/**
 * Proves: ORG-AI-AUDIT-SAFE-INVENTORY-001; Test type: executable inventory-boundary and source-contract mutation;
 * Surface: ai-output-source-truth-audit first repository inventory; Authority: Safe First Inventory in the canonical skill;
 * Product statement: an audit inventories every declared source authority without disclosing data-bearing repository paths;
 * Killer mutation: replace declared roots with a recursive repository-root walk, which must be rejected when ignored
 * uploads, recordings, logs, sessions, telemetry, environment files, or provider payloads enter the result;
 * Counterexample: a declared synthetic, scrubbed test-fixture root remains searchable;
 * Gated command: node --test tests/ai-output-source-truth-audit.test.mjs and npm test.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillPath = path.join(repoRoot, 'skills', 'ai-output-source-truth-audit', 'SKILL.md');

const deniedSegments = new Set([
  'credentials',
  'exports',
  'history',
  'logs',
  'recordings',
  'sessions',
  'telemetry',
  'uploads',
]);

function normalizeRelative(value) {
  return value.split(path.sep).join('/');
}

function walkFiles(root, relative = '') {
  const absolute = path.join(root, relative);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relative, entry.name);
    return entry.isDirectory() ? walkFiles(root, child) : [normalizeRelative(child)];
  });
}

function inventoryDeclaredSources(root, roots, files) {
  return [
    ...roots.flatMap((relative) => walkFiles(root, relative)),
    ...files.filter((relative) => fs.existsSync(path.join(root, relative))),
  ].sort();
}

function denyReason(relative) {
  const segments = normalizeRelative(relative).toLowerCase().split('/');
  const base = segments.at(-1) ?? '';
  if (segments.some((segment) => deniedSegments.has(segment))) return 'data-bearing path segment';
  if (base === '.env' || base.startsWith('.env.')) return 'environment filename';
  if (['.db', '.log', '.sqlite'].includes(path.extname(base))) return 'data-bearing extension';
  if (segments.some((segment) => segment.includes('provider-payload'))) return 'provider payload path';
  return undefined;
}

function assertSafeInventory(paths) {
  const denied = paths
    .map((relative) => ({ relative, reason: denyReason(relative) }))
    .filter(({ reason }) => reason !== undefined);
  assert.deepEqual(denied, [], `inventory crossed the declared data boundary: ${JSON.stringify(denied)}`);
}

function writeFixture(root, relative, content = 'synthetic fixture\n') {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

test('Proves: the canonical skill makes the safe boundary mandatory before the first recursive inventory', () => {
  const skill = fs.readFileSync(skillPath, 'utf8');
  const section = skill.match(/## Safe First Inventory[\s\S]+?(?=\n## Workflow)/u)?.[0];

  assert.ok(section, 'skill must define a Safe First Inventory contract before Workflow');
  assert.match(section, /Before the \*\*first\*\* repo-wide/u);
  assert.match(section, /Declare the complete safe source roots and root files/u);
  assert.match(section, /Declare a data-bearing denylist/u);
  const denylistDeclaration = section.match(/2\. Declare a data-bearing denylist\.[^\n]+/u)?.[0] ?? '';
  for (const requiredClass of [
    /env-like files/u,
    /credential\/secret roots/u,
    /sessions\/history/u,
    /uploads/u,
    /recordings\/audio/u,
    /logs/u,
    /telemetry/u,
    /caches/u,
    /exports/u,
    /live database files/u,
    /customer\/provider payload roots/u,
  ]) {
    assert.match(denylistDeclaration, requiredClass, `minimum denylist omitted ${requiredClass}`);
  }
  assert.match(section, /ignored or untracked data-bearing paths are not safe/u);
  assert.match(section, /only across \*\*all\*\* declared safe roots and files/u);
  assert.match(section, /do not use `head`, capped output, a convenient subdirectory, or early filtering/u);
  assert.match(section, /\*\*Fail-state:\*\*/u);
  assert.match(section, /\*\*Killer mutation:\*\*/u);
  assert.match(section, /\*\*Counterexample:\*\*/u);
  assert.match(section, /tests\/fixtures\/scrubbed/u);
  assert.ok(
    skill.indexOf('## Safe First Inventory') < skill.indexOf('## Workflow'),
    'safe inventory boundary must precede the audit workflow',
  );
});

test('Proves: declared roots stay complete while a broad-root inventory mutation exposes denied paths and fails', (t) => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-audit-safe-inventory-'));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

  writeFixture(fixtureRoot, 'package.json', '{"private":true}\n');
  writeFixture(fixtureRoot, '.gitignore', 'uploads/\nrecordings/\nlogs/\nsessions/\ntelemetry/\n.env*\n');
  writeFixture(fixtureRoot, 'src/decision-core.mjs');
  writeFixture(fixtureRoot, 'docs/source-truth.md');
  writeFixture(fixtureRoot, 'tests/source-truth.test.mjs');
  writeFixture(fixtureRoot, 'tests/fixtures/scrubbed/session-analysis.json', '{"synthetic":true}\n');
  writeFixture(fixtureRoot, 'uploads/session/analysis.json');
  writeFixture(fixtureRoot, 'recordings/call.wav');
  writeFixture(fixtureRoot, 'logs/runtime.log');
  writeFixture(fixtureRoot, 'sessions/provider-payload.json');
  writeFixture(fixtureRoot, 'telemetry/events.json');
  writeFixture(fixtureRoot, '.env.local');

  assert.deepEqual(
    fs.readFileSync(path.join(fixtureRoot, '.gitignore'), 'utf8').trim().split(/\r?\n/u),
    ['uploads/', 'recordings/', 'logs/', 'sessions/', 'telemetry/', '.env*'],
    'synthetic data-bearing paths must remain ignored inputs to the killer mutation',
  );

  const declaredInventory = inventoryDeclaredSources(
    fixtureRoot,
    ['src', 'docs', 'tests'],
    ['package.json', '.gitignore'],
  );
  assertSafeInventory(declaredInventory);
  assert.deepEqual(declaredInventory, [
    '.gitignore',
    'docs/source-truth.md',
    'package.json',
    'src/decision-core.mjs',
    'tests/fixtures/scrubbed/session-analysis.json',
    'tests/source-truth.test.mjs',
  ]);

  const unsafeBroadInventory = walkFiles(fixtureRoot).sort();
  assert.throws(
    () => assertSafeInventory(unsafeBroadInventory),
    (error) => {
      assert.match(error.message, /uploads\/session\/analysis\.json/u);
      assert.match(error.message, /recordings\/call\.wav/u);
      assert.match(error.message, /logs\/runtime\.log/u);
      assert.match(error.message, /sessions\/provider-payload\.json/u);
      assert.match(error.message, /telemetry\/events\.json/u);
      assert.match(error.message, /\.env\.local/u);
      return true;
    },
    'repo-root recursive inventory mutation must be rejected',
  );
});
