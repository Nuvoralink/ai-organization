const FULL_COMMIT_SHA = /^[0-9a-f]{40}$/iu;
const SHA256_DIGEST = /^sha256:[0-9a-f]{64}$/iu;
const ARTIFACT_RECEIPT_AND_DIGEST = /^\S+@sha256:[0-9a-f]{64}$/iu;

const BOUND_VALUE_RULES = Object.freeze({
  contract_digest_active: {
    pattern: SHA256_DIGEST,
    description: 'sha256:<64-hex-digest>',
  },
  artifact_available: {
    pattern: ARTIFACT_RECEIPT_AND_DIGEST,
    description: '<artifact-or-receipt-id>@sha256:<64-hex-digest>',
  },
  landed_commit: {
    pattern: FULL_COMMIT_SHA,
    description: '<40-hex-commit-sha>',
  },
});

export const DEPENDENCY_EDGE_TYPES = Object.freeze(Object.keys(BOUND_VALUE_RULES));
const EDGE_PROPERTIES = new Set(['task_id', 'edge_type', 'bound_value']);

function taskList(tasks) {
  return Array.isArray(tasks) ? tasks : [];
}

function taskRequires(task) {
  return Array.isArray(task?.requires) ? task.requires : [];
}

export function validateRequires(edges) {
  if (edges === undefined) return [];
  if (!Array.isArray(edges)) return ['requires must be an array'];

  const failures = [];
  edges.forEach((candidate, index) => {
    const location = `requires[${index}]`;
    if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)) {
      failures.push(`${location} must be an object`);
      return;
    }
    for (const property of Object.keys(candidate))
      if (!EDGE_PROPERTIES.has(property))
        failures.push(`${location} has unexpected property ${property}`);

    if (typeof candidate.task_id !== 'string' || candidate.task_id.trim().length === 0)
      failures.push(`${location}.task_id must be a non-empty string`);
    if (typeof candidate.edge_type !== 'string' || !BOUND_VALUE_RULES[candidate.edge_type]) {
      failures.push(
        `${location}.edge_type is unsupported; expected one of ${DEPENDENCY_EDGE_TYPES.join(', ')}`,
      );
      return;
    }
    if (
      typeof candidate.bound_value !== 'string' ||
      !BOUND_VALUE_RULES[candidate.edge_type].pattern.test(candidate.bound_value)
    )
      failures.push(
        `${location}.${candidate.edge_type} bound_value must match ${BOUND_VALUE_RULES[candidate.edge_type].description}`,
      );
  });
  return failures;
}

export function detectCycles(tasks) {
  const byId = new Map(
    taskList(tasks)
      .filter((task) => typeof task?.id === 'string' && task.id.length > 0)
      .map((task) => [task.id, task]),
  );
  const visitState = new Map();
  const path = [];

  const visit = (taskId) => {
    visitState.set(taskId, 'visiting');
    path.push(taskId);
    for (const dependencyId of taskRequires(byId.get(taskId))
      .map((edge) => edge?.task_id)
      .filter((candidate) => typeof candidate === 'string' && byId.has(candidate))) {
      if (visitState.get(dependencyId) === 'visiting') {
        const cycleStart = path.indexOf(dependencyId);
        return { cyclePath: [...path.slice(cycleStart), dependencyId] };
      }
      if (visitState.get(dependencyId) !== 'visited') {
        const finding = visit(dependencyId);
        if (finding) return finding;
      }
    }
    path.pop();
    visitState.set(taskId, 'visited');
    return null;
  };

  for (const taskId of byId.keys()) {
    if (visitState.has(taskId)) continue;
    const finding = visit(taskId);
    if (finding) return finding;
  }
  return null;
}

export function detectOrphans(tasks, knownTaskIds) {
  const known =
    knownTaskIds instanceof Set
      ? knownTaskIds
      : new Set(typeof knownTaskIds?.[Symbol.iterator] === 'function' ? knownTaskIds : []);
  for (const task of taskList(tasks)) {
    for (const edge of taskRequires(task))
      if (typeof edge?.task_id === 'string' && !known.has(edge.task_id))
        return { taskId: task?.id, edge };
  }
  return null;
}
