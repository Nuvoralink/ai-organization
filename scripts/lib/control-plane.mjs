import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateJsonAgainstSchema, validateSchemaReferences } from '../../core/schema/validate-json-schema.mjs';
import { validateActionPolicySemantics } from '../../core/authority/assess-action.mjs';
import { validateProjectRoleExtensionSemantics } from '../../core/roles/agent-role-registry.mjs';

const TEXT_EXTENSIONS = new Set([
  '', '.md', '.txt', '.json', '.jsonl', '.ndjson', '.yaml', '.yml', '.toml', '.mjs', '.cjs', '.js', '.ts', '.tsx',
  '.jsx', '.py', '.ps1', '.sh', '.css', '.scss', '.html', '.xml', '.csv', '.toml', '.lock', '.template', '.mustache'
]);

const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:gh[opusr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/,
  /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["']?(?!\$\{|<|REDACTED|EXAMPLE|YOUR_|process\.env|Deno\.env|env\.|os\.environ|getenv\()[A-Za-z0-9_\-/.+=]{16,}/i
];
const PROJECT_OVERLAYS = Object.freeze(['auxara-dialer', 'coachai']);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function normalizeRelative(value) {
  return value.split(path.sep).join('/').replace(/^\.\//, '');
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function loadRoots(repoRoot, override = undefined) {
  if (override) return override;
  const localFile = path.join(repoRoot, 'registries', 'project-roots.local.json');
  const roots = fs.existsSync(localFile) ? readJson(localFile) : {};
  const home = process.env.HOME && fs.existsSync(process.env.HOME)
    ? process.env.HOME
    : process.env.USERPROFILE;
  if (home && !roots.HOME) roots.HOME = home;
  return roots;
}

export function resolveTokenPath(template, roots) {
  const match = /^\$\{([^}]+)\}(?:\/(.*))?$/.exec(template);
  invariant(match, `Path must start with a registered token: ${template}`);
  const [, token, suffix = ''] = match;
  const rootValue = roots[token];
  invariant(typeof rootValue === 'string' && rootValue.length > 0, `Unresolved path token: ${token}`);
  const root = path.resolve(rootValue);
  const resolved = path.resolve(root, ...suffix.split('/').filter(Boolean));
  invariant(isWithin(root, resolved), `Path escapes registered root ${token}: ${template}`);
  return resolved;
}

export function resolveSource(repoRoot, source) {
  invariant(!path.isAbsolute(source), `Canonical source must be repository-relative: ${source}`);
  const resolved = path.resolve(repoRoot, source);
  invariant(isWithin(path.resolve(repoRoot), resolved), `Canonical source escapes repository: ${source}`);
  return resolved;
}

function normalizedBytes(buffer, file) {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) return buffer;
  return Buffer.from(buffer.toString('utf8').replace(/\r\n/g, '\n'));
}

export function hashFile(file) {
  return crypto.createHash('sha256').update(normalizedBytes(fs.readFileSync(file), file)).digest('hex');
}

function hashRawBytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function hashRawFile(file) {
  return hashRawBytes(fs.readFileSync(file));
}

const REPOSITORY_META_FILES = new Set([
  '.gitattributes', '.gitignore', '.gitleaks.toml', '.gitleaksignore', 'AGENTS.md', 'CLAUDE.md',
  'README.md', 'control-plane.manifest.json', 'package-lock.json', 'package.json'
]);
const ORCHESTRATION_DEPENDENCY_EXTENSIONS = new Set(['.md', '.json', '.py', '.toml', '.lock', '.yaml', '.yml', '']);
const ORCHESTRATION_DEPENDENCY_EXACT_ASSETS = new Set([
  'dependencies/marketforge/Marketing Guide V3.pdf',
  'dependencies/visualforge/examples/fixtures/vf-find-025-wrapper-semantic-drift/app/sign-in/page.tsx',
]);

export function classifyTrackedScope(relativeInput) {
  const relative = normalizeRelative(relativeInput);
  const extension = path.extname(relative).toLowerCase();
  if (REPOSITORY_META_FILES.has(relative)) return 'repository-metadata';
  if (relative === 'registries/tracked-scope.v1.json') return 'scope-registry';
  if (relative.startsWith('.github/')) return 'github-orchestration';
  if (relative.startsWith('artifacts/')) return ['.md', '.pptx'].includes(extension) ? 'presentation-artifact' : undefined;
  if (relative.startsWith('docs/')) return extension === '.md' ? 'documentation' : undefined;
  if (relative.startsWith('overlays/')) {
    const parts = relative.split('/');
    const overlayRelative = parts.slice(2).join('/');
    const allowedRootFiles = new Set(['manifest.json', 'ownership.v1.json', 'profile.v1.json', 'exclusions.v1.json']);
    const allowedSubtrees = ['automations/', 'control-plane/', 'migrations/', 'project-files/'];
    const hasOrchestrationShape = parts.length >= 3 && (allowedRootFiles.has(overlayRelative) || allowedSubtrees.some((prefix) => overlayRelative.startsWith(prefix)));
    return hasOrchestrationShape && ['.md', '.mdc', '.json', '.mjs', '.js', '.yaml', '.yml', ''].includes(extension) ? 'project-orchestration-overlay' : undefined;
  }
  if (relative.startsWith('automations/instances/')) return ['.toml', '.md'].includes(extension) ? 'automation-instance' : undefined;
  if (relative.startsWith('automations/')) return extension === '.json' ? 'automation-specification' : undefined;
  if (relative.startsWith('policies/')) return extension === '.json' ? 'policy' : undefined;
  if (relative.startsWith('registries/')) return extension === '.json' ? 'registry' : undefined;
  if (relative.startsWith('schemas/')) return extension === '.json' ? 'schema' : undefined;
  if (relative.startsWith('scripts/')) return extension === '.mjs' ? 'control-plane-tooling' : undefined;
  if (relative.startsWith('tests/')) return extension === '.mjs' ? 'control-plane-test' : undefined;
  if (relative.startsWith('core/')) return ['.mjs', '.md'].includes(extension) ? 'shared-control-plane-runtime' : undefined;
  if (relative.startsWith('global/')) return ['.md', '.json', '.mjs', '.yaml', '.yml'].includes(extension) ? 'global-orchestration' : undefined;
  if (relative.startsWith('skills/')) return ['.md', '.json', '.mjs', '.js', '.ts', '.tsx', '.py', '.ps1', '.csv', '.yaml', '.yml', '.template'].includes(extension) ? 'reusable-skill' : undefined;
  if (relative.startsWith('skills-retired/')) return ['.md', '.json', '.mjs', '.js', '.ts', '.tsx', '.py', '.ps1', '.csv', '.yaml', '.yml', '.template'].includes(extension) ? 'retired-skill' : undefined;
  if (relative.startsWith('dependencies/')) {
    return ORCHESTRATION_DEPENDENCY_EXTENSIONS.has(extension) || ORCHESTRATION_DEPENDENCY_EXACT_ASSETS.has(relative)
      ? 'orchestration-dependency'
      : undefined;
  }
  return undefined;
}

function renderedBytes(file, roots, renderContentTokens = true) {
  const bytes = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext) || !renderContentTokens) return bytes;
  const rendered = bytes.toString('utf8').replace(
    /\$\{([^}|]+)(?:\|([a-z-]+(?:\+[a-z-]+)*))?\}/g,
    (match, token, style) => {
      const root = roots[token];
      if (typeof root !== 'string') return match;
      const transforms = style?.split('+') ?? [];
      if (transforms.some((transform) => !['forward-slash', 'backslash', 'lowercase-drive', 'uppercase-drive'].includes(transform))) return match;
      if (transforms.includes('forward-slash') && transforms.includes('backslash')) return match;
      let value = root;
      if (transforms.includes('forward-slash')) value = value.replaceAll('\\', '/');
      if (transforms.includes('backslash')) value = value.replaceAll('/', '\\');
      if (transforms.includes('lowercase-drive')) value = value.replace(/^([A-Z]):/u, (drive) => drive.toLowerCase());
      if (transforms.includes('uppercase-drive')) value = value.replace(/^([a-z]):/u, (drive) => drive.toUpperCase());
      return value;
    },
  );
  return Buffer.from(rendered);
}

function capturedBytes(file, roots, tokenizeRegisteredPathsOnCapture = false) {
  const bytes = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext) || !tokenizeRegisteredPathsOnCapture) return bytes;
  const replacements = [];
  for (const [token, root] of Object.entries(roots)) {
    if (typeof root !== 'string' || root.length === 0) continue;
    const separatorVariants = [
      { value: root, transform: undefined },
      { value: root.replaceAll('\\', '/'), transform: 'forward-slash' },
      { value: root.replaceAll('/', '\\'), transform: 'backslash' },
    ];
    for (const separator of separatorVariants) {
      const driveVariants = [
        { value: separator.value, transform: undefined },
        { value: separator.value.replace(/^([A-Z]):/u, (drive) => drive.toLowerCase()), transform: 'lowercase-drive' },
        { value: separator.value.replace(/^([a-z]):/u, (drive) => drive.toUpperCase()), transform: 'uppercase-drive' },
      ];
      for (const drive of driveVariants) {
        const style = [separator.transform, drive.transform].filter(Boolean).join('+') || undefined;
        replacements.push({ token, value: drive.value, style });
      }
    }
  }
  replacements.sort((left, right) =>
    right.value.length - left.value.length
    || Number(Boolean(left.style)) - Number(Boolean(right.style))
    || left.token.localeCompare(right.token));
  let content = bytes.toString('utf8');
  for (const { token, value, style } of replacements) {
    const modifier = style ? `|${style}` : '';
    content = content.replaceAll(value, `\${${token}${modifier}}`);
  }
  return Buffer.from(content);
}

function hashBytes(bytes, file) {
  return crypto.createHash('sha256').update(normalizedBytes(bytes, file)).digest('hex');
}

function renderedHash(file, roots, renderContentTokens = true) {
  return hashBytes(renderedBytes(file, roots, renderContentTokens), file);
}

function denyReason(relative, manifest, mapping, isDirectory = false) {
  const normalized = normalizeRelative(relative);
  const segments = normalized.toLowerCase().split('/');
  const base = segments.at(-1) ?? '';
  const deny = manifest.deny;
  if ((mapping.exclude ?? []).some((entry) => normalized === entry || normalized.startsWith(`${entry}/`))) return 'mapping exclusion';
  if (segments.some((segment) => deny.segments.map((x) => x.toLowerCase()).includes(segment))) return 'denied path segment';
  if (deny.filenames.map((x) => x.toLowerCase()).includes(base)) return 'denied filename';
  if (deny.prefixes.some((prefix) => base.startsWith(prefix.toLowerCase()))) return 'denied filename prefix';
  if (deny.extensions.map((x) => x.toLowerCase()).includes(path.extname(base).toLowerCase())) return 'denied extension';
  if (isDirectory) return undefined;
  if (mapping.allowedExtensions.length > 0 && !mapping.allowedExtensions.map((x) => x.toLowerCase()).includes(path.extname(base).toLowerCase())) return 'extension not allowlisted';
  return undefined;
}

function isGlobalDenyReason(reason) {
  return typeof reason === 'string' && reason.startsWith('denied ');
}

function isExactRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (value !== normalizeRelative(value) || path.isAbsolute(value) || path.win32.isAbsolute(value)) return false;
  if (/[\\:*?[\]{}]/u.test(value)) return false;
  const segments = value.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

function installedIgnoreErrors(mapping, manifest) {
  if (mapping.installedIgnore === undefined) return [];
  if (mapping.mode !== 'tree') return [`installedIgnore is valid only for tree mappings: ${mapping.id}`];
  if (!Array.isArray(mapping.installedIgnore)) return [`installedIgnore must be an array: ${mapping.id}`];
  const errors = [];
  const seen = new Set();
  for (const entry of mapping.installedIgnore) {
    if (!isExactRelativePath(entry)) {
      errors.push(`Invalid installedIgnore path for mapping: ${mapping.id}`);
      continue;
    }
    const normalized = normalizeRelative(entry);
    if (seen.has(normalized)) errors.push(`Duplicate installedIgnore path for mapping: ${mapping.id}/${normalized}`);
    seen.add(normalized);
    const reason = denyReason(normalized, manifest, { ...mapping, exclude: [] });
    if (!isGlobalDenyReason(reason)) errors.push(`installedIgnore path must match a global deny rule: ${mapping.id}/${normalized}`);
  }
  return errors;
}

const MAPPING_OWNERSHIPS = new Set(['canonical', 'captured', 'generated', 'external-state', 'reference']);

function mappingOwnershipErrors(mapping) {
  const errors = [];
  if (!MAPPING_OWNERSHIPS.has(mapping.ownership)) errors.push(`Unknown mapping ownership: ${String(mapping.ownership)}`);
  if (mapping.ownership !== 'captured' && (!Array.isArray(mapping.destinations) || mapping.destinations.length === 0)) {
    errors.push(`Ownership ${String(mapping.ownership)} requires at least one destination`);
  }
  return errors;
}

function installedIgnoreReason(relative, manifest, mapping, isDirectory = false) {
  if (mapping.mode !== 'tree' || !Array.isArray(mapping.installedIgnore)) return undefined;
  const normalized = normalizeRelative(relative);
  for (const entry of mapping.installedIgnore) {
    if (!isExactRelativePath(entry)) continue;
    const declaredReason = denyReason(entry, manifest, { ...mapping, exclude: [] });
    if (!isGlobalDenyReason(declaredReason)) continue;
    if (normalized !== entry && !normalized.startsWith(`${entry}/`)) continue;
    const reason = denyReason(normalized, manifest, { ...mapping, exclude: [] }, isDirectory);
    if (isGlobalDenyReason(reason)) return reason;
  }
  return undefined;
}

class PortableInventoryError extends Error {}

function inventoryFailure(message) {
  throw new PortableInventoryError(message);
}

function inspectRoot(root, allowRootLink, label = '.') {
  if (!fs.existsSync(root)) return root;
  const stat = fs.lstatSync(root);
  if (!stat.isSymbolicLink()) return root;
  if (!allowRootLink) inventoryFailure(`Root link/junction is not allowed: ${label}`);
  return fs.realpathSync(root);
}

function rootIsLink(root) {
  return fs.existsSync(root) && fs.lstatSync(root).isSymbolicLink();
}

function legacyLinkMatches(destinationRoot, captureRoot) {
  if (!rootIsLink(destinationRoot)) return false;
  if (path.resolve(destinationRoot).toLowerCase() === path.resolve(captureRoot).toLowerCase()) return false;
  return path.resolve(fs.realpathSync(destinationRoot)).toLowerCase() === path.resolve(fs.realpathSync(captureRoot)).toLowerCase();
}

function classifyInstalledLayout(mapping, roots, operation) {
  const entries = [];
  for (const destinationTemplate of mapping.destinations ?? []) {
    let destinationRoot;
    try { destinationRoot = resolveTokenPath(destinationTemplate, roots); }
    catch { throw new Error(`${operation} destination resolution failed: ${destinationTemplate}`); }
    if (!rootIsLink(destinationRoot)) {
      entries.push({ kind: 'physical', destinationTemplate, destinationRoot });
      continue;
    }
    let approved = false;
    try {
      const captureRoot = resolveTokenPath(mapping.captureFrom, roots);
      approved = mapping.allowInstalledRootLink && legacyLinkMatches(destinationRoot, captureRoot);
    } catch { approved = false; }
    invariant(approved, `${operation} refused unexpected installed link/junction: ${destinationTemplate}`);
    entries.push({ kind: 'junction', destinationTemplate, destinationRoot });
  }
  return {
    entries,
    physical: entries.filter((entry) => entry.kind === 'physical'),
    junctions: entries.filter((entry) => entry.kind === 'junction'),
  };
}

export function collectFiles(rootInput, manifest, mapping, options = {}) {
  const label = options.inventoryLabel ?? '.';
  try {
    if (!fs.existsSync(rootInput)) return new Map();
    const root = inspectRoot(rootInput, mapping.allowRootLink === true, label);
    const output = new Map();

    if (mapping.mode === 'file') {
      const stat = fs.lstatSync(root);
      if (!stat.isFile()) inventoryFailure(`Expected file mapping inventory: ${label}`);
      const relative = path.basename(rootInput);
      const reason = denyReason(relative, manifest, mapping);
      if (options.installedInventory && reason === 'mapping exclusion') return output;
      if (options.installedInventory && reason) {
        options.unsafeEntries?.push({ relative, reason });
        if (options.rejectUnsafe) inventoryFailure(`Managed tree contains ${reason}: ${relative}`);
        return output;
      }
      if (reason) inventoryFailure(`Unsafe mapped file: ${relative}`);
      output.set('', root);
      return output;
    }

    if (!fs.statSync(root).isDirectory()) inventoryFailure(`Expected tree mapping inventory: ${label}`);
    const visit = (directory, relativeBase = '') => {
      const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        const relative = normalizeRelative(path.join(relativeBase, entry.name));
        const absolute = path.join(directory, entry.name);
        const installedIgnore = options.installedInventory
          ? installedIgnoreReason(relative, manifest, mapping, entry.isDirectory())
          : undefined;
        if (installedIgnore) {
          options.skippedEntries?.push({ relative, reason: installedIgnore });
          continue;
        }
        const lstat = fs.lstatSync(absolute);
        if (lstat.isSymbolicLink()) {
          if (options.installedInventory) {
            options.unsafeEntries?.push({ relative, reason: 'link/junction' });
            if (options.rejectUnsafe) inventoryFailure(`Managed tree contains link/junction: ${relative}`);
            continue;
          }
          if (options.rejectDenied) inventoryFailure(`Canonical source contains link/junction: ${relative}`);
          inventoryFailure(`Nested link/junction traversal refused: ${relative}`);
        }
        const reason = denyReason(relative, manifest, mapping, lstat.isDirectory());
        if (reason) {
          if (options.installedInventory && reason !== 'mapping exclusion') options.unsafeEntries?.push({ relative, reason });
          if (options.rejectUnsafe && reason !== 'mapping exclusion') inventoryFailure(`Managed tree contains ${reason}: ${relative}`);
          if (options.rejectDenied && reason !== 'mapping exclusion') inventoryFailure(`Canonical source contains ${reason}: ${relative}`);
          continue;
        }
        if (lstat.isDirectory()) visit(absolute, relative);
        else if (lstat.isFile()) output.set(relative, absolute);
      }
    };
    visit(root);
    return output;
  } catch (error) {
    if (error instanceof PortableInventoryError) throw error;
    const scope = options.installedInventory ? 'Installed destination' : options.rejectDenied ? 'Canonical source' : 'Mapped';
    inventoryFailure(`${scope} inventory failed: ${label}`);
  }
}

function uint64Bytes(value) {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64BE(BigInt(value));
  return bytes;
}

function digestCollectedTree(files) {
  const entries = [...files.entries()]
    .map(([relative, file]) => [normalizeRelative(relative), file])
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
  const digest = crypto.createHash('sha256');
  digest.update(Buffer.from('nuvoralink-installed-tree-v1\0', 'utf8'));
  digest.update(uint64Bytes(entries.length));
  for (const [relative, file] of entries) {
    const relativeBytes = Buffer.from(relative, 'utf8');
    const rawBytes = fs.readFileSync(file);
    digest.update(uint64Bytes(relativeBytes.length));
    digest.update(relativeBytes);
    digest.update(uint64Bytes(rawBytes.length));
    digest.update(rawBytes);
  }
  return { sha256: digest.digest('hex'), fileCount: entries.length };
}

export function computeInstalledTreeDigest({ root, manifest, mapping, destinationTemplate = '.' }) {
  invariant(!rootIsLink(root), `Installed tree digest requires a physical destination: ${destinationTemplate}`);
  return digestCollectedTree(collectFiles(root, manifest, { ...mapping, allowRootLink: false }, {
    installedInventory: true,
    rejectUnsafe: true,
    inventoryLabel: destinationTemplate,
  }));
}

export function parseControlPlaneArgs(argv) {
  invariant(Array.isArray(argv), 'Control-plane arguments must be an array');
  const [command, ...args] = argv;
  const grammars = {
    validate: new Set(),
    check: new Set(['--mapping']),
    capture: new Set(['--dry-run', '--update-existing', '--mapping', '--file']),
    install: new Set(['--dry-run', '--adopt-existing', '--mapping', '--reconcile-installed']),
    digest: new Set(['--mapping']),
    inventory: new Set(),
    rollback: new Set(['--install-id']),
  };
  invariant(Object.hasOwn(grammars, command), `Unknown control-plane command: ${String(command)}`);
  const mappingIds = [];
  const fileSelectors = [];
  const reconciliations = new Map();
  let dryRun = false;
  let adoptExisting = false;
  let updateExisting = false;
  let installId;
  const seenBoolean = new Set();
  const consumeValue = (flag, index) => {
    const value = args[index + 1];
    invariant(typeof value === 'string' && value.length > 0 && !value.startsWith('--'), `Missing value for ${flag}`);
    return value;
  };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    invariant(grammars[command].has(flag), `Option ${String(flag)} is not valid for ${command}`);
    if (['--dry-run', '--adopt-existing', '--update-existing'].includes(flag)) {
      invariant(!seenBoolean.has(flag), `Duplicate option for ${command}: ${flag}`);
      seenBoolean.add(flag);
      if (flag === '--dry-run') dryRun = true;
      else if (flag === '--adopt-existing') adoptExisting = true;
      else updateExisting = true;
      continue;
    }
    const value = consumeValue(flag, index);
    index += 1;
    if (flag === '--mapping') {
      invariant(/^[a-z0-9][a-z0-9-]+$/u.test(value), `Invalid --mapping value: ${value}`);
      invariant(!mappingIds.includes(value), `Duplicate --mapping selection: ${value}`);
      mappingIds.push(value);
    } else if (flag === '--file') {
      invariant(!fileSelectors.includes(value), `Duplicate --file selector: ${value}`);
      fileSelectors.push(value);
    } else if (flag === '--install-id') {
      invariant(installId === undefined, 'Duplicate --install-id option');
      installId = value;
    } else if (flag === '--reconcile-installed') {
      const match = /^([a-z0-9][a-z0-9-]+):([a-f0-9]{64})$/u.exec(value);
      invariant(match, `Invalid --reconcile-installed value: ${value}`);
      const [, mappingId, expectedDigest] = match;
      invariant(!reconciliations.has(mappingId), `Duplicate --reconcile-installed mapping: ${mappingId}`);
      reconciliations.set(mappingId, expectedDigest);
    }
  }
  if (command === 'digest') invariant(mappingIds.length === 1 && args.length === 2, 'digest requires exactly one --mapping ID and accepts no other options');
  const reconcileInstalled = reconciliations.size > 0 ? reconciliations : undefined;
  if (reconcileInstalled) {
    invariant(!adoptExisting && !updateExisting && fileSelectors.length === 0 && installId === undefined,
      'Installed-tree reconciliation accepts only --mapping, --reconcile-installed, and optional --dry-run');
    invariant(mappingIds.length > 0, 'Installed-tree reconciliation requires explicit --mapping selections');
    const missing = mappingIds.filter((id) => !reconciliations.has(id));
    const unselected = [...reconciliations.keys()].filter((id) => !mappingIds.includes(id));
    invariant(missing.length === 0 && unselected.length === 0,
      `Reconciliation mappings must exactly match selected mappings; missing: ${missing.join(', ') || 'none'}; unselected: ${unselected.join(', ') || 'none'}`);
  }
  return {
    command,
    dryRun,
    adoptExisting,
    updateExisting,
    mappingIds: mappingIds.length > 0 ? mappingIds : undefined,
    fileSelectors: fileSelectors.length > 0 ? fileSelectors : undefined,
    reconcileInstalled,
    installId,
  };
}

export function runDigest({ manifest, roots, mappingIds }) {
  invariant(Array.isArray(mappingIds) && mappingIds.length === 1, 'digest requires exactly one explicit mapping selection');
  const [mapping] = selectedMappings(manifest, mappingIds, 'digest');
  const { physical } = classifyInstalledLayout(mapping, roots, 'Digest');
  invariant(physical.length === 1, `digest requires exactly one physical destination for ${mapping.id}; found ${physical.length}`);
  const [{ destinationTemplate, destinationRoot }] = physical;
  let digest;
  try { digest = computeInstalledTreeDigest({ root: destinationRoot, manifest, mapping, destinationTemplate }); }
  catch (error) {
    if (/^Managed tree contains /u.test(error.message)) throw error;
    throw new Error(`Digest could not inventory physical destination: ${destinationTemplate}`);
  }
  return { mapping: mapping.id, physicalDestination: destinationTemplate, sha256: digest.sha256, fileCount: digest.fileCount };
}

function secretFindingBytes(bytes, file) {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) return -1;
  const content = bytes.toString('utf8');
  return SECRET_PATTERNS.findIndex((pattern) => pattern.test(content));
}

function secretFinding(file) {
  return secretFindingBytes(fs.readFileSync(file), file);
}

function portablePathFindingBytes(bytes, file) {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) return false;
  const content = bytes.toString('utf8');
  return /\bC:[\\/](?:Users|dev)[\\/]/i.test(content);
}

function portablePathFinding(file) {
  return portablePathFindingBytes(fs.readFileSync(file), file);
}

export function validateManifest(manifest, repoRoot, roots) {
  const errors = [];
  const ids = new Set();
  const destinations = new Set();
  const destinationRoots = [];
  const physicalTargets = new Map();
  for (const mapping of manifest.mappings) {
    errors.push(...installedIgnoreErrors(mapping, manifest));
    errors.push(...mappingOwnershipErrors(mapping).map((message) => `${message}: ${mapping.id}`));
    if (mapping.tokenizeRegisteredPathsOnCapture && mapping.renderContentTokens === false) {
      errors.push(`Capture path tokenization requires rendered install parity: ${mapping.id}`);
    }
    if (!/^[a-z0-9][a-z0-9-]+$/.test(mapping.id ?? '')) errors.push(`Invalid mapping id: ${mapping.id}`);
    if (ids.has(mapping.id)) errors.push(`Duplicate mapping id: ${mapping.id}`);
    ids.add(mapping.id);
    try { resolveSource(repoRoot, mapping.source); } catch { errors.push(`Invalid source path for mapping: ${mapping.id}`); }
    for (const template of mapping.destinations ?? []) {
      try {
        const destination = resolveTokenPath(template, roots);
        const key = path.normalize(destination).toLowerCase();
        if (destinations.has(key)) errors.push(`Duplicate destination: ${template}`);
        for (const prior of destinationRoots) {
          const relativeToPrior = path.relative(prior.path, destination);
          const relativeToCurrent = path.relative(destination, prior.path);
          const overlaps = relativeToPrior === '' || (!relativeToPrior.startsWith('..') && !path.isAbsolute(relativeToPrior)) || (!relativeToCurrent.startsWith('..') && !path.isAbsolute(relativeToCurrent));
          if (overlaps) errors.push(`Overlapping destination roots: ${prior.template} <-> ${template}`);
        }
        destinationRoots.push({ template, path: destination });
        destinations.add(key);
        try {
          const sourceFiles = collectFiles(resolveSource(repoRoot, mapping.source), manifest, mapping, { rejectDenied: true, inventoryLabel: mapping.source });
          for (const relative of sourceFiles.keys()) {
            const target = mapping.mode === 'file' ? destination : path.join(destination, relative);
            const targetKey = path.normalize(target).toLowerCase();
            const prior = physicalTargets.get(targetKey);
            if (prior) errors.push(`Duplicate physical target: ${prior} <-> ${mapping.id}/${relative || '.'}`);
            else physicalTargets.set(targetKey, `${mapping.id}/${relative || '.'}`);
          }
        } catch (error) {
          errors.push(error instanceof PortableInventoryError ? error.message : `Canonical source inventory failed for mapping: ${mapping.id}`);
        }
      } catch { errors.push(`Invalid destination path for mapping: ${mapping.id}`); }
    }
    try { resolveTokenPath(mapping.captureFrom, roots); } catch { errors.push(`Invalid capture path for mapping: ${mapping.id}`); }
    try { resolveTokenPath(mapping.lock, roots); } catch { errors.push(`Invalid lock path for mapping: ${mapping.id}`); }
  }
  return errors;
}

export function validateCanonical({ repoRoot, manifest }) {
  const problems = [];
  const ids = new Set();
  const destinationTemplates = new Set();
  for (const mapping of manifest.mappings) {
    for (const message of installedIgnoreErrors(mapping, manifest)) problems.push({ type: 'manifest', mapping: mapping.id, message });
    for (const message of mappingOwnershipErrors(mapping)) problems.push({ type: 'manifest', mapping: mapping.id, message });
    if (mapping.tokenizeRegisteredPathsOnCapture && mapping.renderContentTokens === false) {
      problems.push({ type: 'manifest', mapping: mapping.id, message: 'Capture path tokenization requires rendered install parity' });
    }
    if (!/^[a-z0-9][a-z0-9-]+$/.test(mapping.id ?? '')) problems.push({ type: 'manifest', message: `Invalid mapping id: ${mapping.id}` });
    if (ids.has(mapping.id)) problems.push({ type: 'manifest', message: `Duplicate mapping id: ${mapping.id}` });
    ids.add(mapping.id);
    let sourceRoot;
    try { sourceRoot = resolveSource(repoRoot, mapping.source); }
    catch { problems.push({ type: 'manifest', mapping: mapping.id, message: 'Canonical source resolution failed' }); continue; }
    for (const template of [...(mapping.destinations ?? []), mapping.captureFrom, mapping.lock]) {
      if (!/^\$\{[^}]+\}(?:\/.*)?$/.test(template ?? '')) problems.push({ type: 'manifest', mapping: mapping.id, message: 'Path must start with a registered token' });
    }
    for (const template of mapping.destinations ?? []) {
      if (destinationTemplates.has(template)) problems.push({ type: 'manifest', message: `Duplicate destination template: ${template}` });
      destinationTemplates.add(template);
    }
    let sourceFiles;
    try { sourceFiles = collectFiles(sourceRoot, manifest, mapping, { rejectDenied: true, inventoryLabel: mapping.source }); }
    catch (error) { problems.push({ type: 'source', mapping: mapping.id, message: error.message }); continue; }
    if (sourceFiles.size === 0) problems.push({ type: 'empty-source', mapping: mapping.id });
    for (const [relative, source] of sourceFiles) {
      const secretIndex = secretFinding(source);
      if (secretIndex >= 0) problems.push({ type: 'secret-shaped-content', mapping: mapping.id, relative, pattern: secretIndex + 1 });
      if (portablePathFinding(source)) problems.push({ type: 'absolute-path', mapping: mapping.id, relative });
    }
  }
  const tracked = spawnSync('git', ['ls-files', '-z'], { cwd: repoRoot, encoding: 'utf8' });
  if (tracked.status === 0 && !tracked.error) {
    const scopeRegistryPath = path.join(repoRoot, 'registries', 'tracked-scope.v1.json');
    let scopeEntries = [];
    try { scopeEntries = JSON.parse(fs.readFileSync(scopeRegistryPath, 'utf8')).files ?? []; }
    catch { problems.push({ type: 'tracked-scope-registry', message: 'Missing or invalid tracked scope registry' }); }
    const scopeByPath = new Map();
    for (const entry of scopeEntries) {
      const normalized = normalizeRelative(entry?.path ?? '');
      if (!normalized || scopeByPath.has(normalized)) problems.push({ type: 'tracked-scope-registry', message: `Duplicate or invalid tracked scope entry: ${normalized || '<missing>'}` });
      else scopeByPath.set(normalized, entry.class);
    }
    const boundaryMapping = { allowedExtensions: [], exclude: [] };
    const trackedPaths = tracked.stdout.split('\0').filter(Boolean).map(normalizeRelative);
    const trackedSet = new Set(trackedPaths);
    for (const normalized of trackedPaths) {
      const relative = normalized;
      const reason = denyReason(normalized, manifest, boundaryMapping);
      if (reason) problems.push({ type: 'forbidden-tracked-path', relative, reason });
      const expectedClass = classifyTrackedScope(normalized);
      if (!expectedClass) problems.push({ type: 'unsupported-tracked-scope-path', relative });
      else if (!scopeByPath.has(normalized)) problems.push({ type: 'unclassified-tracked-path', relative });
      else if (scopeByPath.get(normalized) !== expectedClass) problems.push({ type: 'tracked-scope-class-mismatch', relative, expected: expectedClass, actual: scopeByPath.get(normalized) });
      else {
        const trackedFile = path.join(repoRoot, relative);
        if (fs.existsSync(trackedFile) && fs.statSync(trackedFile).isFile()) {
          const secretIndex = secretFinding(trackedFile);
          if (secretIndex >= 0) problems.push({ type: 'tracked-secret-shaped-content', relative, pattern: secretIndex + 1 });
          if (portablePathFinding(trackedFile)) problems.push({ type: 'tracked-absolute-path', relative });
        }
      }
    }
    for (const relative of scopeByPath.keys()) if (!trackedSet.has(relative)) problems.push({ type: 'stale-tracked-scope-entry', relative });
  }
  return problems;
}

function compareTrees(sourceFiles, destinationFiles, detectLocalOnly, roots, renderContentTokens = true) {
  const problems = [];
  for (const [relative, source] of sourceFiles) {
    const destination = destinationFiles.get(relative);
    if (!destination) problems.push({ type: 'missing', relative });
    else if (renderedHash(source, roots, renderContentTokens) !== hashFile(destination)) problems.push({ type: 'drift', relative });
  }
  if (detectLocalOnly) {
    for (const relative of destinationFiles.keys()) {
      if (!sourceFiles.has(relative)) problems.push({ type: 'local-only', relative });
    }
  }
  return problems;
}

function gitCommit(repoRoot) {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : 'uncommitted';
}

function lockKey(mapping, destinationTemplate, relative) {
  return `${mapping.id}:${destinationTemplate}:${relative}`;
}

function loadLock(lockPath) {
  if (!fs.existsSync(lockPath)) return { version: '1.0.0', files: {} };
  return readJson(lockPath);
}

function writeAtomic(file, bytes) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temp, bytes);
  fs.renameSync(temp, file);
}

function installId() {
  return `${new Date().toISOString().replace(/[:.]/gu, '-')}-${crypto.randomBytes(4).toString('hex')}`;
}

function snapshotDirectory(lockPath, id) {
  return path.join(path.dirname(lockPath), 'snapshots', id);
}

function restoreSnapshot(snapshot, directory) {
  for (const entry of [...snapshot.entries].reverse()) {
    if (entry.existed) writeAtomic(entry.target, fs.readFileSync(path.join(directory, entry.backup)));
    else if (fs.existsSync(entry.target)) fs.unlinkSync(entry.target);
  }
  if (snapshot.lockExisted) writeAtomic(snapshot.lockPath, Buffer.from(snapshot.lockBefore, 'base64'));
  else if (fs.existsSync(snapshot.lockPath)) fs.unlinkSync(snapshot.lockPath);
}

const CAPTURED_INSTALL_SKIP_OPERATION = 'skipped-by-mode';

function applyInstallTransaction({ operations, locks, repoRoot, failAfter = undefined }) {
  const writes = operations.filter((operation) =>
    !['retain-legacy-link', 'refresh-lock', CAPTURED_INSTALL_SKIP_OPERATION].includes(operation.type));
  const refreshesLockOnly = operations.some((operation) => operation.type === 'refresh-lock');
  if (writes.length === 0 && !refreshesLockOnly && [...locks.keys()].every((lockPath) => fs.existsSync(lockPath))) return undefined;
  const id = installId();
  const snapshots = new Map();
  for (const [lockPath] of locks) {
    const directory = snapshotDirectory(lockPath, id);
    fs.mkdirSync(directory, { recursive: true });
    snapshots.set(lockPath, {
      directory,
      data: {
        version: '1.0.0', id, status: 'prepared', sourceCommit: gitCommit(repoRoot), lockPath,
        lockExisted: fs.existsSync(lockPath), lockBefore: fs.existsSync(lockPath) ? fs.readFileSync(lockPath).toString('base64') : null,
        entries: []
      }
    });
  }
  for (const operation of writes) {
    const snapshot = snapshots.get(operation.lockPath);
    const existed = fs.existsSync(operation.target);
    const backup = `${crypto.createHash('sha256').update(operation.target.toLowerCase()).digest('hex')}.bin`;
    if (existed) fs.writeFileSync(path.join(snapshot.directory, backup), fs.readFileSync(operation.target));
    snapshot.data.entries.push({
      target: operation.target,
      targetLabel: `${operation.destinationTemplate}/${operation.relative || '.'}`,
      destinationTemplate: operation.destinationTemplate,
      relative: operation.relative,
      existed,
      backup: existed ? backup : null,
      postExists: operation.type !== 'retire',
      postHash: operation.type === 'retire' ? null : operation.sourceHash,
      postRawHash: operation.type === 'retire' ? null : operation.sourceRawHash
    });
  }
  for (const snapshot of snapshots.values()) writeAtomic(path.join(snapshot.directory, 'snapshot.json'), `${JSON.stringify(snapshot.data, null, 2)}\n`);

  let applied = 0;
  try {
    for (const operation of writes) {
      if (failAfter !== undefined && applied >= failAfter) throw new Error(`Injected install failure after ${applied} writes`);
      if (operation.type === 'retire') {
        fs.unlinkSync(operation.target);
        delete locks.get(operation.lockPath).files[operation.key];
      } else {
        writeAtomic(operation.target, operation.rendered);
        locks.get(operation.lockPath).files[operation.key] = {
          hash: operation.sourceHash,
          rawHash: operation.sourceRawHash,
          destination: operation.destinationTemplate,
          relative: operation.relative
        };
      }
      applied += 1;
    }
    for (const [lockPath, lock] of locks) {
      lock.sourceRepository = 'Nuvoralink/ai-organization-control-plane';
      lock.sourceCommit = gitCommit(repoRoot);
      lock.updatedAt = new Date().toISOString();
      lock.lastInstallId = id;
      writeAtomic(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
    }
    for (const snapshot of snapshots.values()) {
      snapshot.data.status = 'applied';
      snapshot.data.completedAt = new Date().toISOString();
      writeAtomic(path.join(snapshot.directory, 'snapshot.json'), `${JSON.stringify(snapshot.data, null, 2)}\n`);
    }
    return id;
  } catch (error) {
    for (const snapshot of [...snapshots.values()].reverse()) {
      restoreSnapshot(snapshot.data, snapshot.directory);
      snapshot.data.status = 'rolled_back_after_failed_install';
      snapshot.data.failure = error.message;
      writeAtomic(path.join(snapshot.directory, 'snapshot.json'), `${JSON.stringify(snapshot.data, null, 2)}\n`);
    }
    throw error;
  }
}

export function runRollback({ manifest, roots, installId: requestedId = undefined }) {
  const lockTargets = [...new Map(manifest.mappings.map((mapping) => [resolveTokenPath(mapping.lock, roots), mapping.lock])).entries()]
    .map(([lockPath, lockLabel]) => ({ lockPath, lockLabel }));
  const selected = [];
  for (const { lockPath, lockLabel } of lockTargets) {
    const base = path.join(path.dirname(lockPath), 'snapshots');
    invariant(fs.existsSync(base), `No install snapshots found for ${lockLabel}`);
    const id = requestedId ?? fs.readdirSync(base).sort().at(-1);
    invariant(id, `No install snapshots found for ${lockLabel}`);
    const directory = path.join(base, id);
    const snapshotFile = path.join(directory, 'snapshot.json');
    invariant(fs.existsSync(snapshotFile), `Snapshot not found: ${id}`);
    const snapshot = readJson(snapshotFile);
    invariant(snapshot.status === 'applied', `Snapshot is not rollback-eligible: ${id}/${snapshot.status}`);
    for (const entry of snapshot.entries) {
      const targetLabel = entry.targetLabel ?? `${entry.destinationTemplate ?? '<managed-destination>'}/${entry.relative || '.'}`;
      if (entry.postExists === false) {
        invariant(!fs.existsSync(entry.target), `Rollback refused; retired target was recreated: ${targetLabel}`);
      } else {
        invariant(fs.existsSync(entry.target), `Rollback refused; installed target is missing: ${targetLabel}`);
        const targetMatchesSnapshot = entry.postRawHash
          ? hashRawFile(entry.target) === entry.postRawHash
          : hashFile(entry.target) === entry.postHash;
        invariant(targetMatchesSnapshot, `Rollback refused; installed target is dirty: ${targetLabel}`);
      }
    }
    selected.push({ directory, snapshotFile, snapshot });
  }
  for (const item of selected.reverse()) {
    restoreSnapshot(item.snapshot, item.directory);
    item.snapshot.status = 'rolled_back';
    item.snapshot.rolledBackAt = new Date().toISOString();
    writeAtomic(item.snapshotFile, `${JSON.stringify(item.snapshot, null, 2)}\n`);
  }
  return selected.map((item) => item.snapshot.id);
}

function selectedMappings(manifest, mappingIds, operation) {
  if (mappingIds === undefined) return manifest.mappings;
  const selectedIds = new Set(mappingIds);
  const knownIds = new Set(manifest.mappings.map((mapping) => mapping.id));
  const unknownIds = [...selectedIds].filter((id) => !knownIds.has(id));
  invariant(unknownIds.length === 0, `Unknown ${operation} mapping(s): ${unknownIds.join(', ')}`);
  return manifest.mappings.filter((mapping) => selectedIds.has(mapping.id));
}

function validatedReconciliation({ manifest, mappingIds, adoptExisting, reconcileInstalled }) {
  if (reconcileInstalled === undefined) return undefined;
  invariant(reconcileInstalled instanceof Map && reconcileInstalled.size > 0, 'Installed-tree reconciliation requires at least one mapping digest');
  invariant(!adoptExisting, '--reconcile-installed cannot be combined with --adopt-existing');
  invariant(Array.isArray(mappingIds) && mappingIds.length > 0, 'Installed-tree reconciliation requires explicit --mapping selections');
  const selectedIds = new Set(mappingIds);
  invariant(selectedIds.size === mappingIds.length, 'Duplicate --mapping selection is not allowed during installed-tree reconciliation');
  const knownIds = new Set(manifest.mappings.map((mapping) => mapping.id));
  const unknownIds = [...reconcileInstalled.keys()].filter((id) => !knownIds.has(id));
  invariant(unknownIds.length === 0, `Unknown reconciliation mapping(s): ${unknownIds.join(', ')}`);
  for (const [mappingId, expectedDigest] of reconcileInstalled) {
    invariant(/^[a-z0-9][a-z0-9-]+$/u.test(mappingId), `Invalid reconciliation mapping id: ${mappingId}`);
    invariant(/^[a-f0-9]{64}$/u.test(expectedDigest), `Invalid reviewed installed-tree digest for ${mappingId}`);
  }
  const missing = [...selectedIds].filter((id) => !reconcileInstalled.has(id));
  const unselected = [...reconcileInstalled.keys()].filter((id) => !selectedIds.has(id));
  invariant(missing.length === 0 && unselected.length === 0,
    `Reconciliation mappings must exactly match selected mappings; missing: ${missing.join(', ') || 'none'}; unselected: ${unselected.join(', ') || 'none'}`);
  return reconcileInstalled;
}

export function runCheck({
  repoRoot,
  manifest,
  roots,
  mappingIds = undefined,
  skippedInstalledEntries = undefined,
  informationalEntries = undefined,
}) {
  const canonicalProblems = validateCanonical({ repoRoot, manifest });
  const invalidSources = new Set(canonicalProblems
    .filter((problem) => problem.type === 'source' || problem.message === 'Canonical source resolution failed')
    .map((problem) => problem.mapping));
  const canonicalSourceMessages = new Set(canonicalProblems.filter((problem) => problem.type === 'source').map((problem) => problem.message));
  const canonicalManifestMessages = new Set(canonicalProblems.filter((problem) => problem.type === 'manifest').map((problem) => problem.message));
  const manifestProblems = validateManifest(manifest, repoRoot, roots)
    .filter((message) => !canonicalSourceMessages.has(message)
      && !canonicalManifestMessages.has(message)
      && ![...invalidSources].some((mappingId) => message === `Invalid source path for mapping: ${mappingId}`))
    .map((message) => ({ type: 'manifest', message }));
  const problems = [...canonicalProblems, ...manifestProblems];
  for (const mapping of selectedMappings(manifest, mappingIds, 'check')) {
    if (invalidSources.has(mapping.id)) continue;
    let sourceRoot;
    let sourceFiles;
    try {
      sourceRoot = resolveSource(repoRoot, mapping.source);
      sourceFiles = collectFiles(sourceRoot, manifest, mapping, { rejectDenied: true, inventoryLabel: mapping.source });
    }
    catch {
      problems.push({ type: 'source', mapping: mapping.id, message: 'Canonical source inventory failed' });
      continue;
    }
    if (mapping.ownership === 'captured') {
      let captureRoot;
      try { captureRoot = resolveTokenPath(mapping.captureFrom, roots); }
      catch {
        problems.push({ type: 'captured-source', mapping: mapping.id, message: 'Captured source resolution failed' });
        continue;
      }
      if (!fs.existsSync(captureRoot)) {
        problems.push({ type: 'missing-captured-source', mapping: mapping.id, source: mapping.captureFrom });
        continue;
      }
      let capturedFiles;
      try { capturedFiles = collectFiles(captureRoot, manifest, mapping, { inventoryLabel: mapping.captureFrom }); }
      catch (error) {
        problems.push({ type: 'captured-source', mapping: mapping.id, message: error.message });
        continue;
      }
      for (const difference of compareTrees(
        sourceFiles,
        capturedFiles,
        mapping.detectLocalOnly,
        roots,
        mapping.renderContentTokens !== false,
      )) {
        informationalEntries?.push({
          type: 'captured-backup-behind',
          mapping: mapping.id,
          source: mapping.captureFrom,
          difference: difference.type,
          relative: difference.relative,
        });
      }
      continue;
    }
    for (const destinationTemplate of mapping.destinations ?? []) {
      let destinationRoot;
      try {
        destinationRoot = resolveTokenPath(destinationTemplate, roots);
        if (rootIsLink(destinationRoot)) {
          const captureRoot = resolveTokenPath(mapping.captureFrom, roots);
          if (!mapping.allowInstalledRootLink || !legacyLinkMatches(destinationRoot, captureRoot)) {
            problems.push({ type: 'unexpected-link-target', mapping: mapping.id, destination: destinationTemplate });
            continue;
          }
        }
      } catch (error) {
        problems.push({ type: 'installed-path', mapping: mapping.id, destination: destinationTemplate, message: 'Installed destination resolution failed' });
        continue;
      }
      let destinationFiles;
      const unsafeEntries = [];
      const skippedEntries = [];
      try {
        destinationFiles = collectFiles(
          destinationRoot,
          manifest,
          { ...mapping, allowRootLink: mapping.allowInstalledRootLink === true },
          { installedInventory: true, unsafeEntries, skippedEntries, inventoryLabel: destinationTemplate },
        );
      }
      catch (error) {
        problems.push({ type: 'installed-path', mapping: mapping.id, destination: destinationTemplate, message: error.message });
        continue;
      }
      for (const unsafe of unsafeEntries) {
        problems.push({
          type: 'unsafe-installed-entry',
          mapping: mapping.id,
          destination: destinationTemplate,
          relative: unsafe.relative,
          reason: unsafe.reason,
        });
      }
      for (const skipped of skippedEntries) {
        skippedInstalledEntries?.push({
          type: 'skipped-installed-entry',
          mapping: mapping.id,
          destination: destinationTemplate,
          relative: skipped.relative,
          reason: skipped.reason,
        });
      }
      for (const problem of compareTrees(sourceFiles, destinationFiles, mapping.detectLocalOnly, roots, mapping.renderContentTokens !== false)) {
        problems.push({ ...problem, mapping: mapping.id, destination: destinationTemplate });
      }
    }
  }
  return problems;
}

export function runCapture({ repoRoot, manifest, roots, dryRun = false, updateExisting = false, mappingIds = undefined, fileSelectors = undefined }) {
  const errors = validateManifest(manifest, repoRoot, roots);
  invariant(errors.length === 0, `Manifest invalid:\n${errors.join('\n')}`);
  const selectedIds = mappingIds === undefined ? undefined : new Set(mappingIds);
  if (selectedIds) {
    const knownIds = new Set(manifest.mappings.map((mapping) => mapping.id));
    const unknownIds = [...selectedIds].filter((id) => !knownIds.has(id));
    invariant(unknownIds.length === 0, `Unknown capture mapping(s): ${unknownIds.join(', ')}`);
  }
  const selectedFiles = new Map();
  for (const selector of fileSelectors ?? []) {
    const separator = selector.indexOf(':');
    invariant(separator > 0 && separator < selector.length - 1, `Invalid capture file selector: ${selector}`);
    const mappingId = selector.slice(0, separator);
    const relative = normalizeRelative(selector.slice(separator + 1));
    invariant(manifest.mappings.some((mapping) => mapping.id === mappingId), `Unknown capture mapping: ${mappingId}`);
    invariant(relative.length > 0 && !relative.startsWith('../') && !path.isAbsolute(relative), `Unsafe capture file selector: ${selector}`);
    if (!selectedFiles.has(mappingId)) selectedFiles.set(mappingId, new Set());
    selectedFiles.get(mappingId).add(relative);
  }
  const operations = [];
  for (const mapping of manifest.mappings) {
    if (selectedIds && !selectedIds.has(mapping.id)) continue;
    if (selectedFiles.size > 0 && !selectedFiles.has(mapping.id)) continue;
    const captureRoot = resolveTokenPath(mapping.captureFrom, roots);
    const sourceRoot = resolveSource(repoRoot, mapping.source);
    const captured = collectFiles(captureRoot, manifest, mapping, { inventoryLabel: mapping.captureFrom });
    const canonical = collectFiles(sourceRoot, manifest, mapping, { inventoryLabel: mapping.source });
    if (captured.size === 0 && canonical.size > 0) continue;
    invariant(captured.size > 0, `Capture source is empty: ${mapping.id}`);
    for (const [relative, input] of captured) {
      if (selectedFiles.size > 0 && !selectedFiles.get(mapping.id)?.has(relative)) continue;
      const bytes = capturedBytes(input, roots, mapping.tokenizeRegisteredPathsOnCapture);
      const secretIndex = secretFindingBytes(bytes, input);
      invariant(secretIndex < 0, `Secret-shaped content refused (pattern ${secretIndex + 1}): ${mapping.id}/${relative}`);
      invariant(!portablePathFindingBytes(bytes, input), `Machine-specific absolute path refused: ${mapping.id}/${relative}`);
      const target = mapping.mode === 'file' ? sourceRoot : path.join(sourceRoot, relative);
      if (canonical.has(relative)) {
        if (hashBytes(bytes, input) === hashFile(canonical.get(relative))) continue;
        invariant(updateExisting, `Canonical source differs; capture refused: ${mapping.id}/${relative}`);
        operations.push({ type: 'update-capture', mapping: mapping.id, relative, bytes, target });
      } else operations.push({ type: 'capture', mapping: mapping.id, relative, bytes, target });
    }
    if (selectedFiles.has(mapping.id)) {
      const missing = [...selectedFiles.get(mapping.id)].filter((relative) => !captured.has(relative));
      invariant(missing.length === 0, `Selected capture file(s) missing from ${mapping.id}: ${missing.join(', ')}`);
    }
  }
  if (!dryRun) {
    for (const operation of operations) writeAtomic(operation.target, operation.bytes);
  }
  return operations;
}

export function runInstall({ repoRoot, manifest, roots, dryRun = false, adoptExisting = false, failAfter = undefined, mappingIds = undefined, reconcileInstalled = undefined }) {
  const mappings = selectedMappings(manifest, mappingIds, 'install');
  const reconciliation = validatedReconciliation({ manifest, mappingIds, adoptExisting, reconcileInstalled });
  const reviewedLayouts = new Map();
  if (reconciliation) {
    for (const mapping of mappings) {
      const layout = classifyInstalledLayout(mapping, roots, 'Installed-tree reconciliation');
      invariant(layout.physical.length === 1,
        `Installed-tree reconciliation requires exactly one physical destination for ${mapping.id}; found ${layout.physical.length}`);
      reviewedLayouts.set(mapping.id, layout);
    }
  }
  const errors = validateManifest(manifest, repoRoot, roots);
  invariant(errors.length === 0, `Manifest invalid:\n${errors.join('\n')}`);
  const operations = [];
  const conflicts = [];
  const locks = new Map();

  for (const mapping of mappings) {
    if (mapping.ownership === 'captured') {
      operations.push({
        type: CAPTURED_INSTALL_SKIP_OPERATION,
        mapping: mapping.id,
        ownership: mapping.ownership,
        destinationCount: mapping.destinations?.length ?? 0,
        relative: '',
      });
      continue;
    }
    const sourceRoot = resolveSource(repoRoot, mapping.source);
    const sourceFiles = collectFiles(sourceRoot, manifest, mapping, { inventoryLabel: mapping.source });
    invariant(sourceFiles.size > 0, `Canonical source is empty: ${mapping.id}`);
    const reviewedDigest = reconciliation?.get(mapping.id);
    const lockPath = resolveTokenPath(mapping.lock, roots);
    if (!locks.has(lockPath)) locks.set(lockPath, loadLock(lockPath));
    const lock = locks.get(lockPath);
    const layout = reviewedLayouts.get(mapping.id) ?? classifyInstalledLayout(mapping, roots, 'Install');
    for (const { kind, destinationTemplate, destinationRoot } of layout.entries) {
      if (kind === 'junction') {
        operations.push({ type: 'retain-legacy-link', mapping: mapping.id, relative: '', target: destinationRoot });
        continue;
      }
      const destinationFiles = collectFiles(
        destinationRoot,
        manifest,
        { ...mapping, allowRootLink: false },
        { installedInventory: true, rejectUnsafe: true, inventoryLabel: destinationTemplate },
      );
      if (reviewedDigest) {
        const currentTree = digestCollectedTree(destinationFiles);
        invariant(currentTree.sha256 === reviewedDigest,
          `Installed-tree reconciliation refused: reviewed tree digest mismatch for ${mapping.id}/${destinationTemplate}`);
      }
      if (mapping.detectLocalOnly) {
        for (const [relative, current] of destinationFiles) {
          if (sourceFiles.has(relative)) continue;
          const key = lockKey(mapping, destinationTemplate, relative);
          const installedRawHash = lock.files[key]?.rawHash;
          if (reviewedDigest || (installedRawHash && hashRawFile(current) === installedRawHash)) {
            operations.push({
              type: 'retire',
              mapping: mapping.id,
              relative,
              target: current,
              destinationTemplate,
              lockPath,
              key,
              sourceHash: null
            });
          } else {
            conflicts.push(`Local-only managed file: ${mapping.id}/${relative}`);
          }
        }
      }
      for (const [relative, source] of sourceFiles) {
        const target = mapping.mode === 'file' ? destinationRoot : path.join(destinationRoot, relative);
        const current = destinationFiles.get(relative);
        const key = lockKey(mapping, destinationTemplate, relative);
        const rendered = renderedBytes(source, roots, mapping.renderContentTokens !== false);
        const sourceHash = hashBytes(rendered, source);
        const sourceRawHash = hashRawBytes(rendered);
        if (current && hashFile(current) === sourceHash) {
          const currentRawHash = hashRawFile(current);
          const prior = lock.files[key];
          lock.files[key] = { hash: sourceHash, rawHash: currentRawHash, destination: destinationTemplate, relative };
          if (!prior || prior.hash !== sourceHash || prior.rawHash !== currentRawHash || prior.destination !== destinationTemplate || prior.relative !== relative) {
            operations.push({ type: 'refresh-lock', mapping: mapping.id, relative, lockPath, key });
          }
          continue;
        }
        if (current) {
          const installedHash = lock.files[key]?.hash;
          if ((!installedHash || hashFile(current) !== installedHash) && !adoptExisting && !reviewedDigest) {
            conflicts.push(`Dirty managed target: ${mapping.id}/${relative || '.'}`);
            continue;
          }
        }
        operations.push({
          type: current
            ? (reviewedDigest && (!lock.files[key] || hashFile(current) !== lock.files[key].hash)
              ? 'reconcile-update'
              : adoptExisting && !lock.files[key] ? 'adopt-update' : 'update')
            : 'create',
          mapping: mapping.id,
          relative,
          source,
          rendered,
          target,
          destinationTemplate,
          lockPath,
          key,
          sourceHash,
          sourceRawHash
        });
      }
    }
  }

  invariant(conflicts.length === 0, `Install refused:\n${conflicts.join('\n')}`);
  if (!dryRun) operations.installId = applyInstallTransaction({ operations, locks, repoRoot, failAfter });
  return operations;
}

export function validateActionPolicy(policy) {
  return validateActionPolicySemantics(policy);
}

export function validateAutomationSpecs(registry, projectSpecs) {
  const problems = [];
  const ids = new Set();
  const universal = registry.automations?.find((automation) => automation.id === 'universal-biweekly-orchestration-backflow');
  const driftAlarm = registry.automations?.find((automation) => automation.id === 'universal-weekday-control-plane-drift-alarm');
  for (const automation of registry.automations ?? []) {
    if (ids.has(automation.id)) problems.push(`Duplicate automation id: ${automation.id}`);
    ids.add(automation.id);
  }
  if (!universal?.rrule || !universal?.prompt || universal.mode !== 'read-only') problems.push('Universal backflow automation must be fully reconstructable and read-only');
  if (
    !driftAlarm?.rrule?.includes('BYDAY=MO,TU,WE,TH,FR')
    || !driftAlarm?.prompt?.includes('scripts/control-check-notify.mjs')
    || driftAlarm.mode !== 'read-only'
    || driftAlarm.activation !== 'recommend-only'
    || driftAlarm.targetRoot !== '${PROJECT:control-plane}'
  ) problems.push('Universal control-plane drift alarm must be weekday, reconstructable, read-only, and recommend-only');
  for (const action of ['edit', 'merge', 'deploy', 'production mutation', 'external message']) {
    if (!registry.forbiddenActions?.includes(action)) problems.push(`Automation forbidden action is missing: ${action}`);
  }
  for (const [project, spec] of Object.entries(projectSpecs)) {
    const expected = new Set([`${project === 'coachai' ? 'coachai' : 'auxara'}-daily-orchestration-drift`, `${project === 'coachai' ? 'coachai' : 'auxara'}-weekly-fleet-doctrine-review`]);
    if (!spec.updateExistingExactName || !spec.verifyAfterWrite) problems.push(`${project} automations must update exact IDs and verify stored state`);
    for (const automation of spec.createAtBootstrap ?? []) {
      expected.delete(automation.id);
      if (!automation.rrule || !automation.prompt || automation.mode !== 'read-only') problems.push(`${project} automation is not reconstructable/read-only: ${automation.id}`);
      if (automation.targetRoot !== `\${PROJECT:${project}}`) problems.push(`${project} automation target must use its registered root token: ${automation.id}`);
    }
    for (const missing of expected) problems.push(`${project} bootstrap automation is missing: ${missing}`);
  }
  return problems;
}

export function validateAgentRoleRegistries(repoRoot) {
  const problems = [];
  const universalSchema = path.join(repoRoot, 'schemas', 'agent-role-registry.v1.schema.json');
  const projectSchema = path.join(repoRoot, 'schemas', 'agent-role-project-extension.v1.schema.json');
  let universal;
  try {
    universal = readJson(path.join(repoRoot, 'registries', 'agent-roles.v1.json'));
  } catch {
    return ['Agent registry is missing or unreadable'];
  }

  problems.push(...validateJsonAgainstSchema(universalSchema, universal).map((failure) => `Agent registry schema: ${failure}`));
  const ids = new Set();
  for (const role of universal.roles ?? []) {
    if (ids.has(role.id)) problems.push(`Duplicate agent role: ${role.id}`);
    ids.add(role.id);
    if (!Array.isArray(role.required_outputs) || role.required_outputs.length === 0) problems.push(`Agent role lacks output contract: ${role.id}`);
  }
  if (!ids.has('premise-and-architecture-challenger')) problems.push('Premise challenger role is required');

  for (const project of PROJECT_OVERLAYS) {
    let extension;
    try {
      extension = readJson(path.join(repoRoot, 'overlays', project, 'control-plane', 'registries', 'agent-roles.project.v1.json'));
    } catch {
      problems.push(`${project} role extension is missing or unreadable`);
      continue;
    }
    problems.push(...validateJsonAgainstSchema(projectSchema, extension).map((failure) => `${project} role extension schema: ${failure}`));
    if (Array.isArray(universal.roles) && Array.isArray(extension.roles)) {
      problems.push(...validateProjectRoleExtensionSemantics(universal, extension).map((failure) => `${project} role extension: ${failure}`));
    }
  }
  return problems;
}

export function validateRegistries(repoRoot) {
  const problems = [];
  const policyFile = path.join(repoRoot, 'policies', 'action-authority.v1.json');
  const policy = readJson(policyFile);
  problems.push(...validateJsonAgainstSchema(path.join(repoRoot, 'schemas', 'action-authority.v1.schema.json'), policy).map((failure) => `Action policy schema: ${failure}`));
  problems.push(...validateActionPolicy(policy));

  problems.push(...validateAgentRoleRegistries(repoRoot));
  const artifacts = readJson(path.join(repoRoot, 'registries', 'artifacts.v1.json'));
  const artifactIds = new Set();
  const skillNames = new Set();
  for (const artifact of artifacts.artifacts) {
    if (artifactIds.has(artifact.id)) problems.push(`Duplicate artifact id: ${artifact.id}`);
    artifactIds.add(artifact.id);
    if (artifact.family === 'skill') {
      if (skillNames.has(artifact.declaredName)) problems.push(`Duplicate declared skill name: ${artifact.declaredName}`);
      skillNames.add(artifact.declaredName);
    }
  }
  const manifest = readJson(path.join(repoRoot, 'control-plane.manifest.json'));
  problems.push(...validateJsonAgainstSchema(path.join(repoRoot, 'schemas', 'control-plane-manifest.v1.schema.json'), manifest).map((failure) => `Control manifest schema: ${failure}`));
  for (const mapping of manifest.mappings) if (!artifactIds.has(mapping.id)) problems.push(`Mapping lacks artifact registry row: ${mapping.id}`);
  for (const project of PROJECT_OVERLAYS) {
    const overlay = readJson(path.join(repoRoot, 'overlays', project, 'manifest.json'));
    problems.push(...validateJsonAgainstSchema(path.join(repoRoot, 'schemas', 'project-overlay.v1.schema.json'), overlay).map((failure) => `${project} overlay schema: ${failure}`));
  }
  const automationRegistry = readJson(path.join(repoRoot, 'automations', 'registry.v1.json'));
  const automationSpecs = {
    'auxara-dialer': readJson(path.join(repoRoot, 'overlays', 'auxara-dialer', 'automations', 'project-automations.v1.json')),
    coachai: readJson(path.join(repoRoot, 'overlays', 'coachai', 'automations', 'project-automations.v1.json'))
  };
  problems.push(...validateAutomationSpecs(automationRegistry, automationSpecs));
  for (const schema of fs.readdirSync(path.join(repoRoot, 'schemas')).filter((file) => file.endsWith('.json'))) {
    problems.push(...validateSchemaReferences(path.join(repoRoot, 'schemas', schema)).map((failure) => `${schema}: ${failure}`));
  }
  return problems;
}
