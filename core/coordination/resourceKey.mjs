import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function gitOutput(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function platformFold(value, { fold = process.platform === 'win32' } = {}) {
  if (typeof fold !== 'boolean') {
    throw new TypeError('Resource case-fold option must be a boolean');
  }
  return fold ? value.toLowerCase() : value;
}

function realGitCommonDirectory(cwd) {
  const commonDirectory = gitOutput(
    ['rev-parse', '--path-format=absolute', '--git-common-dir'],
    cwd,
  );
  return platformFold(fs.realpathSync.native(path.resolve(commonDirectory)));
}

function isOutside(base, candidate) {
  const relative = path.relative(base, candidate);
  return relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

function nearestExistingAncestor(candidate) {
  let current = path.resolve(candidate);
  const suffix = [];

  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(`Resource has no existing ancestor: ${candidate}`);
    }
    suffix.unshift(path.basename(current));
    current = parent;
  }

  return { ancestor: current, suffix };
}

function worktreeRootFor(candidate, expectedCommonDirectory) {
  const { ancestor } = nearestExistingAncestor(candidate);
  const gitCwd = fs.statSync(ancestor).isDirectory() ? ancestor : path.dirname(ancestor);
  let root;
  try {
    root = path.resolve(gitOutput(['rev-parse', '--show-toplevel'], gitCwd));
  } catch (cause) {
    throw new Error(`Resource is not inside a Git worktree: ${candidate}`, { cause });
  }

  if (realGitCommonDirectory(root) !== expectedCommonDirectory) {
    throw new Error(`Resource belongs to a different Git repository: ${candidate}`);
  }
  return root;
}

function normalizeLogicalKey(value, trailingDirectory, options = {}) {
  let normalized = value.replaceAll('\\', '/').replace(/\/+/gu, '/');
  while (normalized.startsWith('./')) normalized = normalized.slice(2);
  if (normalized === '.') normalized = '';
  normalized = platformFold(normalized, options);
  if (trailingDirectory && normalized && !normalized.endsWith('/')) normalized += '/';
  return normalized;
}

function directoryContains(directoryKey, candidateKey) {
  const prefix = directoryKey.endsWith('/') ? directoryKey : `${directoryKey}/`;
  return candidateKey === prefix.slice(0, -1) || candidateKey.startsWith(prefix);
}

function configuredSingletonKeys(config) {
  if (config.singletonKeys === undefined) return new Set();
  if (
    !Array.isArray(config.singletonKeys) ||
    config.singletonKeys.some(
      (key) =>
        typeof key !== 'string' ||
        !key.startsWith('singleton:') ||
        key.length === 'singleton:'.length ||
        key.includes('/') ||
        key.includes('\\'),
    )
  ) {
    throw new TypeError('singletonKeys must be an array of singleton resource keys');
  }
  const keys = new Set(config.singletonKeys);
  if (keys.size !== config.singletonKeys.length) {
    throw new Error('singletonKeys must not contain duplicates');
  }
  return keys;
}

function foldConfiguredSingleton(key, config) {
  if (config.singletonPaths === undefined) return key;
  if (
    config.singletonPaths === null ||
    typeof config.singletonPaths !== 'object' ||
    Array.isArray(config.singletonPaths)
  ) {
    throw new TypeError('singletonPaths must be a singleton-key to repository-path map');
  }

  const singletonKeys = configuredSingletonKeys(config);
  const matches = [];
  for (const [singletonKey, configuredPath] of Object.entries(config.singletonPaths)) {
    if (!singletonKeys.has(singletonKey)) {
      throw new Error(`Unknown configured singleton resource key: ${singletonKey}`);
    }
    if (typeof configuredPath !== 'string' || configuredPath.trim() === '') {
      throw new TypeError(`Configured singleton path must be non-empty: ${singletonKey}`);
    }
    const rawConfiguredPath = configuredPath.trim();
    const trailingDirectory = /[\\/]$/u.test(rawConfiguredPath);
    const normalizedPath = normalizeLogicalKey(rawConfiguredPath, trailingDirectory, config);
    if (
      !normalizedPath ||
      normalizedPath.includes('*') ||
      normalizedPath.split('/').includes('..') ||
      path.posix.isAbsolute(normalizedPath) ||
      path.win32.isAbsolute(normalizedPath)
    ) {
      throw new Error(
        `Configured singleton path must be a repository-relative literal: ${singletonKey}`,
      );
    }
    if (
      (trailingDirectory && directoryContains(normalizedPath, key)) ||
      (!trailingDirectory && normalizedPath === key)
    ) {
      matches.push(singletonKey);
    }
  }
  if (matches.length > 1) {
    throw new Error(`Resource matches multiple configured singleton paths: ${key}`);
  }
  return matches[0] ?? key;
}

export function repoId(cwd) {
  return crypto.createHash('sha256').update(realGitCommonDirectory(cwd)).digest('hex');
}

function canonicalResourceDetails(repoRoot, rawPathOrPattern, config = {}) {
  if (typeof rawPathOrPattern !== 'string' || rawPathOrPattern.trim() === '') {
    throw new TypeError('Resource path or pattern must be a non-empty string');
  }
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('Resource config must be an object');
  }

  const raw = rawPathOrPattern.trim();
  if (raw.startsWith('singleton:')) {
    if (!configuredSingletonKeys(config).has(raw)) {
      throw new Error(`Unknown singleton resource key: ${raw}`);
    }
    return { key: raw, pathKey: null };
  }
  if (raw.startsWith('authority:')) {
    const authorityName = raw.slice('authority:'.length).trim();
    if (!authorityName || authorityName.includes('/') || authorityName.includes('\\')) {
      throw new Error(`Invalid authority-domain resource key: ${raw}`);
    }
    return { key: `authority:${platformFold(authorityName, config)}`, pathKey: null };
  }

  const trailingDirectory = /[\\/]$/u.test(raw);
  const nativeInput = raw.replaceAll('/', path.sep).replaceAll('\\', path.sep);
  const requestedFromRepoRoot = path.isAbsolute(nativeInput)
    ? path.resolve(nativeInput)
    : path.resolve(repoRoot, nativeInput);
  const expectedCommonDirectory = realGitCommonDirectory(repoRoot);
  const repoWorktreeRoot = path.resolve(gitOutput(['rev-parse', '--show-toplevel'], repoRoot));
  const sourceWorktreeRoot =
    path.isAbsolute(nativeInput) && isOutside(repoWorktreeRoot, requestedFromRepoRoot)
      ? worktreeRootFor(requestedFromRepoRoot, expectedCommonDirectory)
      : repoWorktreeRoot;
  const lexicalRelative = path.relative(sourceWorktreeRoot, requestedFromRepoRoot);

  if (isOutside(sourceWorktreeRoot, requestedFromRepoRoot)) {
    throw new Error(`Resource escapes its Git worktree: ${rawPathOrPattern}`);
  }

  const sourceRootReal = fs.realpathSync.native(sourceWorktreeRoot);
  const { ancestor, suffix } = nearestExistingAncestor(requestedFromRepoRoot);
  const ancestorReal = fs.realpathSync.native(ancestor);
  const resolvedCandidate = path.resolve(ancestorReal, ...suffix);
  if (isOutside(sourceRootReal, resolvedCandidate)) {
    throw new Error(`Resource resolves outside its Git worktree: ${rawPathOrPattern}`);
  }

  const key = normalizeLogicalKey(lexicalRelative, trailingDirectory, config);
  if (!key) throw new Error('The repository root itself is not a claimable resource');
  return { key: foldConfiguredSingleton(key, config), pathKey: key };
}

/**
 * Convert a worktree-local path or glob into one repository-relative logical resource key.
 * Realpaths are used only for containment proof; the returned identity remains logical.
 */
export function canonicalizeResource(repoRoot, rawPathOrPattern, config = {}) {
  return canonicalResourceDetails(repoRoot, rawPathOrPattern, config).key;
}

/**
 * Return every configured authority-domain key whose owns patterns can select the canonical path.
 */
export function authorityDomainsForPath(canonicalPath, authorityDomains = {}, options = {}) {
  if (typeof canonicalPath !== 'string' || canonicalPath === '') {
    throw new TypeError('Canonical authority path must be a non-empty string');
  }
  if (
    authorityDomains === null ||
    typeof authorityDomains !== 'object' ||
    Array.isArray(authorityDomains)
  ) {
    throw new TypeError('authorityDomains must be an authority-name to definition map');
  }
  if (canonicalPath.startsWith('singleton:') || canonicalPath.startsWith('authority:')) return [];

  const pathPattern = normalizeLogicalKey(canonicalPath, canonicalPath.endsWith('/'), options);
  const candidatePattern = pathPattern.endsWith('/') ? `${pathPattern}**` : pathPattern;
  const matches = [];
  for (const [domain, definition] of Object.entries(authorityDomains).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    if (!definition || typeof definition !== 'object' || !Array.isArray(definition.owns)) {
      throw new TypeError(`Invalid authority-domain definition: ${domain}`);
    }
    const ownsPath = definition.owns.some((ownsPattern) => {
      if (typeof ownsPattern !== 'string' || ownsPattern === '') {
        throw new TypeError(`Authority-domain owns pattern must be non-empty: ${domain}`);
      }
      const trailingDirectory = /[\\/]$/u.test(ownsPattern);
      const normalizedOwns = normalizeLogicalKey(ownsPattern, trailingDirectory, options);
      const authorityPattern = normalizedOwns.endsWith('/')
        ? `${normalizedOwns}**`
        : normalizedOwns;
      return globsCanIntersect(candidatePattern, authorityPattern, options);
    });
    if (ownsPath) matches.push(`authority:${platformFold(domain, options)}`);
  }
  return matches;
}

/**
 * Expand one declared path into its canonical path/singleton plus configured semantic authorities.
 */
export function expandResourceClaims(repoRoot, rawPathOrPattern, config = {}) {
  const { key, pathKey } = canonicalResourceDetails(repoRoot, rawPathOrPattern, config);
  const authorityKeys =
    pathKey === null ? [] : authorityDomainsForPath(pathKey, config.authorityDomains ?? {}, config);
  return [...new Set([key, ...authorityKeys])];
}

export function resourceKind(resourceKey) {
  if (resourceKey.startsWith('singleton:')) {
    if (
      resourceKey.length === 'singleton:'.length ||
      resourceKey.includes('/') ||
      resourceKey.includes('\\')
    ) {
      throw new Error(`Invalid singleton resource key: ${resourceKey}`);
    }
    return 'singleton';
  }
  if (resourceKey.startsWith('authority:')) {
    if (resourceKey.length === 'authority:'.length) {
      throw new Error('Authority-domain resource key requires a name');
    }
    return 'authority-domain';
  }
  if (resourceKey.endsWith('/')) return 'dir';
  if (resourceKey.includes('*')) return 'glob';
  return 'path';
}

function normalizedResource(resource) {
  const key = typeof resource === 'string' ? resource : resource?.key;
  if (typeof key !== 'string' || key === '') {
    throw new TypeError('Resource must be a key string or an object with a non-empty key');
  }
  const normalizedKey =
    key.startsWith('singleton:') || key.startsWith('authority:')
      ? platformFold(key)
      : normalizeLogicalKey(key, key.endsWith('/'));
  const inferredKind = resourceKind(normalizedKey);
  const declaredKind = typeof resource === 'object' ? resource.kind : undefined;
  if (declaredKind && declaredKind !== inferredKind) {
    throw new Error(
      `Resource kind ${declaredKind} does not match inferred kind ${inferredKind}: ${normalizedKey}`,
    );
  }
  return { key: normalizedKey, kind: inferredKind };
}

const GLOB_INTERSECTION_STATE_LIMIT = 4_096;

function addUnseenState(queue, seen, leftIndex, rightIndex) {
  const identity = `${leftIndex}:${rightIndex}`;
  if (seen.has(identity)) return;
  seen.add(identity);
  queue.push([leftIndex, rightIndex]);
}

function segmentGlobsCanIntersect(leftSegment, rightSegment) {
  const stateCount = (leftSegment.length + 1) * (rightSegment.length + 1);
  if (stateCount > GLOB_INTERSECTION_STATE_LIMIT) return true;

  const queue = [[0, 0]];
  const seen = new Set(['0:0']);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [leftIndex, rightIndex] = queue[cursor];
    if (leftIndex === leftSegment.length && rightIndex === rightSegment.length) return true;

    const leftToken = leftSegment[leftIndex];
    const rightToken = rightSegment[rightIndex];
    if (leftToken === '*') {
      addUnseenState(queue, seen, leftIndex + 1, rightIndex);
    }
    if (rightToken === '*') {
      addUnseenState(queue, seen, leftIndex, rightIndex + 1);
    }
    if (leftIndex >= leftSegment.length || rightIndex >= rightSegment.length) continue;

    if (leftToken === '*' && rightToken !== '*') {
      addUnseenState(queue, seen, leftIndex, rightIndex + 1);
    } else if (rightToken === '*' && leftToken !== '*') {
      addUnseenState(queue, seen, leftIndex + 1, rightIndex);
    } else if (leftToken !== '*' && rightToken !== '*' && leftToken === rightToken) {
      addUnseenState(queue, seen, leftIndex + 1, rightIndex + 1);
    }
  }
  return false;
}

function globSegments(pattern, options = {}) {
  const normalized = normalizeLogicalKey(pattern, false, options);
  const segments = normalized.split('/');
  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        segment === '' ||
        segment === '.' ||
        segment === '..' ||
        (segment.includes('**') && segment !== '**'),
    )
  ) {
    return null;
  }
  return segments;
}

/**
 * Decide whether two repository-relative glob patterns can select one concrete path.
 * Unsupported/oversized shapes conservatively overlap so coordination cannot miss a collision.
 */
export function globsCanIntersect(leftPattern, rightPattern, options = {}) {
  const leftSegments = globSegments(leftPattern, options);
  const rightSegments = globSegments(rightPattern, options);
  if (!leftSegments || !rightSegments) return true;
  const stateCount = (leftSegments.length + 1) * (rightSegments.length + 1);
  if (stateCount > GLOB_INTERSECTION_STATE_LIMIT) return true;

  const queue = [[0, 0]];
  const seen = new Set(['0:0']);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [leftIndex, rightIndex] = queue[cursor];
    if (leftIndex === leftSegments.length && rightIndex === rightSegments.length) return true;

    const leftSegment = leftSegments[leftIndex];
    const rightSegment = rightSegments[rightIndex];
    if (leftSegment === '**') {
      addUnseenState(queue, seen, leftIndex + 1, rightIndex);
    }
    if (rightSegment === '**') {
      addUnseenState(queue, seen, leftIndex, rightIndex + 1);
    }
    if (leftIndex >= leftSegments.length || rightIndex >= rightSegments.length) continue;

    if (leftSegment === '**' && rightSegment !== '**') {
      addUnseenState(queue, seen, leftIndex, rightIndex + 1);
    } else if (rightSegment === '**' && leftSegment !== '**') {
      addUnseenState(queue, seen, leftIndex + 1, rightIndex);
    } else if (
      leftSegment !== '**' &&
      rightSegment !== '**' &&
      segmentGlobsCanIntersect(leftSegment, rightSegment)
    ) {
      addUnseenState(queue, seen, leftIndex + 1, rightIndex + 1);
    }
  }
  return false;
}

function pairOverlaps(left, right) {
  if (left.key === right.key) return true;
  if (left.kind === 'singleton' || right.kind === 'singleton') return false;
  if (left.kind === 'authority-domain' || right.kind === 'authority-domain') return false;
  if (left.kind === 'dir' && directoryContains(left.key, right.key)) return true;
  if (right.kind === 'dir' && directoryContains(right.key, left.key)) return true;
  if (left.kind === 'glob' || right.kind === 'glob') {
    const leftPattern = left.kind === 'dir' ? `${left.key}**` : left.key;
    const rightPattern = right.kind === 'dir' ? `${right.key}**` : right.key;
    return globsCanIntersect(leftPattern, rightPattern);
  }
  return false;
}

/**
 * Return both the overlap decision and the exact left/right key pairs that caused it.
 */
export function resourcesOverlap(setA, setB) {
  const leftResources = (setA ?? []).map(normalizedResource);
  const rightResources = (setB ?? []).map(normalizedResource);
  const pairs = [];
  const seen = new Set();

  for (const left of leftResources) {
    for (const right of rightResources) {
      if (!pairOverlaps(left, right)) continue;
      const identity = `${left.key}\u0000${right.key}`;
      if (seen.has(identity)) continue;
      seen.add(identity);
      pairs.push({
        leftKey: left.key,
        leftKind: left.kind,
        rightKey: right.key,
        rightKind: right.kind,
      });
    }
  }

  return {
    overlap: pairs.length > 0,
    keys: [...new Set(pairs.map(({ leftKey }) => leftKey))],
    pairs,
  };
}
