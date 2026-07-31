// Proves: AUXARA-HYBRID-COMPAT-001
// Test type: canonical source-contract regression
// Surface: Auxara Dialer managed HYBRID doc/code, decision-linkage, and PostToolUse routing gates
// Authority: overlays/auxara-dialer/project-files/scripts
// Product statement: a scoped overlay delivery must retain the target gate APIs and resolved linkage behavior.
// Killer mutations: remove a public validator export or aggregate call, re-add BUX-019, restore naive pipe splitting,
// allow an unclosed inline-code span, drop one evidence-integrity route, run a gate from process.cwd(),
// or accept a cwd-relative Claude hook command instead of the rooted exec form.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docCodeGatePath = path.join(
  repoRoot,
  'overlays',
  'auxara-dialer',
  'project-files',
  'scripts',
  'check-doc-code-drift.mjs',
);
const decisionGatePath = path.join(
  repoRoot,
  'overlays',
  'auxara-dialer',
  'project-files',
  'scripts',
  'check-decision-sprint-linkage.mjs',
);
const gateRouterPath = path.join(
  repoRoot,
  'overlays',
  'auxara-dialer',
  'project-files',
  'scripts',
  'lib',
  'claudeGateRouter.mjs',
);
const organizationOverlayGatePath = path.join(
  repoRoot,
  'overlays',
  'auxara-dialer',
  'project-files',
  'scripts',
  'check-organization-overlay.mjs',
);
const agentControlPlaneGatePath = path.join(
  repoRoot,
  'overlays',
  'auxara-dialer',
  'project-files',
  'scripts',
  'check-agent-control-plane.mjs',
);
const hookSettingsValidatorPath = path.join(
  repoRoot,
  'overlays',
  'auxara-dialer',
  'project-files',
  'scripts',
  'lib',
  'validateClaudeHookSettings.mjs',
);
const auxaraSettingsPath = path.join(
  repoRoot,
  'overlays',
  'auxara-dialer',
  'project-files',
  '.claude',
  'settings.json',
);
const auxaraCompletionProfilesPath = path.join(
  repoRoot,
  'overlays',
  'auxara-dialer',
  'project-files',
  '.ai-organization',
  'completion-profiles.json',
);
const auxaraAuthenticationSkillPath = path.join(
  repoRoot,
  'overlays',
  'auxara-dialer',
  'project-files',
  '.agents',
  'skills',
  'auxara-dialer-authentication',
  'SKILL.md',
);

test('Auxara authentication skill preserves global identity and explicit workspace selection authority', () => {
  // Proves: DEC-001, AUTH-002, AUTH-011
  // Test type: canonical doctrine regression and negative contract mutation
  // Surface: generated Auxara authentication implementation guidance
  // Authority: DEC-001 plus ADR-AUTH-002/011
  // Product statement: one identity may safely belong to several workspaces without reviving scalar tenant/role authority or tenant-scoped credentials.
  // Killer mutations: put tenant_id/role_id back on users, put role on membership, choose the first membership, or tenant-scope password-reset tokens.
  const source = fs.readFileSync(auxaraAuthenticationSkillPath, 'utf8');

  assert.match(source, /`users\(id, email, account_status, auth_token_version, password_hash, …\)` — one global identity/u);
  assert.match(source, /`tenant_memberships\(id, tenant_id, user_id, status, …\)` — the only user↔workspace membership\/lifecycle authority/u);
  assert.match(source, /`role_assignments[^\n]+the sole role\/scope binding; membership never receives a role column/u);
  assert.match(source, /Zero active memberships:[^\n]+mint no workspace session/u);
  assert.match(source, /Exactly one:[^\n]+mint the normal stack-bound workspace JWT/u);
  assert.match(source, /Several:[^\n]+workspace-selection capability/u);
  assert.match(source, /`user_id`, `membership_id`, `tenant_id`, `auth_token_version`/u);
  assert.match(source, /`password_reset_tokens` binds to `user_id`, contains no `tenant_id`/u);
  assert.match(source, /Tenant-admin reset authorization remains workspace-scoped/u);
  assert.match(source, /revokes every workspace session/u);

  assert.doesNotMatch(source, /`users\(id, tenant_id,/u);
  assert.doesNotMatch(source, /reset[^\n]{0,160}tenant scoping/u);
  assert.doesNotMatch(source, /membership[^\n]{0,80}(?:role_id|role column)[^\n]{0,40}(?:authority|source)/iu);
});

test('Auxara doc/code gate preserves its public validator contract and aggregate wiring', () => {
  const source = fs.readFileSync(docCodeGatePath, 'utf8');
  const publicValidators = [
    'validateCentralRegistryDocumentation',
    'discoverCompanionAuthorityInventory',
    'validateLivingDocumentation',
    'validateDeferredEndpointDocLiveness',
    'runDocCodeDriftGate',
  ];

  for (const exportName of publicValidators) {
    assert.match(
      source,
      new RegExp(`export function ${exportName}\\b`),
      `${exportName} must remain an importable public validator`,
    );
  }

  const aggregateStart = source.indexOf('export function runDocCodeDriftGate');
  assert.notEqual(aggregateStart, -1, 'aggregate gate must remain exported');
  const aggregateSource = source.slice(aggregateStart);
  for (const validatorName of [
    'validateCentralRegistryDocumentation',
    'validateLivingDocumentation',
    'validateDeferredEndpointDocLiveness',
  ]) {
    assert.match(
      aggregateSource,
      new RegExp(`\\b${validatorName}\\(`),
      `${validatorName} must remain wired into the aggregate gate`,
    );
  }
});

test('Auxara decision gate keeps resolved backlog out and parses inline-code pipes fail-closed', async () => {
  const gate = await import(pathToFileURL(decisionGatePath).href);

  assert.equal(
    gate.PENDING_LINKAGE.some((row) => row.id === 'BUX-019'),
    false,
    'resolved BUX-019 must not return to the pending authority',
  );
  assert.deepEqual(gate.splitMarkdownRow('| REC-005 | `self|team|tenant` | Sprint 1.4 |'), [
    'REC-005',
    '`self|team|tenant`',
    'Sprint 1.4',
  ]);
  assert.equal(
    gate.splitMarkdownRow('| REC-005 | `self|team|tenant | Sprint 1.4 |'),
    null,
    'an unclosed inline-code span must fail closed',
  );
});

test('Auxara PostToolUse routing preserves every project evidence-integrity gate', async () => {
  const router = await import(pathToFileURL(gateRouterPath).href);

  assert.deepEqual(
    router.gatesForFile('repo/.ai-organization/policies/action-authority.v1.json'),
    ['gate:agent-control-plane', 'gate:organization-overlay', 'gate:task-assurance'],
  );
  assert.deepEqual(
    router.gatesForFile('repo/.claude/rules/testing-guardrails.md'),
    ['gate:rules-wiring', 'gate:rule-test-citations', 'gate:agent-context'],
  );
  assert.deepEqual(
    router.gatesForFile('repo/docs/app-plan/auditability/decision-log.md'),
    ['gate:decision-sprint-linkage', 'gate:project-ledger-drift', 'gate:doc-registry-refs'],
  );

  const source = fs.readFileSync(gateRouterPath, 'utf8');
  assert.match(source, /const DEFAULT_GATE_CWD = fileURLToPath\(new URL\('\.\.\/\.\.'/u);
  assert.match(source, /cwd = DEFAULT_GATE_CWD/u);
});

test('Auxara organization ownership refresh is dependency-free and ignores append-only learning', async () => {
  // Proves: ORG-OVERLAY-APPEND-ONLY-001
  // Test type: clean-worktree dependency and append-only hash mutation
  // Surface: installed Auxara organization ownership writer
  // Authority: .ai-organization/ownership.json appendOnlyMarkers
  // Product statement: a clean checkout can refresh ownership without installed packages, and learned-class appends do not masquerade as structural overlay drift.
  // Killer mutations: import Prettier in the writer, hash the full agent file, or ignore appendOnlyMarkers.
  const source = fs.readFileSync(organizationOverlayGatePath, 'utf8');
  assert.doesNotMatch(source, /(?:from\s+['"]prettier['"]|import\(['"]prettier['"]\))/u);

  const gate = await import(pathToFileURL(organizationOverlayGatePath).href);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'auxara-ownership-refresh-'));
  const agentPath = path.join(root, '.claude', 'agents', 'auditor.md');
  fs.mkdirSync(path.dirname(agentPath), { recursive: true });
  fs.mkdirSync(path.join(root, '.ai-organization'), { recursive: true });
  fs.writeFileSync(
    agentPath,
    '# Auditor\n\n## Learned classes\n\n2026-07-31 — first row\n',
  );
  fs.writeFileSync(
    path.join(root, '.ai-organization', 'ownership.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      owner: 'test',
      managedFiles: [{ path: '.claude/agents/auditor.md', sha256: '0'.repeat(64) }],
      projectOwnedRoots: ['backend/'],
      appendOnlyMarkers: ['## Learned classes'],
    }, null, 2)}\n`,
  );

  await gate.writeOrganizationOverlay(root);
  const first = JSON.parse(
    fs.readFileSync(path.join(root, '.ai-organization', 'ownership.json'), 'utf8'),
  ).managedFiles[0].sha256;
  fs.appendFileSync(agentPath, '2026-08-01 — second row\n');
  await gate.writeOrganizationOverlay(root);
  const second = JSON.parse(
    fs.readFileSync(path.join(root, '.ai-organization', 'ownership.json'), 'utf8'),
  ).managedFiles[0].sha256;
  assert.equal(second, first);
});

test('Auxara control-plane gate accepts only rooted exec-form Claude hooks', async () => {
  // Proves: ORG-HOOK-ROOT-001
  // Test type: canonical authority and negative contract mutation
  // Surface: installed Auxara lifecycle and PostToolUse hook validation
  // Authority: .claude/settings.json plus completion-profiles lifecycle timeout
  // Product statement: Claude hooks execute from the verified project root and cannot silently regress to cwd-relative command strings.
  // Killer mutations: accept "node scripts/..." as canonical, omit CLAUDE_PROJECT_DIR, or stop enforcing the PostToolUse matcher.
  const gate = await import(pathToFileURL(hookSettingsValidatorPath).href);
  const settingsSource = fs.readFileSync(auxaraSettingsPath, 'utf8');
  const completionProfilesSource = fs.readFileSync(auxaraCompletionProfilesPath, 'utf8');
  const controlPlaneSource = fs.readFileSync(agentControlPlaneGatePath, 'utf8');

  assert.match(controlPlaneSource, /errors\.push\(\.\.\.validateHookSettings\(settingsSource, completionProfiles\)\)/u);
  assert.deepEqual(gate.validateHookSettings(settingsSource, completionProfilesSource), []);

  const legacySettings = JSON.parse(settingsSource);
  legacySettings.hooks.TaskCreated[0].hooks[0] = {
    type: 'command',
    command: 'node scripts/claude-lifecycle-hook.mjs',
    timeout: 10,
  };
  assert.match(
    gate
      .validateHookSettings(JSON.stringify(legacySettings), completionProfilesSource)
      .join('\n'),
    /TaskCreated must have exactly one rooted exec-form lifecycle hook command/u,
  );

  const unscopedPostToolUse = JSON.parse(settingsSource);
  unscopedPostToolUse.hooks.PostToolUse[0].matcher = 'Write';
  assert.match(
    gate
      .validateHookSettings(JSON.stringify(unscopedPostToolUse), completionProfilesSource)
      .join('\n'),
    /PostToolUse must be Edit\|Write/u,
  );
});
