/**
 * Proves: NFR-011
 * Test type: contract
 * Surface: task-assurance v2/v3 schemas, lifecycle task governor, v2-to-v3 adapter, and typed dependency graph
 * Authority: versioned task-assurance contract plus task-governor.mjs as the sole lifecycle validation seam
 *
 * What this test proves about the product:
 * - Existing v2 task contracts remain accepted and closed to v3-only dependency fields.
 * - V3 accepts only typed, result-bound dependency edges and graph validation reports cycles/orphans.
 * - V2 contracts upgrade without mutation to valid v3 contracts with an explicit empty dependency set.
 *
 * Negative path covered:
 * - Unsupported schema versions, malformed edge types/bindings, self/cross-task cycles, and unknown task ids fail closed.
 *
 * Killer mutations:
 * - Add `requires` to v2, reject v2 after adding the adapter, skip a bound-value check, return no cycle
 *   unconditionally, or ignore unknown task ids. Each mutation must make this file fail.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  DEPENDENCY_EDGE_TYPES,
  detectCycles,
  detectOrphans,
  validateRequires,
} from '../coordination/dependencyGraph.mjs';
import { assuranceSchemaFile, upgradeV2ToV3 } from '../schema/task-assurance.mjs';
import { validateTaskContract, validateTaskDependencyGraph } from './task-governor.mjs';

const COMMIT_SHA = '0123456789abcdef0123456789abcdef01234567';
const ARTIFACT_BINDING =
  'artifact-receipt-7@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const CONTRACT_BINDING = 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function v2Contract(id = 'ASSURANCE-V2-FIXTURE') {
  return {
    schema_version: 2,
    id,
    product_intent: 'Keep lifecycle completion evidence bound to one validated task contract.',
    settled_decisions: ['The task governor is the sole lifecycle contract validation authority.'],
    scope: {
      in: ['versioned task assurance'],
      out: ['dispatch-frontier enforcement'],
      too_little: 'A schema file that no lifecycle consumer validates.',
      too_much: 'Dispatching or blocking work based on dependency satisfaction.',
    },
    execution: { implementer_role: 'sprint-implementer' },
    paths: {
      read: ['.ai-organization/**'],
      edit: ['.ai-organization/**'],
      read_only: [],
      output: ['task assurance validation result'],
    },
    risk: {
      level: 'high',
      classes: ['control_plane'],
      reasons: ['task completion authority'],
    },
    authorities: ['.ai-organization/runtime/core/lifecycle/task-governor.mjs'],
    blast_radius: {
      feeders: ['TaskCreated contract'],
      producers: ['task brief'],
      transformers: ['task assurance adapter'],
      persistence: ['accepted task attempt'],
      validators: ['task governor'],
      consumers: ['lifecycle controller'],
      surfaces: ['task acceptance'],
      retirements: ['bare completion dependency'],
    },
    procedure: ['1. Validate the versioned contract through the task governor.'],
    acceptance: ['Unsupported or malformed contracts fail closed.'],
    proofs: [
      {
        id: 'task-assurance-contract',
        profile_id: 'control',
        capability: 'control_plane_completion',
        proves: 'The versioned task contract remains fail-closed.',
        surface: 'task governor',
        authority: 'task assurance schemas',
        risk_classes: ['control_plane'],
        mutation: {
          required: true,
          case_id: 'forged-runner-attestation-rejected',
          rationale: 'Control-plane completion must retain registered mutation evidence.',
        },
        required: true,
      },
    ],
    action_authority: {
      allowed: ['read', 'test'],
      conditional: [],
      human_required: [],
    },
    completion: {
      tier: 'locally_verified',
      honesty_clause: 'Dependency satisfaction is not enforced by this contract slice.',
      unreached_surfaces: ['dispatch frontier'],
      doctrine_loop: 'none',
    },
  };
}

function edge(taskId, edgeType, boundValue) {
  return {
    task_id: taskId,
    edge_type: edgeType,
    bound_value: boundValue,
  };
}

test('v3 validates one result-bound edge of every type while v2 stays closed to requires', () => {
  const v2 = v2Contract();
  const v3 = {
    ...v2,
    schema_version: 3,
    requires: [
      edge('CONTRACT-PRODUCER', 'contract_digest_active', CONTRACT_BINDING),
      edge('ARTIFACT-PRODUCER', 'artifact_available', ARTIFACT_BINDING),
      edge('LANDED-PRODUCER', 'landed_commit', COMMIT_SHA),
    ],
  };

  assert.deepEqual(validateTaskContract(v3), []);

  const v2WithRequires = { ...v2, requires: v3.requires };
  assert.match(
    validateTaskContract(v2WithRequires).join('\n'),
    /unexpected property requires/u,
    'KILLER MUTATION: allowing requires on v2 must turn this assertion red',
  );

  const v3Schema = JSON.parse(
    fs.readFileSync(assuranceSchemaFile('task-assurance.v3.schema.json'), 'utf8'),
  );
  assert.deepEqual(
    v3Schema.$defs.dependencyEdge.properties.edge_type.enum,
    [...DEPENDENCY_EDGE_TYPES],
    'the schema and semantic validator must expose exactly one typed-edge taxonomy',
  );
});

test('upgradeV2ToV3 preserves a real v2 contract, adds requires:[], and the governor accepts only v2/v3', () => {
  const v2 = v2Contract();
  const upgraded = upgradeV2ToV3(v2);

  assert.equal(v2.schema_version, 2);
  assert.equal(Object.hasOwn(v2, 'requires'), false);
  assert.notStrictEqual(upgraded, v2);
  assert.equal(upgraded.schema_version, 3);
  assert.deepEqual(upgraded.requires, []);
  assert.deepEqual(validateTaskContract(v2), []);
  assert.deepEqual(validateTaskContract(upgraded), []);

  assert.match(
    validateTaskContract({ ...upgraded, schema_version: 4 }).join('\n'),
    /schema_version must be 2 or 3/u,
    'KILLER MUTATION: accepting an unknown version or rejecting legacy v2 must turn this test red',
  );
});

test('the lifecycle README names the executable state directory and both accepted contract versions', () => {
  const readme = fs.readFileSync(new URL('./README.md', import.meta.url), 'utf8');

  assert.doesNotMatch(
    readme,
    /tmp\/agent-assurance/u,
    'KILLER MUTATION: restoring the retired repository-local assurance path must turn red',
  );
  assert.match(
    readme,
    /<absolute-git-common-dir>\/auxara-agent-assurance\/artifacts\//u,
  );
  assert.match(readme, /task-assurance\.v2\.schema\.json/u);
  assert.match(readme, /task-assurance\.v3\.schema\.json/u);
  for (const edgeType of DEPENDENCY_EDGE_TYPES) assert.match(readme, new RegExp(edgeType, 'u'));
});

test('validateRequires rejects invalid edge types and type-specific bound values', () => {
  assert.deepEqual(
    validateRequires([
      edge('CONTRACT-PRODUCER', 'contract_digest_active', CONTRACT_BINDING),
      edge('ARTIFACT-PRODUCER', 'artifact_available', ARTIFACT_BINDING),
      edge('LANDED-PRODUCER', 'landed_commit', COMMIT_SHA),
    ]),
    [],
  );

  const invalid = validateRequires([
    edge('LANDED-PRODUCER', 'landed_commit', 'not-a-full-commit-sha'),
    edge('UNKNOWN-PRODUCER', 'depends_on', COMMIT_SHA),
    edge('CONTRACT-PRODUCER', 'contract_digest_active', 'short-digest'),
    edge('ARTIFACT-PRODUCER', 'artifact_available', `sha256:${'c'.repeat(64)}`),
  ]).join('\n');

  assert.match(invalid, /landed_commit bound_value/u);
  assert.match(invalid, /edge_type is unsupported/u);
  assert.match(invalid, /contract_digest_active bound_value/u);
  assert.match(invalid, /artifact_available bound_value/u);
});

test('detectCycles returns A -> B -> A while a valid DAG passes', () => {
  const cyclic = [
    { id: 'A', requires: [edge('B', 'landed_commit', COMMIT_SHA)] },
    { id: 'B', requires: [edge('A', 'landed_commit', COMMIT_SHA)] },
  ];
  assert.deepEqual(detectCycles(cyclic), { cyclePath: ['A', 'B', 'A'] });

  const dag = [
    { id: 'A', requires: [] },
    { id: 'B', requires: [edge('A', 'landed_commit', COMMIT_SHA)] },
    { id: 'C', requires: [edge('B', 'artifact_available', ARTIFACT_BINDING)] },
  ];
  assert.equal(
    detectCycles(dag),
    null,
    'positive liveness: the detector must distinguish a valid DAG from the cyclic fixture',
  );
});

test('detectOrphans returns the edge that names an unknown task id', () => {
  const orphanEdge = edge('MISSING', 'contract_digest_active', CONTRACT_BINDING);
  const tasks = [
    { id: 'A', requires: [orphanEdge] },
    { id: 'B', requires: [] },
  ];

  assert.deepEqual(detectOrphans(tasks, new Set(['A', 'B'])), {
    taskId: 'A',
    edge: orphanEdge,
  });
  assert.equal(
    detectOrphans(tasks, new Set(['A', 'B', 'MISSING'])),
    null,
    'positive liveness: declaring the exact predecessor must clear the orphan finding',
  );
});

test('the task-governor validation seam consumes self-cycle and graph orphan/cycle checks', () => {
  const selfCycle = {
    ...v2Contract('SELF-CYCLE'),
    schema_version: 3,
    requires: [edge('SELF-CYCLE', 'landed_commit', COMMIT_SHA)],
  };
  assert.match(validateTaskContract(selfCycle).join('\n'), /SELF-CYCLE -> SELF-CYCLE/u);

  const taskA = {
    ...v2Contract('GRAPH-A'),
    schema_version: 3,
    requires: [edge('GRAPH-B', 'landed_commit', COMMIT_SHA)],
  };
  const taskB = {
    ...v2Contract('GRAPH-B'),
    schema_version: 3,
    requires: [edge('GRAPH-A', 'landed_commit', COMMIT_SHA)],
  };
  assert.match(
    validateTaskDependencyGraph([taskA, taskB], new Set(['GRAPH-A', 'GRAPH-B'])).join('\n'),
    /GRAPH-A -> GRAPH-B -> GRAPH-A/u,
  );

  const orphanTask = {
    ...v2Contract('GRAPH-ORPHAN'),
    schema_version: 3,
    requires: [edge('UNKNOWN-TASK', 'artifact_available', ARTIFACT_BINDING)],
  };
  assert.match(
    validateTaskDependencyGraph([orphanTask], new Set(['GRAPH-ORPHAN'])).join('\n'),
    /UNKNOWN-TASK/u,
  );
});
