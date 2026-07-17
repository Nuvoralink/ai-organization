#!/usr/bin/env node
/** Organization authority/inventory/lifecycle gate. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { validateActionPolicySemantics } from '../.ai-organization/runtime/core/authority/assess-action.mjs';
import { validateJsonAgainstSchema } from '../.ai-organization/runtime/core/schema/validate-json-schema.mjs';

const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const exists = (root, rel) => fs.existsSync(path.join(root, rel));
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');

export function checkAgentControlPlane(root = process.cwd()) {
  const errors = [];
  const requiredFiles = [
    '.ai-organization/policies/action-authority.v1.json', '.ai-organization/roles.json', '.ai-organization/proof-profiles.json',
    '.ai-organization/lifecycle-policy.json', '.ai-organization/schemas/task-assurance.v1.schema.json', '.ai-organization/schemas/task-evidence.v1.schema.json',
    '.ai-organization/ownership.json', '.claude/settings.json', '.github/CODEOWNERS', '.github/ISSUE_TEMPLATE/agent-slice.yml',
    '.github/pull_request_template.md', 'docs/app-plan/decision-log.md', 'docs/app-plan/adr/README.md', 'docs/app-plan/adr/000-template.md'
  ];
  for (const rel of requiredFiles) if (!exists(root, rel)) errors.push(`required control-plane artifact missing: ${rel}`);
  if (errors.length) return { ok: false, errors };

  for (const rel of ['.ai-organization/schemas/task-assurance.v1.schema.json', '.ai-organization/schemas/task-evidence.v1.schema.json']) {
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
    const declared = text.match(/^name:\s*([^\r\n]+)$/m)?.[1]?.trim();
    if (declared !== role.name) errors.push(`role name/file mismatch: ${role.name} declares ${declared ?? 'nothing'}`);
    if (role.read_only !== true || role.dispatch !== false) errors.push(`project role must be non-dispatch and registered read-only: ${role.name}`);
  }
  const agentsDir = path.join(root, '.claude', 'agents');
  for (const name of fs.readdirSync(agentsDir).filter((n) => n.endsWith('.md'))) {
    const rel = `.claude/agents/${name}`;
    if (!registeredFiles.has(rel)) errors.push(`unknown installed agent is absent from roles registry: ${rel}`);
  }

  const proof = readJson(root, '.ai-organization/proof-profiles.json');
  if (proof.unknown_path_policy !== 'fail') errors.push('unknown proof paths must fail closed');
  if (!Array.isArray(proof.profiles) || proof.profiles.length < 4) errors.push('proof profile inventory is missing risk classes');
  for (const profile of proof.profiles ?? []) if (!profile.id || !profile.lane || !profile.risk || !profile.include?.length || !profile.commands?.length) errors.push(`invalid proof profile: ${profile.id ?? '<unnamed>'}`);

  const settings = readJson(root, '.claude/settings.json');
  const requiredEvents = ['SessionStart', 'SubagentStart', 'TaskCreated', 'TaskCompleted', 'SubagentStop', 'PostCompact', 'SessionEnd'];
  for (const event of requiredEvents) {
    const hooks = settings.hooks?.[event];
    if (!Array.isArray(hooks) || !hooks.some((entry) => entry.hooks?.some((h) => h.command === 'node scripts/claude-lifecycle-hook.mjs'))) errors.push(`lifecycle hook missing for ${event}`);
  }
  if (!settings.hooks?.PostToolUse?.some((entry) => entry.hooks?.some((h) => h.command === 'node scripts/claude-posttooluse-gate.mjs'))) errors.push('separate fast PostToolUse gate is missing');

  const pkg = readJson(root, 'package.json');
  for (const script of ['gate:agent-context', 'gate:rules-wiring', 'gate:agent-control-plane', 'gate:overlay-parity', 'gate:organization', 'proof:changed', 'test:organization-control-plane']) if (!pkg.scripts?.[script]) errors.push(`package script missing: ${script}`);
  if (!/npm run proof:changed/.test(pkg.scripts?.verify ?? '')) errors.push('verify must include changed-path proof');
  if (!/auxara-sso/.test(pkg.scripts?.['verify:db'] ?? '')) errors.push('verify:db must include auxara-sso regression');

  const uiWorkflow = read(root, '.github/workflows/ui-source-of-truth-gates.yml');
  const dbWorkflow = read(root, '.github/workflows/backend-db-regressions.yml');
  if (!/npm run verify\s*$|npm run verify\r?\n/m.test(uiWorkflow) || !/PROOF_LANE:\s*static/.test(uiWorkflow)) errors.push('static CI must run root verify with the static proof lane');
  if (!/npm run proof:changed/.test(dbWorkflow) || !/PROOF_LANE:\s*db/.test(dbWorkflow)) errors.push('DB CI must run the central changed-path proof DB lane');

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
