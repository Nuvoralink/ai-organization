// Proves: AUXARA-HYBRID-COMPAT-001
// Test type: canonical source-contract regression
// Surface: Auxara Dialer managed HYBRID doc/code and decision-linkage gates
// Authority: overlays/auxara-dialer/project-files/scripts
// Product statement: a scoped overlay delivery must retain the target gate APIs and resolved linkage behavior.
// Killer mutations: remove a public validator export or aggregate call, re-add BUX-019, restore naive pipe splitting,
// or allow an unclosed inline-code span.

import assert from 'node:assert/strict';
import fs from 'node:fs';
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
