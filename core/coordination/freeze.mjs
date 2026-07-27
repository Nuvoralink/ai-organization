/**
 * Contract-bundle freeze observation.
 *
 * This captures declared-member content, declared authority identity, and the relevant toolchain
 * identity in a canonical manifest. It deliberately does not enforce dispatch admission or walk an
 * AST/import graph. Full import-graph semantic closure (including an out-of-bundle registry or
 * generated artifact that changes a member's meaning without changing its bytes) is a future
 * enhancement and must arrive with candidate-bound liveness/compatibility proof.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  canonicalJson,
  defaultAssuranceStateDirectory,
  sha256,
  writeJson,
} from '../lifecycle/evidence-runtime.mjs';
import { authorityDomainRegistryPath, loadAuthorityDomains } from './resourceConfig.mjs';
import { authorityDomainsForPath, globsCanIntersect } from './resourceKey.mjs';

const STORE_VERSION = 1;
const MANIFEST_VERSION = 1;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;
const CONTENT_DIGEST_PATTERN = /^[0-9a-f]{64}$/u;
const ENTRY_KEYS = new Set([
  'extraMembers',
  'frozenAt',
  'manifest',
  'manifestDigest',
  'owner',
  'retiredAt',
  'state',
  'supersedes',
]);

export const FREEZE_STATES = Object.freeze(['proposed', 'active', 'retired']);
const FREEZE_STATE_SET = new Set(FREEZE_STATES);

export class FreezeStoreError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'FreezeStoreError';
  }
}

export class ContractBundleError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'ContractBundleError';
  }
}

export class FreezeConflictError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'FreezeConflictError';
  }
}

function compareCodePoints(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeBundleId(bundleId) {
  if (typeof bundleId !== 'string' || bundleId.trim() === '') {
    throw new TypeError('Contract bundleId must be a non-empty authority-domain name');
  }
  return bundleId.trim();
}

function normalizeRepositoryRelativePath(value, { allowGlob, label }) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be a non-empty repository-relative path`);
  }
  const raw = value.trim().replaceAll('\\', '/').replace(/\/+/gu, '/');
  if (path.posix.isAbsolute(raw) || path.win32.isAbsolute(raw)) {
    throw new ContractBundleError(`${label} must be repository-relative: ${value}`);
  }
  const segments = raw.split('/').filter((segment) => segment !== '' && segment !== '.');
  if (segments.length === 0 || segments.includes('..')) {
    throw new ContractBundleError(`${label} must stay inside the repository: ${value}`);
  }
  const normalized = segments.join('/');
  if (!allowGlob && normalized.includes('*')) {
    throw new ContractBundleError(`${label} must name a file, not a glob: ${value}`);
  }
  if (allowGlob && segments.some((segment) => segment.includes('**') && segment !== '**')) {
    throw new ContractBundleError(`${label} contains an unsupported ** segment: ${value}`);
  }
  return normalized;
}

function normalizeExtraMembers(extraMembers) {
  if (!Array.isArray(extraMembers)) {
    throw new TypeError('extraMembers must be an array of repository-relative file paths');
  }
  return [
    ...new Set(
      extraMembers.map((member) =>
        normalizeRepositoryRelativePath(member, {
          allowGlob: false,
          label: 'Contract bundle extra member',
        }),
      ),
    ),
  ].sort(compareCodePoints);
}

function repositoryFilePath(repoRoot, relativePath) {
  return path.join(repoRoot, ...relativePath.split('/'));
}

function walkRegularFiles(repoRoot, directoryPath) {
  const files = [];
  const queue = [directoryPath];
  for (let index = 0; index < queue.length; index += 1) {
    const directory = queue[index];
    const entries = fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => compareCodePoints(left.name, right.name));
    for (const entry of entries) {
      if (entry.name === '.git') continue;
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        queue.push(candidate);
        continue;
      }
      if (entry.isFile()) {
        files.push(path.relative(repoRoot, candidate).replaceAll('\\', '/'));
        continue;
      }
      if (entry.isSymbolicLink()) {
        throw new ContractBundleError(
          `Contract bundle glob resolved a symbolic link instead of a regular file: ${path
            .relative(repoRoot, candidate)
            .replaceAll('\\', '/')}`,
        );
      }
    }
  }
  return files;
}

function declaredPatternMembers(repoRoot, declaredPattern) {
  const pattern = normalizeRepositoryRelativePath(declaredPattern, {
    allowGlob: true,
    label: 'Authority-domain owns pattern',
  });
  if (!pattern.includes('*')) {
    const file = repositoryFilePath(repoRoot, pattern);
    if (!fs.existsSync(file)) return [{ path: pattern, missing: true }];
    if (!fs.lstatSync(file).isFile()) {
      throw new ContractBundleError(`Authority-domain member is not a regular file: ${pattern}`);
    }
    return [{ path: pattern }];
  }

  const segments = pattern.split('/');
  const wildcardIndex = segments.findIndex((segment) => segment.includes('*'));
  const searchRoot =
    wildcardIndex === 0
      ? repoRoot
      : repositoryFilePath(repoRoot, segments.slice(0, wildcardIndex).join('/'));
  if (!fs.existsSync(searchRoot) || !fs.lstatSync(searchRoot).isDirectory()) {
    return [{ path: pattern, missing: true }];
  }

  const matches = walkRegularFiles(repoRoot, searchRoot)
    .filter((candidate) => globsCanIntersect(pattern, candidate, { fold: false }))
    .sort(compareCodePoints);
  return matches.length > 0
    ? matches.map((memberPath) => ({ path: memberPath }))
    : [{ path: pattern, missing: true }];
}

function exactMember(repoRoot, relativePath) {
  const file = repositoryFilePath(repoRoot, relativePath);
  if (!fs.existsSync(file)) return { path: relativePath, missing: true };
  if (!fs.lstatSync(file).isFile()) {
    throw new ContractBundleError(`Contract bundle member is not a regular file: ${relativePath}`);
  }
  return { path: relativePath };
}

function loadRepositoryAuthorityDomains(repoRoot) {
  let warning;
  const domains = loadAuthorityDomains(authorityDomainRegistryPath(repoRoot), {
    warn: (message) => {
      warning = message;
    },
  });
  if (warning) {
    throw new ContractBundleError(`Contract bundle authority registry cannot be read: ${warning}`);
  }
  return domains;
}

function bundleContext(repoRoot, bundleId) {
  const normalizedBundleId = normalizeBundleId(bundleId);
  const authorityDomains = loadRepositoryAuthorityDomains(repoRoot);
  const definition = authorityDomains[normalizedBundleId];
  if (!definition) {
    throw new ContractBundleError(
      `Unknown contract bundle "${normalizedBundleId}"; no matching authority domain is declared`,
    );
  }
  return { authorityDomains, bundleId: normalizedBundleId, definition };
}

function contentMember(repoRoot, descriptor) {
  if (descriptor.missing) return { path: descriptor.path, missing: true };
  const body = fs.readFileSync(repositoryFilePath(repoRoot, descriptor.path));
  return {
    path: descriptor.path,
    bytes: body.byteLength,
    sha256: sha256(body),
  };
}

function computeManifestFromContext({ repoRoot, context, extraMembers }) {
  const descriptors = new Map();
  for (const declaredPattern of context.definition.owns) {
    for (const descriptor of declaredPatternMembers(repoRoot, declaredPattern)) {
      const previous = descriptors.get(descriptor.path);
      if (!previous || previous.missing) descriptors.set(descriptor.path, descriptor);
    }
  }
  for (const member of extraMembers) {
    const descriptor = exactMember(repoRoot, member);
    const previous = descriptors.get(descriptor.path);
    if (!previous || previous.missing) descriptors.set(descriptor.path, descriptor);
  }

  const members = [...descriptors.values()]
    .sort((left, right) => compareCodePoints(left.path, right.path))
    .map((descriptor) => contentMember(repoRoot, descriptor));
  const declaredAuthorities = new Set([context.bundleId]);
  for (const member of members) {
    for (const authorityKey of authorityDomainsForPath(member.path, context.authorityDomains, {
      fold: false,
    })) {
      declaredAuthorities.add(authorityKey.slice('authority:'.length));
    }
  }

  return {
    bundleId: context.bundleId,
    declaredAuthorities: [...declaredAuthorities].sort(compareCodePoints),
    manifestVersion: MANIFEST_VERSION,
    memberCount: members.length,
    members,
    toolchain: { node: process.version },
  };
}

function digestManifest(manifest) {
  return `sha256:${sha256(canonicalJson(manifest))}`;
}

export function computeContractManifest({ repoRoot, bundleId, extraMembers = [] }) {
  const resolvedRepoRoot = path.resolve(repoRoot);
  const context = bundleContext(resolvedRepoRoot, bundleId);
  const normalizedExtraMembers = normalizeExtraMembers(extraMembers);
  const manifest = computeManifestFromContext({
    repoRoot: resolvedRepoRoot,
    context,
    extraMembers: normalizedExtraMembers,
  });
  return { manifest, manifestDigest: digestManifest(manifest) };
}

function validTimestamp(value) {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
}

function validateManifest(manifest, bundleId) {
  if (!isPlainObject(manifest)) throw new Error('manifest must be an object');
  if (manifest.manifestVersion !== MANIFEST_VERSION) {
    throw new Error(`manifestVersion must be ${MANIFEST_VERSION}`);
  }
  if (manifest.bundleId !== bundleId) throw new Error('manifest bundleId does not match store key');
  if (!Array.isArray(manifest.members) || manifest.members.length !== manifest.memberCount) {
    throw new Error('manifest memberCount does not match members');
  }
  const memberPaths = [];
  for (const member of manifest.members) {
    if (!isPlainObject(member) || typeof member.path !== 'string' || member.path === '') {
      throw new Error('manifest member requires a path');
    }
    memberPaths.push(member.path);
    if (member.missing === true) {
      if (Object.keys(member).sort().join(',') !== 'missing,path') {
        throw new Error(`missing manifest member has unexpected fields: ${member.path}`);
      }
    } else if (
      !Number.isSafeInteger(member.bytes) ||
      member.bytes < 0 ||
      !CONTENT_DIGEST_PATTERN.test(member.sha256 ?? '') ||
      Object.keys(member).sort().join(',') !== 'bytes,path,sha256'
    ) {
      throw new Error(`manifest member content metadata is invalid: ${member.path}`);
    }
  }
  const sortedMemberPaths = [...new Set(memberPaths)].sort(compareCodePoints);
  if (
    sortedMemberPaths.length !== memberPaths.length ||
    sortedMemberPaths.some((memberPath, index) => memberPath !== memberPaths[index])
  ) {
    throw new Error('manifest member paths must be sorted and unique');
  }
  if (
    !Array.isArray(manifest.declaredAuthorities) ||
    manifest.declaredAuthorities.length === 0 ||
    manifest.declaredAuthorities.some(
      (authority) => typeof authority !== 'string' || authority === '',
    )
  ) {
    throw new Error('manifest declaredAuthorities must be a non-empty string array');
  }
  const sortedAuthorities = [...new Set(manifest.declaredAuthorities)].sort(compareCodePoints);
  if (
    sortedAuthorities.length !== manifest.declaredAuthorities.length ||
    sortedAuthorities.some((authority, index) => authority !== manifest.declaredAuthorities[index])
  ) {
    throw new Error('manifest declaredAuthorities must be sorted and unique');
  }
  if (
    !isPlainObject(manifest.toolchain) ||
    Object.keys(manifest.toolchain).length !== 1 ||
    typeof manifest.toolchain.node !== 'string' ||
    manifest.toolchain.node === ''
  ) {
    throw new Error('manifest toolchain must declare exactly one Node identity');
  }
}

function validateFreezeEntry(bundleId, entry) {
  if (!isPlainObject(entry)) throw new Error(`${bundleId} entry must be an object`);
  for (const key of Object.keys(entry)) {
    if (!ENTRY_KEYS.has(key)) throw new Error(`${bundleId} entry has unexpected field ${key}`);
  }
  if (!DIGEST_PATTERN.test(entry.manifestDigest ?? '')) {
    throw new Error(`${bundleId} entry has an invalid manifestDigest`);
  }
  if (!FREEZE_STATE_SET.has(entry.state)) {
    throw new Error(`${bundleId} entry has an invalid state`);
  }
  if (typeof entry.owner !== 'string' || entry.owner.trim() === '') {
    throw new Error(`${bundleId} entry requires an owner`);
  }
  if (!validTimestamp(entry.frozenAt)) throw new Error(`${bundleId} entry has invalid frozenAt`);
  if (
    !Array.isArray(entry.extraMembers) ||
    entry.extraMembers.some((member) => typeof member !== 'string')
  ) {
    throw new Error(`${bundleId} entry has invalid extraMembers`);
  }
  const normalizedExtraMembers = normalizeExtraMembers(entry.extraMembers);
  if (
    normalizedExtraMembers.length !== entry.extraMembers.length ||
    normalizedExtraMembers.some((member, index) => member !== entry.extraMembers[index])
  ) {
    throw new Error(`${bundleId} entry extraMembers must be canonical, sorted, and unique`);
  }
  if (entry.state === 'retired') {
    if (!validTimestamp(entry.retiredAt)) {
      throw new Error(`${bundleId} retired entry requires retiredAt`);
    }
  } else if (entry.retiredAt !== undefined) {
    throw new Error(`${bundleId} non-retired entry must not retain retiredAt`);
  }
  if (entry.supersedes !== undefined && !DIGEST_PATTERN.test(entry.supersedes)) {
    throw new Error(`${bundleId} entry has an invalid supersedes digest`);
  }
  validateManifest(entry.manifest, bundleId);
  if (digestManifest(entry.manifest) !== entry.manifestDigest) {
    throw new Error(`${bundleId} stored manifest does not match manifestDigest`);
  }
}

function validateFreezeStore(store) {
  if (
    !isPlainObject(store) ||
    store.version !== STORE_VERSION ||
    !isPlainObject(store.frozen) ||
    Object.keys(store).sort().join(',') !== 'frozen,version'
  ) {
    throw new Error(`expected version ${STORE_VERSION} with a frozen object`);
  }
  for (const [bundleId, entry] of Object.entries(store.frozen)) {
    validateFreezeEntry(bundleId, entry);
  }
  return store;
}

function emptyFreezeStore() {
  return { version: STORE_VERSION, frozen: {} };
}

export function freezeStorePath(repoRoot = process.cwd()) {
  return path.join(defaultAssuranceStateDirectory(repoRoot), 'frozen-contracts.json');
}

export function readFreezeStore({ repoRoot = process.cwd() } = {}) {
  const file = freezeStorePath(repoRoot);
  if (!fs.existsSync(file)) return emptyFreezeStore();
  try {
    return validateFreezeStore(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new FreezeStoreError(`${file} is corrupt: ${reason}`, { cause });
  }
}

function timestamp(now) {
  const instant = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(instant.getTime())) throw new TypeError('Freeze timestamp must be valid');
  return instant.toISOString();
}

function validOwner(owner) {
  if (typeof owner !== 'string' || owner.trim() === '') {
    throw new TypeError('Freeze owner must be a non-empty string');
  }
  return owner.trim();
}

function writeFreezeStore(repoRoot, store) {
  validateFreezeStore(store);
  writeJson(freezeStorePath(repoRoot), store);
}

function nextStore(store, bundleId, entry) {
  return {
    version: STORE_VERSION,
    frozen: {
      ...store.frozen,
      [bundleId]: entry,
    },
  };
}

export function freezeBundle({
  repoRoot = process.cwd(),
  bundleId,
  owner,
  extraMembers = [],
  refreeze = false,
  now = new Date(),
}) {
  if (typeof refreeze !== 'boolean') throw new TypeError('refreeze must be a boolean');
  const resolvedRepoRoot = path.resolve(repoRoot);
  const normalizedOwner = validOwner(owner);
  const normalizedExtraMembers = normalizeExtraMembers(extraMembers);
  const computed = computeContractManifest({
    repoRoot: resolvedRepoRoot,
    bundleId,
    extraMembers: normalizedExtraMembers,
  });
  const store = readFreezeStore({ repoRoot: resolvedRepoRoot });
  const existing = store.frozen[computed.manifest.bundleId];

  if (existing?.state === 'active' && existing.manifestDigest === computed.manifestDigest) {
    return {
      changed: false,
      entry: existing,
      manifest: existing.manifest,
      storePath: freezeStorePath(resolvedRepoRoot),
    };
  }
  if (existing && existing.manifestDigest !== computed.manifestDigest && refreeze !== true) {
    throw new FreezeConflictError(
      `Contract bundle "${computed.manifest.bundleId}" changed from ${existing.manifestDigest} to ${computed.manifestDigest}; pass refreeze:true for an explicit re-freeze`,
    );
  }

  const frozenAt = timestamp(now);
  const proposedEntry = {
    extraMembers: normalizedExtraMembers,
    frozenAt,
    manifest: computed.manifest,
    manifestDigest: computed.manifestDigest,
    owner: normalizedOwner,
    state: 'proposed',
    ...(existing && existing.manifestDigest !== computed.manifestDigest
      ? { supersedes: existing.manifestDigest }
      : {}),
  };
  writeFreezeStore(resolvedRepoRoot, nextStore(store, computed.manifest.bundleId, proposedEntry));

  const activeEntry = { ...proposedEntry, state: 'active' };
  writeFreezeStore(resolvedRepoRoot, nextStore(store, computed.manifest.bundleId, activeEntry));
  return {
    changed: true,
    entry: activeEntry,
    manifest: computed.manifest,
    storePath: freezeStorePath(resolvedRepoRoot),
  };
}

function manifestDrift(storedManifest, currentManifest) {
  const storedMembers = new Map(storedManifest.members.map((member) => [member.path, member]));
  const currentMembers = new Map(currentManifest.members.map((member) => [member.path, member]));
  const paths = [...new Set([...storedMembers.keys(), ...currentMembers.keys()])].sort(
    compareCodePoints,
  );
  return paths.filter(
    (memberPath) =>
      canonicalJson(storedMembers.get(memberPath)) !==
      canonicalJson(currentMembers.get(memberPath)),
  );
}

export function isFreezeValid({ repoRoot = process.cwd(), bundleId }) {
  const resolvedRepoRoot = path.resolve(repoRoot);
  const context = bundleContext(resolvedRepoRoot, bundleId);
  const store = readFreezeStore({ repoRoot: resolvedRepoRoot });
  const entry = store.frozen[context.bundleId];
  if (!entry) return { valid: null, reason: 'not-frozen' };
  if (entry.state !== 'active') {
    return {
      valid: null,
      reason: entry.state,
      state: entry.state,
      storedDigest: entry.manifestDigest,
    };
  }

  const current = computeContractManifest({
    repoRoot: resolvedRepoRoot,
    bundleId: context.bundleId,
    extraMembers: entry.extraMembers,
  });
  return {
    valid: current.manifestDigest === entry.manifestDigest,
    state: entry.state,
    storedDigest: entry.manifestDigest,
    currentDigest: current.manifestDigest,
    drift: manifestDrift(entry.manifest, current.manifest),
  };
}

export function retireBundle({ repoRoot = process.cwd(), bundleId, owner, now = new Date() }) {
  const resolvedRepoRoot = path.resolve(repoRoot);
  const context = bundleContext(resolvedRepoRoot, bundleId);
  const normalizedOwner = validOwner(owner);
  const store = readFreezeStore({ repoRoot: resolvedRepoRoot });
  const existing = store.frozen[context.bundleId];
  if (!existing) return { changed: false, reason: 'not-frozen' };
  if (existing.state === 'retired') {
    return { changed: false, entry: existing, storePath: freezeStorePath(resolvedRepoRoot) };
  }

  const retiredEntry = {
    ...existing,
    owner: normalizedOwner,
    state: 'retired',
    retiredAt: timestamp(now),
  };
  writeFreezeStore(resolvedRepoRoot, nextStore(store, context.bundleId, retiredEntry));
  return {
    changed: true,
    entry: retiredEntry,
    storePath: freezeStorePath(resolvedRepoRoot),
  };
}
