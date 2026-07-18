#!/usr/bin/env node
/**
 * Startup context gate.
 * Fails on broken/external/cyclic/double imports, unexpected always-on rules, or token budget overflow.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(match[1].split(/\r?\n/).map((line) => line.match(/^([^:#]+):\s*(.+)$/)).filter(Boolean).map((m) => [m[1].trim(), m[2].trim()]));
}

function importsOf(text) {
  return [...text.matchAll(/^\s*@([^\s]+)\s*$/gm)].map((m) => m[1]);
}

export function checkAgentContext(root = process.cwd()) {
  const errors = [];
  const configPath = path.join(root, '.ai-organization', 'context-budget.json');
  if (!fs.existsSync(configPath)) return { ok: false, errors: ['missing .ai-organization/context-budget.json'], files: [], estimatedTokens: 0 };
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const seen = new Set();
  const importedBy = new Map();
  const contents = [];

  function visit(rel, stack = []) {
    const normalized = rel.replace(/\\/g, '/').replace(/^\.\//, '');
    const abs = path.resolve(root, normalized);
    const rootPrefix = `${path.resolve(root)}${path.sep}`;
    if (abs !== path.resolve(root) && !abs.startsWith(rootPrefix)) {
      errors.push(`external startup import is forbidden: ${rel}`);
      return;
    }
    if (stack.includes(normalized)) {
      errors.push(`cyclic startup import: ${[...stack, normalized].join(' -> ')}`);
      return;
    }
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      errors.push(`missing startup import: ${normalized}`);
      return;
    }
    if (seen.has(normalized)) return;
    seen.add(normalized);
    const text = fs.readFileSync(abs, 'utf8');
    contents.push({ rel: normalized, text });
    for (const imported of importsOf(text)) {
      const child = path.posix.normalize(path.posix.join(path.posix.dirname(normalized), imported.replace(/\\/g, '/')));
      const parents = importedBy.get(child) ?? [];
      parents.push(normalized);
      importedBy.set(child, parents);
      if (parents.length > 1) errors.push(`startup file imported more than once: ${child} by ${parents.join(', ')}`);
      visit(child, [...stack, normalized]);
    }
  }

  visit(config.entrypoint);
  const rulesDir = path.join(root, '.cursor', 'rules');
  const alwaysOn = [];
  if (fs.existsSync(rulesDir)) {
    for (const name of fs.readdirSync(rulesDir).filter((n) => n.endsWith('.mdc')).sort()) {
      const rel = `.cursor/rules/${name}`;
      const text = fs.readFileSync(path.join(rulesDir, name), 'utf8');
      if (frontmatter(text).alwaysApply === 'true') {
        alwaysOn.push(rel);
        if (!seen.has(rel)) contents.push({ rel, text });
      }
    }
  }
  const allowed = new Set(config.allowed_always_on_rules ?? []);
  for (const rel of alwaysOn) if (!allowed.has(rel)) errors.push(`unexpected always-on rule: ${rel}`);
  for (const rel of allowed) if (!alwaysOn.includes(rel)) errors.push(`required always-on rule is not active: ${rel}`);
  if (!seen.has(config.canonical_router)) errors.push(`canonical router is not imported: ${config.canonical_router}`);

  const characters = contents.reduce((sum, item) => sum + item.text.length, 0);
  const estimatedTokens = Math.ceil(characters / 4);
  if (estimatedTokens > config.maximum_tokens) errors.push(`startup context ${estimatedTokens} tokens exceeds hard maximum ${config.maximum_tokens}`);
  return { ok: errors.length === 0, errors, files: contents.map((x) => x.rel), alwaysOn, estimatedTokens, targetTokens: config.target_tokens, maximumTokens: config.maximum_tokens };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rootArg = process.argv.indexOf('--root');
  const result = checkAgentContext(rootArg >= 0 ? path.resolve(process.argv[rootArg + 1]) : process.cwd());
  if (!result.ok) {
    console.error(['agent-context: FAIL', ...result.errors.map((e) => `- ${e}`)].join('\n'));
    process.exit(1);
  }
  console.log(`agent-context: PASS — ${result.estimatedTokens}/${result.maximumTokens} estimated startup tokens; ${result.files.length} unique files`);
}
