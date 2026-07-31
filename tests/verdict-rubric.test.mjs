import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ACCEPT_THRESHOLD, rubricIsRequired, scoreVerdict, validateRubric } from '../core/roles/verdict-rubric.mjs';
import { validateRoleExecutionContract } from '../scripts/lib/control-plane.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Two critical criteria and two ordinary ones, summing to 100. */
function rubric(overrides = {}) {
  return {
    coverage_floor: 0.7,
    criteria: [
      { id: 'critical-one', weight: 30, critical: true, summary: 'A load-bearing criterion that cannot be waived.' },
      { id: 'critical-two', weight: 30, critical: true, summary: 'A second load-bearing criterion that cannot be waived.' },
      { id: 'ordinary-one', weight: 25, critical: false, summary: 'An ordinary criterion carrying real weight.' },
      { id: 'ordinary-two', weight: 15, critical: false, summary: 'A lighter ordinary criterion.' },
    ],
    ...overrides,
  };
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relative), 'utf8'));
}

test('Proves: a skipped criterion leaves the denominator instead of scoring zero, so honest gaps never depress the score while coverage falls; Test type: scoring algebra; Surface: verdict scoring; Authority: verdict-rubric rule; Killer mutation: give skip a multiplier of 0 or keep its weight in active_weight — the score drops below 1 and this goes red; Gated command: npm test', () => {
  const allPassed = scoreVerdict(rubric(), {
    'critical-one': 'pass',
    'critical-two': 'pass',
    'ordinary-one': 'pass',
    'ordinary-two': 'skip',
  });

  // The lens honestly skipped 15 of 100 weight and is not punished for it.
  assert.equal(allPassed.verdict, 'ACCEPT');
  assert.equal(allPassed.score, 1);
  assert.equal(allPassed.coverage, 0.85);
  assert.deepEqual(allPassed.unevaluated, ['ordinary-two']);

  // Scoring the same skip as a failure would both depress the score and raise coverage.
  const asFailure = scoreVerdict(rubric(), {
    'critical-one': 'pass',
    'critical-two': 'pass',
    'ordinary-one': 'pass',
    'ordinary-two': 'fail',
  });
  assert.equal(asFailure.coverage, 1);
  assert.ok(asFailure.score < 1, 'a real failure must cost score where a skip does not');
  assert.equal(asFailure.verdict, 'REJECT');
});

test('Proves: an unevaluated critical criterion forces UNVERIFIABLE no matter how much other weight passed; Test type: scoring algebra; Surface: verdict scoring; Authority: verdict-rubric rule; Killer mutation: let a critical skip fall through to the normal score path — the verdict becomes ACCEPT and this goes red; Gated command: npm test', () => {
  const result = scoreVerdict(rubric(), {
    'critical-one': 'pass',
    'critical-two': 'skip',
    'ordinary-one': 'pass',
    'ordinary-two': 'pass',
  });

  assert.equal(result.verdict, 'UNVERIFIABLE');
  assert.equal(result.score, null, 'an unverifiable review reports no score to be quoted out of context');
  assert.match(result.reasons.join('\n'), /critical criteria unevaluated: critical-two/u);

  // Everything it did evaluate passed — passing weight must not buy its way past the gate.
  assert.equal(result.unevaluated.length, 1);
});

test('Proves: coverage below the registered floor forces UNVERIFIABLE even when every evaluated criterion passed; Test type: scoring algebra; Surface: verdict scoring; Authority: verdict-rubric coverage floor; Killer mutation: delete the coverage_floor comparison — a 60%-covered review returns ACCEPT and this goes red; Gated command: npm test', () => {
  // Both criticals evaluated, but only 60 of 100 weight was reached — under the 0.7 floor.
  const result = scoreVerdict(rubric(), {
    'critical-one': 'pass',
    'critical-two': 'pass',
    'ordinary-one': 'skip',
    'ordinary-two': 'skip',
  });

  assert.equal(result.verdict, 'UNVERIFIABLE');
  assert.equal(result.coverage, 0.6);
  assert.match(result.reasons.join('\n'), /coverage 60\.0% below floor 70\.0%/u);

  // Raising coverage over the floor with the same statuses flips it to ACCEPT.
  const covered = scoreVerdict(rubric(), {
    'critical-one': 'pass',
    'critical-two': 'pass',
    'ordinary-one': 'pass',
    'ordinary-two': 'skip',
  });
  assert.equal(covered.verdict, 'ACCEPT');
});

test('Proves: a criterion the lens never mentioned is treated as unevaluated rather than as a pass; Test type: scoring algebra; Surface: verdict scoring; Authority: verdict-rubric silence rule; Killer mutation: default a missing status to pass — the verdict becomes ACCEPT and this goes red; Gated command: npm test', () => {
  // 'critical-two' is simply absent from the report.
  const result = scoreVerdict(rubric(), {
    'critical-one': 'pass',
    'ordinary-one': 'pass',
    'ordinary-two': 'pass',
  });

  assert.equal(result.verdict, 'UNVERIFIABLE');
  assert.ok(result.unevaluated.includes('critical-two'), 'silence must register as unevaluated');
});

test('Proves: only statuses for criteria registered to the role may reach verdict computation; Test type: scoring contract; Surface: verdict scoring; Authority: role rubric criterion ids; Killer mutation: ignore unknown criterion ids — a malformed lifecycle report is silently accepted and this goes red; Gated command: npm test', () => {
  assert.throws(
    () => scoreVerdict(rubric(), {
      'critical-one': 'pass',
      'critical-two': 'pass',
      'ordinary-one': 'pass',
      'ordinary-two': 'pass',
      'invented-criterion': 'pass',
    }),
    /Unknown criterion id: invented-criterion/u,
  );
});

test('Proves: a critical criterion at partial or fail caps the verdict at REJECT regardless of the weighted score; Test type: scoring algebra; Surface: verdict scoring; Authority: verdict-rubric critical rule; Killer mutation: drop the critical shortfall check — the 0.85 score still clears nothing but the partial passes and this goes red; Gated command: npm test', () => {
  const partial = scoreVerdict(rubric(), {
    'critical-one': 'pass',
    'critical-two': 'partial',
    'ordinary-one': 'pass',
    'ordinary-two': 'pass',
  });
  assert.equal(partial.verdict, 'REJECT');
  assert.match(partial.reasons.join('\n'), /critical-two=partial/u);

  // A partial on an ordinary criterion is judged on score alone, not capped outright:
  // 15 weight half-met scores 0.925 and still clears the threshold.
  const ordinaryPartial = scoreVerdict(rubric(), {
    'critical-one': 'pass',
    'critical-two': 'pass',
    'ordinary-one': 'pass',
    'ordinary-two': 'partial',
  });
  assert.equal(ordinaryPartial.score, 0.925);
  assert.ok(ordinaryPartial.score >= ACCEPT_THRESHOLD);
  assert.equal(ordinaryPartial.verdict, 'ACCEPT');

  // The threshold is a real bound, not decoration: half-meeting a heavier ordinary
  // criterion (25 weight → 0.875) rejects on score even with both criticals passed.
  const heavierPartial = scoreVerdict(rubric(), {
    'critical-one': 'pass',
    'critical-two': 'pass',
    'ordinary-one': 'partial',
    'ordinary-two': 'pass',
  });
  assert.equal(heavierPartial.score, 0.875);
  assert.equal(heavierPartial.verdict, 'REJECT');
  assert.match(heavierPartial.reasons.join('\n'), /below accept threshold/u);
});

test('Proves: a rubric is rejected unless its weights sum to 100, its ids are unique, and at least one criterion is critical; Test type: rubric contract; Surface: rubric validation; Authority: verdict-rubric module; Killer mutation: remove the sum, duplicate-id, or critical check — the malformed rubrics validate clean and this goes red; Gated command: npm test', () => {
  assert.deepEqual(validateRubric(rubric()), []);

  const wrongSum = rubric();
  wrongSum.criteria[0].weight = 40;
  assert.match(validateRubric(wrongSum).join('\n'), /weights must sum to 100, got 110\.00/u);

  const duplicate = rubric();
  duplicate.criteria[1].id = 'critical-one';
  assert.match(validateRubric(duplicate).join('\n'), /duplicate criterion id: critical-one/u);

  const noCritical = rubric();
  for (const criterion of noCritical.criteria) criterion.critical = false;
  assert.match(validateRubric(noCritical).join('\n'), /must mark at least one criterion critical/u);

  const badFloor = rubric({ coverage_floor: 0 });
  assert.match(validateRubric(badFloor).join('\n'), /coverage_floor must be a fraction/u);

  // Authored weights like 24.67 cannot sum exactly in binary; the tolerance must admit them.
  const realistic = { coverage_floor: 0.7, criteria: [
    { id: 'a', weight: 43, critical: true, summary: 'Root cause eliminated at the correct layer.' },
    { id: 'b', weight: 24.67, critical: false, summary: 'Every affected instance remediated.' },
    { id: 'c', weight: 18.67, critical: false, summary: 'No new vulnerability introduced.' },
    { id: 'd', weight: 13.66, critical: false, summary: 'Framework-recommended patterns used.' },
  ] };
  assert.deepEqual(validateRubric(realistic), []);
});

test('Proves: the execution contract forces every verdict-issuing lens to the strongest tier, to deny mutation tools, and to carry a rubric only when it issues a verdict; Test type: role contract; Surface: role execution validation; Authority: control-plane registry validator; Killer mutations: drop the strength check, the mutating-tool ban, the rubric requirement, or the rubric-on-implementer ban; Gated command: npm test and control:validate', () => {
  const lens = {
    id: 'probe-auditor',
    mode: 'review_read_only',
    strength: 'strongest_available',
    execution: { tools: { allow: ['Read', 'Grep'], deny: ['Edit', 'Write', 'NotebookEdit'] } },
    verdict_rubric: rubric(),
  };
  assert.deepEqual(validateRoleExecutionContract(lens, 'probe'), []);

  const weakCritic = structuredClone(lens);
  weakCritic.strength = 'implementation';
  assert.match(
    validateRoleExecutionContract(weakCritic, 'probe').join('\n'),
    /must run at strongest_available/u,
    'a critic weaker than the implementer it checks is not a check',
  );

  const mutating = structuredClone(lens);
  mutating.execution.tools.allow.push('Write');
  mutating.execution.tools.deny = ['Edit', 'NotebookEdit'];
  const mutatingProblems = validateRoleExecutionContract(mutating, 'probe').join('\n');
  assert.match(mutatingProblems, /must not allow Write/u);
  assert.match(mutatingProblems, /must explicitly deny Write/u);

  const noRubric = structuredClone(lens);
  delete noRubric.verdict_rubric;
  assert.match(validateRoleExecutionContract(noRubric, 'probe').join('\n'), /must declare a verdict_rubric/u);

  // A verify_runtime lens is held to the same bar as a read-only one.
  const runtimeLens = structuredClone(lens);
  runtimeLens.mode = 'verify_runtime';
  assert.deepEqual(validateRoleExecutionContract(runtimeLens, 'probe'), []);
  assert.equal(rubricIsRequired(runtimeLens), true);

  // An implementer issues evidence, not a verdict, so a rubric there is a contract error.
  const implementer = {
    id: 'probe-implementer',
    mode: 'implement',
    strength: 'implementation',
    execution: { tools: { allow: ['Read', 'Edit', 'Write'] } },
    verdict_rubric: rubric(),
  };
  assert.match(validateRoleExecutionContract(implementer, 'probe').join('\n'), /must not declare a verdict_rubric/u);
  assert.equal(rubricIsRequired(implementer), false);
});

test('Proves: every canonical review and verify role across the universal and both project registries carries a valid rubric, a budget, and a mutation-denying tool list; Test type: canonical integration; Surface: shipped role registries; Authority: agent-role registries; Killer mutation: strip the rubric, budget, or deny list from any shipped lens row; Gated command: npm test and control:validate', () => {
  const registries = [
    ['universal', readJson('registries/agent-roles.v1.json')],
    ['auxara-dialer', readJson('overlays/auxara-dialer/control-plane/registries/agent-roles.project.v1.json')],
    ['coachai', readJson('overlays/coachai/control-plane/registries/agent-roles.project.v1.json')],
  ];

  let lensCount = 0;
  for (const [label, registry] of registries) {
    for (const role of registry.roles) {
      assert.ok(role.execution?.tools?.allow?.length > 0, `${label}/${role.id} must declare allowed tools`);
      assert.equal(
        role.execution?.budget?.enforcement,
        'dormant',
        `${label}/${role.id} budget ships dormant until a pay-per-token runtime enables it`,
      );
      assert.ok(role.execution.budget.max_usd > 0, `${label}/${role.id} must carry a positive ceiling`);
      if (!rubricIsRequired(role)) {
        assert.equal(role.verdict_rubric, undefined, `${label}/${role.id} must not carry a rubric`);
        continue;
      }
      lensCount += 1;
      assert.deepEqual(validateRubric(role.verdict_rubric, `${label}/${role.id}`), []);
      assert.deepEqual(validateRoleExecutionContract(role, label), []);
      // Every shipped lens must be scoreable: a full-pass report reaches ACCEPT.
      const allPass = Object.fromEntries(role.verdict_rubric.criteria.map((c) => [c.id, 'pass']));
      assert.equal(scoreVerdict(role.verdict_rubric, allPass).verdict, 'ACCEPT', `${label}/${role.id}`);
      // And skipping its criticals must be unwaivable.
      const skipCriticals = Object.fromEntries(
        role.verdict_rubric.criteria.map((c) => [c.id, c.critical ? 'skip' : 'pass']),
      );
      assert.equal(scoreVerdict(role.verdict_rubric, skipCriticals).verdict, 'UNVERIFIABLE', `${label}/${role.id}`);
    }
  }
  assert.equal(lensCount, 17, 'expected 9 universal plus 4 dialer plus 4 CoachAI verdict-issuing lenses');
});
