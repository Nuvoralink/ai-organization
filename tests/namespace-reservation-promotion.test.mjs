/**
 * Surface: the PROMOTION of the namespace-reservation authority into the control plane —
 * `core/coordination/{namespace-reservation,reserve-cli,adr-numbering,migration-object-names}.mjs`
 * plus their engine tests, the dialer overlay's managed-file registration, and the
 * `bootstrap-orchestrator` scaffold that seeds a newly bootstrapped project.
 *
 * What this proves about the control plane:
 * - The promoted modules exist where the `*-shared-runtime` mapping delivers them, so every project
 *   (auxara-dialer, coachai, nuvora-link) inherits them with no per-project manifest change.
 * - The shared core stays PROJECT-AGNOSTIC. This is the promotion's whole premise: the moment a
 *   project path, project name, or project-branded env var appears in it, the file stops being
 *   shareable and the next project to adopt it inherits another repo's assumptions silently.
 * - Every promoted module is REGISTERED in the dialer overlay's required-managed-file set, so an
 *   edit to a delivered copy is caught by `gate:organization-overlay` instead of being silently
 *   reverted by the next install (the fork trap).
 * - The bootstrap scaffold ships all four project-owned files, and its thin entries import the
 *   managed engines rather than re-implementing them.
 *
 * Killer mutations (each must turn a named case RED):
 * - Add a project path/name/env-var literal to any shared core module → "stays PROJECT-AGNOSTIC" fails.
 * - Drop a promoted module from REQUIRED_MANAGED_FILES → "registered as a managed control" fails.
 * - Make a bootstrap thin entry re-implement its gate instead of importing the engine → "thin entries
 *   import the managed engine" fails.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coordination = path.join(root, 'core', 'coordination');
const bootstrapGates = path.join(root, 'skills', 'bootstrap-orchestrator', 'templates', 'gates');

/** The promoted implementation modules — the shareable half of the authority. */
const PROMOTED_MODULES = Object.freeze([
  'namespace-reservation.mjs',
  'reserve-cli.mjs',
  'adr-numbering.mjs',
  'migration-object-names.mjs',
]);

/** Their engine tests, delivered alongside so a project's own gate can run them. */
const PROMOTED_TESTS = Object.freeze([
  'namespace-reservation.test.mjs',
  'adr-numbering.test.mjs',
  'migration-object-names.test.mjs',
]);

/** The four files a bootstrapped project installs and owns. */
const BOOTSTRAP_TEMPLATES = Object.freeze([
  'reservation-config.mjs.template',
  'reserve.mjs.template',
  'check-adr-numbering.mjs.template',
  'check-migration-object-names.mjs.template',
]);

/**
 * Tokens that must never appear in a SHARED core module. Each is a real project's path, name, or
 * branded identifier — the exact residue that made the pre-promotion copy unshareable. Matching is
 * case-insensitive because a project name can appear in prose, a path, or an env var.
 */
const PROJECT_SPECIFIC_TOKENS = Object.freeze([
  'backend/prisma',
  'docs/app-plan',
  'auxara',
  'coachai',
  'nuvora',
  'dialer',
  'AUXARA_',
]);

test('every promoted module and engine test exists where the shared-runtime mapping delivers it', () => {
  for (const name of [...PROMOTED_MODULES, ...PROMOTED_TESTS]) {
    const file = path.join(coordination, name);
    assert.ok(fs.existsSync(file), `missing promoted asset core/coordination/${name}`);
    assert.ok(fs.readFileSync(file, 'utf8').trim().length > 0, `${name} is empty`);
  }
});

test('the shared core stays PROJECT-AGNOSTIC — no project path, name, or branded env var', () => {
  const offenders = [];
  for (const name of PROMOTED_MODULES) {
    const text = fs.readFileSync(path.join(coordination, name), 'utf8');
    for (const [index, line] of text.split(/\r?\n/u).entries()) {
      for (const token of PROJECT_SPECIFIC_TOKENS) {
        if (line.toLowerCase().includes(token.toLowerCase())) {
          offenders.push(`${name}:${index + 1} contains ${JSON.stringify(token)} — ${line.trim()}`);
        }
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `a shared core module must carry NO project-specific literal; a project binds it via its own ` +
      `reservation-config.mjs:\n${offenders.join('\n')}`,
  );
});

test('the shared core exposes the neutral env-var names the CLI and configs resolve through', () => {
  const text = fs.readFileSync(path.join(coordination, 'namespace-reservation.mjs'), 'utf8');
  assert.match(text, /NAMESPACE_RESERVATION_AGENT_ID/u);
  assert.match(text, /NAMESPACE_RESERVATION_BASE_REF/u);
  assert.match(text, /export function resolveBaseRef/u);
  assert.match(text, /export function resolveAgentId/u);
});

test('every promoted asset is registered as a managed control in the dialer overlay', () => {
  const gateSource = fs.readFileSync(
    path.join(
      root,
      'overlays',
      'auxara-dialer',
      'project-files',
      'scripts',
      'check-organization-overlay.mjs',
    ),
    'utf8',
  );
  const ownership = JSON.parse(
    fs.readFileSync(
      path.join(root, 'overlays', 'auxara-dialer', 'project-files', '.ai-organization', 'ownership.json'),
      'utf8',
    ),
  );
  const managedPaths = new Set(ownership.managedFiles.map((row) => row.path));

  for (const name of [...PROMOTED_MODULES, ...PROMOTED_TESTS]) {
    const delivered = `.ai-organization/runtime/core/coordination/${name}`;
    assert.ok(
      gateSource.includes(`'${delivered}'`),
      `${delivered} must be in REQUIRED_MANAGED_FILES so a forked delivered copy is caught`,
    );
    assert.ok(
      managedPaths.has(delivered),
      `${delivered} must be digest-pinned in the overlay ownership manifest`,
    );
  }
});

test('the bootstrap scaffold ships all four project-owned files', () => {
  for (const name of BOOTSTRAP_TEMPLATES) {
    const file = path.join(bootstrapGates, name);
    assert.ok(fs.existsSync(file), `missing bootstrap template gates/${name}`);
  }
});

test('the bootstrap thin entries import the managed engine instead of re-implementing it', () => {
  const expectations = [
    ['reserve.mjs.template', 'reserve-cli.mjs', 'runReserveCli'],
    ['check-adr-numbering.mjs.template', 'adr-numbering.mjs', 'runAdrNumberingGate'],
    [
      'check-migration-object-names.mjs.template',
      'migration-object-names.mjs',
      'runMigrationObjectNamesGate',
    ],
  ];
  for (const [templateName, engine, runner] of expectations) {
    const text = fs.readFileSync(path.join(bootstrapGates, templateName), 'utf8');
    assert.ok(
      text.includes(`.ai-organization/runtime/core/coordination/${engine}`),
      `${templateName} must import the delivered managed engine ${engine}`,
    );
    assert.ok(text.includes(runner), `${templateName} must call the engine's ${runner}`);
    assert.ok(
      text.includes('reservation-config.mjs'),
      `${templateName} must read its bindings from the project's reservation config`,
    );
  }
});

test('the bootstrap config template documents the timestamp-migration and port-range calibration', () => {
  const text = fs.readFileSync(path.join(bootstrapGates, 'reservation-config.mjs.template'), 'utf8');
  // Both are judgement calls a bootstrapper must MAKE, not copy — the template must say so, because
  // wiring a `migration` namespace onto timestamp-named migrations, or reusing a sibling's port range,
  // are the two ways this scaffold silently produces a broken or colliding install.
  assert.match(text, /TIMESTAMP-prefixed migrations/u);
  assert.match(text, /must not overlap a sibling/iu);
});
