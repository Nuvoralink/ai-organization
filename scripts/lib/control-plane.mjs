import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const TEXT_EXTENSIONS = new Set([
  '', '.md', '.txt', '.json', '.jsonl', '.yaml', '.yml', '.toml', '.mjs', '.cjs', '.js', '.ts', '.tsx',
  '.jsx', '.py', '.ps1', '.sh', '.css', '.scss', '.html', '.xml', '.csv', '.template', '.mustache'
]);

const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:gh[opusr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/,
  /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["']?(?!\$\{|<|REDACTED|EXAMPLE|YOUR_)[A-Za-z0-9_\-/.+=]{16,}/i
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

function denyReason(relative, manifest, mapping) {
  const normalized = normalizeRelative(relative);
  const segments = normalized.toLowerCase().split('/');
  const base = segments.at(-1) ?? '';
  const deny = manifest.deny;
  if (segments.some((segment) => deny.segments.map((x) => x.toLowerCase()).includes(segment))) return 'denied path segment';
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

export function collectFiles(rootInput, manifest, mapping) {
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
      const reason = denyReason(relative, manifest, mapping);
      if (reason) continue;
      const absolute = path.join(directory, entry.name);
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
  if (!TEXT_EXTENSIONS.has(ext)) return undefined;
  const content = fs.readFileSync(file, 'utf8');
  return SECRET_PATTERNS.findIndex((pattern) => pattern.test(content));
}

function portablePathFinding(file) {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) return false;
  const content = fs.readFileSync(file, 'utf8');
  return /\bC:\\(?:Users|dev)\\/i.test(content);
}

export function validateManifest(manifest, repoRoot, roots) {
  const errors = [];
  const ids = new Set();
  const destinations = new Set();
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
        destinations.add(key);
      } catch (error) { errors.push(error.message); }
    }
    try { resolveTokenPath(mapping.captureFrom, roots); } catch (error) { errors.push(error.message); }
    try { resolveTokenPath(mapping.lock, roots); } catch (error) { errors.push(error.message); }
  }
  return errors;
}

function compareTrees(sourceFiles, destinationFiles, detectLocalOnly) {
  const problems = [];
  for (const [relative, source] of sourceFiles) {
    const destination = destinationFiles.get(relative);
    if (!destination) problems.push({ type: 'missing', relative });
    else if (hashFile(source) !== hashFile(destination)) problems.push({ type: 'drift', relative });
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

export function runCheck({ repoRoot, manifest, roots }) {
  const problems = validateManifest(manifest, repoRoot, roots).map((message) => ({ type: 'manifest', message }));
  for (const mapping of manifest.mappings) {
    const sourceRoot = resolveSource(repoRoot, mapping.source);
    const sourceFiles = collectFiles(sourceRoot, manifest, mapping);
    if (sourceFiles.size === 0) problems.push({ type: 'empty-source', mapping: mapping.id });
    for (const [relative, source] of sourceFiles) {
      const secretIndex = secretFinding(source);
      if (secretIndex >= 0) problems.push({ type: 'secret-shaped-content', mapping: mapping.id, relative, pattern: secretIndex + 1 });
      if (portablePathFinding(source)) problems.push({ type: 'absolute-path', mapping: mapping.id, relative });
    }
    for (const destinationTemplate of mapping.destinations) {
      const destinationRoot = resolveTokenPath(destinationTemplate, roots);
      const destinationFiles = collectFiles(destinationRoot, manifest, { ...mapping, allowRootLink: false });
      for (const problem of compareTrees(sourceFiles, destinationFiles, mapping.detectLocalOnly)) {
        problems.push({ ...problem, mapping: mapping.id, destination: destinationTemplate });
      }
    }
  }
  return problems;
}

export function runCapture({ repoRoot, manifest, roots, dryRun = false }) {
  const errors = validateManifest(manifest, repoRoot, roots);
  invariant(errors.length === 0, `Manifest invalid:\n${errors.join('\n')}`);
  const operations = [];
  for (const mapping of manifest.mappings) {
    const captureRoot = resolveTokenPath(mapping.captureFrom, roots);
    const sourceRoot = resolveSource(repoRoot, mapping.source);
    const captured = collectFiles(captureRoot, manifest, mapping);
    invariant(captured.size > 0, `Capture source is empty: ${mapping.id}`);
    const canonical = collectFiles(sourceRoot, manifest, mapping);
    for (const [relative, input] of captured) {
      const secretIndex = secretFinding(input);
      invariant(secretIndex < 0, `Secret-shaped content refused (pattern ${secretIndex + 1}): ${mapping.id}/${relative}`);
      const target = mapping.mode === 'file' ? sourceRoot : path.join(sourceRoot, relative);
      if (canonical.has(relative)) invariant(hashFile(input) === hashFile(canonical.get(relative)), `Canonical source differs; capture refused: ${mapping.id}/${relative}`);
      else operations.push({ type: 'capture', mapping: mapping.id, relative, input, target });
    }
  }
  if (!dryRun) {
    for (const operation of operations) writeAtomic(operation.target, fs.readFileSync(operation.input));
  }
  return operations;
}

export function runInstall({ repoRoot, manifest, roots, dryRun = false }) {
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
      const destinationFiles = collectFiles(destinationRoot, manifest, { ...mapping, allowRootLink: false });
      if (mapping.detectLocalOnly) {
        for (const relative of destinationFiles.keys()) if (!sourceFiles.has(relative)) conflicts.push(`Local-only managed file: ${mapping.id}/${relative}`);
      }
      for (const [relative, source] of sourceFiles) {
        const target = mapping.mode === 'file' ? destinationRoot : path.join(destinationRoot, relative);
        const current = destinationFiles.get(relative);
        const key = lockKey(mapping, destinationTemplate, relative);
        const sourceHash = hashFile(source);
        if (current && hashFile(current) === sourceHash) {
          lock.files[key] = { hash: sourceHash, destination: target };
          continue;
        }
        if (current) {
          const installedHash = lock.files[key]?.hash;
          if (!installedHash || hashFile(current) !== installedHash) {
            conflicts.push(`Dirty managed target: ${target}`);
            continue;
          }
        }
        operations.push({ type: current ? 'update' : 'create', mapping: mapping.id, relative, source, target, lockPath, key, sourceHash });
      }
    }
  }

  invariant(conflicts.length === 0, `Install refused:\n${conflicts.join('\n')}`);
  if (!dryRun) {
    for (const operation of operations) {
      writeAtomic(operation.target, fs.readFileSync(operation.source));
      locks.get(operation.lockPath).files[operation.key] = { hash: operation.sourceHash, destination: operation.target };
    }
    for (const [lockPath, lock] of locks) {
      lock.sourceRepository = 'Nuvoralink/ai-organization-control-plane';
      lock.sourceCommit = gitCommit(repoRoot);
      lock.updatedAt = new Date().toISOString();
      writeAtomic(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
    }
  }
  return operations;
}

export function validateRegistries(repoRoot) {
  const problems = [];
  const policy = readJson(path.join(repoRoot, 'policies', 'action-authority.v1.json'));
  if (policy.default !== 'human_required') problems.push('Action authority must fail closed to human_required');
  if (!policy.autonomous.includes('push_branch') || !policy.autonomous.includes('open_or_update_pull_request')) problems.push('Push and PR must remain autonomous');
  if (!policy.human_required.includes('merge_that_deploys_or_mutates_production')) problems.push('Production-affecting merge must remain human gated');
  if (!policy.conditional.merge_pull_request.all.includes('no_deploy_or_production_effect')) problems.push('Conditional merge must prove no production effect');

  const registry = readJson(path.join(repoRoot, 'registries', 'agent-roles.v1.json'));
  const ids = new Set();
  for (const role of registry.roles) {
    if (ids.has(role.id)) problems.push(`Duplicate agent role: ${role.id}`);
    ids.add(role.id);
    if (role.required_outputs.length === 0) problems.push(`Agent role lacks output contract: ${role.id}`);
  }
  if (!ids.has('premise-and-architecture-challenger')) problems.push('Premise challenger role is required');
  return problems;
}
