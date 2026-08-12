#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, '.ai-organization', 'control-plane-assets.v1.json');
const fileMappings = [
  ['registries/agent-roles.v1.json', '.ai-organization/registries/agent-roles.v1.json'],
  ['policies/action-authority.v1.json', '.ai-organization/policies/action-authority.v1.json'],
  ['policies/risk-controls.v1.json', '.ai-organization/policies/risk-controls.v1.json'],
  ['scripts/check-fleet-parity.mjs', 'scripts/check-fleet-parity.mjs'],
];
const treeMappings = [
  ['core', '.ai-organization/runtime/core'],
  ['schemas', '.ai-organization/schemas'],
];

function normalized(relative) {
  return relative.replaceAll('\\', '/');
}

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : entry.isFile() ? [target] : [];
  });
}

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function git(sourceRoot, args, encoding = 'utf8') {
  const result = spawnSync('git', ['-C', sourceRoot, ...args], {
    encoding,
    windowsHide: true,
    shell: false,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString('utf8').trim()
      : String(result.stderr ?? '').trim();
    throw new Error(stderr || `git ${args.join(' ')} failed`);
  }
  return result.stdout;
}

function canonicalCommit(sourceRoot, revision = 'HEAD') {
  const commit = String(git(sourceRoot, ['rev-parse', '--verify', `${revision}^{commit}`])).trim();
  if (!/^[0-9a-f]{40}$/u.test(commit)) {
    throw new Error('canonical source did not resolve to one full lowercase Git commit id');
  }
  return commit;
}

function committedBytes(sourceRoot, commit, source) {
  return Buffer.from(git(sourceRoot, ['show', `${commit}:${source}`], null) ?? []);
}

function committedFilesUnder(sourceRoot, commit, sourceTree) {
  return String(git(sourceRoot, ['ls-tree', '-r', '--name-only', commit, '--', sourceTree]))
    .split(/\r?\n/u)
    .filter(Boolean);
}

function sha256(file) {
  return digest(fs.readFileSync(file));
}

function expectedInventory(sourceRoot, commit) {
  const rows = fileMappings.map(([source, target]) => ({
    source,
    target,
    sha256: digest(committedBytes(sourceRoot, commit, source)),
  }));
  for (const [sourceTree, targetTree] of treeMappings) {
    for (const sourceFile of committedFilesUnder(sourceRoot, commit, sourceTree)) {
      const suffix = sourceFile.slice(sourceTree.length + 1);
      rows.push({
        source: sourceFile,
        target: `${targetTree}/${suffix}`,
        sha256: digest(committedBytes(sourceRoot, commit, sourceFile)),
      });
    }
  }
  return rows.sort((left, right) => left.target.localeCompare(right.target));
}

function installedInventory() {
  const targets = fileMappings.map(([, target]) => target);
  for (const [, targetTree] of treeMappings) {
    const directory = path.join(root, targetTree);
    for (const file of filesUnder(directory)) {
      targets.push(normalized(path.relative(root, file)));
    }
  }
  return targets.sort();
}

export function validateControlPlaneParity(manifest) {
  const errors = [];
  if (manifest?.version !== 1) errors.push('manifest version must be 1');
  if (!/^[0-9a-f]{40}$/u.test(manifest?.canonical_commit ?? '')) {
    errors.push('canonical commit provenance must be one full lowercase Git object id');
  }
  if (!Array.isArray(manifest?.assets) || manifest.assets.length === 0) {
    return [...errors, 'manifest assets must be non-empty'];
  }
  const expectedTargets = manifest.assets.map((asset) => asset.target).sort();
  const duplicates = expectedTargets.filter(
    (target, index) => expectedTargets.indexOf(target) !== index,
  );
  for (const duplicate of new Set(duplicates))
    errors.push(`duplicate manifest target: ${duplicate}`);
  const actualTargets = installedInventory();
  if (JSON.stringify(expectedTargets) !== JSON.stringify(actualTargets)) {
    errors.push('installed universal asset inventory differs from the manifest');
  }
  for (const asset of manifest.assets) {
    const target = path.join(root, asset.target);
    if (!fs.existsSync(target)) errors.push(`universal asset is missing: ${asset.target}`);
    else if (sha256(target) !== asset.sha256)
      errors.push(`universal asset hash drift: ${asset.target}`);
  }
  return errors;
}

function sourceArgument() {
  const index = process.argv.indexOf('--source');
  return index === -1 ? undefined : path.resolve(process.argv[index + 1] ?? '');
}

function main() {
  const sourceRoot = sourceArgument();
  if (process.argv.includes('--write')) {
    if (
      sourceRoot === undefined ||
      !fs.existsSync(path.join(sourceRoot, 'registries', 'agent-roles.v1.json'))
    ) {
      throw new Error('--write requires --source pointing to the canonical control-plane checkout');
    }
    const manifest = {
      version: 1,
      canonical_commit: canonicalCommit(sourceRoot),
      source_checkout_role: 'bootstrap-provenance-only-not-a-runtime-dependency',
      assets: [],
    };
    manifest.assets = expectedInventory(sourceRoot, manifest.canonical_commit);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const errors = validateControlPlaneParity(manifest);
  if (sourceRoot !== undefined) {
    try {
      const manifestCommit = canonicalCommit(sourceRoot, manifest.canonical_commit);
      const sourceHead = canonicalCommit(sourceRoot);
      if (sourceHead !== manifestCommit) {
        errors.push(
          `canonical source checkout HEAD ${sourceHead} differs from manifest commit ${manifestCommit}`,
        );
      } else {
        const sourceAssets = expectedInventory(sourceRoot, manifestCommit);
        if (JSON.stringify(sourceAssets) !== JSON.stringify(manifest.assets)) {
          errors.push('canonical source checkout differs from the committed parity manifest');
        }
      }
    } catch (error) {
      errors.push(
        `canonical commit provenance does not resolve to a commit object: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`control-plane-parity: ${error}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `control-plane-parity: PASS assets=${manifest.assets.length} commit=${manifest.canonical_commit}\n`,
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
