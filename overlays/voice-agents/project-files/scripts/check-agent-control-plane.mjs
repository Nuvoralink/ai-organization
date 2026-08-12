#!/usr/bin/env node
// Validates the installed durable orchestration artifacts.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import { validateActionPolicySemantics } from '../.ai-organization/runtime/core/authority/assess-action.mjs';
import { validateJsonAgainstSchema } from '../.ai-organization/runtime/core/schema/validate-json-schema.mjs';
import { validateRoleProjection } from '../.ai-organization/runtime/core/roles/agent-role-registry.mjs';
import {
  COMPLETION_CLAIM_LEASE_MS,
  isValidIntegrationBranch,
  MIN_PROOF_BUDGET_SAFETY_MARGIN_MS,
  normalizeProfileRegistry,
  validateRegisteredAgentRoleProviders,
  validateLifecycleRoleModes,
  validateSafeProofProfile,
} from '../.ai-organization/runtime/core/lifecycle/evidence-runtime.mjs';

export const ARTIFACTS = Object.freeze({
  issue: '.github/ISSUE_TEMPLATE/agent-slice.yml',
  pullRequest: '.github/pull_request_template.md',
  settings: '.claude/settings.json',
  workflow: '.claude/workflows/orchestration-drift-audit.js',
  loop: '.claude/loop.md',
  goals: 'docs/agent-prompts/goal-templates.md',
  playbook: 'docs/agent-prompts/orchestration-playbook.md',
  capabilities: '.ai-organization/policies/action-authority.v1.json',
  capabilitySchema: '.ai-organization/schemas/action-authority.v1.schema.json',
  lifecycle: 'scripts/claude-lifecycle-hook.mjs',
  proofRegistry: '.ai-organization/proof-profiles.json',
  riskPolicy: '.ai-organization/policies/risk-controls.v1.json',
  roles: '.ai-organization/roles.json',
  universalRoleRegistry: '.ai-organization/registries/agent-roles.v1.json',
  projectRoleExtension: '.ai-organization/registries/agent-roles.project.v1.json',
  universalRoleSchema: '.ai-organization/schemas/agent-role-registry.v1.schema.json',
  projectRoleSchema: '.ai-organization/schemas/agent-role-project-extension.v1.schema.json',
  fleetGate: 'scripts/check-fleet-parity.mjs',
  postToolGate: 'scripts/claude-posttooluse-gate.mjs',
  packageJson: 'package.json',
  gitignore: '.gitignore',
});

const REQUIRED_ISSUE_IDS = [
  'completion_tier',
  'context',
  'exact_paths',
  'numbered_procedure',
  'output_contract',
  'boundaries_escalation',
  'acceptance_criteria',
];
const REQUIRED_EVENTS = [
  'SessionStart',
  'SubagentStart',
  'TaskCreated',
  'TaskCompleted',
  'SubagentStop',
  'PostCompact',
  'SessionEnd',
  'PostToolUse',
];
const HUMAN_GATES = [
  'Human approves any merge that deploys or mutates production.',
  'Human approves deploy/publish, production config/write, or data migration.',
  'Human approves destructive/irreversible, billed/purchase, secret, or external-contact action.',
  'Human approves unresolved product scope, visible design/copy, or material architecture decision.',
];

function commandHooks(registrations) {
  return Array.isArray(registrations)
    ? registrations.flatMap((entry) => (Array.isArray(entry?.hooks) ? entry.hooks : []))
    : [];
}

function isRootedExecHook(hook, script) {
  return (
    hook?.type === 'command' &&
    hook.command === 'node' &&
    Array.isArray(hook.args) &&
    hook.args.length === 1 &&
    hook.args[0] === `\${CLAUDE_PROJECT_DIR}/scripts/${script}`
  );
}

function read(root, key, errors) {
  const relative = ARTIFACTS[key];
  try {
    return fs.readFileSync(path.join(root, relative), 'utf8');
  } catch {
    errors.push(`${relative}: missing/unreadable`);
    return '';
  }
}

function requireText(text, fragment, label, errors) {
  if (!text.toLowerCase().includes(fragment.toLowerCase()))
    errors.push(`${label}: missing ${fragment}`);
}

function unnegatedDangerousLines(text) {
  const danger =
    /\b(?:git\s+(?:push|reset|checkout|switch|merge|clean)|gh\s+(?:pr\s+(?:create|merge|close|review|comment)|issue\s+(?:create|close|comment))|deploy|publish|delete|purchase)\b/i;
  return text
    .split(/\r?\n/)
    .filter(
      (line) =>
        danger.test(line) && !/\b(?:do not|never|must not|forbid(?:den)?|without)\b/i.test(line),
    );
}

function projectedProviderRoles(roles) {
  return [
    ...(Array.isArray(roles?.global_roles) ? roles.global_roles : []),
    ...(Array.isArray(roles?.project_roles) ? roles.project_roles : []),
  ].filter((role) => typeof role?.file === 'string' && role.file.length > 0);
}

export function validateFleetControlPlane({
  root,
  roles,
  universalRoleRegistry,
  projectRoleExtension,
  fleetGate,
  postToolGate,
  packageJson,
}) {
  const errors = [];
  if (!Array.isArray(universalRoleRegistry?.roles))
    errors.push(`${ARTIFACTS.universalRoleRegistry}: roles must be an array`);
  if (!Array.isArray(projectRoleExtension?.roles))
    errors.push(`${ARTIFACTS.projectRoleExtension}: roles must be an array`);
  for (const [schemaKey, registryKey, value] of [
    ['universalRoleSchema', 'universalRoleRegistry', universalRoleRegistry],
    ['projectRoleSchema', 'projectRoleExtension', projectRoleExtension],
  ]) {
    try {
      errors.push(
        ...validateJsonAgainstSchema(path.join(root, ARTIFACTS[schemaKey]), value).map(
          (error) => `${ARTIFACTS[registryKey]}: schema ${error}`,
        ),
      );
    } catch {
      errors.push(`${ARTIFACTS[schemaKey]}: missing/unreadable`);
    }
  }
  errors.push(
    ...validateRoleProjection(universalRoleRegistry, projectRoleExtension, roles, 'roles.json').map(
      (error) => `${ARTIFACTS.roles}: ${error}`,
    ),
  );
  const providerRoles = projectedProviderRoles(roles);
  errors.push(
    ...validateRegisteredAgentRoleProviders(providerRoles, root).map(
      (error) => `${ARTIFACTS.roles}: ${error}`,
    ),
  );
  for (const fragment of [
    'validateRoleProjection',
    'agent-roles.v1.json',
    'agent-roles.project.v1.json',
    'exactly one executable fleet projection',
    'assertDispatchableFrontmatter',
    'unquoted scalar containing a colon-space',
    'Verdict rubric',
  ])
    requireText(fleetGate, fragment, ARTIFACTS.fleetGate, errors);
  if (
    !/^node\s+scripts\/check-fleet-parity\.mjs(?:\s|$)/u.test(
      packageJson?.scripts?.['gate:fleet-parity'] ?? '',
    )
  )
    errors.push(
      `${ARTIFACTS.packageJson}: gate:fleet-parity must execute the installed canonical fleet gate`,
    );
  if (!/npm run gate:fleet-parity/u.test(packageJson?.scripts?.['gates:all'] ?? ''))
    errors.push(`${ARTIFACTS.packageJson}: gates:all must include gate:fleet-parity`);
  for (const fragment of [
    'agent-roles(?:\\.project)?\\.v1\\.json',
    'agent-role-(?:registry|project-extension)\\.v1\\.schema\\.json',
    'roles\\.json',
    '\\.claude\\/agents',
    'check-fleet-parity\\.mjs',
    "gates.push('gate:fleet-parity')",
  ])
    requireText(postToolGate, fragment, ARTIFACTS.postToolGate, errors);
  return errors;
}

export function validateAgentControlPlane(root = process.cwd()) {
  const errors = [];
  const issue = read(root, 'issue', errors);
  const pullRequest = read(root, 'pullRequest', errors);
  const settingsText = read(root, 'settings', errors);
  const workflow = read(root, 'workflow', errors);
  const loop = read(root, 'loop', errors);
  const goals = read(root, 'goals', errors);
  const playbook = read(root, 'playbook', errors);
  const capabilitiesText = read(root, 'capabilities', errors);
  const lifecycle = read(root, 'lifecycle', errors);
  const proofRegistryText = read(root, 'proofRegistry', errors);
  const riskPolicyText = read(root, 'riskPolicy', errors);
  const rolesText = read(root, 'roles', errors);
  const universalRoleRegistryText = read(root, 'universalRoleRegistry', errors);
  const projectRoleExtensionText = read(root, 'projectRoleExtension', errors);
  const fleetGate = read(root, 'fleetGate', errors);
  const postToolGate = read(root, 'postToolGate', errors);
  const packageJsonText = read(root, 'packageJson', errors);
  const gitignore = read(root, 'gitignore', errors);

  for (const id of REQUIRED_ISSUE_IDS) requireText(issue, `id: ${id}`, ARTIFACTS.issue, errors);
  const tiers = [...issue.matchAll(/^\s*-\s+(read-only|implementation)\s*$/gm)].map(
    (match) => match[1],
  );
  if (tiers.join(',') !== 'read-only,implementation')
    errors.push(`${ARTIFACTS.issue}: completion tiers must be exactly read-only, implementation`);
  for (const id of REQUIRED_ISSUE_IDS) {
    const block =
      issue.match(new RegExp(`id:\\s*${id}[\\s\\S]*?(?=\\n\\s*- type:|$)`, 'i'))?.[0] ?? '';
    if (!/required:\s*true/i.test(block)) errors.push(`${ARTIFACTS.issue}: ${id} is not required`);
  }

  for (const gate of HUMAN_GATES) {
    requireText(pullRequest, `- [ ] ${gate}`, ARTIFACTS.pullRequest, errors);
    if (pullRequest.includes(`- [x] ${gate}`))
      errors.push(`${ARTIFACTS.pullRequest}: human gate is pre-checked: ${gate}`);
  }

  let capabilities;
  try {
    capabilities = JSON.parse(capabilitiesText);
  } catch {
    errors.push(`${ARTIFACTS.capabilities}: invalid JSON`);
    capabilities = {};
  }
  try {
    errors.push(
      ...validateJsonAgainstSchema(path.join(root, ARTIFACTS.capabilitySchema), capabilities).map(
        (error) => `${ARTIFACTS.capabilities}: schema ${error}`,
      ),
    );
  } catch {
    errors.push(`${ARTIFACTS.capabilitySchema}: missing/unreadable`);
  }
  errors.push(
    ...validateActionPolicySemantics(capabilities).map(
      (error) => `${ARTIFACTS.capabilities}: semantics ${error}`,
    ),
  );

  let proofRegistry;
  let riskPolicy;
  let roles;
  let universalRoleRegistry;
  let projectRoleExtension;
  let packageJson;
  try {
    proofRegistry = JSON.parse(proofRegistryText);
  } catch {
    errors.push(`${ARTIFACTS.proofRegistry}: invalid JSON`);
    proofRegistry = {};
  }
  try {
    riskPolicy = JSON.parse(riskPolicyText);
  } catch {
    errors.push(`${ARTIFACTS.riskPolicy}: invalid JSON`);
    riskPolicy = {};
  }
  try {
    roles = JSON.parse(rolesText);
  } catch {
    errors.push(`${ARTIFACTS.roles}: invalid JSON`);
    roles = {};
  }
  try {
    universalRoleRegistry = JSON.parse(universalRoleRegistryText);
  } catch {
    errors.push(`${ARTIFACTS.universalRoleRegistry}: invalid JSON`);
    universalRoleRegistry = {};
  }
  try {
    projectRoleExtension = JSON.parse(projectRoleExtensionText);
  } catch {
    errors.push(`${ARTIFACTS.projectRoleExtension}: invalid JSON`);
    projectRoleExtension = {};
  }
  try {
    packageJson = JSON.parse(packageJsonText);
  } catch {
    errors.push(`${ARTIFACTS.packageJson}: invalid JSON`);
    packageJson = {};
  }

  errors.push(
    ...validateFleetControlPlane({
      root,
      roles,
      universalRoleRegistry,
      projectRoleExtension,
      fleetGate,
      postToolGate,
      packageJson,
    }),
  );
  const providerRoles = projectedProviderRoles(roles);
  const roleNames = new Set(providerRoles.map((role) => role.name));
  const roleModes = new Map(providerRoles.map((role) => [role.name, role.mode]));

  if (!isValidIntegrationBranch(proofRegistry.integration_branch))
    errors.push(
      `${ARTIFACTS.proofRegistry}: integration_branch must be an explicit safe Git branch name`,
    );
  if (
    !Array.isArray(proofRegistry.lifecycle_supported_risk_classes) ||
    proofRegistry.lifecycle_supported_risk_classes.length === 0
  )
    errors.push(`${ARTIFACTS.proofRegistry}: lifecycle-supported risk classes must be explicit`);
  errors.push(
    ...validateLifecycleRoleModes(proofRegistry.lifecycle_roles_by_completion_mode, roleModes).map(
      (error) => `${ARTIFACTS.proofRegistry}: ${error}`,
    ),
  );
  if (!Number.isInteger(proofRegistry.lifecycle_hook_timeout_ms))
    errors.push(`${ARTIFACTS.proofRegistry}: lifecycle_hook_timeout_ms is required`);
  if (
    !Number.isInteger(proofRegistry.lifecycle_timeout_safety_margin_ms) ||
    proofRegistry.lifecycle_timeout_safety_margin_ms < MIN_PROOF_BUDGET_SAFETY_MARGIN_MS
  )
    errors.push(
      `${ARTIFACTS.proofRegistry}: lifecycle timeout safety margin must be at least one minute`,
    );
  const rawProfiles = Array.isArray(proofRegistry.profiles)
    ? proofRegistry.profiles
    : Object.entries(proofRegistry.profiles ?? {}).map(([id, profile]) => ({ id, ...profile }));
  const lifecycleIds = new Set(
    rawProfiles
      .filter((profile) => profile.assurance || profile.classification)
      .map((profile) => profile.id),
  );
  const lifecycleProfiles = normalizeProfileRegistry(proofRegistry).filter((profile) =>
    lifecycleIds.has(profile.id),
  );
  const providedCapabilities = new Set(
    lifecycleProfiles.flatMap((profile) => profile.capabilities ?? []),
  );
  for (const profile of lifecycleProfiles)
    errors.push(
      ...validateSafeProofProfile(profile, { cwd: root, actionAuthority: capabilities }).map(
        (error) => `${ARTIFACTS.proofRegistry}/${profile.id}: ${error}`,
      ),
    );
  for (const riskClass of proofRegistry.lifecycle_supported_risk_classes ?? []) {
    const row = riskPolicy.classes?.[riskClass];
    if (!row)
      errors.push(
        `${ARTIFACTS.proofRegistry}: lifecycle-supported risk class has no policy row: ${riskClass}`,
      );
    for (const required of row?.required_proofs ?? [])
      if (!providedCapabilities.has(required))
        errors.push(
          `${ARTIFACTS.proofRegistry}: ${riskClass} lacks assurance capability provider: ${required}`,
        );
    for (const required of row?.required_roles ?? [])
      if (!roleNames.has(required))
        errors.push(
          `${ARTIFACTS.proofRegistry}: ${riskClass} lacks registered role provider: ${required}`,
        );
  }
  const profileBudgets = lifecycleProfiles.map(
    (profile) =>
      (profile.commands ?? []).reduce(
        (sum, command) => sum + (Number.isInteger(command.timeout_ms) ? command.timeout_ms : 0),
        0,
      ) + (Number.isInteger(profile.mutation?.timeout_ms) ? profile.mutation.timeout_ms : 0),
  );
  if (
    profileBudgets.some(
      (budget) =>
        budget + (proofRegistry.lifecycle_timeout_safety_margin_ms ?? 0) >
        (proofRegistry.lifecycle_hook_timeout_ms ?? 0),
    )
  )
    errors.push(
      `${ARTIFACTS.proofRegistry}: a lifecycle profile budget exceeds the hook timeout after safety margin`,
    );
  if (
    (proofRegistry.lifecycle_hook_timeout_ms ?? Infinity) +
      (proofRegistry.lifecycle_timeout_safety_margin_ms ?? 0) >
    COMPLETION_CLAIM_LEASE_MS
  )
    errors.push(
      `${ARTIFACTS.proofRegistry}: hook timeout plus safety margin exceeds the completion claim lease`,
    );

  if (/node:(?:child_process|vm)|\b(?:exec|execSync|spawn|spawnSync)\s*\(/.test(workflow))
    errors.push(`${ARTIFACTS.workflow}: process execution/imports are forbidden`);
  const agentCalls = workflow.match(/\bagent\s*\(/g)?.length ?? 0;
  if (agentCalls < 1 || agentCalls > 4)
    errors.push(
      `${ARTIFACTS.workflow}: agent() calls must be between 1 and 4, found ${agentCalls}`,
    );
  requireText(workflow, 'readOnlyIntent: true', ARTIFACTS.workflow, errors);
  requireText(workflow, 'plan mode', ARTIFACTS.workflow, errors);
  requireText(workflow, 'notReached', ARTIFACTS.workflow, errors);
  for (const line of unnegatedDangerousLines(workflow))
    errors.push(`${ARTIFACTS.workflow}: unnegated dangerous instruction: ${line.trim()}`);

  for (const fragment of [
    'Hard cap',
    'Exit:',
    'Progress:',
    'Budget:',
    'conditional-merge',
    'Human',
  ])
    requireText(loop, fragment, ARTIFACTS.loop, errors);
  requireText(goals, 'enter Claude plan mode', ARTIFACTS.goals, errors);
  requireText(playbook, 'Enter Claude plan mode first', ARTIFACTS.playbook, errors);
  requireText(playbook, 'prompt language alone is not', ARTIFACTS.playbook, errors);
  requireText(lifecycle, 'Procedure needs a numbered step', ARTIFACTS.lifecycle, errors);
  requireText(lifecycle, 'Doctrine-loop findings', ARTIFACTS.lifecycle, errors);
  requireText(lifecycle, 'Honesty clause', ARTIFACTS.lifecycle, errors);
  requireText(gitignore, 'tmp/agent-telemetry/', ARTIFACTS.gitignore, errors);
  requireText(gitignore, 'tmp/agent-assurance/', ARTIFACTS.gitignore, errors);

  let settings;
  try {
    settings = JSON.parse(settingsText);
  } catch {
    errors.push(`${ARTIFACTS.settings}: invalid JSON`);
    settings = {};
  }
  const hooks = settings?.hooks ?? {};
  const hookNames = Object.keys(hooks).sort();
  if (JSON.stringify(hookNames) !== JSON.stringify([...REQUIRED_EVENTS].sort()))
    errors.push(
      `${ARTIFACTS.settings}: hook events must be exactly ${[...REQUIRED_EVENTS].sort().join(', ')}; found ${hookNames.join(', ')}`,
    );
  for (const event of REQUIRED_EVENTS.filter((name) => name !== 'PostToolUse')) {
    const registrations = hooks[event];
    const commands = commandHooks(registrations);
    if (
      registrations?.length !== 1 ||
      commands.length !== 1 ||
      !isRootedExecHook(commands[0], 'claude-lifecycle-hook.mjs')
    )
      errors.push(
        `${ARTIFACTS.settings}: ${event} must contain exactly one rooted exec-form claude-lifecycle-hook.mjs command hook`,
      );
  }
  const taskCompletedTimeouts = commandHooks(hooks.TaskCompleted)
    .filter((hook) => isRootedExecHook(hook, 'claude-lifecycle-hook.mjs'))
    .map((hook) => hook.timeout);
  if (
    taskCompletedTimeouts.length !== 1 ||
    taskCompletedTimeouts[0] * 1_000 !== proofRegistry.lifecycle_hook_timeout_ms
  )
    errors.push(
      `${ARTIFACTS.settings}: TaskCompleted timeout must exactly match proof registry lifecycle_hook_timeout_ms`,
    );
  const post = hooks.PostToolUse;
  const postCommands = commandHooks(post);
  if (
    post?.length !== 1 ||
    post[0]?.matcher !== 'Edit|Write' ||
    postCommands.length !== 1 ||
    !isRootedExecHook(postCommands[0], 'claude-posttooluse-gate.mjs')
  )
    errors.push(
      `${ARTIFACTS.settings}: PostToolUse must be Edit|Write with exactly one rooted exec-form claude-posttooluse-gate.mjs command hook`,
    );
  if (/figma/i.test(JSON.stringify(settings?.permissions?.allow ?? [])))
    errors.push(`${ARTIFACTS.settings}: retired Figma tool remains actively allowlisted`);

  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const errors = validateAgentControlPlane(root);
  if (errors.length) {
    console.error(`check-agent-control-plane: ${errors.length} error(s)`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`check-agent-control-plane: ${Object.keys(ARTIFACTS).length} artifacts valid`);
}
