#!/usr/bin/env node
/** Organization authority/inventory/lifecycle gate. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { validateActionPolicySemantics } from '../.ai-organization/runtime/core/authority/assess-action.mjs';
import { validateJsonAgainstSchema } from '../.ai-organization/runtime/core/schema/validate-json-schema.mjs';
import { COMPLETION_CLAIM_LEASE_MS, agentFrontmatterName, isValidIntegrationBranch, normalizeProfileRegistry, validateLifecycleRoleModes, validateSafeProofProfile } from '../.ai-organization/runtime/core/lifecycle/evidence-runtime.mjs';

const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const exists = (root, rel) => fs.existsSync(path.join(root, rel));
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');

function commandHooks(registrations) {
  return Array.isArray(registrations)
    ? registrations.flatMap((entry) => (Array.isArray(entry?.hooks) ? entry.hooks : []))
    : [];
}

function isRootedExecHook(hook, script) {
  return hook?.type === 'command'
    && hook.command === 'node'
    && Array.isArray(hook.args)
    && hook.args.length === 1
    && hook.args[0] === `\${CLAUDE_PROJECT_DIR}/scripts/${script}`;
}

export function checkAgentControlPlane(root = process.cwd()) {
  const errors = [];
  const requiredFiles = [
    '.ai-organization/policies/action-authority.v1.json', '.ai-organization/roles.json', '.ai-organization/proof-profiles.json',
    '.ai-organization/lifecycle-policy.json', '.ai-organization/schemas/task-assurance.v2.schema.json', '.ai-organization/schemas/task-evidence.v2.schema.json', '.ai-organization/schemas/task-evidence.v3.schema.json',
    '.ai-organization/ownership.json', '.claude/settings.json', '.github/CODEOWNERS', '.github/ISSUE_TEMPLATE/agent-slice.yml',
    '.github/pull_request_template.md', 'docs/app-plan/decision-log.md', 'docs/app-plan/adr/README.md', 'docs/app-plan/adr/000-template.md',
    'scripts/check-fleet-parity.mjs'
  ];
  for (const rel of requiredFiles) if (!exists(root, rel)) errors.push(`required control-plane artifact missing: ${rel}`);
  if (errors.length) return { ok: false, errors };

  for (const rel of ['.ai-organization/schemas/task-assurance.v2.schema.json', '.ai-organization/schemas/task-evidence.v2.schema.json', '.ai-organization/schemas/task-evidence.v3.schema.json']) {
    try { readJson(root, rel); } catch (error) { errors.push(`invalid JSON authority ${rel}: ${error.message}`); }
  }

  const action = readJson(root, '.ai-organization/policies/action-authority.v1.json');
  errors.push(...validateJsonAgainstSchema(path.join(root, '.ai-organization/schemas/action-authority.v1.schema.json'), action).map((error) => `action authority schema: ${error}`));
  errors.push(...validateActionPolicySemantics(action).map((error) => `action authority semantics: ${error}`));

  const roles = readJson(root, '.ai-organization/roles.json');
  const allRoles = [...(roles.global_roles ?? []), ...(roles.project_roles ?? [])];
  const names = allRoles.map((r) => r.name);
  if (new Set(names).size !== names.length) errors.push('role names must be unique');
  const dispatchers = allRoles.filter((r) => r.dispatch === true);
  if (dispatchers.length !== 1 || dispatchers[0]?.name !== 'orchestrator' || roles.dispatch_authority !== 'orchestrator') errors.push('orchestrator must be the single dispatch authority');
  for (const required of ['premise-and-architecture-challenger', 'sprint-kickoff-auditor', 'functionality-parity-auditor', 'user-journey-auditor', 'release-verifier', 'ui-verifier']) if (!names.includes(required)) errors.push(`required role missing: ${required}`);
  const registeredFiles = new Set();
  for (const role of roles.project_roles ?? []) {
    if (!role.file || !exists(root, role.file)) { errors.push(`installed role file missing: ${role.name}`); continue; }
    registeredFiles.add(role.file.replace(/\\/g, '/'));
    const text = read(root, role.file);
    const declared = agentFrontmatterName(text);
    if (declared !== role.name) errors.push(`role name/file mismatch: ${role.name} declares ${declared ?? 'nothing'}`);
    if (role.read_only !== true || role.dispatch !== false) errors.push(`project role must be non-dispatch and registered read-only: ${role.name}`);
  }
  const agentsDir = path.join(root, '.claude', 'agents');
  for (const name of fs.readdirSync(agentsDir).filter((n) => n.endsWith('.md'))) {
    const rel = `.claude/agents/${name}`;
    if (!registeredFiles.has(rel)) errors.push(`unknown installed agent is absent from roles registry: ${rel}`);
  }

  const proof = readJson(root, '.ai-organization/proof-profiles.json');
  const riskPolicy = readJson(root, '.ai-organization/policies/risk-controls.v1.json');
  if (proof.unknown_path_policy !== 'fail') errors.push('unknown proof paths must fail closed');
  if (!isValidIntegrationBranch(proof.integration_branch)) errors.push('proof registry integration branch must be an explicit safe Git branch name');
  if (!Array.isArray(proof.lifecycle_supported_risk_classes) || proof.lifecycle_supported_risk_classes.length === 0) errors.push('proof registry must explicitly declare lifecycle-supported risk classes');
  const roleProviderModes = new Map(allRoles.map((role) => [role.name, role.mutates_source === true ? 'implementation' : 'read-only']));
  errors.push(...validateLifecycleRoleModes(proof.lifecycle_roles_by_completion_mode, roleProviderModes));
  if (!Number.isInteger(proof.lifecycle_hook_timeout_ms) || !Number.isInteger(proof.lifecycle_timeout_safety_margin_ms)) errors.push('proof registry must declare hook timeout and safety margin in milliseconds');
  if (!Array.isArray(proof.profiles) || proof.profiles.length < 4) errors.push('proof profile inventory is missing risk classes');
  for (const profile of proof.profiles ?? []) {
    const assurance = profile.assurance;
    const isReadOnlyIntegrity = profile.id === 'internal-read-only'
      && profile.lane === 'internal'
      && profile.risk === 'read_only_integrity'
      && Array.isArray(profile.include) && profile.include.length === 0
      && Array.isArray(profile.commands) && profile.commands.length === 0
      && assurance?.classification === 'internal_read_only'
      && assurance.safe_local_only === true
      && JSON.stringify(assurance.capabilities) === JSON.stringify(['read_only_integrity'])
      && assurance.commands?.length === 1
      && assurance.commands[0]?.id === 'repository-binding'
      && JSON.stringify(assurance.commands[0]?.argv) === JSON.stringify(['internal', 'repository-binding'])
      && assurance.mutation === undefined;
    const isProjectProof = profile.id
      && profile.lane
      && profile.risk
      && profile.include?.length
      && profile.commands?.length;
    if (!isReadOnlyIntegrity && !isProjectProof) errors.push(`invalid proof profile: ${profile.id ?? '<unnamed>'}`);
  }
  const lifecycleProfileIds = new Set((proof.profiles ?? []).filter((profile) => profile.assurance).map((profile) => profile.id));
  const lifecycleProfiles = normalizeProfileRegistry(proof).filter((profile) => lifecycleProfileIds.has(profile.id));
  for (const profile of lifecycleProfiles) errors.push(...validateSafeProofProfile(profile, { cwd: root, actionAuthority: action }).map((error) => `invalid assurance provider ${profile.id}: ${error}`));
  const organizationGateProof = proof.profiles
    ?.find((profile) => profile.id === 'organization-control')
    ?.assurance?.commands
    ?.find((command) => command.id === 'organization-gates');
  for (const marker of ['fleet-parity: PASS', 'overlay-parity: PASS']) {
    if (!organizationGateProof?.parser?.required_patterns?.includes(marker)) {
      errors.push(`organization-gates proof must require aggregate receipt marker: ${marker}`);
    }
  }
  const assuranceCapabilities = new Set(lifecycleProfiles.flatMap((profile) => profile.capabilities ?? []));
  const roleProviders = new Set(names);
  for (const riskClass of proof.lifecycle_supported_risk_classes ?? []) {
    const row = riskPolicy.classes?.[riskClass];
    if (!row) errors.push(`lifecycle-supported risk class has no policy row: ${riskClass}`);
    for (const capability of row?.required_proofs ?? []) if (!assuranceCapabilities.has(capability)) errors.push(`lifecycle-supported risk class ${riskClass} lacks assurance capability provider: ${capability}`);
    for (const role of row?.required_roles ?? []) if (!roleProviders.has(role)) errors.push(`lifecycle-supported risk class ${riskClass} lacks registered role provider: ${role}`);
  }
  for (const rule of proof.risk_path_rules ?? []) if (!riskPolicy.classes?.[rule.risk_class] || (!Array.isArray(rule.include) && !(proof.profiles ?? []).some((profile) => profile.id === rule.profile_id && Array.isArray(profile.include)))) errors.push(`invalid risk path rule for ${rule.risk_class ?? '<missing>'}`);
  const profileBudgets = lifecycleProfiles.map((profile) => (profile.commands ?? []).reduce((sum, command) => sum + (command.timeout_ms ?? 0), 0) + (profile.mutation?.timeout_ms ?? 0));
  if (profileBudgets.some((budget) => budget + proof.lifecycle_timeout_safety_margin_ms > proof.lifecycle_hook_timeout_ms)) errors.push('lifecycle assurance profile budget exceeds hook timeout after safety margin');
  if (proof.lifecycle_hook_timeout_ms + proof.lifecycle_timeout_safety_margin_ms > COMPLETION_CLAIM_LEASE_MS) errors.push('lifecycle hook timeout plus safety margin exceeds completion claim lease');

  const settings = readJson(root, '.claude/settings.json');
  const requiredEvents = ['SessionStart', 'SubagentStart', 'TaskCreated', 'TaskCompleted', 'SubagentStop', 'PostCompact', 'SessionEnd'];
  for (const event of requiredEvents) {
    const registrations = settings.hooks?.[event];
    const hooks = commandHooks(registrations);
    if (registrations?.length !== 1 || hooks.length !== 1 || !isRootedExecHook(hooks[0], 'claude-lifecycle-hook.mjs')) errors.push(`rooted exec-form lifecycle hook missing for ${event}`);
  }
  const taskCompletedTimeouts = commandHooks(settings.hooks?.TaskCompleted).filter((hook) => isRootedExecHook(hook, 'claude-lifecycle-hook.mjs')).map((hook) => hook.timeout);
  if (taskCompletedTimeouts.length !== 1 || taskCompletedTimeouts[0] * 1_000 !== proof.lifecycle_hook_timeout_ms) errors.push('TaskCompleted lifecycle hook timeout must exactly match the proof registry authority');
  const post = settings.hooks?.PostToolUse;
  const postHooks = commandHooks(post);
  if (post?.length !== 1 || post[0]?.matcher !== 'Edit|Write' || postHooks.length !== 1 || !isRootedExecHook(postHooks[0], 'claude-posttooluse-gate.mjs')) errors.push('separate rooted exec-form PostToolUse gate is missing');
  // The managed-edit guard is REQUIRED (fork-trap shift-left): without it, editing a delivered
  // managed copy is only discovered at parity-gate time, after the damage.
  const pre = settings.hooks?.PreToolUse;
  const preHooks = commandHooks(pre);
  if (pre?.length !== 1 || pre[0]?.matcher !== 'Edit|Write' || preHooks.length !== 1 || !isRootedExecHook(preHooks[0], 'claude-pretooluse-guard.mjs')) errors.push('separate rooted exec-form PreToolUse managed-edit guard is missing');

  const pkg = readJson(root, 'package.json');
  for (const script of ['gate:agent-context', 'gate:rules-wiring', 'gate:agent-control-plane', 'gate:fleet-parity', 'gate:overlay-parity', 'gate:organization', 'proof:changed', 'test:organization-control-plane']) if (!pkg.scripts?.[script]) errors.push(`package script missing: ${script}`);
  if (!/npm run gate:fleet-parity/u.test(pkg.scripts?.['gate:organization'] ?? '')) errors.push('gate:organization must include gate:fleet-parity');
  if (!/npm run proof:changed/.test(pkg.scripts?.verify ?? '')) errors.push('verify must include changed-path proof');
  // verify:db is still the single DB-regression authority, but its membership now comes from the
  // discovery-driven lane registry instead of a hand-maintained npm chain (the chain ran 12 scripts
  // while 274 existed). Assert the new entrypoint AND the coverage the old sentinel protected.
  const verifyDb = pkg.scripts?.['verify:db'] ?? '';
  if (!/run-backend-regressions\.mjs --lane=db/.test(verifyDb)) errors.push('verify:db must delegate to the discovery-driven db lane (scripts/run-backend-regressions.mjs --lane=db)');
  if (!/npm run test:regression:static/.test(readJson(root, '.ai-organization/proof-profiles.json').profiles.find((p) => p.id === 'backend-static')?.commands?.join(' ') ?? '')) errors.push('backend-static proof profile must run the static regression lane');
  const laneRegistry = readJson(root, 'backend/scripts/regression-lanes.json');
  for (const required of ['auxaraSsoRegression.ts', 'dialerIngestCallRegression.ts', 'tenantSecurityBlackBoxRegression.ts']) {
    if (!(laneRegistry.db ?? []).includes(required)) errors.push(`regression-lanes.json db lane must include ${required}`);
    if (laneRegistry.quarantine?.[required]) errors.push(`${required} must not be quarantined — it is a required DB-authority regression`);
  }

  const uiWorkflow = read(root, '.github/workflows/ui-source-of-truth-gates.yml');
  const dbWorkflow = read(root, '.github/workflows/backend-db-regressions.yml');
  const ciLocal = read(root, 'scripts/ci-local.mjs');
  if (!/npm run verify\s*$|npm run verify\r?\n/m.test(uiWorkflow) || !/PROOF_LANE:\s*static/.test(uiWorkflow)) errors.push('static CI must run root verify with the static proof lane');
  if (!/npm run proof:changed/.test(dbWorkflow) || !/PROOF_LANE:\s*db/.test(dbWorkflow)) errors.push('DB CI must run the central changed-path proof DB lane');
  if (!/JWT_SECRET:\s*ci-test-jwt-secret-value/.test(uiWorkflow)) errors.push('static CI must provide the non-secret test JWT import prerequisite');
  if (!/TENANT_SECURITY_BLACKBOX_DATABASE_URL:\s*postgresql:\/\/test:test@localhost:5432\/test/.test(dbWorkflow)
    || !/TENANT_SECURITY_BLACKBOX_CONFIRM_DISPOSABLE_DB:\s*["']?1["']?/.test(dbWorkflow)) {
    errors.push('DB CI must explicitly bind tenant black-box tests to its disposable service database');
  }
  for (const marker of ['JWT_SECRET', 'TENANT_SECURITY_BLACKBOX_DATABASE_URL', 'TENANT_SECURITY_BLACKBOX_CONFIRM_DISPOSABLE_DB']) {
    if (!ciLocal.includes(marker)) errors.push(`ci-local must mirror the workflow prerequisite ${marker}`);
  }

  const combined = [read(root, 'AGENTS.md'), read(root, '.cursor/rules/coachai-frontend-rules.mdc'), read(root, '.claude/agents/ui-verifier.md')].join('\n');
  if (!/Claude Design/.test(combined) || !/approval/i.test(combined)) errors.push('Claude Design approval authority is not wired');
  if (/Figma reference|approved Figma|Figma-first/i.test(combined)) errors.push('active Figma design authority remains in control surfaces');
  const decision = read(root, 'docs/app-plan/decision-log.md');
  for (const id of ['ORG-001', 'ORG-002', 'ORG-003', 'ORG-004', 'ORG-005', 'ORG-006']) if (!decision.includes(id)) errors.push(`settled organization decision missing: ${id}`);
  if (!/Branch protection is deferred/i.test(decision)) errors.push('decision log must state branch protection is deferred');

  return { ok: errors.length === 0, errors, roleCount: allRoles.length, proofProfileCount: proof.profiles?.length ?? 0 };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rootArg = process.argv.indexOf('--root');
  const result = checkAgentControlPlane(rootArg >= 0 ? path.resolve(process.argv[rootArg + 1]) : process.cwd());
  if (!result.ok) { console.error(['agent-control-plane: FAIL', ...result.errors.map((e) => `- ${e}`)].join('\n')); process.exit(1); }
  console.log(`agent-control-plane: PASS — ${result.roleCount} roles, ${result.proofProfileCount} risk profiles, canonical action authority semantics`);
}
