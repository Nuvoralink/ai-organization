import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCompletion, validateTaskContract } from '../core/lifecycle/task-governor.mjs';

function contract() {
  return {
    id: 'ORG-001',
    product_intent: 'Make completion evidence deterministic across vendors.',
    paths: { edit: ['scripts/**', 'tests/**'], read_only: ['scripts/vendor/**'] },
    risk: { level: 'medium', classes: ['control_plane'], reasons: ['completion authority'] },
    proofs: [{
      id: 'control-tests',
      proves: 'The governor rejects an invalid completion.',
      command: 'npm test',
      surface: 'control plane',
      authority: 'task governor',
      risk_classes: ['control_plane'],
      killer_mutation: 'Remove the required proof result.',
      required: true
    }],
    completion: { tier: 'review_verified' }
  };
}

function evidence() {
  return {
    task_id: 'ORG-001',
    changed_files: ['scripts/check.mjs', 'tests/check.test.mjs'],
    proofs: [{ id: 'control-tests', command: 'npm test', exit_code: 0, artifact_opened: true, killer_mutation_observed: true }],
    independent_review: { required: true, reviewer: 'independent-reviewer', verdict: 'pass' },
    unreached_surfaces: [],
    doctrine_loop: 'none'
  };
}

test('Proves: ORG-GOV-001; Test type: contract; Surface: task kickoff; Authority: task governor; Killer mutation: remove risk proof coverage; Gated command: npm test', () => {
  assert.deepEqual(validateTaskContract(contract()), []);
  const mutated = contract();
  mutated.proofs[0].risk_classes = ['documentation'];
  assert.match(validateTaskContract(mutated).join('\n'), /no required proof/u);
});

test('Proves: ORG-GOV-002; Test type: mutation; Surface: completion; Authority: task governor; Killer mutation: omit or fake proof output; Gated command: npm test', () => {
  assert.deepEqual(validateCompletion(contract(), evidence()), []);
  const missing = evidence();
  missing.proofs = [];
  assert.match(validateCompletion(contract(), missing).join('\n'), /not run/u);
  const unopened = evidence();
  unopened.proofs[0].artifact_opened = false;
  assert.match(validateCompletion(contract(), unopened).join('\n'), /not opened/u);
});

test('Proves: ORG-GOV-003; Test type: mutation; Surface: path authority; Authority: task governor; Killer mutation: edit outside allowlist or inside read-only subtree; Gated command: npm test', () => {
  const outside = evidence();
  outside.changed_files.push('src/app.ts');
  assert.match(validateCompletion(contract(), outside).join('\n'), /outside editable/u);
  const readOnly = evidence();
  readOnly.changed_files.push('scripts/vendor/upstream.mjs');
  assert.match(validateCompletion(contract(), readOnly).join('\n'), /read-only/u);
});

test('Proves: ORG-GOV-004; Test type: mutation; Surface: independent review; Authority: task governor; Killer mutation: self-certify a review-verified tier; Gated command: npm test', () => {
  const unreviewed = evidence();
  unreviewed.independent_review = { required: true, reviewer: null, verdict: 'findings' };
  assert.match(validateCompletion(contract(), unreviewed).join('\n'), /Independent review/u);
});
