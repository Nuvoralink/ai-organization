import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const COMMIT_PATTERN = /^[0-9a-f]{40}$/u;
const SAFE_SOURCE_PATTERN = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/u;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function readGitOid(canonicalRoot, args, label) {
  const result = spawnSync('git', ['-C', canonicalRoot, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`${label}: ${String(result.stderr ?? '').trim() || 'git rev-parse failed'}`);
  }
  const oid = String(result.stdout ?? '').trim();
  if (!COMMIT_PATTERN.test(oid)) {
    throw new Error(`${label}: Git did not return one full lowercase object id`);
  }
  return oid;
}

function assertCanonicalCheckout(canonicalRoot, commit) {
  const resolvedCommit = readGitOid(
    canonicalRoot,
    ['rev-parse', '--verify', `${commit}^{commit}`],
    'manifest canonical_commit does not resolve to a commit object',
  );
  if (resolvedCommit !== commit) {
    throw new Error('manifest canonical_commit must identify the commit object directly');
  }
  const checkedOutHead = readGitOid(
    canonicalRoot,
    ['rev-parse', 'HEAD'],
    'cannot resolve canonical checkout HEAD',
  );
  if (checkedOutHead !== resolvedCommit) {
    throw new Error('canonical checkout HEAD does not equal manifest canonical_commit');
  }
}

function readCommittedBlob(canonicalRoot, commit, source) {
  const result = spawnSync('git', ['-C', canonicalRoot, 'show', `${commit}:${source}`], {
    encoding: null,
    windowsHide: true,
    shell: false,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const diagnostic = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString('utf8').trim()
      : String(result.stderr ?? '').trim();
    throw new Error(`Cannot read canonical blob ${source}: ${diagnostic || 'git show failed'}`);
  }
  return Buffer.from(result.stdout ?? []);
}

export function validateControlPlaneAssetProvenance({ canonicalRoot, manifest }) {
  const errors = [];
  const commit = manifest?.canonical_commit;
  if (typeof commit !== 'string' || !COMMIT_PATTERN.test(commit)) {
    return ['manifest canonical_commit must be one full lowercase Git object id'];
  }
  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
    return ['manifest assets must be a non-empty array'];
  }

  try {
    assertCanonicalCheckout(canonicalRoot, commit);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  const seenSources = new Set();
  for (const asset of manifest.assets) {
    const source = asset?.source;
    const declaredHash = asset?.sha256;
    if (
      typeof source !== 'string' ||
      !SAFE_SOURCE_PATTERN.test(source) ||
      path.posix.normalize(source) !== source ||
      source.includes('\\')
    ) {
      errors.push('manifest asset source must be one safe normalized repository-relative path');
      continue;
    }
    if (seenSources.has(source)) {
      errors.push(`manifest asset source is duplicated: ${source}`);
      continue;
    }
    seenSources.add(source);
    if (typeof declaredHash !== 'string' || !/^[0-9a-f]{64}$/u.test(declaredHash)) {
      errors.push(`manifest asset hash is invalid: ${source}`);
      continue;
    }
    try {
      const committedHash = sha256(readCommittedBlob(canonicalRoot, commit, source));
      if (committedHash !== declaredHash) {
        errors.push(`manifest asset is not reproducible from canonical_commit: ${source}`);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return errors;
}

async function main(argv) {
  if (
    argv.length !== 4 ||
    argv[0] !== '--canonical-root' ||
    argv[2] !== '--manifest' ||
    argv[1]?.length === 0 ||
    argv[3]?.length === 0
  ) {
    throw new Error(
      'Usage: verify-control-plane-asset-provenance.mjs --canonical-root <path> --manifest <path>',
    );
  }
  const manifest = JSON.parse(await readFile(path.resolve(argv[3]), 'utf8'));
  const errors = validateControlPlaneAssetProvenance({
    canonicalRoot: path.resolve(argv[1]),
    manifest,
  });
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
    return;
  }
  console.log(`control-plane-asset-provenance: PASS assets=${String(manifest.assets.length)}`);
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
