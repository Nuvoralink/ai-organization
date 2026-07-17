#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { classifyTrackedScope } from './lib/control-plane.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: repoRoot, encoding: 'utf8' });
if (result.status !== 0 || result.error) throw result.error ?? new Error(result.stderr || 'Unable to inventory repository files');
const files = [...new Set(result.stdout.split('\0').filter(Boolean).map((value) => value.replaceAll('\\', '/')))].sort();
const unsupported = files.filter((relative) => !classifyTrackedScope(relative));
if (unsupported.length) throw new Error(`Unsupported orchestration-scope paths:\n${unsupported.join('\n')}`);
const registry = {
  version: '1.0.0',
  scope: 'orchestration-only',
  files: files.map((relative) => ({ path: relative, class: classifyTrackedScope(relative) }))
};
const target = path.join(repoRoot, 'registries', 'tracked-scope.v1.json');
fs.writeFileSync(target, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`tracked-scope: wrote ${registry.files.length} exact classifications`);
