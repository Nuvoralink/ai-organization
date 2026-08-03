#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesRoot = path.join(root, '.claude', 'rules');
const problems = [];
const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
const claude = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');

if (fs.existsSync(path.join(root, '.cursor', 'rules'))) problems.push('retired parallel rules authority exists: .cursor/rules');
if (!/@AGENTS\.md/u.test(claude)) problems.push('CLAUDE.md must import the canonical AGENTS.md router');
const referenced = new Set([...agents.matchAll(/\.claude\/rules\/([A-Za-z0-9._-]+\.md)/gu)].map((match) => match[1]));
const files = fs.readdirSync(rulesRoot).filter((name) => name.endsWith('.md')).sort();
for (const name of files) {
  const text = fs.readFileSync(path.join(rulesRoot, name), 'utf8');
  if (!/^---\r?\n[\s\S]*?\r?\n---/u.test(text) || !/^paths:\s*$/mu.test(text)) problems.push(`rule lacks paths frontmatter: .claude/rules/${name}`);
  if (!referenced.has(name)) problems.push(`rule is undiscoverable from AGENTS.md: .claude/rules/${name}`);
}
for (const name of referenced) if (!files.includes(name)) problems.push(`AGENTS.md references missing rule: .claude/rules/${name}`);
if (problems.length) {
  console.error(['rules-wiring: FAIL', ...problems.map((problem) => `- ${problem}`)].join('\n'));
  process.exit(1);
}
console.log(`rules-wiring: PASS — ${files.length} path-scoped rules`);
