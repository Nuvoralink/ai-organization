#!/usr/bin/env node

// Auxara — agent control-plane artifact gate (NFR-011).
//
// Central authority for the GitHub handoff templates, saved plan-mode read-only-intent workflow,
// and Agent View goal templates. The gate parses workflow JavaScript with the repo's TypeScript dependency;
// it does not execute the workflow. Boundary fixtures live in agent-control-plane-gate.test.ts.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { validateActionPolicySemantics } from '../.ai-organization/runtime/core/authority/assess-action.mjs';
import { validateJsonAgainstSchema } from '../.ai-organization/runtime/core/schema/validate-json-schema.mjs';
import { COMPLETION_CLAIM_LEASE_MS, isValidIntegrationBranch, normalizeProfileRegistry, validateLifecycleRoleModes, validateSafeProofProfile } from '../.ai-organization/runtime/core/lifecycle/evidence-runtime.mjs';

export const CONTROL_PLANE_POLICY = Object.freeze({
  artifacts: Object.freeze({
    issue: '.github/ISSUE_TEMPLATE/agent-slice.yml',
    pullRequest: '.github/PULL_REQUEST_TEMPLATE.md',
    workflow: '.claude/workflows/orchestration-drift-audit.js',
    loop: '.claude/loop.md',
    goals: 'docs/agent-prompts/goal-templates.md',
    playbook: 'docs/agent-prompts/orchestration-playbook.md',
    settings: '.claude/settings.json',
    actionAuthority: '.ai-organization/policies/action-authority.v1.json',
    riskPolicy: '.ai-organization/policies/risk-controls.v1.json',
    actionAuthoritySchema: '.ai-organization/schemas/action-authority.v1.schema.json',
    agentRegistry: '.ai-organization/agents.json',
    completionProfiles: '.ai-organization/completion-profiles.json',
    package: 'package.json',
  }),
  issue: Object.freeze({
    requiredFieldIds: Object.freeze([
      'completion_tier',
      'settled_context',
      'exact_paths',
      'numbered_procedure',
      'output_contract',
      'boundaries_escalation',
      'acceptance_criteria',
      'irreversible_boundary',
    ]),
    requiredText: Object.freeze([
      'quoted',
      'read but never modify',
      'own exit status',
      'output contract',
      'boundaries and escalation',
      'self-verifiable acceptance criteria',
      'action-authority.v1.json',
      'conditional merge',
    ]),
    completionTierOptions: Object.freeze(['read-only', 'implementation']),
  }),
  pullRequest: Object.freeze({
    headings: Object.freeze([
      'product outcome',
      'authority and decision matrix',
      'blast radius',
      'upstream feeders',
      'downstream consumers',
      'verification evidence',
      'killer mutation',
      'rendered evidence (when relevant)',
      'security, tenant, compliance, and authority checks',
      'docs, journey, and doctrine-loop',
      'honesty: surfaces not reached',
      'human-gated actions (agents must leave unchecked)',
    ]),
    humanGateLabels: Object.freeze([
      'human approves deploy or production mutation.',
      'human approves production config changes or migrations.',
      'human approves destructive, billed, secret-bearing, or external contact/message actions.',
      'human approves product, design, or material architecture decisions.',
    ]),
  }),
  workflow: Object.freeze({
    name: 'orchestration-drift-audit',
    maxAgentCalls: 5,
    requiredText: Object.freeze([
      'live repo',
      'github',
      'stale handoffs',
      'docs',
      'rules',
      'gates',
      'backlog',
      'do not start a new product initiative',
      'readonlyintent',
      'invoke only from claude plan mode',
      'prompt guards alone are not a tool-permission boundary',
    ]),
    promptGuards: Object.freeze([
      'read-only',
      'do not edit or create files',
      'do not run tree-mutating git commands',
      'do not send external messages',
      'do not merge',
      'deploy',
      'publish',
      'mutate production',
      'delete',
      'purchase',
      'contact',
    ]),
  }),
  loop: Object.freeze({
    headings: Object.freeze([
      'authorization boundary',
      'loop contract',
      'iteration procedure',
      'idle behavior',
      'required report',
    ]),
    requiredText: Object.freeze([
      'maximum 3 iterations',
      'monotonicity',
      'do not start a new initiative',
      'exactly one read-only drift inspection',
      'branch, commit, push, and open or update pull requests',
      'conditional merge',
      'action-authority.v1.json',
      "command's own exit status",
    ]),
  }),
  goals: Object.freeze({
    headings: Object.freeze([
      'feature slice',
      'bug and root-cause slice',
      'sprint close',
      'review and verification',
      'operating the control plane',
    ]),
    requiredText: Object.freeze([
      'claude agents',
      'orchestration-drift-audit',
      'claude design is the design authority',
      '**goal:**',
      '**evaluator:**',
    ]),
  }),
  playbook: Object.freeze({
    requiredText: Object.freeze([
      'enter plan mode first',
      '/orchestration-drift-audit',
      'plan mode is the tool-permission boundary',
      'prompt text alone is not enforcement',
    ]),
  }),
  settings: Object.freeze({
    forbiddenAllowedToolFragments: Object.freeze(['9fab7e35-1142-425d-bd8f-1c7fdeba1c7e']),
  }),
});

const NEGATION_RE =
  /\b(?:do not|don't|never|must not|forbid(?:den)?|prohibit(?:ed)?|not allowed|no agent may)\b/i;
const DANGEROUS_COMMANDS = Object.freeze([
  {
    label: 'tree-mutating git command',
    re: /\bgit\s+(?:add|apply|checkout|switch|reset|clean|commit|push|pull|fetch|rebase|merge|cherry-pick|revert|stash|worktree)\b/i,
  },
  {
    label: 'GitHub mutation command',
    re: /\bgh\s+(?:pr|issue|workflow|run|release|repo)\s+(?:create|merge|close|reopen|comment|edit|review|ready|delete|dispatch|rerun|cancel)\b/i,
  },
  {
    label: 'deploy/publish command',
    re: /\b(?:npm\s+publish|docker\s+push|vercel\s+deploy|railway\s+(?:up|deploy)|kubectl\s+(?:apply|delete)|terraform\s+apply)\b/i,
  },
  {
    label: 'destructive shell command',
    re: /\b(?:rm\s+-rf|remove-item\s+[^\r\n]*-recurse|del\s+\/s|curl\s+[^\r\n]*(?:-x\s*(?:post|put|patch|delete)|--request\s+(?:post|put|patch|delete)))\b/i,
  },
]);


const normalize = (value) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');

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

function requireText(errors, file, source, fragments) {
  const normalized = normalize(source);
  for (const fragment of fragments) {
    if (!normalized.includes(normalize(fragment))) {
      errors.push(`${file}: missing required control language: ${fragment}`);
    }
  }
}

function markdownHeadings(source) {
  return new Set([...source.matchAll(/^#{2,3}\s+(.+?)\s*$/gm)].map((match) => normalize(match[1])));
}

function requireHeadings(errors, file, source, headings) {
  const actual = markdownHeadings(source);
  for (const heading of headings) {
    if (!actual.has(normalize(heading))) errors.push(`${file}: missing heading: ${heading}`);
  }
}

function validateIssueForm(source, file) {
  const errors = [];
  requireText(errors, file, source, CONTROL_PLANE_POLICY.issue.requiredText);
  const blocks = source.split(/^\s{2}- type:/m).slice(1);
  const byId = new Map();
  for (const block of blocks) {
    const id = block.match(/^\s+id:\s*([a-z0-9_-]+)\s*$/m)?.[1];
    if (id) byId.set(id, block);
  }
  for (const id of CONTROL_PLANE_POLICY.issue.requiredFieldIds) {
    const block = byId.get(id);
    if (!block) {
      errors.push(`${file}: missing required issue field id: ${id}`);
      continue;
    }
    if (!/validations:\s*\r?\n\s+required:\s*true\s*$/m.test(block)) {
      errors.push(`${file}: issue field ${id} must be required`);
    }
  }
  const tierBlock = byId.get('completion_tier');
  if (tierBlock) {
    const optionsBlock = tierBlock.match(
      /\n\s+options:\s*\r?\n([\s\S]*?)(?=\n\s+validations:)/,
    )?.[1];
    const options = optionsBlock
      ? [...optionsBlock.matchAll(/^\s+-\s+(.+?)\s*$/gm)].map((match) => match[1])
      : [];
    if (
      options.length !== CONTROL_PLANE_POLICY.issue.completionTierOptions.length ||
      options.some(
        (option, index) => option !== CONTROL_PLANE_POLICY.issue.completionTierOptions[index],
      )
    ) {
      errors.push(
        `${file}: completion_tier options must be exactly ${CONTROL_PLANE_POLICY.issue.completionTierOptions.join(', ')}`,
      );
    }
  }
  return errors;
}

function validatePullRequestTemplate(source, file) {
  const errors = [];
  requireHeadings(errors, file, source, CONTROL_PLANE_POLICY.pullRequest.headings);
  const normalized = normalize(source);
  for (const label of CONTROL_PLANE_POLICY.pullRequest.humanGateLabels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`^- \\[ \\] ${escaped}$`, 'im').test(source)) {
      errors.push(`${file}: missing unchecked human gate: ${label}`);
    }
    if (new RegExp(`^- \\[x\\] ${escaped}$`, 'im').test(source)) {
      errors.push(`${file}: human gate is pre-checked: ${label}`);
    }
  }
  for (const required of ["command's own exit status", 'raw key output/artifact', 'not reached']) {
    if (!normalized.includes(normalize(required))) {
      errors.push(`${file}: missing evidence language: ${required}`);
    }
  }
  return errors;
}

function parseJson(errors, file, source) {
  try {
    return JSON.parse(source);
  } catch (error) {
    errors.push(`${file}: invalid JSON: ${error.message}`);
    return undefined;
  }
}

function validateActionAuthority(root, source, file) {
  const errors = [];
  const policy = parseJson(errors, file, source);
  if (!policy) return errors;
  errors.push(...validateJsonAgainstSchema(path.join(root, CONTROL_PLANE_POLICY.artifacts.actionAuthoritySchema), policy).map((error) => `${file}: schema ${error}`));
  errors.push(...validateActionPolicySemantics(policy).map((error) => `${file}: semantics ${error}`));
  return errors;
}

function validateAgentRegistry(root, source, file) {
  const errors = [];
  const registry = parseJson(errors, file, source);
  if (!registry) return errors;
  if (registry.schemaVersion !== 1) errors.push(`${file}: schemaVersion must be 1`);
  if (registry.orchestrator?.id !== 'orchestrator' || registry.orchestrator?.role !== 'single-pm') {
    errors.push(`${file}: orchestrator entry must declare the single-pm role`);
  }
  if (!registry.orchestrator?.roleContract?.trim()) {
    errors.push(`${file}: orchestrator role contract is missing`);
  }
  if (!Array.isArray(registry.agents) || registry.agents.length === 0) {
    errors.push(`${file}: agents must be a non-empty array`);
    return errors;
  }
  const ids = new Set();
  const registeredFiles = new Set();
  for (const agent of registry.agents) {
    if (typeof agent?.id !== 'string' || !/^[a-z0-9-]+$/.test(agent.id)) {
      errors.push(`${file}: agent has invalid id`);
      continue;
    }
    if (ids.has(agent.id)) errors.push(`${file}: duplicate agent id: ${agent.id}`);
    ids.add(agent.id);
    if (!['read-only', 'implementation'].includes(agent.mode)) {
      errors.push(`${file}: ${agent.id} has invalid mode`);
    }
    if (typeof agent.roleContract !== 'string' || !agent.roleContract.trim()) {
      errors.push(`${file}: ${agent.id} role contract is missing`);
    }
    const expectedFile = `.claude/agents/${agent.id}.md`;
    if (agent.file !== expectedFile) {
      errors.push(`${file}: ${agent.id} file must be ${expectedFile}`);
      continue;
    }
    registeredFiles.add(agent.file);
    const target = path.join(root, agent.file);
    if (!fs.existsSync(target)) {
      errors.push(`${agent.file}: registered agent file is missing`);
      continue;
    }
    const agentSource = fs.readFileSync(target, 'utf8');
    const frontmatterName = agentSource.match(/^---\s*\r?\n[\s\S]*?^name:\s*([^\r\n]+)\s*$/m)?.[1];
    if (frontmatterName !== agent.id) {
      errors.push(`${agent.file}: frontmatter name must equal ${agent.id}`);
    }
  }
  const directory = path.join(root, '.claude', 'agents');
  if (fs.existsSync(directory)) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const relative = `.claude/agents/${entry.name}`;
        if (!registeredFiles.has(relative)) errors.push(`${relative}: unknown unregistered agent`);
      }
    }
  }
  return errors;
}

function walkFiles(root, relative, predicate, output) {
  const target = path.join(root, relative);
  if (!fs.existsSync(target)) return;
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const child = path.posix.join(relative.replace(/\\/g, '/'), entry.name);
    if (entry.isDirectory()) walkFiles(root, child, predicate, output);
    else if (predicate(child)) output.push(child);
  }
}

function npmReferences(source) {
  const references = [];
  for (const match of source.matchAll(/\bnpm\s+run\s+([A-Za-z0-9:_-]+)([^\r\n`]*)/g)) {
    const tail = match[2].split(/&&|;|\|/)[0];
    const workspace =
      tail.match(/(?:^|\s)(?:-w|--workspace)\s+([^\s]+)/)?.[1] ??
      tail.match(/(?:^|\s)--workspace=([^\s]+)/)?.[1];
    references.push({
      command: match[1],
      workspace: workspace?.replace(/[)`'",.]+$/, ''),
    });
  }
  return references;
}

function validateNpmCommandReferences(root, packageSource, completionProfilesSource, agentRegistrySource, actionAuthoritySource) {
  const errors = [];
  const rootPackage = parseJson(errors, 'package.json', packageSource);
  if (!rootPackage) return errors;
  if (rootPackage.scripts?.['test:organization-control-plane'] !== 'npm test --workspace=backend -- --reporter=tap claude-lifecycle-hook.test.ts') errors.push('package.json: test:organization-control-plane must emit structured TAP for the assurance parser');
  if (rootPackage.scripts?.['test:evidence-integrity-mutation'] !== 'node .ai-organization/runtime/core/lifecycle/run-evidence-integrity-mutation.mjs') errors.push('package.json: mutation proof must run the shared live-verifier harness');
  const completionProfiles = parseJson(
    errors,
    CONTROL_PLANE_POLICY.artifacts.completionProfiles,
    completionProfilesSource,
  );
  const agentRegistry = parseJson(errors, CONTROL_PLANE_POLICY.artifacts.agentRegistry, agentRegistrySource);
  const actionAuthority = parseJson(errors, CONTROL_PLANE_POLICY.artifacts.actionAuthority, actionAuthoritySource);
  const packages = new Map([['root', rootPackage]]);
  for (const workspace of Array.isArray(rootPackage.workspaces) ? rootPackage.workspaces : []) {
    const packagePath = path.join(root, workspace, 'package.json');
    if (!fs.existsSync(packagePath)) {
      errors.push(`${workspace}/package.json: configured workspace package is missing`);
      continue;
    }
    const parsed = parseJson(
      errors,
      `${workspace}/package.json`,
      fs.readFileSync(packagePath, 'utf8'),
    );
    if (parsed) {
      packages.set(workspace, parsed);
      if (typeof parsed.name === 'string') packages.set(parsed.name, parsed);
    }
  }

  const referenceFiles = [
    'AGENTS.md',
    'CLAUDE.md',
    CONTROL_PLANE_POLICY.artifacts.issue,
    CONTROL_PLANE_POLICY.artifacts.pullRequest,
    CONTROL_PLANE_POLICY.artifacts.loop,
    CONTROL_PLANE_POLICY.artifacts.goals,
    CONTROL_PLANE_POLICY.artifacts.playbook,
  ];
  walkFiles(root, '.claude/rules', (file) => file.endsWith('.md'), referenceFiles);
  walkFiles(root, '.claude/agents', (file) => file.endsWith('.md'), referenceFiles);
  for (const [workspace, packageJson] of packages) {
    if (workspace !== 'root' && workspace !== packageJson.name) continue;
    for (const value of Object.values(packageJson.scripts ?? {})) {
      for (const reference of npmReferences(String(value))) {
        const target = reference.workspace ? packages.get(reference.workspace) : packageJson;
        if (!target?.scripts?.[reference.command]) {
          errors.push(
            `package.json scripts: npm run ${reference.command}${reference.workspace ? ` -w ${reference.workspace}` : ''} does not exist`,
          );
        }
      }
    }
  }
  for (const relative of [...new Set(referenceFiles)]) {
    const target = path.join(root, relative);
    if (!fs.existsSync(target)) continue;
    const source = fs.readFileSync(target, 'utf8');
    for (const reference of npmReferences(source)) {
      const targetPackage = reference.workspace ? packages.get(reference.workspace) : rootPackage;
      if (!targetPackage?.scripts?.[reference.command]) {
        errors.push(
          `${relative}: referenced npm command does not exist: ${reference.command}${reference.workspace ? ` -w ${reference.workspace}` : ''}`,
        );
      }
    }
  }
  const requiredProfiles = [
    'control',
    'backend',
    'frontend',
    'shared',
    'database',
    'docs',
    'project',
  ];
  if (completionProfiles?.schemaVersion !== 1) {
    errors.push(`${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: schemaVersion must be 1`);
  }
  if (!isValidIntegrationBranch(completionProfiles?.integration_branch)) {
    errors.push(`${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: integration_branch must be an explicit safe Git branch name for repository binding`);
  }
  if (!Number.isInteger(completionProfiles?.lifecycle_hook_timeout_ms) || !Number.isInteger(completionProfiles?.lifecycle_timeout_safety_margin_ms)) errors.push(`${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: lifecycle hook timeout and safety margin are required in milliseconds`);
  if (!Array.isArray(completionProfiles?.lifecycle_supported_risk_classes) || completionProfiles.lifecycle_supported_risk_classes.length === 0) {
    errors.push(`${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: lifecycle-supported risk classes must be explicit`);
  } else {
    const policyFile = path.join(root, '.ai-organization', 'policies', 'risk-controls.v1.json');
    const riskPolicy = fs.existsSync(policyFile) ? parseJson(errors, '.ai-organization/policies/risk-controls.v1.json', fs.readFileSync(policyFile, 'utf8')) : null;
    const lifecycleProfileIds = new Set(Object.entries(completionProfiles.profiles ?? {}).filter(([, profile]) => profile?.assurance).map(([id]) => id));
    const lifecycleProfiles = normalizeProfileRegistry(completionProfiles).filter((profile) => lifecycleProfileIds.has(profile.id));
    for (const profile of lifecycleProfiles) errors.push(...validateSafeProofProfile(profile, { cwd: root, actionAuthority }).map((error) => `${CONTROL_PLANE_POLICY.artifacts.completionProfiles}/${profile.id}: ${error}`));
    const capabilities = new Set(lifecycleProfiles.flatMap((profile) => profile.capabilities ?? []));
    const roleProviders = new Set((agentRegistry?.agents ?? []).map((agent) => agent.id));
    const roleProviderModes = new Map((agentRegistry?.agents ?? []).map((agent) => [agent.id, agent.mode]));
    errors.push(...validateLifecycleRoleModes(completionProfiles.lifecycle_roles_by_completion_mode, roleProviderModes).map((error) => `${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: ${error}`));
    for (const riskClass of completionProfiles.lifecycle_supported_risk_classes) {
      const row = riskPolicy?.classes?.[riskClass];
      if (!row) errors.push(`${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: lifecycle-supported risk class has no policy row: ${riskClass}`);
      for (const capability of row?.required_proofs ?? []) if (!capabilities.has(capability)) errors.push(`${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: ${riskClass} lacks assurance capability provider: ${capability}`);
      for (const role of row?.required_roles ?? []) if (!roleProviders.has(role)) errors.push(`${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: ${riskClass} lacks registered role provider: ${role}`);
    }
    for (const rule of completionProfiles.risk_path_rules ?? []) if (!riskPolicy?.classes?.[rule.risk_class] || !Array.isArray(rule.include) || rule.include.length === 0) errors.push(`${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: invalid risk path rule for ${rule.risk_class ?? '<missing>'}`);
    const profileBudgets = lifecycleProfiles.map((profile) => (profile.commands ?? []).reduce((sum, command) => sum + (command.timeout_ms ?? 0), 0) + (profile.mutation?.timeout_ms ?? 0));
    if (profileBudgets.some((budget) => budget + completionProfiles.lifecycle_timeout_safety_margin_ms > completionProfiles.lifecycle_hook_timeout_ms)) errors.push(`${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: lifecycle profile budget exceeds hook timeout after safety margin`);
    if (completionProfiles.lifecycle_hook_timeout_ms + completionProfiles.lifecycle_timeout_safety_margin_ms > COMPLETION_CLAIM_LEASE_MS) errors.push(`${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: hook timeout plus safety margin exceeds completion claim lease`);
  }
  for (const profile of requiredProfiles) {
    const commands = completionProfiles?.profiles?.[profile]?.commands;
    if (!Array.isArray(commands) || commands.length === 0) {
      errors.push(
        `${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: ${profile} must select at least one command`,
      );
      continue;
    }
    for (const command of commands) {
      if (typeof command !== 'string' || !rootPackage.scripts?.[command]) {
        errors.push(
          `${CONTROL_PLANE_POLICY.artifacts.completionProfiles}: ${profile} references missing command: ${command}`,
        );
      }
    }
  }
  return errors;
}

function unwrapExpression(node) {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function staticLiteral(node) {
  const value = unwrapExpression(node);
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) return value.text;
  if (ts.isTemplateExpression(value)) {
    return value.head.text + value.templateSpans.map((span) => span.literal.text).join('');
  }
  return null;
}

function literalObjectValue(objectNode, key) {
  for (const property of objectNode.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name =
      ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
        ? property.name.text
        : null;
    if (name === key) return unwrapExpression(property.initializer);
  }
  return null;
}

function isPureLiteral(node) {
  const value = unwrapExpression(node);
  if (
    ts.isStringLiteral(value) ||
    ts.isNumericLiteral(value) ||
    value.kind === ts.SyntaxKind.TrueKeyword ||
    value.kind === ts.SyntaxKind.FalseKeyword ||
    value.kind === ts.SyntaxKind.NullKeyword
  ) {
    return true;
  }
  if (ts.isArrayLiteralExpression(value)) return value.elements.every(isPureLiteral);
  if (ts.isObjectLiteralExpression(value)) {
    return value.properties.every(
      (property) =>
        ts.isPropertyAssignment(property) &&
        !ts.isComputedPropertyName(property.name) &&
        isPureLiteral(property.initializer),
    );
  }
  return false;
}

function hasExportModifier(node) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function validateMeta(errors, file, sourceFile) {
  const first = sourceFile.statements[0];
  if (!first || !ts.isVariableStatement(first) || !hasExportModifier(first)) {
    errors.push(`${file}: first statement must be export const meta = { ... }`);
    return;
  }
  if ((first.declarationList.flags & ts.NodeFlags.Const) === 0) {
    errors.push(`${file}: meta must be declared with const`);
  }
  const declaration = first.declarationList.declarations[0];
  if (
    first.declarationList.declarations.length !== 1 ||
    !declaration ||
    !ts.isIdentifier(declaration.name) ||
    declaration.name.text !== 'meta' ||
    !declaration.initializer
  ) {
    errors.push(`${file}: first statement must declare only meta`);
    return;
  }
  const initializer = unwrapExpression(declaration.initializer);
  if (!ts.isObjectLiteralExpression(initializer) || !isPureLiteral(initializer)) {
    errors.push(`${file}: meta must be a pure object literal with no computed values`);
    return;
  }
  const name = literalObjectValue(initializer, 'name');
  const description = literalObjectValue(initializer, 'description');
  const phases = literalObjectValue(initializer, 'phases');
  if (!name || staticLiteral(name) !== CONTROL_PLANE_POLICY.workflow.name) {
    errors.push(`${file}: meta.name must equal ${CONTROL_PLANE_POLICY.workflow.name}`);
  }
  if (!description || !staticLiteral(description)?.trim()) {
    errors.push(`${file}: meta.description must be a non-empty string literal`);
  }
  if (!phases || !ts.isArrayLiteralExpression(phases) || phases.elements.length < 1) {
    errors.push(`${file}: meta.phases must be a non-empty literal array`);
  }
}

function hasTopLevelAwait(sourceFile) {
  let found = false;
  const visit = (node) => {
    if (found) return;
    if (ts.isFunctionLike(node)) return;
    if (ts.isAwaitExpression(node)) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  for (const statement of sourceFile.statements) visit(statement);
  return found;
}

function validateDangerousCommands(errors, file, source) {
  source.split(/\r?\n/).forEach((line, index) => {
    // Scope negation to the command's own clause. A preceding "Do not edit." must not shield a later
    // active "Run git push" instruction on the same physical template-literal line.
    for (const clause of line.split(/\.\s+|;\s*|\|\s*/)) {
      for (const command of DANGEROUS_COMMANDS) {
        if (command.re.test(clause) && !NEGATION_RE.test(clause)) {
          errors.push(`${file}:${index + 1}: unnegated ${command.label}`);
        }
      }
    }
  });
}

export function validateWorkflowSource(source, file = CONTROL_PLANE_POLICY.artifacts.workflow) {
  const errors = [];
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  for (const diagnostic of sourceFile.parseDiagnostics) {
    const position =
      diagnostic.start == null ? null : sourceFile.getLineAndCharacterOfPosition(diagnostic.start);
    const where = position ? `:${position.line + 1}:${position.character + 1}` : '';
    errors.push(
      `${file}${where}: syntax error: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`,
    );
  }
  validateMeta(errors, file, sourceFile);
  requireText(errors, file, source, CONTROL_PLANE_POLICY.workflow.requiredText);
  if (!hasTopLevelAwait(sourceFile)) errors.push(`${file}: workflow must use top-level await`);
  if (/\bsprint\s+\d+(?:[.\s-]\d+)?\b/i.test(source)) {
    errors.push(`${file}: workflow must not depend on a named sprint number`);
  }
  if (/\breadOnly\s*:\s*true\b/.test(source)) {
    errors.push(
      `${file}: must not claim prompt-only readOnly:true; use readOnlyIntent plus the plan-mode boundary`,
    );
  }

  const agentCalls = [];
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node)) {
      errors.push(
        `${file}: imports are forbidden; saved workflows use only the bounded workflow globals`,
      );
    }
    if (
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node) ||
      ts.isForStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isForOfStatement(node)
    ) {
      errors.push(`${file}: explicit loops are forbidden; use fixed bounded agent calls`);
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === 'agent') agentCalls.push(node);
      if (/^workflow$/i.test(node.expression.text)) {
        errors.push(`${file}: recursive workflow invocation is forbidden`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  if (agentCalls.length < 1)
    errors.push(`${file}: workflow must contain at least one agent() call`);
  if (agentCalls.length > CONTROL_PLANE_POLICY.workflow.maxAgentCalls) {
    errors.push(
      `${file}: ${agentCalls.length} agent() calls exceed cap ${CONTROL_PLANE_POLICY.workflow.maxAgentCalls}`,
    );
  }
  agentCalls.forEach((call, index) => {
    const prompt = call.arguments[0] ? staticLiteral(call.arguments[0]) : null;
    if (prompt == null) {
      errors.push(
        `${file}: agent() call ${index + 1} prompt must be an inline static string/template`,
      );
      return;
    }
    requireText(
      errors,
      `${file} agent() call ${index + 1}`,
      prompt,
      CONTROL_PLANE_POLICY.workflow.promptGuards,
    );
  });
  validateDangerousCommands(errors, file, source);
  return errors;
}

export function validateAgentControlPlane(root = process.cwd()) {
  const errors = [];
  for (const relative of Object.values(CONTROL_PLANE_POLICY.artifacts)) {
    if (!fs.existsSync(path.join(root, relative)))
      errors.push(`${relative}: required artifact is missing`);
  }
  if (errors.length) return errors;

  const issue = read(root, CONTROL_PLANE_POLICY.artifacts.issue);
  const pullRequest = read(root, CONTROL_PLANE_POLICY.artifacts.pullRequest);
  const workflow = read(root, CONTROL_PLANE_POLICY.artifacts.workflow);
  const loop = read(root, CONTROL_PLANE_POLICY.artifacts.loop);
  const goals = read(root, CONTROL_PLANE_POLICY.artifacts.goals);
  const playbook = read(root, CONTROL_PLANE_POLICY.artifacts.playbook);
  const settingsSource = read(root, CONTROL_PLANE_POLICY.artifacts.settings);
  const actionAuthority = read(root, CONTROL_PLANE_POLICY.artifacts.actionAuthority);
  const agentRegistry = read(root, CONTROL_PLANE_POLICY.artifacts.agentRegistry);
  const completionProfiles = read(root, CONTROL_PLANE_POLICY.artifacts.completionProfiles);
  const packageSource = read(root, CONTROL_PLANE_POLICY.artifacts.package);

  errors.push(...validateIssueForm(issue, CONTROL_PLANE_POLICY.artifacts.issue));
  errors.push(
    ...validatePullRequestTemplate(pullRequest, CONTROL_PLANE_POLICY.artifacts.pullRequest),
  );
  errors.push(...validateWorkflowSource(workflow, CONTROL_PLANE_POLICY.artifacts.workflow));
  requireHeadings(
    errors,
    CONTROL_PLANE_POLICY.artifacts.loop,
    loop,
    CONTROL_PLANE_POLICY.loop.headings,
  );
  requireText(
    errors,
    CONTROL_PLANE_POLICY.artifacts.loop,
    loop,
    CONTROL_PLANE_POLICY.loop.requiredText,
  );
  errors.push(
    ...validateActionAuthority(root, actionAuthority, CONTROL_PLANE_POLICY.artifacts.actionAuthority),
  );
  errors.push(
    ...validateAgentRegistry(root, agentRegistry, CONTROL_PLANE_POLICY.artifacts.agentRegistry),
  );
  errors.push(...validateNpmCommandReferences(root, packageSource, completionProfiles, agentRegistry, actionAuthority));
  requireHeadings(
    errors,
    CONTROL_PLANE_POLICY.artifacts.goals,
    goals,
    CONTROL_PLANE_POLICY.goals.headings,
  );
  requireText(
    errors,
    CONTROL_PLANE_POLICY.artifacts.goals,
    goals,
    CONTROL_PLANE_POLICY.goals.requiredText,
  );
  requireText(
    errors,
    CONTROL_PLANE_POLICY.artifacts.playbook,
    playbook,
    CONTROL_PLANE_POLICY.playbook.requiredText,
  );
  try {
    const settings = JSON.parse(settingsSource);
    const allowed = Array.isArray(settings?.permissions?.allow) ? settings.permissions.allow : [];
    for (const fragment of CONTROL_PLANE_POLICY.settings.forbiddenAllowedToolFragments) {
      if (allowed.some((tool) => typeof tool === 'string' && tool.includes(fragment))) {
        errors.push(
          `${CONTROL_PLANE_POLICY.artifacts.settings}: retired active tool allowlist fragment: ${fragment}`,
        );
      }
    }
    const lifecycleEvents = ['SessionStart', 'SubagentStart', 'TaskCreated', 'TaskCompleted', 'SubagentStop', 'PostCompact', 'SessionEnd'];
    for (const event of lifecycleEvents) {
      const registrations = settings.hooks?.[event];
      const commands = commandHooks(registrations);
      if (registrations?.length !== 1 || commands.length !== 1 || !isRootedExecHook(commands[0], 'claude-lifecycle-hook.mjs')) {
        errors.push(`${CONTROL_PLANE_POLICY.artifacts.settings}: ${event} must contain exactly one rooted exec-form lifecycle hook`);
      }
    }
    const post = settings.hooks?.PostToolUse;
    const postCommands = commandHooks(post);
    if (post?.length !== 1 || post[0]?.matcher !== 'Edit|Write' || postCommands.length !== 1 || !isRootedExecHook(postCommands[0], 'claude-posttooluse-gate.mjs')) {
      errors.push(`${CONTROL_PLANE_POLICY.artifacts.settings}: PostToolUse must contain exactly one rooted exec-form Edit|Write hook`);
    }
    const completionTimeouts = commandHooks(settings.hooks?.TaskCompleted).filter((hook) => isRootedExecHook(hook, 'claude-lifecycle-hook.mjs')).map((hook) => hook.timeout);
    const profileRegistry = JSON.parse(completionProfiles);
    if (completionTimeouts.length !== 1 || completionTimeouts[0] * 1_000 !== profileRegistry.lifecycle_hook_timeout_ms) errors.push(`${CONTROL_PLANE_POLICY.artifacts.settings}: TaskCompleted timeout must exactly match the completion profile authority`);
  } catch (error) {
    errors.push(`${CONTROL_PLANE_POLICY.artifacts.settings}: invalid JSON: ${error.message}`);
  }
  return errors;
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const errors = validateAgentControlPlane(root);
  if (errors.length) {
    console.error('check-agent-control-plane: FAIL');
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log(
    `check-agent-control-plane: OK — ${Object.keys(CONTROL_PLANE_POLICY.artifacts).length} artifacts valid; ` +
      `saved workflow is syntax-valid, read-only-intent with a plan-mode invocation boundary, and capped at ${CONTROL_PLANE_POLICY.workflow.maxAgentCalls} agent calls.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
