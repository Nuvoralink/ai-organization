#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  deriveRoleProjection,
  effectiveRoles,
} from '../.ai-organization/runtime/core/roles/agent-role-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const universalPath = path.join(root, '.ai-organization', 'registries', 'agent-roles.v1.json');
const extensionPath = path.join(
  root,
  '.ai-organization',
  'registries',
  'agent-roles.project.v1.json',
);
const rolesPath = path.join(root, '.ai-organization', 'roles.json');
const agentsDirectory = path.join(root, '.claude', 'agents');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function yamlScalar(value) {
  return JSON.stringify(value);
}

function renderAgent(role) {
  const rubric = role.verdict_rubric;
  const criteria = (rubric?.criteria ?? []).map(
    (criterion) =>
      `- \`${criterion.id}\`${criterion.critical ? ' **(critical)**' : ''} — ${criterion.summary}`,
  );
  const trigger = role.trigger.map((item) => `- ${item}`);
  const outputs = role.required_outputs.map((item) => `- ${item}`);
  return [
    '---',
    `name: ${role.id}`,
    `description: ${yamlScalar(`${role.purpose} Trigger when: ${role.trigger.join('; ')}.`)}`,
    'tools: Read, Grep, Glob, Bash',
    '---',
    '',
    `# ${role.id}`,
    '',
    role.purpose,
    '',
    '## Trigger',
    '',
    ...trigger,
    '',
    '## Read first',
    '',
    '- `AGENTS.md` and the path-scoped rule it routes for the touched files.',
    '- `platform-design/README.md` and every architecture authority it routes for this slice.',
    '- `docs/decision-log.md`, `docs/ARCHITECTURE_BLAST_RADIUS.md`, and `docs/BUG_BACKLOG.md`.',
    '- The full dispatcher-materialized diff and every upstream feeder/downstream consumer in scope.',
    '',
    '## Boundaries',
    '',
    'Read-only. Do not edit, write, stage, commit, switch branches, stash, reset, merge, push, deploy, mutate production, invoke a live provider, submit a browser action, contact anyone, or inspect secrets/PII. Test commands must be local and non-mutating outside disposable test resources. A status or implementer report is a lead; quote the actual file, diff, persisted artifact, or raw command output. Name every surface not reached.',
    '',
    '## Procedure',
    '',
    '1. Re-derive the brief premises from current source and enumerate the complete inspected scope.',
    '2. Walk the authority both directions: feeder → transform → persistence → consumer, then consumer → owning source.',
    '3. Evaluate every registered criterion below as `pass`, `partial`, `fail`, or `skip`, with quoted `file:line` or raw-output evidence. An unevaluated critical criterion makes the verdict `UNVERIFIABLE`.',
    '4. Pressure-test at least one rejected alternative, the effect of bypassing the seam, and the killer mutation that should turn the proof red.',
    '5. Route out-of-lane findings to the exact sibling lens named in `AGENTS.md`; do not silently drop or adjudicate them in the wrong lane.',
    '',
    ...(rubric
      ? [
          '## Verdict rubric',
          '',
          ...criteria,
          '',
          `Coverage floor: ${rubric.coverage_floor}. Weights and criticality remain owned by the project/universal role registries.`,
          '',
        ]
      : []),
    '## Required outputs',
    '',
    ...outputs,
    '',
    'End with the computed verdict, criterion table, findings ordered by severity, exact evidence, surfaces not reached, and `Doctrine-loop findings` with the three-question RCA plus smallest reusable control fix—or explicit `none`.',
    '',
    '## Learned classes (live log)',
    '',
    '- None yet.',
    '',
  ].join('\n');
}

function expectedArtifacts() {
  const universal = readJson(universalPath);
  const extension = readJson(extensionPath);
  const projectIds = new Set((extension.roles ?? []).map((role) => role.id));
  const exceptions = new Set((extension.agent_file_exceptions ?? []).map((row) => row.role_id));
  const agents = new Map();
  for (const role of effectiveRoles(universal, extension)) {
    if (
      role.mode === 'orchestrate' ||
      (role.mode === 'implement' && !projectIds.has(role.id)) ||
      exceptions.has(role.id)
    )
      continue;
    agents.set(`${role.id}.md`, renderAgent(role));
  }
  return {
    roles: `${JSON.stringify(deriveRoleProjection(universal, extension, 'roles.json'), null, 2)}\n`,
    agents,
  };
}

function check(expected) {
  const errors = [];
  if (!fs.existsSync(rolesPath) || fs.readFileSync(rolesPath, 'utf8') !== expected.roles) {
    errors.push('.ai-organization/roles.json is missing or stale');
  }
  const actualNames = fs.existsSync(agentsDirectory)
    ? fs
        .readdirSync(agentsDirectory)
        .filter((name) => name.endsWith('.md'))
        .sort()
    : [];
  const expectedNames = [...expected.agents.keys()].sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    errors.push(
      `agent projection inventory differs: expected=${expectedNames.join(',')} actual=${actualNames.join(',')}`,
    );
  }
  for (const [name, content] of expected.agents) {
    const file = path.join(agentsDirectory, name);
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) {
      errors.push(`agent projection is missing or stale: .claude/agents/${name}`);
    }
  }
  return errors;
}

const expected = expectedArtifacts();
if (process.argv.includes('--write')) {
  fs.mkdirSync(path.dirname(rolesPath), { recursive: true });
  fs.mkdirSync(agentsDirectory, { recursive: true });
  fs.writeFileSync(rolesPath, expected.roles, 'utf8');
  for (const name of fs.readdirSync(agentsDirectory)) {
    if (name.endsWith('.md') && !expected.agents.has(name))
      fs.rmSync(path.join(agentsDirectory, name));
  }
  for (const [name, content] of expected.agents) {
    fs.writeFileSync(path.join(agentsDirectory, name), content, 'utf8');
  }
}
const errors = check(expected);
if (errors.length > 0) {
  for (const error of errors) process.stderr.write(`agent-projections: ${error}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `agent-projections: PASS roles=${expected.agents.size + 4} agent_files=${expected.agents.size}\n`,
  );
}
