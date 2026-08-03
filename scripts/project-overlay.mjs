#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadRoots,
  parseControlPlaneArgs,
  readJson,
  runCapture,
  runCheck,
  runDigest,
  runInstall,
  runRollback,
  validateCanonical,
  validateManifest,
} from './lib/control-plane.mjs';
import { buildOverlayLock } from '../overlays/coachai/project-files/scripts/check-overlay-parity.mjs';
import { validateOrganizationOverlay } from '../overlays/auxara-dialer/project-files/scripts/check-organization-overlay.mjs';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

export function loadOverlay(project, rootsOverride = undefined) {
  if (!/^[a-z0-9][a-z0-9-]+$/u.test(project ?? ''))
    throw new Error(`Invalid project overlay id: ${project}`);
  const overlayRoot = path.join(repoRoot, 'overlays', project);
  const manifestFile = path.join(overlayRoot, 'manifest.json');
  if (!fs.existsSync(manifestFile))
    throw new Error(`Unknown project overlay: ${project}`);
  const baseManifest = readJson(manifestFile);
  const ownershipFile = path.join(overlayRoot, 'ownership.v1.json');
  const ownership = fs.existsSync(ownershipFile)
    ? readJson(ownershipFile)
    : { assets: [] };
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
      lock: `\${HOME}/.nuvoralink-control-plane/project-locks/${project}/overlay-lock.json`,
    }));
  const manifest = {
    ...baseManifest,
    mappings: [...baseManifest.mappings, ...declaredProjectFiles],
  };
  const roots = loadRoots(repoRoot, rootsOverride);
  return { overlayRoot, manifest, roots };
}

export function validatePortableOverlayLock(value) {
  const failures = [];
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return ['portable overlay lock must be an object'];
  const allowed = new Set(['version', 'source', 'files', 'json_sections']);
  for (const key of Object.keys(value))
    if (!allowed.has(key))
      failures.push(`portable overlay lock has unexpected property: ${key}`);
  if (value.version !== 1)
    failures.push('portable overlay lock version must be 1');
  if (
    typeof value.source !== 'string' ||
    !/^universal-private-orchestrator\/overlays\/[a-z0-9-]+$/u.test(
      value.source,
    )
  )
    failures.push('portable overlay lock source is invalid');
  const validateHashMap = (entries, label) => {
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
      failures.push(`${label} must be an object`);
      return;
    }
    for (const [relative, hash] of Object.entries(entries)) {
      const normalized = relative.replaceAll('\\', '/');
      if (
        !relative ||
        normalized !== relative ||
        path.posix.isAbsolute(relative) ||
        relative === '..' ||
        relative.startsWith('../')
      )
        failures.push(`${label} contains a non-portable path: ${relative}`);
      if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/u.test(hash))
        failures.push(`${label} contains a non-SHA-256 value: ${relative}`);
    }
  };
  if (!Array.isArray(value.files))
    failures.push('portable overlay lock files must be an array');
  else {
    const seenPaths = new Set();
    for (const entry of value.files) {
      if (
        !entry ||
        typeof entry !== 'object' ||
        Array.isArray(entry) ||
        Object.keys(entry).some((key) => !['path', 'sha256'].includes(key))
      ) {
        failures.push(
          'portable overlay lock file entry must contain only path and sha256',
        );
        continue;
      }
      const relative = entry.path;
      const normalized =
        typeof relative === 'string' ? relative.replaceAll('\\', '/') : '';
      if (
        !relative ||
        normalized !== relative ||
        path.posix.isAbsolute(relative) ||
        relative === '..' ||
        relative.startsWith('../')
      )
        failures.push(
          `portable overlay lock files contains a non-portable path: ${relative}`,
        );
      if (seenPaths.has(relative))
        failures.push(
          `portable overlay lock files contains a duplicate path: ${relative}`,
        );
      seenPaths.add(relative);
      if (
        typeof entry.sha256 !== 'string' ||
        !/^[a-f0-9]{64}$/u.test(entry.sha256)
      )
        failures.push(
          `portable overlay lock files contains a non-SHA-256 value: ${relative}`,
        );
    }
  }
  if (
    !value.json_sections ||
    typeof value.json_sections !== 'object' ||
    Array.isArray(value.json_sections)
  )
    failures.push('portable overlay lock json_sections must be an object');
  else
    for (const [relative, sections] of Object.entries(value.json_sections)) {
      if (
        path.posix.isAbsolute(relative) ||
        relative.includes('\\') ||
        relative === '..' ||
        relative.startsWith('../')
      )
        failures.push(
          `portable overlay lock json_sections contains a non-portable path: ${relative}`,
        );
      validateHashMap(
        sections,
        `portable overlay lock json_sections ${relative}`,
      );
    }
  return failures;
}

export function validateRunnerDeliveryContract(project, ownership) {
  const rows = ownership?.assets ?? [];
  const failures = [];
  for (const destination of [
    'scripts/run-bounded-agent.mjs',
    'scripts/lib/boundedProcess.mjs',
    'scripts/lib/dispatchBoundary.mjs',
  ]) {
    const row = rows.find((candidate) => candidate.destination === destination);
    if (!row) {
      failures.push(
        `Bounded runner delivery mapping is missing: ${project}/${destination}`,
      );
      continue;
    }
    if (
      row.mode !== 'generated' ||
      row.sourcePath !== destination ||
      row.installMode !== 'file'
    ) {
      failures.push(
        `Bounded runner delivery mapping is malformed: ${project}/${destination}`,
      );
    }
  }
  const packageRow = rows.find(
    (row) => row.destination === 'package.json#scripts',
  );
  if (
    !packageRow ||
    packageRow.mode !== 'project-owned-reference' ||
    !Array.isArray(packageRow.managedSections) ||
    !packageRow.managedSections.includes('scripts.agent:run')
  ) {
    failures.push(
      `Bounded runner package wiring is unmanaged: ${project}/scripts.agent:run`,
    );
  }
  return failures;
}

function setDottedValue(target, dotted, value) {
  const parts = dotted.split('.');
  let current = target;
  for (const key of parts.slice(0, -1)) current = current[key] ??= {};
  current[parts.at(-1)] = value;
}

export function comparePortableOverlayFiles(expected, actual) {
  const failures = [];
  const expectedFiles = new Map(
    (expected.files ?? []).map((entry) => [entry.path, entry.sha256]),
  );
  const actualFiles = new Map(
    (actual.files ?? []).map((entry) => [entry.path, entry.sha256]),
  );
  for (const [relative, hash] of expectedFiles) {
    if (!actualFiles.has(relative))
      failures.push(
        `portable overlay lock contains a file absent from the reviewed source: ${relative}`,
      );
    else if (actualFiles.get(relative) !== hash)
      failures.push(
        `portable overlay source differs from its lock: ${relative}`,
      );
  }
  for (const relative of actualFiles.keys()) {
    if (!expectedFiles.has(relative))
      failures.push(
        `portable overlay source has an unlocked managed file: ${relative}`,
      );
  }
  return failures;
}

export function validatePortableOverlaySourceParity(
  projectFilesRoot,
  manifest,
) {
  const lockPath = path.join(
    projectFilesRoot,
    '.ai-organization',
    'overlay-lock.json',
  );
  if (!fs.existsSync(lockPath)) return [];
  const expected = readJson(lockPath);
  const fixtureBase = fs.mkdtempSync(
    path.join(os.tmpdir(), `${manifest.project}-portable-overlay-`),
  );
  const installedRoot = path.join(fixtureBase, 'project');
  const fixtureHome = path.join(fixtureBase, 'home');
  try {
    fs.mkdirSync(installedRoot, { recursive: true });
    fs.mkdirSync(fixtureHome, { recursive: true });
    runInstall({
      repoRoot,
      manifest,
      roots: { [manifest.rootToken]: installedRoot, HOME: fixtureHome },
    });
    const installedOwnership = readJson(
      path.join(installedRoot, '.ai-organization', 'ownership.json'),
    );
    for (const [relative, sections] of Object.entries(
      installedOwnership.managed_json_sections ?? {},
    )) {
      const file = path.join(installedRoot, relative);
      if (fs.existsSync(file)) continue;
      const value = {};
      for (const section of sections)
        setDottedValue(value, section, `portable-overlay-fixture:${section}`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
    }
    return comparePortableOverlayFiles(
      expected,
      buildOverlayLock(installedRoot),
    ).map((message) => `portable overlay source parity: ${message}`);
  } finally {
    fs.rmSync(fixtureBase, { recursive: true, force: true });
  }
}

export function validateManagedOwnershipSourceParity(
  projectFilesRoot,
  manifest,
) {
  if (manifest.project !== 'auxara-dialer') return [];
  const ownershipPath = path.join(
    projectFilesRoot,
    '.ai-organization',
    'ownership.json',
  );
  if (!fs.existsSync(ownershipPath)) return [];
  const fixtureBase = fs.mkdtempSync(
    path.join(os.tmpdir(), `${manifest.project}-managed-overlay-`),
  );
  const installedRoot = path.join(fixtureBase, 'project');
  const fixtureHome = path.join(fixtureBase, 'home');
  try {
    fs.mkdirSync(installedRoot, { recursive: true });
    fs.mkdirSync(fixtureHome, { recursive: true });
    runInstall({
      repoRoot,
      manifest,
      roots: { [manifest.rootToken]: installedRoot, HOME: fixtureHome },
    });
    return validateOrganizationOverlay(installedRoot).map(
      (message) => `managed ownership source parity: ${message}`,
    );
  } finally {
    fs.rmSync(fixtureBase, { recursive: true, force: true });
  }
}

export function validateOverlay(project, rootsOverride = undefined) {
  const { overlayRoot, manifest, roots } = loadOverlay(project, rootsOverride);
  const failures = [...validateCanonical({ repoRoot, manifest })];
  if (manifest.project !== project)
    failures.push({
      type: 'overlay',
      message: `Project id mismatch: ${manifest.project}`,
    });
  const ownershipFile = path.join(overlayRoot, 'ownership.v1.json');
  if (!fs.existsSync(ownershipFile))
    failures.push({
      type: 'overlay',
      message: 'ownership.v1.json is required',
    });
  else {
    const ownership = readJson(ownershipFile);
    const allowedModes = new Set([
      'generated',
      'project-owned-reference',
      'external-state',
      'retired',
    ]);
    const rows = new Map();
    for (const row of ownership.assets ?? []) {
      if (rows.has(row.id))
        failures.push({
          type: 'overlay',
          message: `Duplicate ownership row: ${row.id}`,
        });
      rows.set(row.id, row);
      if (!allowedModes.has(row.mode))
        failures.push({
          type: 'overlay',
          message: `Unknown ownership mode: ${row.id}/${row.mode}`,
        });
      if (row.sourcePath) {
        if (row.mode !== 'generated')
          failures.push({
            type: 'overlay',
            message: `Only generated rows may declare sourcePath: ${row.id}`,
          });
        if (!['file', 'tree'].includes(row.installMode))
          failures.push({
            type: 'overlay',
            message: `Generated project file lacks installMode: ${row.id}`,
          });
        if (
          !Array.isArray(row.allowedExtensions) ||
          row.allowedExtensions.length === 0
        )
          failures.push({
            type: 'overlay',
            message: `Generated project file lacks an extension allowlist: ${row.id}`,
          });
        if (typeof row.detectLocalOnly !== 'boolean')
          failures.push({
            type: 'overlay',
            message: `Generated project file lacks local-only policy: ${row.id}`,
          });
        const normalized = path.posix.normalize(
          row.sourcePath.replaceAll('\\', '/'),
        );
        if (
          path.posix.isAbsolute(normalized) ||
          normalized === '..' ||
          normalized.startsWith('../')
        )
          failures.push({
            type: 'overlay',
            message: `Generated project source escapes overlay: ${row.id}`,
          });
        if (row.destination === '.ai-organization/overlay-lock.json') {
          try {
            const lock = readJson(
              path.join(overlayRoot, 'project-files', normalized),
            );
            for (const message of validatePortableOverlayLock(lock))
              failures.push({ type: 'overlay', message });
          } catch (error) {
            failures.push({
              type: 'overlay',
              message: `Portable overlay lock is unreadable: ${error.message}`,
            });
          }
        }
      }
    }
    for (const message of validateRunnerDeliveryContract(project, ownership)) {
      failures.push({ type: 'overlay', message });
    }
    for (const message of validatePortableOverlaySourceParity(
      path.join(overlayRoot, 'project-files'),
      manifest,
    )) {
      failures.push({ type: 'overlay', message });
    }
    for (const message of validateManagedOwnershipSourceParity(
      path.join(overlayRoot, 'project-files'),
      manifest,
    )) {
      failures.push({ type: 'overlay', message });
    }
    for (const mapping of manifest.mappings) {
      const row = rows.get(mapping.id);
      if (!row)
        failures.push({
          type: 'overlay',
          message: `Mapping lacks ownership row: ${mapping.id}`,
        });
      else if (row.mode !== 'generated')
        failures.push({
          type: 'overlay',
          message: `Installable mapping must be generated: ${mapping.id}`,
        });
    }
  }
  const rootToken = manifest.rootToken;
  const expectedLock = `\${HOME}/.nuvoralink-control-plane/project-locks/${project}/overlay-lock.json`;
  for (const mapping of manifest.mappings) {
    for (const destination of mapping.destinations) {
      if (!destination.startsWith(`\${${rootToken}}/`))
        failures.push({
          type: 'overlay',
          message: `Destination escapes project root: ${mapping.id}/${destination}`,
        });
    }
    if (mapping.lock !== expectedLock)
      failures.push({
        type: 'overlay',
        message: `Overlay runtime lock must stay outside the product repository: ${mapping.id}`,
      });
  }
  if (roots[rootToken])
    failures.push(
      ...validateManifest(manifest, repoRoot, roots).map((message) => ({
        type: 'manifest',
        message,
      })),
    );
  return failures;
}

function printFailures(failures, stderr = console.error) {
  failures.forEach((failure) =>
    stderr(typeof failure === 'string' ? failure : JSON.stringify(failure)),
  );
}

export function parseProjectOverlayArgs(argv) {
  const [command, project, ...rest] = argv;
  if (
    ![
      'validate',
      'check',
      'install',
      'capture',
      'digest',
      'inventory',
      'rollback',
    ].includes(command) ||
    !project
  ) {
    throw new Error(
      'Usage: project-overlay.mjs <validate|check|install|capture|digest|inventory|rollback> <project> [--root PATH] [--dry-run] [--update-existing] [--mapping ID] [--file MAPPING:RELATIVE] [--adopt-existing] [--reconcile-installed MAPPING:SHA256] [--reconcile-target MAPPING:SHA256] [--install-id ID]',
    );
  }
  let rootOverride;
  const forwarded = [];
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value !== '--root') {
      forwarded.push(value);
      continue;
    }
    if (rootOverride !== undefined) throw new Error('Duplicate --root');
    rootOverride = rest[index + 1];
    if (!rootOverride || rootOverride.startsWith('--'))
      throw new Error('--root requires a path');
    index += 1;
  }
  return {
    project,
    rootOverride,
    ...parseControlPlaneArgs([command, ...forwarded]),
  };
}

export function runProjectOverlayCli(argv, context = {}) {
  const stdout = context.stdout ?? console.log;
  const stderr = context.stderr ?? console.error;
  try {
    const {
      command,
      project,
      rootOverride,
      dryRun,
      updateExisting,
      mappingIds,
      fileSelectors,
      adoptExisting,
      reconcileInstalled,
      reconcileTarget,
      installId,
    } = parseProjectOverlayArgs(argv);
    const loaded = loadOverlay(project, context.rootsOverride);
    const roots = { ...loaded.roots };
    if (rootOverride !== undefined) {
      roots[loaded.manifest.rootToken] = path.resolve(rootOverride);
    }
    const failures = validateOverlay(project, roots);
    let portableCaptureReplacementValid = false;
    let managedCaptureReplacementValid = false;
    if (command === 'capture' && roots[loaded.manifest.rootToken]) {
      managedCaptureReplacementValid =
        validateOrganizationOverlay(roots[loaded.manifest.rootToken]).length ===
        0;
      const replacement = path.join(
        roots[loaded.manifest.rootToken],
        '.ai-organization',
        'overlay-lock.json',
      );
      if (fs.existsSync(replacement)) {
        try {
          portableCaptureReplacementValid =
            validatePortableOverlayLock(readJson(replacement)).length === 0;
        } catch {
          portableCaptureReplacementValid = false;
        }
      }
    }
    const refreshingPortableLock =
      command === 'capture' &&
      mappingIds?.length === 1 &&
      mappingIds[0] === `${project}-project-portable-lock`;
    const blockingFailures =
      command === 'capture'
        ? failures.filter(
            (failure) =>
              failure.type !== 'empty-source' &&
              !(
                portableCaptureReplacementValid &&
                failure.type === 'overlay' &&
                failure.message?.startsWith('portable overlay lock ')
              ) &&
              !(
                refreshingPortableLock &&
                failure.type === 'overlay' &&
                failure.message?.startsWith('portable overlay source parity:')
              ) &&
              !(
                managedCaptureReplacementValid &&
                failure.type === 'overlay' &&
                failure.message?.startsWith('managed ownership source parity:')
              ),
          )
        : failures;
    if (blockingFailures.length > 0) {
      printFailures(blockingFailures, stderr);
      return 1;
    }
    if (command === 'validate') {
      stdout(`${project} overlay validation passed`);
      return 0;
    }
    if (command === 'inventory') {
      stdout(
        JSON.stringify(
          {
            project,
            rootToken: loaded.manifest.rootToken,
            mappings: loaded.manifest.mappings.map(
              ({ id, source, destinations }) => ({ id, source, destinations }),
            ),
          },
          null,
          2,
        ),
      );
      return 0;
    }
    if (command === 'check') {
      const problems = runCheck({
        repoRoot,
        manifest: loaded.manifest,
        roots,
        mappingIds,
      });
      if (problems.length) {
        printFailures(problems, stderr);
        return 1;
      }
      stdout(`${project} overlay check passed`);
      return 0;
    }
    if (command === 'digest') {
      stdout(
        JSON.stringify(
          runDigest({ manifest: loaded.manifest, roots, mappingIds }),
        ),
      );
      return 0;
    }
    if (command === 'rollback') {
      const ids = runRollback({ manifest: loaded.manifest, roots, installId });
      stdout(`rolled back install ${[...new Set(ids)].join(', ')}`);
      return 0;
    }
    const operations =
      command === 'capture'
        ? runCapture({
            repoRoot,
            manifest: loaded.manifest,
            roots,
            dryRun,
            updateExisting,
            mappingIds,
            fileSelectors,
          })
        : runInstall({
            repoRoot,
            manifest: loaded.manifest,
            roots,
            dryRun,
            adoptExisting,
            mappingIds,
            reconcileInstalled,
            reconcileTarget,
            reconcileTargetCommand: (mappingId, digest) => {
              const rootOption =
                rootOverride === undefined
                  ? ''
                  : ` --root '${rootOverride.replaceAll("'", "''")}'`;
              return `node scripts/project-overlay.mjs install ${project}${rootOption} --mapping ${mappingId} --reconcile-target ${mappingId}:${digest}`;
            },
          });
    operations.forEach((operation) => {
      const reviewedTarget = operation.reviewedTargetDigest
        ? `\treviewed-target-sha256=${operation.reviewedTargetDigest}`
        : '';
      stdout(
        `${operation.type}\t${operation.mapping}\t${operation.relative || '.'}${reviewedTarget}`,
      );
    });
    stdout(`operations=${operations.length} dryRun=${dryRun}`);
    return 0;
  } catch (error) {
    stderr(error.message);
    return 1;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = runProjectOverlayCli(process.argv.slice(2));
}
