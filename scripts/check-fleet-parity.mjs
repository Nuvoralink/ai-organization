#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { effectiveRoles } from '../.ai-organization/runtime/core/roles/agent-role-registry.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectionCandidates = [
  path.join('.ai-organization', 'agents.json'),
  path.join('.ai-organization', 'roles.json'),
];
const universalNoAgentFileModes = new Set(['orchestrate', 'implement']);

function readJson(relative, label, problems) {
  try {
    const value = JSON.parse(fs.readFileSync(path.join(projectRoot, relative), 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      problems.push(`${label} must be a JSON object: ${relative}`);
      return null;
    }
    return value;
  } catch (error) {
    problems.push(`${label} is missing or unreadable: ${relative} (${error.message})`);
    return null;
  }
}

function addProjectionId(ids, seen, id, source, problems) {
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]+$/u.test(id)) {
    problems.push(`${source} contains an invalid role id: ${String(id)}`);
    return;
  }
  if (seen.has(id)) {
    problems.push(`${source} contains duplicate role id: ${id}`);
    return;
  }
  seen.add(id);
  ids.add(id);
}

function projectionIds(relative, projection, problems) {
  const ids = new Set();
  const seen = new Set();
  if (relative.endsWith('agents.json')) {
    if (
      !projection.orchestrator ||
      typeof projection.orchestrator !== 'object' ||
      Array.isArray(projection.orchestrator)
    ) {
      problems.push(`${relative} must contain an orchestrator object`);
    } else {
      addProjectionId(ids, seen, projection.orchestrator.id, relative, problems);
    }
    if (!Array.isArray(projection.agents)) {
      problems.push(`${relative} must contain an agents array`);
    } else {
      for (const role of projection.agents)
        addProjectionId(ids, seen, role?.id, relative, problems);
    }
    return ids;
  }

  for (const key of ['global_roles', 'project_roles']) {
    if (!Array.isArray(projection[key])) {
      problems.push(`${relative} must contain a ${key} array`);
      continue;
    }
    for (const role of projection[key]) addProjectionId(ids, seen, role?.name, relative, problems);
  }
  return ids;
}

function projectAgentIds(problems) {
  const agentsDir = path.join(projectRoot, '.claude', 'agents');
  let entries;
  try {
    entries = fs.readdirSync(agentsDir, { withFileTypes: true });
  } catch (error) {
    problems.push(
      `project agent directory is missing or unreadable: .claude/agents (${error.message})`,
    );
    return new Map();
  }

  const agents = new Map();
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name) !== '.md') continue;
    const id = path.basename(entry.name, '.md');
    const relative = path.posix.join('.claude', 'agents', entry.name);
    if (!/^[a-z0-9][a-z0-9-]+$/u.test(id)) {
      problems.push(`agent filename does not encode a valid role id: ${relative}`);
      continue;
    }
    if (agents.has(id)) problems.push(`duplicate project agent role id: ${id}`);
    agents.set(id, relative);
  }
  return agents;
}

function compareSets(leftLabel, left, rightLabel, right, problems) {
  for (const id of [...left].sort()) {
    if (!right.has(id)) problems.push(`${leftLabel} lists role absent from ${rightLabel}: ${id}`);
  }
}

const problems = [];
const universal = readJson(
  path.join('.ai-organization', 'registries', 'agent-roles.v1.json'),
  'universal role registry',
  problems,
);
const projectExtension = readJson(
  path.join('.ai-organization', 'registries', 'agent-roles.project.v1.json'),
  'project role extension',
  problems,
);

let roles = [];
if (universal && projectExtension) {
  try {
    roles = effectiveRoles(universal, projectExtension);
  } catch (error) {
    problems.push(error.message);
  }
}

const effectiveById = new Map();
for (const role of roles) {
  if (effectiveById.has(role.id))
    problems.push(`effective role inventory contains duplicate id: ${role.id}`);
  effectiveById.set(role.id, role);
}
const effectiveIds = new Set(effectiveById.keys());
const projectRoleIds = new Set((projectExtension?.roles ?? []).map((role) => role.id));
const agentFileExceptions = new Set(
  (projectExtension?.agent_file_exceptions ?? []).map((exception) => exception.role_id),
);
const agents = projectAgentIds(problems);

for (const [id, relative] of agents) {
  if (!effectiveIds.has(id))
    problems.push(`agent file has no effective-role row: ${relative} (${id})`);
}
for (const [id, role] of effectiveById) {
  if (agents.has(id)) {
    if (agentFileExceptions.has(id))
      problems.push(
        `project agent-file exception is redundant because the agent file exists: ${id}`,
      );
    continue;
  }
  if (projectRoleIds.has(id)) {
    problems.push(`effective project role has no agent file: ${id}`);
    continue;
  }
  if (universalNoAgentFileModes.has(role.mode)) continue;
  if (agentFileExceptions.has(id)) continue;
  problems.push(
    `effective universal ${role.mode} role has no agent file or explicit project exception: ${id}`,
  );
}

const projections = [];
for (const relative of projectionCandidates) {
  if (!fs.existsSync(path.join(projectRoot, relative))) continue;
  const value = readJson(relative, 'fleet projection', problems);
  if (value) projections.push({ relative, ids: projectionIds(relative, value, problems) });
}
if (projections.length === 2) {
  compareSets(
    projections[0].relative,
    projections[0].ids,
    projections[1].relative,
    projections[1].ids,
    problems,
  );
  compareSets(
    projections[1].relative,
    projections[1].ids,
    projections[0].relative,
    projections[0].ids,
    problems,
  );
}
for (const projection of projections) {
  compareSets(projection.relative, projection.ids, 'effective roles', effectiveIds, problems);
  compareSets('effective roles', effectiveIds, projection.relative, projection.ids, problems);
}

if (problems.length > 0) {
  console.error(['fleet-parity: FAIL', ...problems.map((problem) => `- ${problem}`)].join('\n'));
  process.exit(1);
}

const projectionLabel =
  projections.length === 0
    ? 'none'
    : projections.map((projection) => path.basename(projection.relative)).join('+');
console.log(
  `fleet-parity: PASS — ${effectiveIds.size} effective roles, ${agents.size} project agent files, projection=${projectionLabel}`,
);
