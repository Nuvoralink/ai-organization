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
  '.ai-organization/schemas/task-assurance.v3.schema.json',
  '.ai-organization/schemas/task-evidence.v2.schema.json',
  '.ai-organization/runtime/core/authority/assess-action.mjs',
  '.ai-organization/runtime/core/coordination/coverage.mjs',
  '.ai-organization/runtime/core/coordination/dependencyGraph.mjs',
  '.ai-organization/runtime/core/roles/verdict-rubric.mjs',
  '.ai-organization/runtime/core/schema/task-assurance.mjs',
  '.ai-organization/runtime/core/schema/validate-json-schema.mjs',
  '.ai-organization/runtime/core/lifecycle/README.md',
  '.ai-organization/runtime/core/lifecycle/codex-task-status.mjs',
  '.ai-organization/runtime/core/lifecycle/evidence-runtime.mjs',
  '.ai-organization/runtime/core/lifecycle/lifecycle-controller.mjs',
  '.ai-organization/runtime/core/lifecycle/run-evidence-integrity-mutation.mjs',
  '.ai-organization/runtime/core/lifecycle/task-assurance.test.mjs',
  '.ai-organization/runtime/core/lifecycle/task-governor.mjs',
  'scripts/check-agent-control-plane.mjs',
  'scripts/check-organization-overlay.mjs',
  'scripts/claude-lifecycle-hook.mjs',
  'scripts/run-bounded-agent.mjs',
  'scripts/lib/boundedProcess.mjs',
  'scripts/lib/dispatchBoundary.mjs',
  'scripts/lib/agentTelemetry.mjs',
  'scripts/lib/validateClaudeHookSettings.mjs',
]);

const normalizePath = (value) =>
  String(value ?? '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Append-only project learning belongs to the installed project, while the overlay owns the
// structural prefix. Hashing the whole file would make a legitimate learned-class append look
// like structural control-plane drift.
const stripAppendOnlyRegions = (text, markers) => {
  for (const marker of markers) {
    const match = new RegExp(`^${escapeRegex(marker)}`, 'm').exec(text);
    if (match) return `${text.slice(0, match.index).replace(/\n+$/, '')}\n`;
  }
  return text;
};
const hashFile = (file, appendOnlyMarkers = []) => {
  const buffer = fs.readFileSync(file);
  if (!appendOnlyMarkers.length || buffer.includes(0))
    return createHash('sha256').update(buffer).digest('hex');
  const text = buffer.toString('utf8');
  const stripped = stripAppendOnlyRegions(text, appendOnlyMarkers);
  return stripped === text
    ? createHash('sha256').update(buffer).digest('hex')
    : createHash('sha256').update(stripped).digest('hex');
};
const readAppendOnlyMarkers = (manifest) =>
  Array.isArray(manifest?.appendOnlyMarkers)
    ? manifest.appendOnlyMarkers.filter((marker) => typeof marker === 'string')
    : [];

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
  const appendOnlyMarkers = readAppendOnlyMarkers(manifest);
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
    const actual = hashFile(target, appendOnlyMarkers);
    if (actual !== entry.sha256) errors.push(`${relative}: managed file parity mismatch`);
  }
  for (const required of REQUIRED_MANAGED_FILES)
    if (!seen.has(required))
      errors.push(`${ORGANIZATION_MANIFEST}: required managed control is omitted: ${required}`);
  return errors;
}

export async function writeOrganizationOverlay(root = process.cwd()) {
  const manifestPath = path.join(root, ORGANIZATION_MANIFEST);
  const manifestSource = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestSource);
  const appendOnlyMarkers = readAppendOnlyMarkers(manifest);
  const hashes = manifest.managedFiles.map((entry) =>
    hashFile(path.join(root, normalizePath(entry.path)), appendOnlyMarkers),
  );
  let hashIndex = 0;
  const updatedSource = manifestSource.replace(
    /("sha256"\s*:\s*")[a-f0-9]{64}(")/gu,
    (_match, prefix, suffix) => {
      if (hashIndex >= hashes.length) {
        throw new Error(`${ORGANIZATION_MANIFEST}: more sha256 properties than managed files`);
      }
      const replacement = `${prefix}${hashes[hashIndex]}${suffix}`;
      hashIndex += 1;
      return replacement;
    },
  );
  if (hashIndex !== hashes.length) {
    throw new Error(
      `${ORGANIZATION_MANIFEST}: expected ${hashes.length} sha256 properties, found ${hashIndex}`,
    );
  }
  fs.writeFileSync(manifestPath, updatedSource);
  return manifestPath;
}

async function main() {
  const args = process.argv.slice(2);
  const rootArg = args.find((value) => !value.startsWith('--'));
  const root = rootArg ? path.resolve(rootArg) : process.cwd();
  if (args.includes('--write')) {
    await writeOrganizationOverlay(root);
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main();
