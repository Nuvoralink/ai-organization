import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateActionPolicySemantics } from '../core/authority/assess-action.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bootstrap = path.join(root, 'skills', 'bootstrap-orchestrator');
const read = (relative) => fs.readFileSync(path.join(bootstrap, relative), 'utf8');

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
    path.join(root, 'overlays/coachai/project-files/scripts/check-agent-control-plane.mjs')
  ];
  for (const file of files) {
    const source = path.isAbsolute(file) ? fs.readFileSync(file, 'utf8') : read(file);
    assert.doesNotMatch(source, /docs\/agent-prompts\/action-authority\.json|\.ai-organization\/action-authority\.json|AGENT_ACTIONS|HUMAN_ACTIONS|MERGE_CONDITIONS|expectedAutonomous/u);
    assert.match(source, /validateActionPolicySemantics/u);
  }
});

test('Proves: ORG-PLAN-001; Test type: mutation; Surface: decision-log template; Authority: decision-sprint linkage schema; Killer mutation: restore the obsolete five-column header; Gated command: npm test', () => {
  const source = read('templates/docs/decision-log.md.template');
  const validates = (text) => text.includes('| ID | Title | Area | Phase | Sprint | Status | Notes |');
  assert.equal(validates(source), true);
  assert.equal(validates(source.replace('| ID | Title | Area | Phase | Sprint | Status | Notes |', '| ID | Decision | Basis | Date | Reversal trigger |')), false);
});

test('Proves: ORG-TEST-001; Test type: mutation; Surface: test-intent rule and gate templates; Authority: test-intent doctrine; Killer mutation: remove Killer mutation or Gated command enforcement; Gated command: npm test', () => {
  const rule = read('templates/rules/test-intent.template.md');
  const gate = read('templates/gates/check-test-intent.mjs.template');
  const validates = (ruleText, gateText) => ruleText.includes('Killer mutation:')
    && ruleText.includes('Gated command:')
    && gateText.includes("extractLineValue(h, 'Killer mutation')")
    && gateText.includes("extractLineValue(h, 'Gated command')");
  assert.equal(validates(rule, gate), true);
  assert.equal(validates(rule, gate.replace("if (!extractLineValue(h, 'Killer mutation'))", "if (false)")), false);
});

test('Proves: ORG-FLEET-001; Test type: mutation; Surface: bootstrap roster; Authority: agent-role registry; Killer mutation: omit either kickoff or premise challenger; Gated command: npm test', () => {
  const skill = read('SKILL.md');
  const claude = read('templates/CLAUDE.md.template');
  const agents = read('templates/AGENTS.md.template');
  const validates = (text) => text.includes('premise-and-architecture') && text.includes('sprint-kickoff');
  for (const source of [skill, claude, agents]) assert.equal(validates(source), true);
  assert.equal(validates(skill.replaceAll('sprint-kickoff', 'kickoff-removed')), false);
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
  for (const project of ['auxara-dialer', 'coachai']) {
    const adapter = fs.readFileSync(path.join(root, 'overlays', project, 'project-files', 'scripts', 'claude-lifecycle-hook.mjs'), 'utf8');
    assert.match(adapter, /completeLifecycleTask\(/u, `${project} TaskCompleted must call the shared stateful lifecycle controller`);
    assert.doesNotMatch(adapter, /artifact_opened|killer_mutation_observed|AGENT_PROOF_COMMAND/u, `${project} must not synthesize or override proof truth`);
  }
  const template = read('templates/lifecycle/claude-lifecycle-hook.mjs.template');
  assert.match(template, /completeLifecycleTask\(/u);
  assert.match(template, /TASK_CONTRACT_JSON/u);
});

test('Proves: ORG-HOOK-001; Test type: mutation and path counterexample; Surface: bootstrap and overlay hook descriptors; Authority: Claude project-root hook contract; Killer mutation: restore a cwd-relative shell-form command; Gated command: npm test', () => {
  const settingsSources = [
    ['bootstrap', parseCommentedJson(read('templates/settings.json.template'))],
    ['auxara-dialer', JSON.parse(fs.readFileSync(path.join(root, 'overlays', 'auxara-dialer', 'project-files', '.claude', 'settings.json'), 'utf8'))],
    ['coachai', JSON.parse(fs.readFileSync(path.join(root, 'overlays', 'coachai', 'project-files', '.claude', 'settings.json'), 'utf8'))],
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
  const validates = (name, source) => {
    if (name === 'bootstrap') return source.includes('root = configuredProjectRoot();')
      && source.includes('CLAUDE_PROJECT_DIR does not match the script-derived repository root')
      && !source.includes('repoRoot(payload?.cwd ?? process.cwd())');
    if (name === 'auxara') return source.includes('const telemetryDir = telemetryDirectory(projectRoot);') && !source.includes('telemetryDirectory(process.cwd())');
    return source.includes("const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');")
      && source.includes('fs.realpathSync.native(path.resolve(configuredProjectDir))')
      && source.includes('CLAUDE_PROJECT_DIR does not match the script-derived repository root')
      && !source.includes('const root = process.cwd();');
  };
  for (const [name, source] of Object.entries(sources)) {
    assert.equal(validates(name, source), true, `${name} roots lifecycle telemetry outside cwd`);
  }
  assert.equal(validates('bootstrap', sources.bootstrap.replace('root = configuredProjectRoot();', 'root = repoRoot(payload?.cwd ?? process.cwd());')), false);
  assert.equal(validates('auxara', sources.auxara.replace('const telemetryDir = telemetryDirectory(projectRoot);', 'const telemetryDir = telemetryDirectory(process.cwd());')), false);
  assert.equal(validates('coachai', sources.coachai.replace(
    "const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');",
    'const scriptRoot = process.cwd();',
  )), false);
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

test('Proves: ORG-HOOK-003C; Test type: canonical-template runtime mutation; Surface: generated lifecycle adapter; Authority: script-derived project root and parse integrity; Killer mutation: trust CLAUDE_PROJECT_DIR or catch malformed JSON and exit zero; Gated command: npm test', (t) => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bootstrap lifecycle verified root-'));
  const siblingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bootstrap lifecycle spoofed root-'));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(siblingRoot, { recursive: true, force: true }));
  fs.mkdirSync(path.join(fixtureRoot, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, '.ai-organization', 'runtime'), { recursive: true });
  fs.cpSync(path.join(root, 'core'), path.join(fixtureRoot, '.ai-organization', 'runtime', 'core'), { recursive: true });
  const adapter = read('templates/lifecycle/claude-lifecycle-hook.mjs.template')
    .replaceAll('{{INTEGRATION_BRANCH}}', 'main')
    .replaceAll('{{TASK_COMPLETION_GATE}}', 'verify');
  fs.writeFileSync(path.join(fixtureRoot, 'scripts', 'claude-lifecycle-hook.mjs'), adapter);
  assert.equal(spawnSync('git', ['init', '-b', 'root-proof'], { cwd: fixtureRoot, encoding: 'utf8' }).status, 0);
  const executable = path.join(fixtureRoot, 'scripts', 'claude-lifecycle-hook.mjs');

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
  const validates = (text) => text.includes('There is no DEPLOY-VERIFIED-with-skips state')
    && text.includes('A frontend 200/app shell is reachability evidence only')
    && text.includes('If any required check is named here, the verdict cannot be DEPLOY-VERIFIED');
  assert.equal(validates(source), true);
  assert.equal(validates(source.replace('There is no DEPLOY-VERIFIED-with-skips state.', 'Skipped checks may be disclosed.')), false);
});

test('Proves: ORG-UPTIME-001; Test type: mutation; Surface: uptime probe template; Authority: readiness contract; Killer mutation: treat any 2xx as ready; Gated command: npm test', () => {
  const source = read('templates/ci/uptime-probe.mjs.template');
  const validates = (text) => text.includes('{{READINESS_JSON_ASSERTION}}')
    && text.includes('Never use a generic 2xx')
    && !text.includes('const ready = readiness.ok');
  assert.equal(validates(source), true);
  assert.equal(validates(source.replace('const ready = readinessContract(readiness);', 'const ready = readiness.ok;')), false);
});
