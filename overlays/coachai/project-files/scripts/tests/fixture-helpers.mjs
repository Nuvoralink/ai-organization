import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function tempFixture(prefix = 'coachai-org-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function copyRel(sourceRoot, targetRoot, rel) {
  const source = path.join(sourceRoot, rel);
  const target = path.join(targetRoot, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

// Deliberately-extra fixture inputs beyond the declared managed surface. Each is project-owned
// (ownership.json keeps it outside overlay ownership) yet read by checkAgentControlPlane, so a
// control-plane fixture is incomplete without it:
// - docs/app-plan/decision-log.md: required control-plane artifact whose decision content is read.
// - docs/app-plan/adr: carries the required adr/README.md and adr/000-template.md artifacts.
// - backend/scripts/regression-lanes.json: db-lane registry whose entries the check validates.
const EXTRA_FIXTURE_INPUTS = [
  'docs/app-plan/decision-log.md',
  'docs/app-plan/adr',
  'backend/scripts/regression-lanes.json',
];

export function organizationFixture(sourceRoot) {
  const root = tempFixture();
  const ownership = JSON.parse(
    fs.readFileSync(path.join(sourceRoot, '.ai-organization', 'ownership.json'), 'utf8'),
  );
  // The copy inventory IS the declared managed surface (plus the named extras above): a new
  // ownership row reaches every fixture-built regression without a helper edit.
  const inventory = new Set([
    ...(ownership.managed_roots ?? []),
    ...(ownership.managed_files ?? []),
    ...Object.keys(ownership.managed_json_sections ?? {}),
    ...EXTRA_FIXTURE_INPUTS,
  ]);
  for (const rel of inventory) copyRel(sourceRoot, root, rel);
  return root;
}
