#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { classifyTrackedScope } from './lib/control-plane.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function reconcileTrackedScope(files, existing, { approvals = new Map(), prune = false } = {}) {
  const current = new Map((existing?.files ?? []).map((entry) => [entry.path, entry.class]));
  const fileSet = new Set(files);
  const failures = [];
  const rows = [];
  for (const relative of files) {
    const suggestedClass = classifyTrackedScope(relative);
    if (!suggestedClass) { failures.push(`Unsupported orchestration-scope path: ${relative}`); continue; }
    const declaredClass = current.get(relative) ?? approvals.get(relative);
    if (!declaredClass) { failures.push(`Unreviewed new path requires --approve ${relative}=${suggestedClass}`); continue; }
    if (declaredClass !== suggestedClass) { failures.push(`Tracked scope class mismatch: ${relative} (${declaredClass} != ${suggestedClass})`); continue; }
    rows.push({ path: relative, class: declaredClass });
  }
  for (const relative of current.keys()) if (!fileSet.has(relative) && !prune) failures.push(`Stale tracked-scope row requires --prune: ${relative}`);
  for (const relative of approvals.keys()) if (!fileSet.has(relative)) failures.push(`Approved path is not present: ${relative}`);
  if (failures.length > 0) throw new Error(failures.join('\n'));
  return { version: '1.0.0', scope: 'orchestration-only', files: rows };
}

function cli(argv) {
  const result = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0 || result.error) throw result.error ?? new Error(result.stderr || 'Unable to inventory repository files');
  const files = [...new Set(result.stdout.split('\0').filter(Boolean).map((value) => value.replaceAll('\\', '/')))]
    .filter((relative) => fs.existsSync(path.join(repoRoot, relative)))
    .sort();
  const target = path.join(repoRoot, 'registries', 'tracked-scope.v1.json');
  const existing = JSON.parse(fs.readFileSync(target, 'utf8'));
  const approvals = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== '--approve') continue;
    const value = argv[index + 1] ?? '';
    const separator = value.lastIndexOf('=');
    if (separator <= 0) throw new Error('--approve requires PATH=CLASS');
    approvals.set(value.slice(0, separator).replaceAll('\\', '/'), value.slice(separator + 1));
    index += 1;
  }
  const registry = reconcileTrackedScope(files, existing, { approvals, prune: argv.includes('--prune') });
  const serialized = `${JSON.stringify(registry, null, 2)}\n`;
  if (argv.includes('--check')) {
    const current = fs.readFileSync(target, 'utf8');
    if (current !== serialized) throw new Error('Tracked-scope registry is not canonical; run npm run control:scope:refresh');
  } else {
    fs.writeFileSync(target, serialized);
  }
  console.log(`tracked-scope: verified ${registry.files.length} reviewed exact classifications`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli(process.argv.slice(2));
