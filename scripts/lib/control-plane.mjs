import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateJsonAgainstSchema, validateSchemaReferences } from '../../core/schema/validate-json-schema.mjs';

const TEXT_EXTENSIONS = new Set([
  '', '.md', '.txt', '.json', '.jsonl', '.ndjson', '.yaml', '.yml', '.toml', '.mjs', '.cjs', '.js', '.ts', '.tsx',
  '.jsx', '.py', '.ps1', '.sh', '.css', '.scss', '.html', '.xml', '.csv', '.toml', '.lock', '.template', '.mustache'
]);

const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:gh[opusr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/,
  /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["']?(?!\$\{|<|REDACTED|EXAMPLE|YOUR_|process\.env|Deno\.env|env\.|os\.environ|getenv\()[A-Za-z0-9_\-/.+=]{16,}/i
];

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
  invariant(typeof roots[token] === 'string' && roots[token].length > 0, `Unresolved path token: ${token}`);
  const root = path.resolve(roots[token]);
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

const REPOSITORY_META_FILES = new Set([
  '.gitattributes', '.gitignore', '.gitleaks.toml', '.gitleaksignore', 'AGENTS.md', 'CLAUDE.md',
  'README.md', 'control-plane.manifest.json', 'package-lock.json', 'package.json'
]);

export function classifyTrackedScope(relativeInput) {
  const relative = normalizeRelative(relativeInput);
  const extension = path.extname(relative).toLowerCase();
  if (REPOSITORY_META_FILES.has(relative)) return 'repository-metadata';
  if (relative === 'registries/tracked-scope.v1.json') return 'scope-registry';
  if (relative.startsWith('.github/')) return 'github-orchestration';
  if (relative.startsWith('artifacts/')) return ['.md', '.pptx'].includes(extension) ? 'presentation-artifact' : undefined;
  if (relative.startsWith('docs/')) return extension === '.md' ? 'documentation' : undefined;
  if (relative.startsWith('overlays/')) return ['.md', '.mdc', '.json', '.mjs', '.js', '.yaml', '.yml', ''].includes(extension) ? 'project-orchestration-overlay' : undefined;
  if (relative.startsWith('automations/')) return extension === '.json' ? 'automation-specification' : undefined;
  if (relative.startsWith('policies/')) return extension === '.json' ? 'policy' : undefined;
  if (relative.startsWith('registries/')) return extension === '.json' ? 'registry' : undefined;
  if (relative.startsWith('schemas/')) return extension === '.json' ? 'schema' : undefined;
  if (relative.startsWith('scripts/')) return extension === '.mjs' ? 'control-plane-tooling' : undefined;
  if (relative.startsWith('tests/')) return extension === '.mjs' ? 'control-plane-test' : undefined;
  if (relative.startsWith('core/')) return ['.mjs', '.md'].includes(extension) ? 'shared-control-plane-runtime' : undefined;
  if (relative.startsWith('global/')) return ['.md', '.json', '.mjs', '.yaml', '.yml'].includes(extension) ? 'global-orchestration' : undefined;
  if (relative.startsWith('skills/')) return ['.md', '.json', '.mjs', '.js', '.ts', '.tsx', '.py', '.ps1', '.csv', '.yaml', '.yml', '.template'].includes(extension) ? 'reusable-skill' : undefined;
  if (relative.startsWith('dependencies/')) return ['.md', '.json', '.py', '.toml', '.lock', ''].includes(extension) ? 'orchestration-dependency' : undefined;
  return undefined;
}

function renderedBytes(file, roots, renderContentTokens = true) {
  const bytes = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext) || !renderContentTokens) return bytes;
  const rendered = bytes.toString('utf8').replace(/\$\{([^}]+)\}/g, (match, token) => roots[token] ?? match);
  return Buffer.from(rendered);
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
  if (segments.some((segment) => deny.segments.map((x) => x.toLowerCase()).includes(segment))) return 'denied path segment';
  if (isDirectory) {
    if ((mapping.exclude ?? []).some((entry) => normalized === entry || normalized.startsWith(`${entry}/`))) return 'mapping exclusion';
    return undefined;
  }
  if (deny.filenames.map((x) => x.toLowerCase()).includes(base)) return 'denied filename';
  if (deny.prefixes.some((prefix) => base.startsWith(prefix.toLowerCase()))) return 'denied filename prefix';
  if (deny.extensions.map((x) => x.toLowerCase()).includes(path.extname(base).toLowerCase())) return 'denied extension';
  if ((mapping.exclude ?? []).some((entry) => normalized === entry || normalized.startsWith(`${entry}/`))) return 'mapping exclusion';
  if (mapping.allowedExtensions.length > 0 && !mapping.allowedExtensions.map((x) => x.toLowerCase()).includes(path.extname(base).toLowerCase())) return 'extension not allowlisted';
  return undefined;
}

function inspectRoot(root, allowRootLink) {
  if (!fs.existsSync(root)) return root;
  const stat = fs.lstatSync(root);
  if (!stat.isSymbolicLink()) return root;
  invariant(allowRootLink, `Root link/junction is not allowed: ${root}`);
  return fs.realpathSync(root);
}

function rootIsLink(root) {
  return fs.existsSync(root) && fs.lstatSync(root).isSymbolicLink();
}

function legacyLinkMatches(destinationRoot, captureRoot) {
  if (!rootIsLink(destinationRoot)) return false;
  return path.resolve(fs.realpathSync(destinationRoot)).toLowerCase() === path.resolve(fs.realpathSync(captureRoot)).toLowerCase();
}

export function collectFiles(rootInput, manifest, mapping, options = {}) {
  if (!fs.existsSync(rootInput)) return new Map();
  const root = inspectRoot(rootInput, mapping.allowRootLink === true);
  const output = new Map();

  if (mapping.mode === 'file') {
    const stat = fs.lstatSync(root);
    invariant(stat.isFile(), `Expected file mapping source: ${rootInput}`);
    const relative = path.basename(rootInput);
    invariant(!denyReason(relative, manifest, mapping), `Unsafe mapped file: ${rootInput}`);
    output.set('', root);
    return output;
  }

  invariant(fs.statSync(root).isDirectory(), `Expected tree mapping source: ${rootInput}`);
  const visit = (directory, relativeBase = '') => {
    const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const relative = normalizeRelative(path.join(relativeBase, entry.name));
      const absolute = path.join(directory, entry.name);
      const reason = denyReason(relative, manifest, mapping, entry.isDirectory());
      if (reason) {
        if (options.rejectDenied) throw new Error(`Canonical source contains ${reason}: ${absolute}`);
        continue;
      }
      const lstat = fs.lstatSync(absolute);
      invariant(!lstat.isSymbolicLink(), `Nested link/junction traversal refused: ${absolute}`);
      if (entry.isDirectory()) visit(absolute, relative);
      else if (entry.isFile()) output.set(relative, absolute);
    }
  };
  visit(root);
  return output;
}

function secretFinding(file) {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) return -1;
  const content = fs.readFileSync(file, 'utf8');
  return SECRET_PATTERNS.findIndex((pattern) => pattern.test(content));
}

function portablePathFinding(file) {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) return false;
  const content = fs.readFileSync(file, 'utf8');
  return /\bC:[\\/](?:Users|dev)[\\/]/i.test(content);
}

export function validateManifest(manifest, repoRoot, roots) {
  const errors = [];
  const ids = new Set();
  const destinations = new Set();
  const destinationRoots = [];
  const physicalTargets = new Map();
  for (const mapping of manifest.mappings) {
    if (!/^[a-z0-9][a-z0-9-]+$/.test(mapping.id ?? '')) errors.push(`Invalid mapping id: ${mapping.id}`);
    if (ids.has(mapping.id)) errors.push(`Duplicate mapping id: ${mapping.id}`);
    ids.add(mapping.id);
    try { resolveSource(repoRoot, mapping.source); } catch (error) { errors.push(error.message); }
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
          const sourceFiles = collectFiles(resolveSource(repoRoot, mapping.source), manifest, mapping, { rejectDenied: true });
          for (const relative of sourceFiles.keys()) {
            const target = mapping.mode === 'file' ? destination : path.join(destination, relative);
            const targetKey = path.normalize(target).toLowerCase();
            const prior = physicalTargets.get(targetKey);
            if (prior) errors.push(`Duplicate physical target: ${prior} <-> ${mapping.id}/${relative || '.'}`);
            else physicalTargets.set(targetKey, `${mapping.id}/${relative || '.'}`);
          }
        } catch (error) {
          errors.push(error.message);
        }
      } catch (error) { errors.push(error.message); }
    }
    try { resolveTokenPath(mapping.captureFrom, roots); } catch (error) { errors.push(error.message); }
    try { resolveTokenPath(mapping.lock, roots); } catch (error) { errors.push(error.message); }
  }
  return errors;
}

export function validateCanonical({ repoRoot, manifest }) {
  const problems = [];
  const ids = new Set();
  const destinationTemplates = new Set();
  for (const mapping of manifest.mappings) {
    if (!/^[a-z0-9][a-z0-9-]+$/.test(mapping.id ?? '')) problems.push({ type: 'manifest', message: `Invalid mapping id: ${mapping.id}` });
    if (ids.has(mapping.id)) problems.push({ type: 'manifest', message: `Duplicate mapping id: ${mapping.id}` });
    ids.add(mapping.id);
    let sourceRoot;
    try { sourceRoot = resolveSource(repoRoot, mapping.source); }
    catch (error) { problems.push({ type: 'manifest', message: error.message }); continue; }
    for (const template of [...(mapping.destinations ?? []), mapping.captureFrom, mapping.lock]) {
      if (!/^\$\{[^}]+\}(?:\/.*)?$/.test(template ?? '')) problems.push({ type: 'manifest', message: `Path must start with a registered token: ${template}` });
    }
    for (const template of mapping.destinations ?? []) {
      if (destinationTemplates.has(template)) problems.push({ type: 'manifest', message: `Duplicate destination template: ${template}` });
      destinationTemplates.add(template);
    }
    let sourceFiles;
    try { sourceFiles = collectFiles(sourceRoot, manifest, mapping, { rejectDenied: true }); }
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
    catch (error) { problems.push({ type: 'tracked-scope-registry', message: `Missing or invalid tracked scope registry: ${error.message}` }); }
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

function applyInstallTransaction({ operations, locks, repoRoot, failAfter = undefined }) {
  const writes = operations.filter((operation) => operation.type !== 'retain-legacy-link');
  if (writes.length === 0 && [...locks.keys()].every((lockPath) => fs.existsSync(lockPath))) return undefined;
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
    snapshot.data.entries.push({ target: operation.target, existed, backup: existed ? backup : null, postHash: operation.sourceHash });
  }
  for (const snapshot of snapshots.values()) writeAtomic(path.join(snapshot.directory, 'snapshot.json'), `${JSON.stringify(snapshot.data, null, 2)}\n`);

  let applied = 0;
  try {
    for (const operation of writes) {
      if (failAfter !== undefined && applied >= failAfter) throw new Error(`Injected install failure after ${applied} writes`);
      writeAtomic(operation.target, operation.rendered);
      locks.get(operation.lockPath).files[operation.key] = { hash: operation.sourceHash, destination: operation.destinationTemplate, relative: operation.relative };
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
  const lockPaths = [...new Set(manifest.mappings.map((mapping) => resolveTokenPath(mapping.lock, roots)))];
  const selected = [];
  for (const lockPath of lockPaths) {
    const base = path.join(path.dirname(lockPath), 'snapshots');
    invariant(fs.existsSync(base), `No install snapshots found for ${lockPath}`);
    const id = requestedId ?? fs.readdirSync(base).sort().at(-1);
    invariant(id, `No install snapshots found for ${lockPath}`);
    const directory = path.join(base, id);
    const snapshotFile = path.join(directory, 'snapshot.json');
    invariant(fs.existsSync(snapshotFile), `Snapshot not found: ${id}`);
    const snapshot = readJson(snapshotFile);
    invariant(snapshot.status === 'applied', `Snapshot is not rollback-eligible: ${id}/${snapshot.status}`);
    for (const entry of snapshot.entries) {
      invariant(fs.existsSync(entry.target), `Rollback refused; installed target is missing: ${entry.target}`);
      invariant(hashFile(entry.target) === entry.postHash, `Rollback refused; installed target is dirty: ${entry.target}`);
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

export function runCheck({ repoRoot, manifest, roots }) {
  const problems = [...validateCanonical({ repoRoot, manifest }), ...validateManifest(manifest, repoRoot, roots).map((message) => ({ type: 'manifest', message }))];
  for (const mapping of manifest.mappings) {
    const sourceRoot = resolveSource(repoRoot, mapping.source);
    const sourceFiles = collectFiles(sourceRoot, manifest, mapping);
    for (const destinationTemplate of mapping.destinations) {
      const destinationRoot = resolveTokenPath(destinationTemplate, roots);
      const captureRoot = resolveTokenPath(mapping.captureFrom, roots);
      if (rootIsLink(destinationRoot) && (!mapping.allowInstalledRootLink || !legacyLinkMatches(destinationRoot, captureRoot))) {
        problems.push({ type: 'unexpected-link-target', mapping: mapping.id, destination: destinationTemplate });
        continue;
      }
      let destinationFiles;
      try { destinationFiles = collectFiles(destinationRoot, manifest, { ...mapping, allowRootLink: mapping.allowInstalledRootLink === true }); }
      catch (error) { problems.push({ type: 'installed-path', mapping: mapping.id, destination: destinationTemplate, message: error.message }); continue; }
      for (const problem of compareTrees(sourceFiles, destinationFiles, mapping.detectLocalOnly, roots, mapping.renderContentTokens !== false)) {
        problems.push({ ...problem, mapping: mapping.id, destination: destinationTemplate });
      }
      if (mapping.mode === 'tree' && fs.existsSync(destinationRoot) && !rootIsLink(destinationRoot)) {
        const visitUnexpected = (directory, relativeBase = '') => {
          for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const relative = normalizeRelative(path.join(relativeBase, entry.name));
            const absolute = path.join(directory, entry.name);
            if (entry.isDirectory()) visitUnexpected(absolute, relative);
            else if (entry.isFile() && denyReason(relative, manifest, mapping) === 'extension not allowlisted') {
              problems.push({ type: 'unclassified-local-only', mapping: mapping.id, destination: destinationTemplate, relative });
            }
          }
        };
        visitUnexpected(destinationRoot);
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
    const captured = collectFiles(captureRoot, manifest, mapping);
    const canonical = collectFiles(sourceRoot, manifest, mapping);
    if (captured.size === 0 && canonical.size > 0) continue;
    invariant(captured.size > 0, `Capture source is empty: ${mapping.id}`);
    for (const [relative, input] of captured) {
      if (selectedFiles.size > 0 && !selectedFiles.get(mapping.id)?.has(relative)) continue;
      const secretIndex = secretFinding(input);
      invariant(secretIndex < 0, `Secret-shaped content refused (pattern ${secretIndex + 1}): ${mapping.id}/${relative}`);
      invariant(!portablePathFinding(input), `Machine-specific absolute path refused: ${mapping.id}/${relative}`);
      const target = mapping.mode === 'file' ? sourceRoot : path.join(sourceRoot, relative);
      if (canonical.has(relative)) {
        if (hashFile(input) === hashFile(canonical.get(relative))) continue;
        invariant(updateExisting, `Canonical source differs; capture refused: ${mapping.id}/${relative}`);
        operations.push({ type: 'update-capture', mapping: mapping.id, relative, input, target });
      } else operations.push({ type: 'capture', mapping: mapping.id, relative, input, target });
    }
    if (selectedFiles.has(mapping.id)) {
      const missing = [...selectedFiles.get(mapping.id)].filter((relative) => !captured.has(relative));
      invariant(missing.length === 0, `Selected capture file(s) missing from ${mapping.id}: ${missing.join(', ')}`);
    }
  }
  if (!dryRun) {
    for (const operation of operations) writeAtomic(operation.target, fs.readFileSync(operation.input));
  }
  return operations;
}

export function runInstall({ repoRoot, manifest, roots, dryRun = false, adoptExisting = false, failAfter = undefined }) {
  const errors = validateManifest(manifest, repoRoot, roots);
  invariant(errors.length === 0, `Manifest invalid:\n${errors.join('\n')}`);
  const operations = [];
  const conflicts = [];
  const locks = new Map();

  for (const mapping of manifest.mappings) {
    const sourceRoot = resolveSource(repoRoot, mapping.source);
    const sourceFiles = collectFiles(sourceRoot, manifest, mapping);
    invariant(sourceFiles.size > 0, `Canonical source is empty: ${mapping.id}`);
    const lockPath = resolveTokenPath(mapping.lock, roots);
    if (!locks.has(lockPath)) locks.set(lockPath, loadLock(lockPath));
    const lock = locks.get(lockPath);
    for (const destinationTemplate of mapping.destinations) {
      const destinationRoot = resolveTokenPath(destinationTemplate, roots);
      const captureRoot = resolveTokenPath(mapping.captureFrom, roots);
      if (rootIsLink(destinationRoot)) {
        invariant(mapping.allowInstalledRootLink && legacyLinkMatches(destinationRoot, captureRoot), `Unexpected installed link/junction target: ${destinationRoot}`);
        operations.push({ type: 'retain-legacy-link', mapping: mapping.id, relative: '', target: destinationRoot });
        continue;
      }
      const destinationFiles = collectFiles(destinationRoot, manifest, { ...mapping, allowRootLink: false });
      if (mapping.detectLocalOnly) {
        for (const relative of destinationFiles.keys()) if (!sourceFiles.has(relative)) conflicts.push(`Local-only managed file: ${mapping.id}/${relative}`);
      }
      for (const [relative, source] of sourceFiles) {
        const target = mapping.mode === 'file' ? destinationRoot : path.join(destinationRoot, relative);
        const current = destinationFiles.get(relative);
        const key = lockKey(mapping, destinationTemplate, relative);
        const rendered = renderedBytes(source, roots, mapping.renderContentTokens !== false);
        const sourceHash = hashBytes(rendered, source);
        if (current && hashFile(current) === sourceHash) {
          lock.files[key] = { hash: sourceHash, destination: destinationTemplate, relative };
          continue;
        }
        if (current) {
          const installedHash = lock.files[key]?.hash;
          if ((!installedHash || hashFile(current) !== installedHash) && !adoptExisting) {
            conflicts.push(`Dirty managed target: ${target}`);
            continue;
          }
        }
        operations.push({ type: current ? (adoptExisting && !lock.files[key] ? 'adopt-update' : 'update') : 'create', mapping: mapping.id, relative, source, rendered, target, destinationTemplate, lockPath, key, sourceHash });
      }
    }
  }

  invariant(conflicts.length === 0, `Install refused:\n${conflicts.join('\n')}`);
  if (!dryRun) operations.installId = applyInstallTransaction({ operations, locks, repoRoot, failAfter });
  return operations;
}

export function validateActionPolicy(policy) {
  const problems = [];
  const requiredAutonomous = [
    'read_in_scope', 'analyze_and_plan', 'edit_in_isolated_workspace', 'run_local_tests_and_safe_read_only_checks',
    'create_branch_or_worktree', 'commit_in_scope_changes', 'push_branch', 'open_or_update_pull_request'
  ];
  const requiredHuman = [
    'merge_that_deploys_or_mutates_production', 'deploy_or_publish', 'production_write_or_configuration_change',
    'database_or_data_migration', 'destructive_or_irreversible_action', 'billed_action_or_purchase',
    'external_message_or_contact', 'secret_or_credential_change', 'close_product_scope_decision',
    'approve_visible_design_or_copy_in_context', 'close_material_architecture_decision'
  ];
  const requiredMergeConditions = [
    'no_deploy_or_production_effect', 'low_risk', 'additive_or_isolated_change', 'no_active_conflicting_work',
    'fetched_current_base', 'required_checks_passed', 'independent_review_passed', 'actual_diff_verified',
    'no_unresolved_human_decision', 'not_security_auth_billing_schema_data_provider_ai_semantics_or_visible_ui'
  ];
  if (policy.default !== 'human_required') problems.push('Action authority must fail closed to human_required');
  for (const action of requiredAutonomous) if (!policy.autonomous?.includes(action)) problems.push(`Autonomous action is missing: ${action}`);
  for (const action of requiredHuman) if (!policy.human_required?.includes(action)) problems.push(`Human-required action is missing: ${action}`);
  for (const condition of requiredMergeConditions) if (!policy.conditional?.merge_pull_request?.all?.includes(condition)) problems.push(`Conditional merge predicate is missing: ${condition}`);
  if (policy.conditional?.merge_pull_request?.on_uncertainty !== 'human_required') problems.push('Conditional merge must fail closed to human_required');
  if (!policy.explicitly_deferred?.includes('github_branch_protection')) problems.push('Branch protection deferral must remain explicit');
  return problems;
}

export function validateAutomationSpecs(registry, projectSpecs) {
  const problems = [];
  const ids = new Set();
  const universal = registry.automations?.find((automation) => automation.id === 'universal-biweekly-orchestration-backflow');
  for (const automation of registry.automations ?? []) {
    if (ids.has(automation.id)) problems.push(`Duplicate automation id: ${automation.id}`);
    ids.add(automation.id);
  }
  if (!universal?.rrule || !universal?.prompt || universal.mode !== 'read-only') problems.push('Universal backflow automation must be fully reconstructable and read-only');
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

export function validateRegistries(repoRoot) {
  const problems = [];
  const policyFile = path.join(repoRoot, 'policies', 'action-authority.v1.json');
  const policy = readJson(policyFile);
  problems.push(...validateJsonAgainstSchema(path.join(repoRoot, 'schemas', 'action-authority.v1.schema.json'), policy).map((failure) => `Action policy schema: ${failure}`));
  problems.push(...validateActionPolicy(policy));

  const registry = readJson(path.join(repoRoot, 'registries', 'agent-roles.v1.json'));
  problems.push(...validateJsonAgainstSchema(path.join(repoRoot, 'schemas', 'agent-role-registry.v1.schema.json'), registry).map((failure) => `Agent registry schema: ${failure}`));
  const ids = new Set();
  for (const role of registry.roles) {
    if (ids.has(role.id)) problems.push(`Duplicate agent role: ${role.id}`);
    ids.add(role.id);
    if (role.required_outputs.length === 0) problems.push(`Agent role lacks output contract: ${role.id}`);
  }
  if (!ids.has('premise-and-architecture-challenger')) problems.push('Premise challenger role is required');
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
  for (const project of ['auxara-dialer', 'coachai']) {
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
