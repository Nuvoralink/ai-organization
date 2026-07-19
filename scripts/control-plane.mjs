#!/usr/bin/env node
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
  validateRegistries
} from './lib/control-plane.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = readJson(path.join(repoRoot, 'control-plane.manifest.json'));
const roots = loadRoots(repoRoot);
const command = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
const adoptExisting = process.argv.includes('--adopt-existing');
const updateExisting = process.argv.includes('--update-existing');
const mappingIds = process.argv.flatMap((value, index, values) => value === '--mapping' && values[index + 1] ? [values[index + 1]] : []);
const fileSelectors = process.argv.flatMap((value, index, values) => value === '--file' && values[index + 1] ? [values[index + 1]] : []);

function printOperations(operations) {
  for (const operation of operations) console.log(`${operation.type}\t${operation.mapping}\t${operation.relative || '.'}`);
  console.log(`operations=${operations.length} dryRun=${dryRun}`);
}
try {
  if (command === 'validate') {
    const problems = [...validateRegistries(repoRoot), ...validateCanonical({ repoRoot, manifest })];
    if (problems.length > 0) {
      for (const problem of problems) console.error(typeof problem === 'string' ? problem : JSON.stringify(problem));
      console.error(`control-plane validation failed: ${problems.length} problem(s)`);
      process.exitCode = 1;
    } else console.log('control-plane validation passed');
  } else if (command === 'check') {
    const problems = [...validateRegistries(repoRoot), ...runCheck({
      repoRoot,
      manifest,
      roots,
      mappingIds: mappingIds.length > 0 ? mappingIds : undefined
    })];
    if (problems.length > 0) {
      for (const problem of problems) console.error(typeof problem === 'string' ? problem : JSON.stringify(problem));
      console.error(`control-plane check failed: ${problems.length} problem(s)`);
      process.exitCode = 1;
    } else console.log('control-plane check passed');
  } else if (command === 'capture') {
    printOperations(runCapture({
      repoRoot,
      manifest,
      roots,
      dryRun,
      updateExisting,
      mappingIds: mappingIds.length > 0 ? mappingIds : undefined,
      fileSelectors: fileSelectors.length > 0 ? fileSelectors : undefined
    }));
  } else if (command === 'install') {
    printOperations(runInstall({
      repoRoot,
      manifest,
      roots,
      dryRun,
      adoptExisting,
      mappingIds: mappingIds.length > 0 ? mappingIds : undefined
    }));
  } else if (command === 'inventory') {
    console.log(JSON.stringify({ mappings: manifest.mappings.map(({ id, source, destinations, ownership }) => ({ id, source, destinations, ownership })) }, null, 2));
  } else if (command === 'rollback') {
    const idIndex = process.argv.indexOf('--install-id');
    const ids = runRollback({ manifest, roots, installId: idIndex >= 0 ? process.argv[idIndex + 1] : undefined });
    console.log(`rolled back install ${[...new Set(ids)].join(', ')}`);
  } else {
    console.error('Usage: node scripts/control-plane.mjs <validate|check|capture|install|inventory|rollback> [--dry-run] [--update-existing] [--mapping ID] [--file MAPPING:RELATIVE] [--adopt-existing] [--install-id ID]');
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
