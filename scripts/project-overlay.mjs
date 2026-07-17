#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadRoots,
  readJson,
  runCapture,
  runCheck,
  runInstall,
  runRollback,
  validateCanonical,
  validateManifest
} from './lib/control-plane.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadOverlay(project, rootsOverride = undefined) {
  if (!/^[a-z0-9][a-z0-9-]+$/u.test(project ?? '')) throw new Error(`Invalid project overlay id: ${project}`);
  const overlayRoot = path.join(repoRoot, 'overlays', project);
  const manifestFile = path.join(overlayRoot, 'manifest.json');
  if (!fs.existsSync(manifestFile)) throw new Error(`Unknown project overlay: ${project}`);
  const baseManifest = readJson(manifestFile);
  const ownershipFile = path.join(overlayRoot, 'ownership.v1.json');
  const ownership = fs.existsSync(ownershipFile) ? readJson(ownershipFile) : { assets: [] };
  const declaredProjectFiles = (ownership.assets ?? [])
    .filter((asset) => asset.mode === 'generated' && asset.sourcePath)
    .map((asset) => ({
      id: asset.id,
      source: `overlays/${project}/project-files/${asset.sourcePath}`,
      captureFrom: `\${${baseManifest.rootToken}}/${asset.destination}`,
      destinations: [`\${${baseManifest.rootToken}}/${asset.destination}`],
      mode: asset.installMode,
      ownership: 'generated',
      allowedExtensions: asset.allowedExtensions,
      exclude: [],
      detectLocalOnly: asset.detectLocalOnly,
      allowRootLink: false,
      allowInstalledRootLink: false,
      lock: `\${HOME}/.nuvoralink-control-plane/project-locks/${project}/overlay-lock.json`
    }));
  const manifest = { ...baseManifest, mappings: [...baseManifest.mappings, ...declaredProjectFiles] };
  const roots = loadRoots(repoRoot, rootsOverride);
  return { overlayRoot, manifest, roots };
}

export function validateOverlay(project, rootsOverride = undefined) {
  const { overlayRoot, manifest, roots } = loadOverlay(project, rootsOverride);
  const failures = [...validateCanonical({ repoRoot, manifest })];
  if (manifest.project !== project) failures.push({ type: 'overlay', message: `Project id mismatch: ${manifest.project}` });
  const ownershipFile = path.join(overlayRoot, 'ownership.v1.json');
  if (!fs.existsSync(ownershipFile)) failures.push({ type: 'overlay', message: 'ownership.v1.json is required' });
  else {
    const ownership = readJson(ownershipFile);
    const allowedModes = new Set(['generated', 'project-owned-reference', 'external-state', 'retired']);
    const rows = new Map();
    for (const row of ownership.assets ?? []) {
      if (rows.has(row.id)) failures.push({ type: 'overlay', message: `Duplicate ownership row: ${row.id}` });
      rows.set(row.id, row);
      if (!allowedModes.has(row.mode)) failures.push({ type: 'overlay', message: `Unknown ownership mode: ${row.id}/${row.mode}` });
      if (row.sourcePath) {
        if (row.mode !== 'generated') failures.push({ type: 'overlay', message: `Only generated rows may declare sourcePath: ${row.id}` });
        if (!['file', 'tree'].includes(row.installMode)) failures.push({ type: 'overlay', message: `Generated project file lacks installMode: ${row.id}` });
        if (!Array.isArray(row.allowedExtensions) || row.allowedExtensions.length === 0) failures.push({ type: 'overlay', message: `Generated project file lacks an extension allowlist: ${row.id}` });
        if (typeof row.detectLocalOnly !== 'boolean') failures.push({ type: 'overlay', message: `Generated project file lacks local-only policy: ${row.id}` });
        const normalized = path.posix.normalize(row.sourcePath.replaceAll('\\', '/'));
        if (path.posix.isAbsolute(normalized) || normalized === '..' || normalized.startsWith('../')) failures.push({ type: 'overlay', message: `Generated project source escapes overlay: ${row.id}` });
      }
    }
    for (const mapping of manifest.mappings) {
      const row = rows.get(mapping.id);
      if (!row) failures.push({ type: 'overlay', message: `Mapping lacks ownership row: ${mapping.id}` });
      else if (row.mode !== 'generated') failures.push({ type: 'overlay', message: `Installable mapping must be generated: ${mapping.id}` });
    }
  }
  const rootToken = manifest.rootToken;
  const expectedLock = `\${HOME}/.nuvoralink-control-plane/project-locks/${project}/overlay-lock.json`;
  for (const mapping of manifest.mappings) {
    for (const destination of mapping.destinations) {
      if (!destination.startsWith(`\${${rootToken}}/`)) failures.push({ type: 'overlay', message: `Destination escapes project root: ${mapping.id}/${destination}` });
    }
    if (mapping.lock !== expectedLock) failures.push({ type: 'overlay', message: `Overlay runtime lock must stay outside the product repository: ${mapping.id}` });
  }
  if (roots[rootToken]) failures.push(...validateManifest(manifest, repoRoot, roots).map((message) => ({ type: 'manifest', message })));
  return failures;
}

function printFailures(failures) {
  failures.forEach((failure) => console.error(typeof failure === 'string' ? failure : JSON.stringify(failure)));
}

function cli(argv) {
  const [command, project, ...rest] = argv;
  if (!['validate', 'check', 'install', 'capture', 'inventory', 'rollback'].includes(command) || !project) {
    console.error('Usage: project-overlay.mjs <validate|check|install|capture|inventory|rollback> <project> [--root PATH] [--dry-run] [--update-existing] [--adopt-existing] [--install-id ID]');
    return 2;
  }
  const rootIndex = rest.indexOf('--root');
  const loaded = loadOverlay(project);
  const roots = { ...loaded.roots };
  if (rootIndex >= 0) {
    const root = rest[rootIndex + 1];
    if (!root) throw new Error('--root requires a path');
    roots[loaded.manifest.rootToken] = path.resolve(root);
  }
  const failures = validateOverlay(project, roots);
  const blockingFailures = command === 'capture'
    ? failures.filter((failure) => failure.type !== 'empty-source')
    : failures;
  if (blockingFailures.length > 0) {
    printFailures(blockingFailures);
    return 1;
  }
  if (command === 'validate') {
    console.log(`${project} overlay validation passed`);
    return 0;
  }
  if (command === 'inventory') {
    console.log(JSON.stringify({ project, rootToken: loaded.manifest.rootToken, mappings: loaded.manifest.mappings.map(({ id, source, destinations }) => ({ id, source, destinations })) }, null, 2));
    return 0;
  }
  if (command === 'check') {
    const problems = runCheck({ repoRoot, manifest: loaded.manifest, roots });
    if (problems.length) {
      printFailures(problems);
      return 1;
    }
    console.log(`${project} overlay check passed`);
    return 0;
  }
  if (command === 'rollback') {
    const idIndex = rest.indexOf('--install-id');
    const ids = runRollback({ manifest: loaded.manifest, roots, installId: idIndex >= 0 ? rest[idIndex + 1] : undefined });
    console.log(`rolled back install ${[...new Set(ids)].join(', ')}`);
    return 0;
  }
  const dryRun = rest.includes('--dry-run');
  const operations = command === 'capture'
    ? runCapture({ repoRoot, manifest: loaded.manifest, roots, dryRun, updateExisting: rest.includes('--update-existing') })
    : runInstall({ repoRoot, manifest: loaded.manifest, roots, dryRun, adoptExisting: rest.includes('--adopt-existing') });
  operations.forEach((operation) => console.log(`${operation.type}\t${operation.mapping}\t${operation.relative || '.'}`));
  console.log(`operations=${operations.length} dryRun=${dryRun}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = cli(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
