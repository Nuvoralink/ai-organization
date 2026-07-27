import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
export const AUTHORITY_DOMAIN_REGISTRY_RELATIVE_PATH = Object.freeze([
  '.ai-organization',
  'policies',
  'authority-domains.v1.json',
]);

export function authorityDomainRegistryPath(repoRoot = REPOSITORY_ROOT) {
  return path.join(repoRoot, ...AUTHORITY_DOMAIN_REGISTRY_RELATIVE_PATH);
}

const AUTHORITY_DOMAIN_REGISTRY_PATH = authorityDomainRegistryPath();

export const SINGLETON_RESOURCE_PATHS = Object.freeze({
  'singleton:root-lockfile': 'package-lock.json',
  'singleton:prisma-schema': 'backend/prisma/schema.prisma',
  'singleton:migration-namespace': 'backend/prisma/migrations/',
  'singleton:gate-registry': 'scripts/run-gates-all.mjs',
});

export const SINGLETON_RESOURCE_KEYS = Object.freeze(Object.keys(SINGLETON_RESOURCE_PATHS));

function authorityRegistryWarning(registryPath, error) {
  const reason = error instanceof Error ? error.message : String(error);
  return `[coordination] authority-domain registry unavailable or corrupt at ${registryPath}; semantic folding disabled: ${reason}`;
}

function emitAuthorityRegistryWarning(warn, registryPath, error) {
  try {
    warn(authorityRegistryWarning(registryPath, error));
  } catch {
    // Diagnostics must not turn absent project configuration into a dispatch failure.
  }
}

function validAuthorityName(value) {
  return (
    typeof value === 'string' &&
    value !== '' &&
    !value.includes('/') &&
    !value.includes('\\') &&
    value === value.toLowerCase()
  );
}

function validOwnsPattern(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  const normalized = value.trim().replaceAll('\\', '/');
  return (
    normalized === value &&
    !normalized.startsWith('/') &&
    !normalized.split('/').includes('..') &&
    !path.posix.isAbsolute(normalized) &&
    !path.win32.isAbsolute(normalized)
  );
}

function freezeAuthorityDomains(domains) {
  const frozen = {};
  for (const [domain, definition] of Object.entries(domains)) {
    if (!validAuthorityName(domain)) {
      throw new Error(`Invalid authority-domain name: ${domain}`);
    }
    if (
      definition === null ||
      typeof definition !== 'object' ||
      Array.isArray(definition) ||
      !Array.isArray(definition.owns) ||
      definition.owns.length < 2 ||
      !definition.owns.every(validOwnsPattern) ||
      typeof definition.note !== 'string' ||
      definition.note.trim() === ''
    ) {
      throw new Error(`Invalid authority-domain definition: ${domain}`);
    }
    frozen[domain] = Object.freeze({
      owns: Object.freeze([...new Set(definition.owns)]),
      note: definition.note.trim(),
    });
  }
  return Object.freeze(frozen);
}

export function loadAuthorityDomains(
  registryPath = AUTHORITY_DOMAIN_REGISTRY_PATH,
  { warn = console.warn } = {},
) {
  if (typeof warn !== 'function') throw new TypeError('Authority registry warn must be a function');
  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    if (
      registry === null ||
      typeof registry !== 'object' ||
      Array.isArray(registry) ||
      registry.version !== 1 ||
      registry.domains === null ||
      typeof registry.domains !== 'object' ||
      Array.isArray(registry.domains)
    ) {
      throw new Error('Expected version 1 with a domains object');
    }
    return freezeAuthorityDomains(registry.domains);
  } catch (error) {
    emitAuthorityRegistryWarning(warn, registryPath, error);
    return Object.freeze({});
  }
}

export const AUTHORITY_DOMAINS = loadAuthorityDomains();

export const RESOURCE_CONFIG = Object.freeze({
  singletonKeys: SINGLETON_RESOURCE_KEYS,
  singletonPaths: SINGLETON_RESOURCE_PATHS,
  authorityDomains: AUTHORITY_DOMAINS,
});

// The registry path remains an ordinary claim. Comparing immutable old registry data with a
// proposed edit via CAS belongs to a later registry-integrity slice (ARC-010).
