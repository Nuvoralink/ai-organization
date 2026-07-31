import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateActionPolicySemantics } from '../core/authority/assess-action.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bootstrap = path.join(root, 'skills', 'bootstrap-orchestrator');
const read = (relative) => fs.readFileSync(path.join(bootstrap, relative), 'utf8');

function markdownFilesUnder(directory) {
  const files = [];
  const pending = [directory];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(absolute);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(absolute);
    }
  }
  return files;
}

const REQUIRED_HOOK_EVENTS = [
  'SessionStart', 'SubagentStart', 'TaskCreated', 'TaskCompleted',
  'SubagentStop', 'PostCompact', 'SessionEnd', 'PostToolUse',
];

function parseCommentedJson(source) {
  return JSON.parse(source.split(/\r?\n/u).filter((line) => !line.trimStart().startsWith('//')).join('\n'));
}

function hookCommands(registrations) {
  return Array.isArray(registrations)
    ? registrations.flatMap((entry) => (Array.isArray(entry?.hooks) ? entry.hooks : []))
    : [];
}

function rootedHookErrors(settings) {
  const errors = [];
  for (const event of REQUIRED_HOOK_EVENTS) {
    const registrations = settings.hooks?.[event];
    const commands = hookCommands(registrations);
    const script = event === 'PostToolUse' ? 'claude-posttooluse-gate.mjs' : 'claude-lifecycle-hook.mjs';
    const expected = `\${CLAUDE_PROJECT_DIR}/scripts/${script}`;
    if (registrations?.length !== 1 || commands.length !== 1 || commands[0]?.type !== 'command' || commands[0]?.command !== 'node' || !Array.isArray(commands[0]?.args) || commands[0].args.length !== 1 || commands[0].args[0] !== expected) {
      errors.push(event);
    }
  }
  return errors;
}

function writePostToolFixture(project, fixtureRoot) {
  const scriptsDir = path.join(fixtureRoot, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  const recorder = [
    "import fs from 'node:fs';",
    "fs.appendFileSync(new URL('./gate-cwds.jsonl', import.meta.url), `${JSON.stringify({ cwd: process.cwd(), marker: process.argv[2] })}\\n`);",
  ].join('\n');
  fs.writeFileSync(path.join(fixtureRoot, 'record-cwd.mjs'), recorder);

  if (project === 'bootstrap') {
    const source = read('templates/claude-posttooluse-gate.mjs.template')
      .replaceAll('{{RULES_DIR_LEAF}}', '\\.claude\\/rules')
      .replaceAll('{{RULE_EXT_BARE}}', 'md');
    fs.writeFileSync(path.join(scriptsDir, 'claude-posttooluse-gate.mjs'), source);
    fs.writeFileSync(path.join(fixtureRoot, 'package.json'), JSON.stringify({
      scripts: { 'gate:test-intent': 'node record-cwd.mjs test-intent' },
    }));
    return '/fixture/example.test.mjs';
  }

  const sourceRoot = path.join(root, 'overlays', project, 'project-files');
  fs.copyFileSync(
    path.join(sourceRoot, 'scripts', 'claude-posttooluse-gate.mjs'),
    path.join(scriptsDir, 'claude-posttooluse-gate.mjs'),
  );
  if (project === 'auxara-dialer') {
    fs.mkdirSync(path.join(scriptsDir, 'lib'), { recursive: true });
    fs.copyFileSync(
      path.join(sourceRoot, 'scripts', 'lib', 'claudeGateRouter.mjs'),
      path.join(scriptsDir, 'lib', 'claudeGateRouter.mjs'),
    );
    fs.mkdirSync(path.join(fixtureRoot, '.ai-organization'), { recursive: true });
    fs.copyFileSync(
      path.join(sourceRoot, '.ai-organization', 'completion-profiles.json'),
      path.join(fixtureRoot, '.ai-organization', 'completion-profiles.json'),
    );
    fs.writeFileSync(path.join(fixtureRoot, 'package.json'), JSON.stringify({
      scripts: { 'gate:test-intent': 'node record-cwd.mjs test-intent' },
    }));
    return '/fixture/example.test.mjs';
  }

  fs.mkdirSync(path.join(scriptsDir, 'lib'), { recursive: true });
  fs.writeFileSync(
    path.join(scriptsDir, 'lib', 'test-file-match.mjs'),
    "export const isTestFile = (value) => /\\.(test|spec)\\.[^.]+$/u.test(String(value));\n",
  );
  fs.writeFileSync(path.join(fixtureRoot, 'package.json'), JSON.stringify({
    scripts: {
      'check:ui': 'node record-cwd.mjs ui',
      'check:ui-continuity': 'node record-cwd.mjs ui-continuity',
    },
  }));
  return '/fixture/frontend/src/example.ts';
}

function runPostToolHook(fixtureRoot, launchCwd, filePath, inputOverride) {
  const input = inputOverride ?? JSON.stringify({
    hook_event_name: 'PostToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: filePath },
  });
  return spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'claude-posttooluse-gate.mjs')], {
    cwd: launchCwd,
    input,
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: fixtureRoot },
  });
}

test('Proves: ORG-AUTH-001; Test type: mutation; Surface: action-authority template; Authority: policies/action-authority.v1.json; Killer mutation: restore unconditional push or remove push and merge side-effect predicates; Gated command: npm test', () => {
  const policy = JSON.parse(fs.readFileSync(path.join(root, 'policies', 'action-authority.v1.json'), 'utf8'));
  assert.deepEqual(validateActionPolicySemantics(policy), []);
  const unconditionalPush = structuredClone(policy);
  unconditionalPush.autonomous.push('push_branch');
  delete unconditionalPush.conditional.push_branch;
  assert.match(validateActionPolicySemantics(unconditionalPush).join('\n'), /push_branch must be conditional/u);
  for (const predicate of policy.conditional.push_branch.all) {
    const weakenedPush = structuredClone(policy);
    weakenedPush.conditional.push_branch.all = weakenedPush.conditional.push_branch.all.filter((value) => value !== predicate);
    assert.match(validateActionPolicySemantics(weakenedPush).join('\n'), new RegExp(`Conditional push_branch missing required predicate: ${predicate}`, 'u'));
  }
  for (const predicate of policy.conditional.merge_pull_request.all) {
    const weakenedMerge = structuredClone(policy);
    weakenedMerge.conditional.merge_pull_request.all = weakenedMerge.conditional.merge_pull_request.all.filter((value) => value !== predicate);
    assert.match(validateActionPolicySemantics(weakenedMerge).join('\n'), new RegExp(`Conditional merge_pull_request missing required predicate: ${predicate}`, 'u'));
  }
});

test('Proves: ORG-AUTH-004; Test type: authority-retirement mutation; Surface: bootstrap and project gates; Authority: policies/action-authority.v1.json; Killer mutation: restore a legacy authority path or hardcoded runtime action-list constant; Gated command: npm test', () => {
  const files = [
    'templates/gates/check-agent-control-plane.mjs.template',
    path.join(root, 'overlays/auxara-dialer/project-files/scripts/check-agent-control-plane.mjs'),
    path.join(root, 'overlays/coachai/project-files/scripts/check-agent-control-plane.mjs'),
    path.join(root, 'overlays/nuvora-link/project-files/scripts/check-agent-control-plane.mjs')
  ];
  for (const file of files) {
    const source = path.isAbsolute(file) ? fs.readFileSync(file, 'utf8') : read(file);
    assert.doesNotMatch(source, /docs\/agent-prompts\/action-authority\.json|\.ai-organization\/action-authority\.json|AGENT_ACTIONS|HUMAN_ACTIONS|MERGE_CONDITIONS|expectedAutonomous/u);
    assert.match(source, /validateActionPolicySemantics/u);
  }
});

test('Proves: ORG-PLAN-001; Test type: mutation; Surface: decision-log template; Authority: decision-sprint linkage schema; Killer mutation: restore the obsolete five-column header; Gated command: npm test', () => {
  const source = read('templates/docs/decision-log.md.template');
  const header = source.split(/\r?\n/u).find((line) => line.startsWith('| ID |'));
  const columns = header.split('|').map((cell) => cell.trim()).filter(Boolean);
  assert.deepEqual(columns, ['ID', 'Title', 'Area', 'Phase', 'Sprint', 'Status', 'Notes']);
  assert.notDeepEqual(['ID', 'Decision', 'Basis', 'Date', 'Reversal trigger'], columns);
});

test('Proves: ORG-TEST-001; Test type: executable gate mutation; Surface: generated check-test-intent.mjs; Authority: test-intent header contract; Killer mutation: remove Killer mutation or Gated command and keep the executable gate green; Gated command: npm test', (t) => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'test-intent executable gate-'));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
  fs.mkdirSync(path.join(fixtureRoot, 'src'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(fixtureRoot, 'requirements.md'), '# ORG-TEST-001\n');
  const gate = read('templates/gates/check-test-intent.mjs.template')
    .replaceAll('{{SRC_DIRS}}', "'src'")
    .replaceAll('{{ID_SOURCE_FILES}}', "'requirements.md'")
    .replaceAll('{{PROJECT_TEST_TYPES}}', '')
    .replaceAll('{{RULES_DIR}}', '.claude/rules')
    .replaceAll('{{SCRIPTS_DIR}}', 'scripts')
    .replaceAll('{{PLACEHOLDER}}', 'configured value');
  const gatePath = path.join(fixtureRoot, 'scripts', 'check-test-intent.mjs');
  const testPath = path.join(fixtureRoot, 'src', 'proof.test.ts');
  const baseline = `/**
 * Proves: ORG-TEST-001
 * Test type: unit
 * Surface: generated gate fixture
 * Authority: test-intent header contract
 * What this test proves about the product: Required proof metadata is executable policy.
 * Killer mutation: remove one required header field
 * Gated command: npm test
 */
export const proof = true;
`;
  fs.writeFileSync(gatePath, gate);
  const runGate = () => spawnSync(process.execPath, [gatePath], { cwd: fixtureRoot, encoding: 'utf8' });
  const assertPass = () => {
    const result = runGate();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /check-test-intent: OK/u);
  };
  fs.writeFileSync(testPath, baseline);
  assertPass();
  for (const field of ['Killer mutation', 'Gated command']) {
    const mutated = baseline.replace(new RegExp(`^ \\* ${field}:.*\\r?\\n`, 'mu'), '');
    fs.writeFileSync(testPath, mutated);
    const failed = runGate();
    assert.equal(failed.status, 1, `${field}: ${failed.stdout}`);
    assert.match(failed.stderr, new RegExp(`missing "${field}:" line`, 'u'));
    fs.writeFileSync(testPath, baseline);
    assertPass();
  }
});

test('Proves: ORG-FLEET-001; Test type: template sentinel mutation; Surface: implementer template; Authority: orchestrator delegation boundary; Killer mutation: remove the implementer no-delegation rule; Gated command: npm test', () => {
  const implementer = read('templates/agents/implementer.template.md');
  assert.match(implementer, /Do not spawn or delegate to other agents/u);
  assert.match(implementer, /Delegation and fleet coordination are orchestrator authority/u);
});

test('Proves: ORG-FLEET-001; Test type: mutation; Surface: bootstrap roster; Authority: agent-role registry; Killer mutation: omit either kickoff or premise challenger; Gated command: npm test', () => {
  const skill = read('SKILL.md');
  const claude = read('templates/CLAUDE.md.template');
  const agents = read('templates/AGENTS.md.template');
  for (const source of [skill, claude, agents]) {
    assert.match(source, /premise-and-architecture/u);
    assert.match(source, /sprint-kickoff/u);
  }
});

test('Proves: ORG-OVERLAY-001; Test type: mutation; Surface: existing-project bootstrap; Authority: overlay ownership manifest; Killer mutation: permit copy-all or overwrite a dirty managed target; Gated command: npm test', () => {
  const skill = fs.readFileSync(path.join(root, 'skills', 'bootstrap-orchestrator', 'SKILL.md'), 'utf8');
  assert.match(skill, /Existing-project overlay mode/u);
  assert.match(skill, /refuses dirty managed targets/u);
  assert.match(skill, /Never use copy-all discovery as authority/u);
  assert.match(skill, /project-owned product doc must remain outside overlay parity/u);
});

test('Proves: ORG-CONTEXT-001; Test type: mutation; Surface: startup context; Authority: context-engineering; Killer mutation: add a second import path without changing unique bytes; Gated command: npm test', () => {
  const skill = fs.readFileSync(path.join(root, 'skills', 'context-engineering', 'SKILL.md'), 'utf8');
  const gate = read('templates/gates/check-agent-context-budget.mjs.template');
  assert.match(skill, /one import path per authority/u);
  assert.match(gate, /Duplicate startup import/u);
  assert.match(gate, /firstParent/u);
});

test('Proves: ORG-GOV-005; Test type: architecture; Surface: cross-vendor assurance; Authority: vendor-neutral task governor; Killer mutation: fabricate Codex lifecycle parity without an authenticated platform event; Gated command: npm test', () => {
  const skill = fs.readFileSync(path.join(root, 'skills', 'bootstrap-orchestrator', 'SKILL.md'), 'utf8');
  const governor = fs.readFileSync(path.join(root, 'core', 'lifecycle', 'task-governor.mjs'), 'utf8');
  const lifecycleTemplate = fs.readFileSync(path.join(root, 'skills', 'bootstrap-orchestrator', 'templates', 'lifecycle', 'claude-lifecycle-hook.mjs.template'), 'utf8');
  const lifecycleFixture = fs.readFileSync(path.join(root, 'skills', 'bootstrap-orchestrator', 'templates', 'tests', 'claude-lifecycle-hook.test.ts.template'), 'utf8');
  const codexStatus = fs.readFileSync(path.join(root, 'core', 'lifecycle', 'codex-task-status.mjs'), 'utf8');
  assert.match(skill, /read-only Codex status client/u);
  assert.match(skill, /Never add a self-minting Codex report\/review\/approval CLI/u);
  assert.match(skill, /full nested and pre\/post script closure/u);
  const controlGate = read('templates/gates/check-agent-control-plane.mjs.template');
  assert.match(controlGate, /lifecycle_supported_risk_classes/u);
  assert.match(controlGate, /lacks assurance capability provider/u);
  assert.match(controlGate, /lacks registered role provider/u);
  assert.match(controlGate, /lifecycle_hook_timeout_ms/u);
  assert.match(controlGate, /COMPLETION_CLAIM_LEASE_MS/u);
  assert.match(controlGate, /isValidIntegrationBranch\(proofRegistry\.integration_branch\)/u);
  assert.match(controlGate, /validateRegisteredAgentRoleProviders\(roles\.roles, root\)/u);
  assert.match(controlGate, /validateLifecycleRoleModes\(proofRegistry\.lifecycle_roles_by_completion_mode, roleModes\)/u);
  assert.match(governor, /Changed file is outside editable paths/u);
  assert.match(governor, /Runner attestation is invalid/u);
  assert.doesNotMatch(governor, /artifact_opened|killer_mutation_observed/u);
  assert.match(lifecycleTemplate, /recordLifecycleCompletionReport/u);
  assert.match(lifecycleTemplate, /case 'SubagentStop'/u);
  assert.doesNotMatch(lifecycleTemplate, /completionReport:\s*completionReport\(payload\)/u);
  assert.match(lifecycleFixture, /execution:\s*\{ implementer_role:/u);
  assert.match(lifecycleFixture, /COMPLETION_REPORT_JSON:/u);
  assert.doesNotMatch(codexStatus, /acceptLifecycleTask|completeLifecycleTask|recordLifecycle/u);
  for (const project of ['auxara-dialer', 'coachai', 'nuvora-link']) {
    const adapter = fs.readFileSync(path.join(root, 'overlays', project, 'project-files', 'scripts', 'claude-lifecycle-hook.mjs'), 'utf8');
    assert.match(adapter, /completeLifecycleTask\(/u, `${project} TaskCompleted must call the shared stateful lifecycle controller`);
    assert.doesNotMatch(adapter, /artifact_opened|killer_mutation_observed|AGENT_PROOF_COMMAND/u, `${project} must not synthesize or override proof truth`);
  }
  const template = read('templates/lifecycle/claude-lifecycle-hook.mjs.template');
  assert.match(template, /completeLifecycleTask\(/u);
  assert.match(template, /TASK_CONTRACT_JSON/u);
});

test('Proves: ORG-COORD-CLI-007; Test type: shipped-template mutation; Surface: bounded Claude dispatch brief; Authority: one brief drives prompt and coordination claim; Killer mutation: omit --brief/task_id or route the global dispatcher to a global ledger; Gated command: npm test', () => {
  const skill = read('SKILL.md');
  const brief = read('templates/briefs/dispatch-brief.template.md');
  assert.match(brief, /CLAUDE_DISPATCH_BOUNDARY_JSON:\{"task_id":"<stable-task-id>"/u);
  assert.match(brief, /both `?--prompt-file`? and.*`?--brief`?|--prompt-file and.*--brief/u);
  assert.match(brief, /--claim-file is the mutually exclusive compatibility fallback/u);
  assert.match(skill, /git rev-parse --show-toplevel/u);
  assert.match(skill, /repository's installed `.ai-organization\/runtime\/core\/coordination\/` modules/u);
  assert.match(skill, /proven `enforce` overlap refuses before spawn with exit `125`/u);
  assert.match(skill, /child-owned exit `125` is remapped to `3`/u);
});

test('Proves: ORG-HOOK-006; Test type: canonical source-contract mutation; Surface: bootstrap and Auxara lifecycle adapters; Authority: TaskCreated coordination and replacement lifecycle; Killer mutation: remove admission/refusal, claim release/reconciliation, or replacement-dispatch persistence from either managed hook; Gated command: npm test', () => {
  const sources = {
    bootstrap: read('templates/lifecycle/claude-lifecycle-hook.mjs.template'),
    auxara: fs.readFileSync(
      path.join(
        root,
        'overlays',
        'auxara-dialer',
        'project-files',
        'scripts',
        'claude-lifecycle-hook.mjs',
      ),
      'utf8',
    ),
  };
  const boundedProcessTemplate = read(
    'templates/lifecycle/lib/boundedProcess.mjs.template',
  );
  for (const [name, source] of Object.entries(sources)) {
    for (const requiredSeam of [
      'coordinationAdmissionDecision',
      'coordinationRefusalMessage',
      'registerClaim',
      'releaseClaim',
      'reconcileClaims',
      'recordReplacementDispatch',
      'replacementDispatchWouldStall',
    ]) {
      assert.match(source, new RegExp(`\\b${requiredSeam}\\b`, 'u'), `${name}: ${requiredSeam}`);
    }
    assert.match(
      source,
      /else if \(registration\?\.claimId\)[\s\S]*safelyReleaseTaskClaim/u,
      `${name}: a claim acquired before lifecycle rejection must be released`,
    );
    assert.match(
      source,
      /result\.accepted\)[\s\S]*safelyReleaseTaskClaim/u,
      `${name}: completion must release the task claim`,
    );
    assert.match(
      source,
      /import \{ isProcessAlive \} from '\.\/lib\/boundedProcess\.mjs';/u,
      `${name}: lifecycle liveness must use the shared bounded-process seam`,
    );
    assert.doesNotMatch(
      source,
      /function isProcessAlive\(/u,
      `${name}: lifecycle liveness policy must not be forked inline`,
    );
  }
  assert.match(
    boundedProcessTemplate,
    /export function isProcessAlive\(/u,
    'the bootstrap must ship the helper imported by the lifecycle template',
  );
  assert.match(
    sources.auxara,
    /export async function dispatchLifecyclePayload\(/u,
    'Auxara fixture tests must use an explicit-root module seam without weakening executable root binding',
  );
  assert.match(
    sources.auxara,
    /Explicit lifecycle project root must be a Git repository root/u,
    'the explicit-root seam must reject a nested or non-repository path',
  );
});

test('Proves: COORDINATION-RUNNER-DELIVERY-001; Test type: canonical-template and overlay byte-parity mutation; Surface: bounded runner bootstrap delivery; Authority: Dialer-proven runner union and package-script template; Killer mutations: omit the runner, process seam, boundary parser, package script, template LF authority, or fork either project overlay; Gated command: npm test', () => {
  assert.match(
    fs.readFileSync(path.join(root, '.gitattributes'), 'utf8'),
    /^\*\.template text eol=lf\r?$/mu,
    'template sources must have platform-stable LF bytes before parity comparison',
  );
  const templateSources = {
    runner: read('templates/lifecycle/run-bounded-agent.mjs.template'),
    process: read('templates/lifecycle/lib/boundedProcess.mjs.template'),
    boundary: read('templates/lifecycle/lib/dispatchBoundary.mjs.template'),
  };
  const packageScripts = JSON.parse(
    read('templates/lifecycle/package-scripts.json.template'),
  );
  assert.equal(packageScripts['agent:run'], 'node scripts/run-bounded-agent.mjs');
  assert.match(templateSources.runner, /from '\.\/lib\/boundedProcess\.mjs';/u);
  assert.match(templateSources.runner, /from '\.\/lib\/dispatchBoundary\.mjs';/u);
  assert.match(templateSources.process, /export function isProcessAlive\(/u);
  assert.match(templateSources.process, /export function runBounded\(/u);
  assert.match(templateSources.boundary, /expected exactly one .* row/u);

  for (const project of ['auxara-dialer', 'coachai', 'nuvora-link']) {
    const projectScripts = path.join(root, 'overlays', project, 'project-files', 'scripts');
    assert.equal(
      fs.readFileSync(path.join(projectScripts, 'run-bounded-agent.mjs'), 'utf8'),
      templateSources.runner,
      `${project} runner must remain byte-identical to the canonical template`,
    );
    assert.equal(
      fs.readFileSync(path.join(projectScripts, 'lib', 'boundedProcess.mjs'), 'utf8'),
      templateSources.process,
      `${project} process seam must remain byte-identical to the deliberate union`,
    );
    assert.equal(
      fs.readFileSync(path.join(projectScripts, 'lib', 'dispatchBoundary.mjs'), 'utf8'),
      templateSources.boundary,
      `${project} dispatch boundary parser must remain byte-identical to the canonical template`,
    );
  }
});

test('Proves: CONTROL-PLANE-LIFECYCLE-OVERLAY-DRIFT-001; Test type: canonical skill truth mutation; Surface: lifecycle bootstrap contract and state inventory; Authority: executable v2/v3 schema dispatcher and Git-common-dir state resolver; Killer mutations: restore v2-only schema wording or claim tmp/agent-assurance is runtime state; Gated command: npm test', () => {
  const skill = read('SKILL.md');
  assert.match(skill, /task-assurance v2 and v3 plus task-evidence v2/u);
  assert.match(
    skill,
    /<absolute-git-common-dir>\/auxara-agent-assurance\//u,
  );
  assert.match(
    skill,
    /tmp\/agent-assurance\/` ignore is only a defensive exclusion/u,
  );
});

test('Proves: ORG-LOOP-002; Test type: exact-literal authority sweep; Surface: global, bootstrap, and overlay Markdown; Authority: propagating exit sentinel; Killer mutation: restore cmd; echo without saving and re-exiting the command status; Gated command: npm test', () => {
  const loopDiscipline = path.join(root, 'global', 'claude', 'rules', 'loop-discipline.md');
  const authorityRoots = [
    path.join(root, 'global'),
    path.join(root, 'skills', 'bootstrap-orchestrator'),
    path.join(root, 'overlays'),
  ];
  const unsafeLiteral = 'cmd; echo "EXIT: $?"';
  const offenders = authorityRoots
    .flatMap(markdownFilesUnder)
    .filter((file) => path.resolve(file) !== path.resolve(loopDiscipline))
    .filter((file) => fs.readFileSync(file, 'utf8').includes(unsafeLiteral))
    .map((file) => path.relative(root, file).replaceAll('\\', '/'))
    .sort();
  assert.deepEqual(offenders, []);
  const lesson = fs.readFileSync(loopDiscipline, 'utf8');
  assert.match(lesson, /`cmd; echo "EXIT: \$\?"` — is itself a masking bug/u);
  assert.match(lesson, /rc=\$\?; echo "EXIT: \$rc"; exit \$rc/u);
  const promotionSkill = fs.readFileSync(
    path.join(root, 'skills', 'docs-rules-guardrail-promotion', 'SKILL.md'),
    'utf8',
  );
  assert.match(promotionSkill, /`rg --hidden`/u);
  assert.match(promotionSkill, /hidden `\.claude` or\s+`\.codex` authority file/u);
  assert.match(promotionSkill, /secret, runtime, cache, and vendor directories remain unread/u);
});

test('Proves: ORG-HOOK-001; Test type: mutation and path counterexample; Surface: bootstrap and overlay hook descriptors; Authority: Claude project-root hook contract; Killer mutation: restore a cwd-relative shell-form command; Gated command: npm test', () => {
  const settingsSources = [
    ['bootstrap', parseCommentedJson(read('templates/settings.json.template'))],
    ['auxara-dialer', JSON.parse(fs.readFileSync(path.join(root, 'overlays', 'auxara-dialer', 'project-files', '.claude', 'settings.json'), 'utf8'))],
    ['coachai', JSON.parse(fs.readFileSync(path.join(root, 'overlays', 'coachai', 'project-files', '.claude', 'settings.json'), 'utf8'))],
    ['nuvora-link', JSON.parse(fs.readFileSync(path.join(root, 'overlays', 'nuvora-link', 'project-files', '.claude', 'settings.json'), 'utf8'))],
  ];
  for (const [name, settings] of settingsSources) {
    assert.deepEqual(rootedHookErrors(settings), [], `${name} must use rooted exec-form hooks`);
    const mutated = structuredClone(settings);
    mutated.hooks.SessionEnd[0].hooks[0] = {
      type: 'command',
      command: 'node scripts/claude-lifecycle-hook.mjs',
      timeout: mutated.hooks.SessionEnd[0].hooks[0].timeout,
    };
    assert.deepEqual(rootedHookErrors(mutated), ['SessionEnd'], `${name} must reject the relative-shell mutation`);
  }

  const projectWithSpaces = String.raw`C:\worktrees\Dialer Project With Spaces`;
  const rootedArg = settingsSources[0][1].hooks.SessionStart[0].hooks[0].args[0]
    .replace('${CLAUDE_PROJECT_DIR}', projectWithSpaces);
  assert.equal(path.win32.normalize(rootedArg), path.win32.join(projectWithSpaces, 'scripts', 'claude-lifecycle-hook.mjs'));
});

test('Proves: ORG-HOOK-002; Test type: telemetry-root mutation; Surface: lifecycle runtime initialization; Authority: repository-root telemetry contract; Killer mutation: initialize lifecycle or telemetry from process.cwd(); Gated command: npm test', () => {
  const sources = {
    bootstrap: read('templates/lifecycle/claude-lifecycle-hook.mjs.template'),
    auxara: fs.readFileSync(path.join(root, 'overlays', 'auxara-dialer', 'project-files', 'scripts', 'claude-lifecycle-hook.mjs'), 'utf8'),
    coachai: fs.readFileSync(path.join(root, 'overlays', 'coachai', 'project-files', 'scripts', 'claude-lifecycle-hook.mjs'), 'utf8'),
  };
  assert.match(sources.bootstrap, /root = configuredProjectRoot\(\);/u);
  assert.match(sources.bootstrap, /CLAUDE_PROJECT_DIR does not match the script-derived repository root/u);
  assert.doesNotMatch(sources.bootstrap, /repoRoot\(payload\?\.cwd \?\? process\.cwd\(\)\)/u);
  assert.match(sources.auxara, /const telemetryDir = telemetryDirectory\(projectRoot\);/u);
  assert.doesNotMatch(sources.auxara, /telemetryDirectory\(process\.cwd\(\)\)/u);
  assert.match(sources.coachai, /const scriptRoot = path\.resolve\(path\.dirname\(fileURLToPath\(import\.meta\.url\)\), '\.\.'\);/u);
  assert.match(sources.coachai, /fs\.realpathSync\.native\(path\.resolve\(configuredProjectDir\)\)/u);
  assert.match(sources.coachai, /CLAUDE_PROJECT_DIR does not match the script-derived repository root/u);
  assert.doesNotMatch(sources.coachai, /const root = process\.cwd\(\);/u);
});

test('Proves: ORG-HOOK-003; Test type: runtime counterexample; Surface: Auxara and CoachAI lifecycle telemetry; Authority: configured project root; Killer mutation: derive telemetry from the nested launch cwd; Gated command: npm test', (t) => {
  for (const project of ['auxara-dialer', 'coachai']) {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), `${project} hook runtime with spaces-`));
    t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
    const sourceRoot = path.join(root, 'overlays', project, 'project-files');
    fs.cpSync(path.join(sourceRoot, 'scripts'), path.join(fixtureRoot, 'scripts'), { recursive: true });
    fs.cpSync(path.join(sourceRoot, '.ai-organization'), path.join(fixtureRoot, '.ai-organization'), { recursive: true });
    fs.cpSync(path.join(root, 'core'), path.join(fixtureRoot, '.ai-organization', 'runtime', 'core'), { recursive: true });
    const nestedCwd = path.join(fixtureRoot, 'fixtures', 'mock package with spaces');
    fs.mkdirSync(nestedCwd, { recursive: true });
    const siblingRoot = fs.mkdtempSync(path.join(os.tmpdir(), `${project} sibling repository-`));
    t.after(() => fs.rmSync(siblingRoot, { recursive: true, force: true }));
    if (project === 'auxara-dialer') {
      assert.equal(spawnSync('git', ['init', '-b', 'root-proof'], { cwd: fixtureRoot, encoding: 'utf8' }).status, 0);
      assert.equal(spawnSync('git', ['init', '-b', 'sibling-proof'], { cwd: siblingRoot, encoding: 'utf8' }).status, 0);
    }
    const result = spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'claude-lifecycle-hook.mjs')], {
      cwd: nestedCwd,
      input: JSON.stringify(project === 'auxara-dialer'
        ? { hook_event_name: 'SessionStart', session_id: `${project}-nested`, cwd: siblingRoot, source: 'startup' }
        : { hook_event_name: 'SessionEnd', session_id: `${project}-nested`, cwd: siblingRoot }),
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: fixtureRoot },
    });
    assert.equal(result.status, 0, `${project}: ${result.stderr}`);
    const telemetryFile = project === 'coachai' ? 'lifecycle.jsonl' : 'events.jsonl';
    assert.equal(fs.existsSync(path.join(fixtureRoot, 'tmp', 'agent-telemetry', telemetryFile)), true, `${project} writes telemetry below the configured project root`);
    assert.equal(fs.existsSync(path.join(nestedCwd, 'tmp', 'agent-telemetry', telemetryFile)), false, `${project} must not write telemetry below nested cwd`);
    if (project === 'auxara-dialer') {
      assert.match(result.stdout, /root-proof/u, 'Auxara state must come from the verified project root');
      assert.doesNotMatch(result.stdout, /sibling-proof/u, 'payload.cwd must not redirect Auxara state collection');
    }
    for (const hostileInput of ['{not-json', 'null', '[]', '"scalar"', '42']) {
      const malformed = spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'claude-lifecycle-hook.mjs')], {
        cwd: nestedCwd,
        input: hostileInput,
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_PROJECT_DIR: fixtureRoot },
      });
      assert.equal(malformed.status, 2, `${project} hostile lifecycle payload ${hostileInput} must block`);
      assert.match(malformed.stderr, /malformed hook payload|payload must be a JSON object/iu);
    }
    if (project === 'coachai') {
      const malformedEvent = spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'claude-lifecycle-hook.mjs')], {
        cwd: nestedCwd,
        input: JSON.stringify({ hook_event_name: { nested: true }, session_id: 'malformed-event-name' }),
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_PROJECT_DIR: fixtureRoot },
      });
      assert.equal(malformedEvent.status, 0, malformedEvent.stderr);
      const rows = fs.readFileSync(path.join(fixtureRoot, 'tmp', 'agent-telemetry', telemetryFile), 'utf8').trim().split(/\r?\n/u);
      const lastRecord = JSON.parse(rows.at(-1));
      assert.equal(lastRecord.event, 'Malformed');
      assert.equal(typeof lastRecord.event, 'string');
      assert.match(malformedEvent.stdout, /lifecycle Malformed: ACCEPTED/u);
    }
  }
});

test('Proves: ORG-HOOK-003C and ORG-HOOK-006; Test type: canonical-template runtime mutation; Surface: generated lifecycle adapter; Authority: script-derived project root, parse integrity, coordination admission, and durable replacement state; Killer mutation: trust CLAUDE_PROJECT_DIR, catch malformed JSON and exit zero, bypass a proven enforce conflict, or remove the unchanged replacement-dispatch stop; Gated command: npm test', async (t) => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bootstrap lifecycle verified root-'));
  const siblingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bootstrap lifecycle spoofed root-'));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(siblingRoot, { recursive: true, force: true }));
  fs.mkdirSync(path.join(fixtureRoot, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, '.ai-organization', 'runtime'), { recursive: true });
  fs.cpSync(path.join(root, 'core'), path.join(fixtureRoot, '.ai-organization', 'runtime', 'core'), { recursive: true });
  fs.cpSync(path.join(root, 'policies'), path.join(fixtureRoot, '.ai-organization', 'runtime', 'policies'), { recursive: true });
  fs.cpSync(path.join(root, 'schemas'), path.join(fixtureRoot, '.ai-organization', 'runtime', 'schemas'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, '.ai-organization', 'registries'), { recursive: true });
  fs.copyFileSync(
    path.join(root, 'registries', 'agent-roles.v1.json'),
    path.join(fixtureRoot, '.ai-organization', 'registries', 'agent-roles.v1.json'),
  );
  const adapter = read('templates/lifecycle/claude-lifecycle-hook.mjs.template')
    .replaceAll('{{INTEGRATION_BRANCH}}', 'main')
    .replaceAll('{{TASK_COMPLETION_GATE}}', 'verify');
  fs.writeFileSync(path.join(fixtureRoot, 'scripts', 'claude-lifecycle-hook.mjs'), adapter);
  fs.mkdirSync(path.join(fixtureRoot, 'scripts', 'lib'), { recursive: true });
  fs.writeFileSync(
    path.join(fixtureRoot, 'scripts', 'lib', 'boundedProcess.mjs'),
    read('templates/lifecycle/lib/boundedProcess.mjs.template'),
  );
  assert.equal(spawnSync('git', ['init', '-b', 'root-proof'], { cwd: fixtureRoot, encoding: 'utf8' }).status, 0);
  assert.equal(spawnSync('git', ['config', 'user.email', 'lifecycle@example.invalid'], { cwd: fixtureRoot, encoding: 'utf8' }).status, 0);
  assert.equal(spawnSync('git', ['config', 'user.name', 'Lifecycle Test'], { cwd: fixtureRoot, encoding: 'utf8' }).status, 0);
  fs.writeFileSync(path.join(fixtureRoot, 'README.md'), 'base\n');
  fs.writeFileSync(path.join(fixtureRoot, 'package.json'), JSON.stringify({ private: true, scripts: { verify: "node -e \"console.log('VERIFY_PASS')\"", 'proof:documentation': "node -e \"console.log('DOC_PROOF_PASS')\"" } }));
  fs.writeFileSync(path.join(fixtureRoot, '.ai-organization', 'proof-profiles.json'), JSON.stringify({
    version: 2,
    integration_branch: 'main',
    lifecycle_hook_timeout_ms: 1800000,
    lifecycle_timeout_safety_margin_ms: 60000,
    lifecycle_roles_by_completion_mode: { 'read-only': ['implementer', 'adversarial-reviewer'], implementation: ['implementer'] },
    lifecycle_supported_risk_classes: ['documentation'],
    profiles: [{
      id: 'documentation',
      assurance: {
        version: 1,
        classification: 'local_non_mutating',
        safe_local_only: true,
        capabilities: ['documentation_contract'],
        env_allowlist: [],
        commands: [{ id: 'documentation-proof', argv: ['npm', 'run', 'proof:documentation'], timeout_ms: 30000, parser: { kind: 'patterns', minimum_output_bytes: 1, minimum_executed: 1, required_patterns: ['DOC_PROOF_PASS'] } }],
      },
    }, {
      id: 'internal-read-only',
      assurance: {
        version: 1,
        classification: 'internal_read_only',
        safe_local_only: true,
        capabilities: ['read_only_integrity'],
        env_allowlist: [],
        commands: [{ id: 'repository-binding', argv: ['internal', 'repository-binding'], timeout_ms: 30000, parser: { kind: 'internal_repository_binding' } }],
      },
    }],
  }));
  assert.equal(spawnSync('git', ['add', '.'], { cwd: fixtureRoot, encoding: 'utf8' }).status, 0);
  assert.equal(spawnSync('git', ['commit', '-m', 'base'], { cwd: fixtureRoot, encoding: 'utf8' }).status, 0);
  assert.equal(spawnSync('git', ['update-ref', 'refs/remotes/origin/main', 'HEAD'], { cwd: fixtureRoot, encoding: 'utf8' }).status, 0);
  const executable = path.join(fixtureRoot, 'scripts', 'claude-lifecycle-hook.mjs');
  const runLifecycle = (payload) => spawnSync(process.execPath, [executable], {
    cwd: fixtureRoot,
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: fixtureRoot },
  });
  const contract = (taskId, tier = 'implementation') => ({
    schema_version: 2,
    id: taskId,
    product_intent: 'Execute the generated lifecycle delivery-fit authority.',
    settled_decisions: ['The generated lifecycle hook owns TaskCreated delivery-fit validation.'],
    scope: { in: ['generated hook'], out: ['product code'], too_little: 'Presence checks.', too_much: 'Production actions.' },
    execution: { implementer_role: 'implementer' },
    paths: { read: ['README.md'], edit: ['README.md'], read_only: [], output: ['tmp/agent-assurance/**'] },
    risk: { level: 'low', classes: ['documentation'], reasons: ['generated fixture'] },
    authorities: ['core/lifecycle'],
    blast_radius: { feeders: ['TaskCreated'], producers: ['hook'], transformers: ['adapter'], persistence: ['attempt'], validators: ['controller'], consumers: ['TaskCompleted'], surfaces: ['lifecycle'], retirements: ['presence-only validation'] },
    procedure: ['Execute the real generated hook.'],
    acceptance: ['TaskCreated accepts only a valid delivery fit.'],
    proofs: tier === 'read-only'
      ? [{ id: 'read-only-binding', profile_id: 'internal-read-only', capability: 'read_only_integrity', proves: 'The repository binding remains unchanged.', surface: 'repository', authority: 'git binding', risk_classes: ['documentation'], mutation: { required: false, case_id: null, rationale: 'A read-only task cannot execute mutation.' }, required: true }]
      : [{ id: 'documentation-proof', profile_id: 'documentation', capability: 'documentation_contract', proves: 'Generated lifecycle behavior executes.', surface: 'TaskCreated', authority: 'lifecycle hook', risk_classes: ['documentation'], mutation: { required: false, case_id: null, rationale: 'This fixture tests adapter policy.' }, required: true }],
    action_authority: { allowed: tier === 'read-only' ? ['read'] : ['read', 'test'], conditional: [], human_required: [] },
    completion: { tier: tier === 'read-only' ? 'analysis' : 'implemented', honesty_clause: 'Name unreached surfaces.', unreached_surfaces: [], doctrine_loop: 'none' },
  });
  const brief = (taskId, { tier = 'implementation', delivery = [
    '**Delivery fit**: single-turn',
    '**Estimated scope**: 1 lifecycle adapter and its executable regression.',
    '**Coherence**: one agent can change and verify the authority atomically.',
  ].join('\n') } = {}) => [
    '### Context', 'Settled authority.',
    '### Exact paths', 'scripts/claude-lifecycle-hook.mjs',
    '### Numbered procedure', delivery, '1. Execute the real hook.',
    '### Output contract', 'Return command-owned evidence.',
    '### Boundaries', 'Do not publish.',
    '### Self-verifiable acceptance', 'The generated behavior decides the event.',
    '### Authority path', 'TaskCreated -> lifecycle controller -> persisted task attempt.',
    '### Lifecycle matrix', 'TaskCreated accepts; TaskCompleted proves; SubagentStop records.',
    '### Runtime execution', 'The installed hook executes in the verified repository root.',
    '### Proof matrix', 'TaskCreated status proves admission and persisted lifecycle state.',
    '### Completion tier', tier,
    `TASK_CONTRACT_JSON:${JSON.stringify(contract(taskId, tier))}`,
  ].filter((line) => line !== '').join('\n');
  const taskCreated = (taskId, description) => runLifecycle({ hook_event_name: 'TaskCreated', session_id: `session-${taskId}`, agent_id: 'implementer', agent_type: 'implementer', task_id: taskId, task_description: description });

  for (const hostileInput of ['{not-json', 'null', '[]', '"scalar"', '42']) {
    const malformed = spawnSync(process.execPath, [executable], {
      cwd: fixtureRoot,
      input: hostileInput,
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: fixtureRoot },
    });
    assert.equal(malformed.status, 2);
    assert.match(malformed.stderr, /malformed hook payload|payload must be a JSON object/iu);
  }

  const spoofed = spawnSync(process.execPath, [executable], {
    cwd: fixtureRoot,
    input: JSON.stringify({ hook_event_name: 'SessionEnd', session_id: 'spoofed-root' }),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: siblingRoot },
  });
  assert.equal(spoofed.status, 2);
  assert.match(spoofed.stderr, /CLAUDE_PROJECT_DIR does not match/iu);
  assert.equal(fs.existsSync(path.join(siblingRoot, 'tmp', 'agent-telemetry')), false);

  const singleTurn = taskCreated('FIT-SINGLE', brief('FIT-SINGLE'));
  assert.equal(singleTurn.status, 0, singleTurn.stderr);
  const checkpointedDelivery = [
    '**Delivery fit**: checkpointed',
    '- Checkpoint 1: parser | authority state: one parser | verification: focused test exit 0.',
    '- Checkpoint 2: adapter | authority state: one adapter | verification: integration test exit 0.',
  ].join('\n');
  const checkpointed = taskCreated('FIT-CHECKPOINTED', brief('FIT-CHECKPOINTED', { delivery: checkpointedDelivery }));
  assert.equal(checkpointed.status, 0, checkpointed.stderr);
  const readOnly = taskCreated('FIT-READ-ONLY', brief('FIT-READ-ONLY', { tier: 'read-only', delivery: '' }));
  assert.equal(readOnly.status, 0, readOnly.stderr);

  const firstReplacementDispatch = taskCreated(
    'FIT-REPLACEMENT-STALL',
    brief('FIT-REPLACEMENT-STALL'),
  );
  assert.equal(firstReplacementDispatch.status, 0, firstReplacementDispatch.stderr);
  const unchangedReplacementDispatch = taskCreated(
    'FIT-REPLACEMENT-STALL',
    brief('FIT-REPLACEMENT-STALL'),
  );
  assert.equal(unchangedReplacementDispatch.status, 2, unchangedReplacementDispatch.stderr);
  assert.match(unchangedReplacementDispatch.stderr, /Unchanged replacement dispatch stalled/u);

  const policyDirectory = path.join(fixtureRoot, '.ai-organization', 'policies');
  fs.mkdirSync(policyDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(policyDirectory, 'coordination-mode.v1.json'),
    JSON.stringify({ mode: 'enforce', acceptNotReady: true }),
  );
  const coordinationRuntime = await import(
    pathToFileURL(
      path.join(
        fixtureRoot,
        '.ai-organization',
        'runtime',
        'core',
        'coordination',
        'register.mjs',
      ),
    ).href
  );
  const existingClaim = await coordinationRuntime.registerClaim({
    repoRoot: fixtureRoot,
    taskId: 'FIT-COORDINATION-OWNER',
    attemptId: 'att-existing-owner',
    agentKind: 'codex',
    editPaths: ['README.md'],
    readPaths: [],
    ownerToken: 'existing-owner-token',
    ownerPid: process.pid,
    worktreePath: fixtureRoot,
    persistReceipt: false,
    admission: coordinationRuntime.coordinationAdmissionDecision({ repoRoot: fixtureRoot }),
  });
  assert.equal(typeof existingClaim.claimId, 'string', JSON.stringify(existingClaim));
  const refusedCoordination = taskCreated(
    'FIT-COORDINATION-REFUSED',
    brief('FIT-COORDINATION-REFUSED'),
  );
  assert.equal(refusedCoordination.status, 2, refusedCoordination.stderr);
  assert.match(refusedCoordination.stderr, /coordination.*refus|overlap/iu);
  await coordinationRuntime.releaseClaim({
    repoRoot: fixtureRoot,
    claimId: existingClaim.claimId,
    ownerToken: 'existing-owner-token',
    fencingEpoch: existingClaim.fencingEpoch,
  });

  const invalidDelivery = [
    ['FIT-MISSING', ''],
    ['FIT-AMBIGUOUS', `${brief('FIT-AMBIGUOUS')}\n**Delivery fit**: checkpointed\n- Checkpoint 1: parser | authority state: one parser | verification: test.\n- Checkpoint 2: adapter | authority state: one adapter | verification: test.`],
    ['FIT-PLACEHOLDER', ['**Delivery fit**: single-turn', '**Estimated scope**: TBD', '**Coherence**: fill later'].join('\n')],
    ['FIT-MALFORMED', ['**Delivery fit**: checkpointed', '- Checkpoint 1: parser | authority state: one parser | verification: test.', '- Checkpoint 2: adapter | authority state: one adapter'].join('\n')],
    ['FIT-REORDERED', ['**Delivery fit**: checkpointed', '- Checkpoint 2: adapter | authority state: one adapter | verification: test.', '- Checkpoint 1: parser | authority state: one parser | verification: test.'].join('\n')],
  ];
  for (const [taskId, delivery] of invalidDelivery) {
    const description = taskId === 'FIT-AMBIGUOUS' ? delivery : brief(taskId, { delivery });
    const blocked = taskCreated(taskId, description);
    assert.equal(blocked.status, 2, `${taskId}: ${blocked.stderr}`);
    assert.match(blocked.stderr, /Delivery fit/u);
  }

  const deliveryGate = (taskId) => taskCreated(taskId, brief(taskId, { delivery: '' })).status === 2 ? 0 : 1;
  assert.equal(deliveryGate('FIT-MUTATION-BASELINE'), 0);
  const mutatedAdapter = adapter.replace("if (tier === 'implementation') {", "if (false && tier === 'implementation') {");
  assert.notEqual(mutatedAdapter, adapter);
  fs.writeFileSync(executable, mutatedAdapter);
  assert.equal(deliveryGate('FIT-MUTATION-REMOVED'), 1, 'removing implementation delivery-fit enforcement must turn the executable behavior gate red');
  fs.writeFileSync(executable, adapter);
  assert.equal(deliveryGate('FIT-MUTATION-RESTORED'), 0);
});

test('Proves: ORG-HOOK-003B; Test type: spoofed-root runtime mutation; Surface: CoachAI lifecycle root; Authority: script-derived canonical repository root; Killer mutation: trust mismatched CLAUDE_PROJECT_DIR; Gated command: npm test', (t) => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'coachai lifecycle verified root-'));
  const siblingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'coachai lifecycle spoofed root-'));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(siblingRoot, { recursive: true, force: true }));
  const sourceRoot = path.join(root, 'overlays', 'coachai', 'project-files');
  fs.cpSync(path.join(sourceRoot, 'scripts'), path.join(fixtureRoot, 'scripts'), { recursive: true });
  fs.cpSync(path.join(sourceRoot, '.ai-organization'), path.join(fixtureRoot, '.ai-organization'), { recursive: true });
  fs.cpSync(path.join(root, 'core'), path.join(fixtureRoot, '.ai-organization', 'runtime', 'core'), { recursive: true });
  const result = spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'claude-lifecycle-hook.mjs')], {
    cwd: fixtureRoot,
    input: JSON.stringify({ hook_event_name: 'SessionEnd', session_id: 'spoofed-root' }),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: siblingRoot },
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /CLAUDE_PROJECT_DIR does not match/iu);
  assert.equal(fs.existsSync(path.join(siblingRoot, 'tmp', 'agent-telemetry', 'lifecycle.jsonl')), false);
});

test('Proves: ORG-HOOK-004; Test type: nested-cwd runtime mutation and root counterexample; Surface: universal, Auxara, and CoachAI PostToolUse gate children; Authority: configured project root; Killer mutation: spawn npm or node from process.cwd(); Gated command: npm test', (t) => {
  for (const project of ['bootstrap', 'auxara-dialer', 'coachai']) {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), `${project} posttool root with spaces-`));
    t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
    const filePath = writePostToolFixture(project, fixtureRoot);
    const nestedCwd = path.join(fixtureRoot, 'packages', 'nested package');
    fs.mkdirSync(nestedCwd, { recursive: true });
    fs.copyFileSync(path.join(fixtureRoot, 'package.json'), path.join(nestedCwd, 'package.json'));

    for (const launchCwd of [fixtureRoot, nestedCwd]) {
      fs.rmSync(path.join(fixtureRoot, 'gate-cwds.jsonl'), { force: true });
      const result = runPostToolHook(fixtureRoot, launchCwd, filePath);
      assert.equal(result.status, 0, `${project} from ${launchCwd}: ${result.stderr}`);
      const records = fs.readFileSync(path.join(fixtureRoot, 'gate-cwds.jsonl'), 'utf8')
        .trim().split(/\r?\n/u).map((line) => JSON.parse(line));
      assert.equal(records.length > 0, true, `${project} must execute at least one routed gate`);
      assert.deepEqual(new Set(records.map((record) => path.resolve(record.cwd))), new Set([path.resolve(fixtureRoot)]));
    }
  }
});

test('Proves: ORG-HOOK-005; Test type: malformed-input mutation and no-op counterexample; Surface: universal, Auxara, and CoachAI PostToolUse gate parsing; Authority: Edit/Write hook payload contract; Killer mutation: catch malformed JSON and exit zero; Gated command: npm test', (t) => {
  for (const project of ['bootstrap', 'auxara-dialer', 'coachai']) {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), `${project} posttool payload-`));
    t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
    const filePath = writePostToolFixture(project, fixtureRoot);
    const malformed = runPostToolHook(fixtureRoot, fixtureRoot, filePath, '{not-json');
    assert.equal(malformed.status, 2, `${project} malformed payload must block`);
    assert.match(malformed.stderr, /malformed|invalid.*payload/iu);

    const missingEditPath = runPostToolHook(
      fixtureRoot,
      fixtureRoot,
      filePath,
      JSON.stringify({ hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: {} }),
    );
    assert.equal(missingEditPath.status, 2, `${project} Edit/Write without file_path must block`);

    const nonEdit = runPostToolHook(
      fixtureRoot,
      fixtureRoot,
      filePath,
      JSON.stringify({ hook_event_name: 'PostToolUse', tool_name: 'Read', tool_input: {} }),
    );
    assert.equal(nonEdit.status, 0, `${project} well-formed non-edit event remains a no-op`);
  }
});

test('Proves: ORG-REL-001; Test type: mutation; Surface: release-verifier template; Authority: deployed-verification truth table; Killer mutation: allow DEPLOY-VERIFIED with a skipped check or shell-only core flow; Gated command: npm test', () => {
  const source = read('templates/agents/release-verifier.template.md');
  assert.match(source, /There is no DEPLOY-VERIFIED-with-skips state/u);
  assert.match(source, /A frontend 200\/app shell is reachability evidence only/u);
  assert.match(source, /If any required check is named here, the verdict cannot be DEPLOY-VERIFIED/u);
});

test('Proves: ORG-REL-002; Test type: stale-authority mutation; Surface: release-verifier template and managed project overlays; Authority: current deploy-CLI contract plus replace-dont-layer doctrine; Killer mutation: restore append-only learned advice or a Railway -d deployment-id example; Gated command: npm test', () => {
  const sources = [
    read('templates/agents/release-verifier.template.md'),
    fs.readFileSync(
      path.join(root, 'overlays', 'auxara-dialer', 'project-files', '.claude', 'agents', 'release-verifier.md'),
      'utf8',
    ),
    fs.readFileSync(
      path.join(root, 'overlays', 'coachai', 'project-files', '.claude', 'agents', 'release-verifier.md'),
      'utf8',
    ),
  ];
  for (const source of sources) {
    assert.match(source, /Learned classes \(living current rules\)/u);
    assert.match(source, /railway --version/u);
    assert.doesNotMatch(source, /railway logs -d\s*<[^>]+>/u);
    assert.doesNotMatch(source, /orchestrator (?:APPENDS|appends)|never delete rows/u);
  }
});

test('Proves: ORG-UPTIME-001; Test type: mutation; Surface: uptime probe template; Authority: readiness contract; Killer mutation: treat any 2xx as ready; Gated command: npm test', () => {
  const source = read('templates/ci/uptime-probe.mjs.template');
  assert.match(source, /\{\{READINESS_JSON_ASSERTION\}\}/u);
  assert.match(source, /Never use a generic 2xx/u);
  assert.doesNotMatch(source, /const ready = readiness\.ok/u);
});
