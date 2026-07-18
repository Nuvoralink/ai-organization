#!/usr/bin/env node

// Auxara Dialer doc/code drift gate.
//
// Converted from the carried-over CoachAI gate (V2 authority inventory / SRP-001/002/004 / score
// authority — none of which exist in the dialer) to the DIALER's actual source-of-truth surfaces
// (Sprint 0.1): the ARC-005 central registries resolve to real files, the migration-001 Prisma
// models + FORCED RLS exist, and the shared taxonomy enums stay in sync. CoachAI-equivalent DEEP
// checks (tenant-security manifest, telemetry SRP, surface-authority map) are reintroduced as the
// dialer analogues land in their owning sprints (1.0+).

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

if (
  !fs.existsSync(path.join(root, 'backend/src')) &&
  !fs.existsSync(path.join(root, 'frontend/src'))
) {
  console.log('check-doc-code-drift: backend/ and frontend/ not scaffolded yet — skipping.');
  process.exit(0);
}

const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => {
  try {
    return fs.readFileSync(path.join(root, file), 'utf8');
  } catch {
    return '';
  }
};

const failures = [];

function sortedDifference(left, right) {
  return [...left].filter((value) => !right.has(value)).sort();
}

function duplicates(values) {
  const seen = new Set();
  const dupes = new Set();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes].sort();
}

function extractPermissionKeysFromTaxonomy(source) {
  const keys = [];
  const keyPattern = /\bkey:\s*'([^']+)'/g;
  let match;
  while ((match = keyPattern.exec(source))) {
    keys.push(match[1]);
  }
  return keys;
}

function extractGlossaryPermissionKeys(source) {
  const sectionMatch = source.match(/## Permission key registry\s+[\s\S]*?(?=\n## [^\n]+|\s*$)/);
  if (!sectionMatch) return null;
  const keys = [];
  const rowPattern = /^\|\s*`([^`]+)`\s*\|/gm;
  let match;
  while ((match = rowPattern.exec(sectionMatch[0]))) {
    if (match[1] !== 'Key') keys.push(match[1]);
  }
  return keys;
}

// 1. ARC-005 central registries resolve to real files.
const registries = [
  'shared/src/index.ts',
  'shared/src/taxonomy/tenantKind.ts',
  'shared/src/taxonomy/scopes.ts',
  'shared/src/taxonomy/roles.ts',
  'shared/src/taxonomy/permissions.ts',
  'shared/src/taxonomy/rolePermissions.ts',
  'shared/src/taxonomy/dispositionSource.ts',
  'shared/src/taxonomy/validationStatus.ts',
  'shared/src/taxonomy/objections.ts',
  'shared/src/taxonomy/lineProvenance.ts',
  'shared/src/taxonomy/recordingDisclosurePolicy.ts',
  'shared/src/taxonomy/complianceCapability.ts',
  'shared/src/contracts/endpoints.ts',
  'shared/src/contracts/auth.ts',
  'shared/src/contracts/calls.ts',
  'shared/src/contracts/dispositions.ts',
  'shared/src/contracts/compliance.ts',
  'shared/src/contracts/battlecards.ts',
  'shared/src/contracts/conversations.ts',
  'shared/src/contracts/teleprompter.ts',
  'shared/src/config/thresholds.ts',
];
for (const file of registries) {
  if (!exists(file)) failures.push(`Missing ARC-005 central registry: ${file}`);
}

// 2. Migration-001 Prisma models exist.
const schema = read('backend/prisma/schema.prisma');
for (const model of [
  'Tenant',
  'User',
  'Role',
  'Permission',
  'RolePermission',
  'UserPermission',
  'AuditLog',
]) {
  if (!new RegExp(`model\\s+${model}\\b`).test(schema)) {
    failures.push(`Prisma schema missing migration-001 model: ${model}`);
  }
}

// 3. RLS is present AND forced in migration 001 (ADR-AUTH-005 backstop; FORCE so owner is subject).
const migration = read('backend/prisma/migrations/0001_init/migration.sql');
if (!/ROW LEVEL SECURITY/.test(migration)) {
  failures.push('migration 0001 is missing RLS (ADR-AUTH-005 tenant-isolation backstop)');
}
if (!/FORCE ROW LEVEL SECURITY/.test(migration)) {
  failures.push('migration 0001 RLS is not FORCED — the connecting owner role could bypass it');
}

// 4. Shared enums stay in sync with the Prisma enums they mirror.
const tenantKind = read('shared/src/taxonomy/tenantKind.ts');
for (const value of ['customer', 'internal']) {
  if (!tenantKind.includes(`'${value}'`))
    failures.push(`tenantKind registry missing value '${value}'`);
  if (!new RegExp(`\\b${value}\\b`).test(schema))
    failures.push(`Prisma TenantKind enum missing value '${value}'`);
}
const scopes = read('shared/src/taxonomy/scopes.ts');
for (const value of ['self', 'team', 'tenant', 'platform']) {
  if (!scopes.includes(`'${value}'`)) failures.push(`scopes registry missing value '${value}'`);
}

// 5. Backend source-of-truth libs exist.
for (const file of [
  'backend/src/lib/env.ts',
  'backend/src/lib/telemetry.ts',
  'backend/src/lib/tenantContext.ts',
  'backend/src/lib/prisma.ts',
]) {
  if (!exists(file)) failures.push(`Missing backend source-of-truth lib: ${file}`);
}

// 6. Living docs that own drift-prevention exist (routing layer + blast radius).
for (const file of ['docs/DOCUMENTATION_INDEX.md', 'docs/ARCHITECTURE_BLAST_RADIUS.md']) {
  if (!exists(file)) failures.push(`Missing living doc: ${file}`);
}

// 7. Permission registry mirror stays synced.
//
// Proves: REQ-AUTH-003
// Test type: gate / contract
// Surface: docs/app-plan/product/27-glossary-taxonomy.md Permission key registry
//   <-> shared/src/taxonomy/permissions.ts
// Authority: shared/src/taxonomy/permissions.ts (ARC-005); glossary is a mirror.
// Negative path: remove one permission row from the glossary and this gate names the missing key.
// Mutation that must break it: deleting this block lets glossary/taxonomy drift pass silently.
const permissionTaxonomyKeys = extractPermissionKeysFromTaxonomy(
  read('shared/src/taxonomy/permissions.ts'),
);
const glossaryPermissionKeys = extractGlossaryPermissionKeys(
  read('docs/app-plan/product/27-glossary-taxonomy.md'),
);
if (glossaryPermissionKeys === null) {
  failures.push(
    'Glossary missing Permission key registry section (docs/app-plan/product/27-glossary-taxonomy.md)',
  );
} else {
  const taxonomySet = new Set(permissionTaxonomyKeys);
  const glossarySet = new Set(glossaryPermissionKeys);
  for (const key of duplicates(permissionTaxonomyKeys)) {
    failures.push(`permissions.ts defines duplicate permission key: ${key}`);
  }
  for (const key of duplicates(glossaryPermissionKeys)) {
    failures.push(`glossary permission registry duplicates key: ${key}`);
  }
  for (const key of sortedDifference(taxonomySet, glossarySet)) {
    failures.push(`glossary permission registry missing key from permissions.ts: ${key}`);
  }
  for (const key of sortedDifference(glossarySet, taxonomySet)) {
    failures.push(`glossary permission registry has key not in permissions.ts: ${key}`);
  }
}

if (failures.length) {
  console.error('check-doc-code-drift failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(
  'check-doc-code-drift: OK (dialer registries + migration-001 RLS + shared enums + glossary permissions in sync)',
);
process.exit(0);
