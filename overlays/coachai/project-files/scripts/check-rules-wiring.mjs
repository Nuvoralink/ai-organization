#!/usr/bin/env node
/** Canonical-rule wiring gate: compact router, complete JIT inventory, no duplicated Claude rule tree. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export function checkRulesWiring(root = process.cwd()) {
  const errors = [];
  const agentsPath = path.join(root, 'AGENTS.md');
  const claudePath = path.join(root, 'CLAUDE.md');
  if (!fs.existsSync(agentsPath) || !fs.existsSync(claudePath)) return { ok: false, errors: ['AGENTS.md and CLAUDE.md are required'] };
  const agents = fs.readFileSync(agentsPath, 'utf8');
  const claude = fs.readFileSync(claudePath, 'utf8');
  const importCount = (claude.match(/^\s*@AGENTS\.md\s*$/gm) ?? []).length;
  if (importCount !== 1) errors.push(`CLAUDE.md must import @AGENTS.md exactly once; found ${importCount}`);
  if (/\.cursor\/rules\/[^\s`)]+\.mdc/.test(claude)) errors.push('CLAUDE.md must not import/list canonical rules independently');
  if (fs.existsSync(path.join(root, '.claude', 'rules'))) errors.push('.claude/rules is a forbidden parallel rule authority');

  const rulesDir = path.join(root, '.cursor', 'rules');
  const names = fs.existsSync(rulesDir) ? fs.readdirSync(rulesDir).filter((n) => n.endsWith('.mdc')).sort() : [];
  const referenced = new Set([...agents.matchAll(/\.cursor\/rules\/([A-Za-z0-9._-]+\.mdc)/g)].map((m) => m[1]));
  for (const name of names) {
    const text = fs.readFileSync(path.join(rulesDir, name), 'utf8');
    if (!/^---\r?\n[\s\S]*?\r?\n---/.test(text)) errors.push(`rule lacks valid frontmatter: .cursor/rules/${name}`);
    if (!referenced.has(name)) errors.push(`canonical rule is absent from AGENTS.md routing: .cursor/rules/${name}`);
  }
  for (const name of referenced) if (!names.includes(name)) errors.push(`AGENTS.md references missing rule: .cursor/rules/${name}`);

  const cfgPath = path.join(root, '.ai-organization', 'context-budget.json');
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const allowed = new Set(cfg.allowed_always_on_rules ?? []);
    for (const name of names) {
      const text = fs.readFileSync(path.join(rulesDir, name), 'utf8');
      const always = /^alwaysApply:\s*true\s*$/m.test(text);
      const rel = `.cursor/rules/${name}`;
      if (always && !allowed.has(rel)) errors.push(`rule is always-on but not budget-approved: ${rel}`);
    }
  }
  return { ok: errors.length === 0, errors, ruleCount: names.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rootArg = process.argv.indexOf('--root');
  const result = checkRulesWiring(rootArg >= 0 ? path.resolve(process.argv[rootArg + 1]) : process.cwd());
  if (!result.ok) { console.error(['rules-wiring: FAIL', ...result.errors.map((e) => `- ${e}`)].join('\n')); process.exit(1); }
  console.log(`rules-wiring: PASS — ${result.ruleCount} canonical rules routed exactly once`);
}
