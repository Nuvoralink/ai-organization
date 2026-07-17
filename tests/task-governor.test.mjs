import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCompletion, validateTaskContract } from '../core/lifecycle/task-governor.mjs';

function contract() {
  return {
    id: 'ORG-001',
    product_intent: 'Make completion evidence deterministic across vendors.',
    settled_decisions: ['The shared governor owns cross-vendor contract and evidence validation.'],
    scope: {
      in: ['Shared task contract and completion evidence validation'],
      out: ['Application feature implementation'],
      too_little: 'Checking only selected semantic fields would permit schema bypass.',
      too_much: 'Replacing project-specific proof selection would erase domain controls.'
    },
    paths: {
      read: ['schemas/**', 'core/**'],
      edit: ['scripts/**', 'tests/**'],
      read_only: ['scripts/vendor/**'],
      output: ['tests/**']
    },
    risk: { level: 'medium', classes: ['control_plane'], reasons: ['completion authority'] },
    authorities: ['schemas/task-assurance.v1.schema.json', 'schemas/task-evidence.v1.schema.json'],
    blast_radius: {
      feeders: ['Agent dispatch briefs'],
      producers: ['Task contract authors'],
      transformers: ['Project lifecycle adapters'],
      persistence: [],
      validators: ['Shared task governor'],
      consumers: ['Claude and Codex orchestration'],
      surfaces: ['Task kickoff and completion'],
      retirements: ['Partial project-local schema checks']
    },
    procedure: ['Validate the full schema before semantic and completion checks.'],
    acceptance: ['A schema-incomplete contract is rejected before work begins.'],
    proofs: [{
      id: 'control-tests',
      proves: 'The governor rejects an invalid completion.',
      command: 'npm test',
      surface: 'control plane',
      authority: 'task governor',
      risk_classes: ['control_plane'],
      killer_mutation: 'Remove the required proof result.',
      required: true
    }],
    action_authority: {
      allowed: ['read', 'edit', 'test'],
      conditional: ['commit', 'push', 'pull_request'],
      human_required: ['production_mutation', 'destructive_action', 'billed_action']
    },
    completion: {
      tier: 'review_verified',
      honesty_clause: 'Name every surface not reached by the supplied proof.',
      unreached_surfaces: [],
      doctrine_loop: 'Record the smallest reusable control improvement or none.'
    }
  };
}

function evidence() {
  return {
    task_id: 'ORG-001',
    changed_files: ['scripts/check.mjs', 'tests/check.test.mjs'],
    proofs: [{ id: 'control-tests', command: 'npm test', exit_code: 0, artifact_opened: true, killer_mutation_observed: true }],
    independent_review: { required: true, reviewer: 'independent-reviewer', verdict: 'pass' },
    unreached_surfaces: [],
    doctrine_loop: 'none'
  };
}

test('Proves: ORG-GOV-001; Test type: contract; Surface: task kickoff; Authority: task governor; Killer mutation: remove risk proof coverage; Gated command: npm test', () => {
  assert.deepEqual(validateTaskContract(contract()), []);
  const mutated = contract();
  mutated.proofs[0].risk_classes = ['documentation'];
  assert.match(validateTaskContract(mutated).join('\n'), /no required proof/u);
});

test('Proves: ORG-GOV-002; Test type: mutation; Surface: completion; Authority: task governor; Killer mutation: omit or fake proof output; Gated command: npm test', () => {
  assert.deepEqual(validateCompletion(contract(), evidence()), []);
  const missing = evidence();
  missing.proofs = [];
  assert.match(validateCompletion(contract(), missing).join('\n'), /not run/u);
  const unopened = evidence();
  unopened.proofs[0].artifact_opened = false;
  assert.match(validateCompletion(contract(), unopened).join('\n'), /not opened/u);
});

test('Proves: ORG-GOV-003; Test type: mutation; Surface: path authority; Authority: task governor; Killer mutation: edit outside allowlist or inside read-only subtree; Gated command: npm test', () => {
  const outside = evidence();
  outside.changed_files.push('src/app.ts');
  assert.match(validateCompletion(contract(), outside).join('\n'), /outside editable/u);
  const readOnly = evidence();
  readOnly.changed_files.push('scripts/vendor/upstream.mjs');
  assert.match(validateCompletion(contract(), readOnly).join('\n'), /read-only/u);
});

test('Proves: ORG-GOV-004; Test type: mutation; Surface: independent review; Authority: task governor; Killer mutation: self-certify a review-verified tier; Gated command: npm test', () => {
  const unreviewed = evidence();
  unreviewed.independent_review = { required: true, reviewer: null, verdict: 'findings' };
  assert.match(validateCompletion(contract(), unreviewed).join('\n'), /Independent review/u);
});

test('Proves: ORG-GOV-006; Test type: schema-bypass mutation; Surface: cross-vendor task contract; Authority: task-assurance and task-evidence schemas; Killer mutation: omit scope, authorities, blast radius, procedure, acceptance, path fields, action authority, and completion honesty while semantic spot-checks still pass; Gated command: npm test', () => {
  const incomplete = {
    id: 'ORG-INCOMPLETE',
    product_intent: 'A substantive product intent remains present.',
    paths: { edit: ['scripts/**'], read_only: [] },
    risk: { classes: ['control_plane'] },
    proofs: [{ id: 'proof', command: 'npm test', proves: 'proof', authority: 'tests', surface: 'control', killer_mutation: 'break it', risk_classes: ['control_plane'], required: true }]
  };
  const errors = validateTaskContract(incomplete).join('\n');
  for (const required of ['settled_decisions', 'scope', 'authorities', 'blast_radius', 'procedure', 'acceptance', 'action_authority', 'completion']) assert.match(errors, new RegExp(required, 'u'));
});
