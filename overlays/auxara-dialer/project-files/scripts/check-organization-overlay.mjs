#!/usr/bin/env node

// Verifies the installed organization overlay without claiming ownership of product/source files.
// The manifest hashes only files that the organization layer fully owns; hybrid and product files are
// validated by their domain gates instead of being copied into this overlay.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ORGANIZATION_MANIFEST = '.ai-organization/ownership.json';
const REQUIRED_MANAGED_FILES = new Set([
  '.ai-organization/completion-profiles.json',
  '.ai-organization/policies/action-authority.v1.json',
  '.ai-organization/policies/risk-controls.v1.json',
  '.ai-organization/schemas/task-assurance.v2.schema.json',
  '.ai-organization/schemas/task-evidence.v2.schema.json',
  '.ai-organization/runtime/core/authority/assess-action.mjs',
  '.ai-organization/runtime/core/schema/validate-json-schema.mjs',
  '.ai-organization/runtime/core/lifecycle/README.md',
  '.ai-organization/runtime/core/lifecycle/codex-task-status.mjs',
  '.ai-organization/runtime/core/lifecycle/evidence-runtime.mjs',
  '.ai-organization/runtime/core/lifecycle/lifecycle-controller.mjs',
  '.ai-organization/runtime/core/lifecycle/run-evidence-integrity-mutation.mjs',
  '.ai-organization/runtime/core/lifecycle/task-governor.mjs',
  'scripts/check-agent-control-plane.mjs',
  'scripts/check-organization-overlay.mjs',
  'scripts/claude-lifecycle-hook.mjs',
  'scripts/run-bounded-agent.mjs',
  'scripts/lib/boundedProcess.mjs',
  'scripts/lib/dispatchBoundary.mjs',
  'scripts/lib/agentTelemetry.mjs',
]);

const normalizePath = (value) =>
  String(value ?? '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
const hashFile = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

export function validateOrganizationOverlay(root = process.cwd()) {
  const errors = [];
  const manifestPath = path.join(root, ORGANIZATION_MANIFEST);
  if (!fs.existsSync(manifestPath))
    return [`${ORGANIZATION_MANIFEST}: required manifest is missing`];

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return [`${ORGANIZATION_MANIFEST}: invalid JSON: ${error.message}`];
  }

  if (manifest?.schemaVersion !== 1)
    errors.push(`${ORGANIZATION_MANIFEST}: schemaVersion must be 1`);
  if (typeof manifest?.owner !== 'string' || !manifest.owner.trim()) {
    errors.push(`${ORGANIZATION_MANIFEST}: owner must be non-empty`);
  }
  if (!Array.isArray(manifest?.managedFiles) || manifest.managedFiles.length === 0) {
    errors.push(`${ORGANIZATION_MANIFEST}: managedFiles must be non-empty`);
  }
  if (!Array.isArray(manifest?.projectOwnedRoots) || manifest.projectOwnedRoots.length === 0) {
    errors.push(`${ORGANIZATION_MANIFEST}: projectOwnedRoots must be non-empty`);
  }

  const projectRoots = Array.isArray(manifest?.projectOwnedRoots)
    ? manifest.projectOwnedRoots.map(normalizePath)
    : [];
  const seen = new Set();
  for (const entry of Array.isArray(manifest?.managedFiles) ? manifest.managedFiles : []) {
    const relative = normalizePath(entry?.path);
    if (
      !relative ||
      path.isAbsolute(relative) ||
      relative.startsWith('../') ||
      relative.includes('/../')
    ) {
      errors.push(`${ORGANIZATION_MANIFEST}: invalid managed path: ${entry?.path ?? '<missing>'}`);
      continue;
    }
    if (seen.has(relative)) {
      errors.push(`${ORGANIZATION_MANIFEST}: duplicate managed path: ${relative}`);
      continue;
    }
    seen.add(relative);
    if (projectRoots.some((prefix) => relative.startsWith(prefix))) {
      errors.push(`${ORGANIZATION_MANIFEST}: managed path crosses project-owned root: ${relative}`);
      continue;
    }
    if (typeof entry?.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      errors.push(`${ORGANIZATION_MANIFEST}: ${relative} has no valid sha256`);
      continue;
    }
    const target = path.join(root, relative);
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      errors.push(`${relative}: managed file is missing`);
      continue;
    }
    const actual = hashFile(target);
    if (actual !== entry.sha256) errors.push(`${relative}: managed file parity mismatch`);
  }
  for (const required of REQUIRED_MANAGED_FILES) if (!seen.has(required)) errors.push(`${ORGANIZATION_MANIFEST}: required managed control is omitted: ${required}`);
  return errors;
}

export function writeOrganizationOverlay(root = process.cwd()) {
  const manifestPath = path.join(root, ORGANIZATION_MANIFEST);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.managedFiles = manifest.managedFiles.map((entry) => ({
    ...entry,
    sha256: hashFile(path.join(root, normalizePath(entry.path))),
  }));
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
}

function main() {
  const args = process.argv.slice(2);
  const rootArg = args.find((value) => !value.startsWith('--'));
  const root = rootArg ? path.resolve(rootArg) : process.cwd();
  if (args.includes('--write')) {
    writeOrganizationOverlay(root);
    console.log(`check-organization-overlay: wrote ${ORGANIZATION_MANIFEST}`);
    return;
  }
  const errors = validateOrganizationOverlay(root);
  if (errors.length) {
    console.error('check-organization-overlay: FAIL');
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log(
    'check-organization-overlay: OK — managed organization assets match ownership metadata; project-owned roots remain outside parity enforcement.',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
