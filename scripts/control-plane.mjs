#!/usr/bin/env node
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
  validateRegistries
} from './lib/control-plane.mjs';

const entrypointPath = path.resolve(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(path.dirname(entrypointPath), '..');

function printOperations(operations, dryRun, stdout) {
  for (const operation of operations) stdout(`${operation.type}\t${operation.mapping}\t${operation.relative || '.'}`);
  stdout(`operations=${operations.length} dryRun=${dryRun}`);
}

export function runControlPlaneCli(argv, context = {}) {
  const repoRoot = context.repoRoot ?? defaultRepoRoot;
  const manifest = context.manifest ?? readJson(path.join(repoRoot, 'control-plane.manifest.json'));
  const roots = context.roots ?? loadRoots(repoRoot);
  const stdout = context.stdout ?? console.log;
  const stderr = context.stderr ?? console.error;
  try {
    const { command, dryRun, adoptExisting, updateExisting, mappingIds, fileSelectors, reconcileInstalled, installId } = parseControlPlaneArgs(argv);
    if (command === 'validate') {
      const problems = [...validateRegistries(repoRoot), ...validateCanonical({ repoRoot, manifest })];
      if (problems.length > 0) {
        for (const problem of problems) stderr(typeof problem === 'string' ? problem : JSON.stringify(problem));
        stderr(`control-plane validation failed: ${problems.length} problem(s)`);
        return 1;
      }
      stdout('control-plane validation passed');
    } else if (command === 'check') {
      const skippedInstalledEntries = [];
      const informationalEntries = [];
      const problems = [
        ...validateRegistries(repoRoot),
        ...runCheck({ repoRoot, manifest, roots, mappingIds, skippedInstalledEntries, informationalEntries }),
      ];
      for (const entry of informationalEntries) stdout(JSON.stringify(entry));
      for (const skipped of skippedInstalledEntries) stdout(JSON.stringify(skipped));
      if (problems.length > 0) {
        for (const problem of problems) stderr(typeof problem === 'string' ? problem : JSON.stringify(problem));
        stderr(`control-plane check failed: ${problems.length} problem(s)`);
        return 1;
      }
      stdout('control-plane check passed');
    } else if (command === 'capture') {
      printOperations(runCapture({ repoRoot, manifest, roots, dryRun, updateExisting, mappingIds, fileSelectors }), dryRun, stdout);
    } else if (command === 'install') {
      printOperations(runInstall({ repoRoot, manifest, roots, dryRun, adoptExisting, reconcileInstalled, mappingIds }), dryRun, stdout);
    } else if (command === 'digest') {
      stdout(JSON.stringify(runDigest({ manifest, roots, mappingIds })));
    } else if (command === 'inventory') {
      stdout(JSON.stringify({ mappings: manifest.mappings.map(({ id, source, destinations, ownership }) => ({ id, source, destinations, ownership })) }, null, 2));
    } else if (command === 'rollback') {
      const ids = runRollback({ manifest, roots, installId });
      stdout(`rolled back install ${[...new Set(ids)].join(', ')}`);
    } else {
      stderr('Usage: node scripts/control-plane.mjs <validate|check|capture|install|digest|inventory|rollback> [--dry-run] [--update-existing] [--mapping ID] [--file MAPPING:RELATIVE] [--adopt-existing] [--reconcile-installed MAPPING:SHA256] [--install-id ID]');
      return 2;
    }
    return 0;
  } catch (error) {
    stderr(error.message);
    return 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
if (invokedPath?.toLowerCase() === entrypointPath.toLowerCase()) {
  process.exitCode = runControlPlaneCli(process.argv.slice(2));
}
