#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const all = process.argv.includes('--all');
const testPattern = /(?:^|\/)(?:[^/]+\.)?(?:test|spec)\.(?:[cm]?[jt]sx?)$/u;
const ignored = /(?:^|\/)(?:node_modules|dist|build|coverage)(?:\/|$)/u;
function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).replaceAll('\\', '/');
    if (ignored.test(relative)) continue;
    if (entry.isDirectory()) walk(absolute, output);
    else if (entry.isFile() && testPattern.test(relative)) output.push(relative);
  }
  return output;
}
let files;
if (all) files = walk(root);
else {
  const commands = [
    ['diff', '--name-only', '--diff-filter=ACMR', 'origin/develop...HEAD'],
    ['diff', '--name-only', '--diff-filter=ACMR'],
    ['diff', '--name-only', '--diff-filter=ACMR', '--cached'],
    ['ls-files', '--others', '--exclude-standard'],
  ];
  files = [...new Set(commands.flatMap((args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    return result.status === 0 ? result.stdout.split(/\r?\n/u).filter(Boolean) : [];
  }).map((file) => file.replaceAll('\\', '/')).filter((file) => testPattern.test(file) && !ignored.test(file)))];
}
const required = ['Proves:', 'Test type:', 'Surface:', 'Authority:', 'What this test proves about the product:', 'Killer mutation:', 'Gated command:'];
const problems = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const field of required) if (!text.includes(field)) problems.push(`${file} missing "${field}"`);
}
if (problems.length) {
  console.error(['test-intent: FAIL', ...problems.map((problem) => `- ${problem}`)].join('\n'));
  process.exit(1);
}
console.log(`test-intent: PASS — checked=${files.length} mode=${all ? 'all' : 'changed'}`);
