import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { effectiveRoles, validateProjectRoleExtensionSemantics } from '../core/roles/agent-role-registry.mjs';
import { validateJsonAgainstSchema } from '../core/schema/validate-json-schema.mjs';
import { validateAgentRoleRegistries } from '../scripts/lib/control-plane.mjs';
import { validateOverlay } from '../scripts/project-overlay.mjs';

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

test('Proves: named project agent-file exceptions apply only to active universal review or verify roles; Test type: semantic boundary; Surface: project role extension; Authority: universal role identity and mode; Killer mutations: accept unknown, superseded, duplicate, or already mode-exempt role ids; Gated command: npm test', () => {
  const valid = structuredClone(projectExtension);
  valid.roles = [];
  valid.agent_file_exceptions = [{
    role_id: 'security-auditor',
    source: 'inherited_global_agent',
    reason: 'The global security auditor is inherited outside the project agent directory.',
  }];
  assert.deepEqual(validateJsonAgainstSchema(projectSchema, valid), []);
  assert.deepEqual(validateProjectRoleExtensionSemantics(universal, valid), []);

  const unknown = structuredClone(valid);
  unknown.agent_file_exceptions[0].role_id = 'missing-auditor';
  assert.match(validateProjectRoleExtensionSemantics(universal, unknown).join('\n'), /names non-universal role/u);

  const duplicate = structuredClone(valid);
  duplicate.agent_file_exceptions.push(structuredClone(duplicate.agent_file_exceptions[0]));
  assert.match(validateProjectRoleExtensionSemantics(universal, duplicate).join('\n'), /Duplicate project agent-file exception/u);

  const redundant = structuredClone(valid);
  redundant.agent_file_exceptions[0].role_id = 'claude-frontend-implementer';
  assert.match(validateProjectRoleExtensionSemantics(universal, redundant).join('\n'), /redundant for universal implement role/u);

  const superseded = structuredClone(projectExtension);
  superseded.agent_file_exceptions = [valid.agent_file_exceptions[0]];
  assert.match(validateProjectRoleExtensionSemantics(universal, superseded).join('\n'), /names superseded universal role/u);
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

test('Proves: the seeded dialer and CoachAI project registries validate through the control-plane registry gate; Test type: canonical integration; Surface: project role registries; Authority: control-plane validator; Killer mutation: remove a required output, duplicate a project id, or point extends at an absent universal role; Gated command: control:validate and npm test', () => {
  assert.deepEqual(validateAgentRoleRegistries(repoRoot), []);
});

test('Proves: the dialer specialization replaces generic security and frontend implementation while CoachAI retains universal security; Test type: canonical merge integration; Surface: effective project fleets; Authority: universal plus project registries; Killer mutation: ignore supersedes_universal or apply one project extension globally; Gated command: npm test', () => {
  const canonicalUniversal = JSON.parse(fs.readFileSync(path.join(repoRoot, 'registries', 'agent-roles.v1.json'), 'utf8'));
  const dialer = JSON.parse(fs.readFileSync(path.join(repoRoot, 'overlays', 'auxara-dialer', 'control-plane', 'registries', 'agent-roles.project.v1.json'), 'utf8'));
  const coachai = JSON.parse(fs.readFileSync(path.join(repoRoot, 'overlays', 'coachai', 'control-plane', 'registries', 'agent-roles.project.v1.json'), 'utf8'));
  const dialerIds = effectiveRoles(canonicalUniversal, dialer).map((entry) => entry.id);
  const coachaiIds = effectiveRoles(canonicalUniversal, coachai).map((entry) => entry.id);

  assert.equal(dialerIds.includes('security-auditor'), false);
  assert.equal(dialerIds.includes('cybersecurity-auditor'), true);
  assert.equal(dialerIds.includes('claude-frontend-implementer'), false);
  assert.equal(dialerIds.includes('sprint-implementer'), true);
  assert.equal(coachaiIds.includes('security-auditor'), true);
  assert.equal(coachaiIds.includes('cybersecurity-auditor'), false);
});

test('Proves: each overlay installs one project extension plus the same canonical fleet-parity gate beside the unchanged universal runtime; Test type: overlay contract; Surface: overlay manifests and ownership; Authority: project overlay mappings; Killer mutation: fork the gate source, drop the extension or gate mapping, change a destination, or omit an ownership row; Gated command: overlay validate and npm test', () => {
  for (const [project, prefix] of [['auxara-dialer', 'auxara'], ['coachai', 'coachai']]) {
    const overlayRoot = path.join(repoRoot, 'overlays', project);
    const manifest = JSON.parse(fs.readFileSync(path.join(overlayRoot, 'manifest.json'), 'utf8'));
    const ownership = JSON.parse(fs.readFileSync(path.join(overlayRoot, 'ownership.v1.json'), 'utf8'));
    const universalMapping = manifest.mappings.find((mapping) => mapping.id === `${prefix}-agent-role-registry`);
    const extensionMapping = manifest.mappings.find((mapping) => mapping.id === `${prefix}-agent-role-extension-registry`);
    const fleetMapping = manifest.mappings.find((mapping) => mapping.id === `${prefix}-fleet-parity-gate`);
    const metadataMapping = manifest.mappings.find((mapping) => mapping.id === `${prefix}-organization-metadata`);

    assert.equal(universalMapping.source, 'registries/agent-roles.v1.json');
    assert.equal(extensionMapping.source, `overlays/${project}/control-plane/registries/agent-roles.project.v1.json`);
    assert.equal(fleetMapping.source, 'scripts/check-fleet-parity.mjs');
    assert.deepEqual(
      extensionMapping.destinations,
      [`\${PROJECT:${project}}/.ai-organization/registries/agent-roles.project.v1.json`],
    );
    assert.deepEqual(
      fleetMapping.destinations,
      [`\${PROJECT:${project}}/scripts/check-fleet-parity.mjs`],
    );
    for (const field of ['mode', 'ownership', 'allowedExtensions', 'detectLocalOnly', 'allowRootLink', 'allowInstalledRootLink', 'lock']) {
      assert.deepEqual(extensionMapping[field], universalMapping[field], `${project} extension must match universal ${field} discipline`);
    }
    assert.ok(metadataMapping.exclude.includes('registries/agent-roles.project.v1.json'));
    assert.ok(ownership.assets.some((asset) =>
      asset.id === extensionMapping.id
      && asset.mode === 'generated'
      && asset.destination === '.ai-organization/registries/agent-roles.project.v1.json'));
    assert.ok(ownership.assets.some((asset) =>
      asset.id === fleetMapping.id
      && asset.mode === 'generated'
      && asset.destination === 'scripts/check-fleet-parity.mjs'));
    assert.deepEqual(validateOverlay(project).map((failure) => failure.message ?? failure), []);
  }
});
