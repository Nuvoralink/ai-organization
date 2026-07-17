#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadRoots,
  readJson,
  runCapture,
  runCheck,
  runInstall,
  validateRegistries
} from './lib/control-plane.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = readJson(path.join(repoRoot, 'control-plane.manifest.json'));
const roots = loadRoots(repoRoot);
const command = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

function printOperations(operations) {
  for (const operation of operations) console.log(`${operation.type}\t${operation.mapping}\t${operation.relative || '.'}`);
  console.log(`operations=${operations.length} dryRun=${dryRun}`);
}
try {
  if (command === 'check') {
    const problems = [...validateRegistries(repoRoot), ...runCheck({ repoRoot, manifest, roots })];
    if (problems.length > 0) {
      for (const problem of problems) console.error(typeof problem === 'string' ? problem : JSON.stringify(problem));
      console.error(`control-plane check failed: ${problems.length} problem(s)`);
      process.exitCode = 1;
    } else console.log('control-plane check passed');
  } else if (command === 'capture') {
    printOperations(runCapture({ repoRoot, manifest, roots, dryRun }));
  } else if (command === 'install') {
    printOperations(runInstall({ repoRoot, manifest, roots, dryRun }));
  } else if (command === 'inventory') {
    console.log(JSON.stringify({ mappings: manifest.mappings.map(({ id, source, destinations, ownership }) => ({ id, source, destinations, ownership })) }, null, 2));
  } else {
    console.error('Usage: node scripts/control-plane.mjs <check|capture|install|inventory> [--dry-run]');
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
