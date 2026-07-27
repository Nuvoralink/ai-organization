import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { effectiveRoles, validateProjectRoleExtensionSemantics } from '../core/roles/agent-role-registry.mjs';
import { validateJsonAgainstSchema } from '../core/schema/validate-json-schema.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const universalSchema = path.join(repoRoot, 'schemas', 'agent-role-registry.v1.schema.json');
const projectSchema = path.join(repoRoot, 'schemas', 'agent-role-project-extension.v1.schema.json');

function role(id, extra = {}) {
  return {
    id,
    purpose: `Exercise the ${id} role contract without inventing a second authority.`,
    trigger: ['role-registry test'],
    mode: 'review_read_only',
    strength: 'strongest_available',
    vendor_preference: 'either',
    incompatible_with: ['implementer-for-same-slice'],
    required_outputs: ['evidence-backed verdict'],
    ...extra,
  };
}

const universal = {
  $schema: '../schemas/agent-role-registry.v1.schema.json',
  version: '1.0.0',
  roles: [role('security-auditor'), role('claude-frontend-implementer', { mode: 'implement', strength: 'implementation' })],
};

const projectExtension = {
  $schema: 'https://nuvoralink.internal/schemas/agent-role-project-extension.v1.schema.json',
  version: '1.0.0',
  roles: [
    role('cybersecurity-auditor', { extends: 'security-auditor', supersedes_universal: true }),
    role('sprint-implementer', {
      mode: 'implement',
      strength: 'implementation',
      extends: 'claude-frontend-implementer',
      supersedes_universal: true,
    }),
  ],
};

test('Proves: project-only relationship fields reuse the universal role contract while remaining invalid in the universal registry; Test type: schema contract; Surface: agent-role schemas; Authority: agent-role-registry schemas; Killer mutation: admit extends in the universal property-name set or remove the project schema $ref; Gated command: npm test', () => {
  assert.deepEqual(validateJsonAgainstSchema(projectSchema, projectExtension), []);
  const invalidUniversal = structuredClone(universal);
  invalidUniversal.roles[0].extends = 'security-auditor';
  assert.match(validateJsonAgainstSchema(universalSchema, invalidUniversal).join('\n'), /property "extends"/u);

  const invalidProject = structuredClone(projectExtension);
  invalidProject.roles[0].unexpected_relationship = true;
  assert.match(validateJsonAgainstSchema(projectSchema, invalidProject).join('\n'), /must match at least one schema/u);
});

test('Proves: project extensions fail closed on unknown bases, duplicate ids, and unapproved universal redefinitions; Test type: semantic boundary; Surface: project role extension; Authority: universal role ids; Killer mutations: skip extends lookup, duplicate-id detection, or supersedes requirement; Gated command: npm test', () => {
  const unknownBase = structuredClone(projectExtension);
  unknownBase.roles[0].extends = 'missing-auditor';
  assert.match(validateProjectRoleExtensionSemantics(universal, unknownBase).join('\n'), /extends unknown universal role/u);

  const duplicate = structuredClone(projectExtension);
  duplicate.roles.push(structuredClone(duplicate.roles[0]));
  assert.match(validateProjectRoleExtensionSemantics(universal, duplicate).join('\n'), /Duplicate project role id/u);

  const unapprovedRedefinition = structuredClone(projectExtension);
  unapprovedRedefinition.roles = [role('security-auditor')];
  assert.match(
    validateProjectRoleExtensionSemantics(universal, unapprovedRedefinition).join('\n'),
    /redefines universal role without supersedes_universal/u,
  );
});

test('Proves: effectiveRoles removes each superseded universal role and preserves unrelated universal roles; Test type: pure merge behavior; Surface: effective role inventory; Authority: supersedes_universal; Killer mutation: ignore supersedes_universal and concatenate both registries; Gated command: npm test', () => {
  const effective = effectiveRoles(universal, projectExtension);
  assert.deepEqual(effective.map((entry) => entry.id), ['cybersecurity-auditor', 'sprint-implementer']);
  assert.equal(effective.some((entry) => entry.id === 'security-auditor'), false);
  assert.equal(effective.some((entry) => entry.id === 'claude-frontend-implementer'), false);
  assert.equal(effective.some((entry) => Object.hasOwn(entry, 'supersedes_universal')), false);

  const coexistence = structuredClone(projectExtension);
  coexistence.roles = [role('doctrine-drift-auditor')];
  assert.deepEqual(
    effectiveRoles(universal, coexistence).map((entry) => entry.id),
    ['security-auditor', 'claude-frontend-implementer', 'doctrine-drift-auditor'],
  );
});
