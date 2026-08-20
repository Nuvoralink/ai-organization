#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Startup-context budget for the always-loaded layer (CLAUDE.md + its `@` imports).
//
// The measured post-router startup is ~2.6K tokens. The 6K hard ceiling leaves reviewed growth room
// while keeping the project near its ~4K target. Path-scoped rules load only on demand and must not
// also be imported explicitly; duplicate delivery fails even when unique-byte accounting is unchanged.
export const DEFAULT_MAX_STARTUP_TOKENS = 6_000;
export const APPROXIMATE_CHARS_PER_TOKEN = 4;

function parseArgs(argv) {
  const result = {
    root: process.cwd(),
    maxTokens: DEFAULT_MAX_STARTUP_TOKENS,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--root') {
      result.root = path.resolve(argv[++index] ?? '');
    } else if (value === '--max-tokens') {
      result.maxTokens = Number(argv[++index]);
    } else if (value === '--json') {
      result.json = true;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (!Number.isFinite(result.maxTokens) || result.maxTokens <= 0) {
    throw new Error('--max-tokens must be a positive number');
  }

  return result;
}

function hasPathsFrontmatter(source) {
  if (!source.startsWith('---')) return false;
  const end = source.indexOf('\n---', 3);
  if (end === -1) return false;
  return /^paths\s*:/m.test(source.slice(3, end));
}

function findRuleFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...findRuleFiles(absolute));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(absolute);
  }
  return files;
}

function importTargets(source) {
  return source
    .split(/\r?\n/u)
    .map((line) => line.match(/^\s*@([^\s]+)\s*$/u)?.[1])
    .filter(Boolean);
}

export function inspectAgentStartupContext(root, maxTokens = DEFAULT_MAX_STARTUP_TOKENS) {
  const repoRoot = path.resolve(root);
  const included = new Map();
  const firstParent = new Map();
  const failures = [];

  function includeFile(absolute, ancestry = [], parent = '<entry>') {
    const resolved = path.resolve(absolute);
    if (included.has(resolved)) {
      failures.push(
        `Duplicate startup import: ${path.relative(repoRoot, resolved)} is reached from ${firstParent.get(resolved)} and ${parent}`,
      );
      return;
    }
    if (!resolved.startsWith(`${repoRoot}${path.sep}`) && resolved !== repoRoot) {
      failures.push(
        `External startup import is outside the measurable repository budget: ${resolved}`,
      );
      return;
    }
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      failures.push(
        `Startup context import does not resolve: ${path.relative(repoRoot, resolved)}`,
      );
      return;
    }
    if (ancestry.length >= 5) {
      failures.push(
        `Startup context import exceeds Claude's five-hop limit: ${path.relative(repoRoot, resolved)}`,
      );
      return;
    }

    const source = fs.readFileSync(resolved, 'utf8');
    included.set(resolved, source.length);
    firstParent.set(resolved, parent);
    for (const target of importTargets(source)) {
      if (target.startsWith('~') || path.isAbsolute(target)) {
        failures.push(`External startup import cannot be budgeted deterministically: ${target}`);
        continue;
      }
      includeFile(
        path.resolve(path.dirname(resolved), target),
        [...ancestry, resolved],
        path.relative(repoRoot, resolved),
      );
    }
  }

  for (const entry of ['CLAUDE.md', path.join('.claude', 'CLAUDE.md')]) {
    const absolute = path.join(repoRoot, entry);
    if (fs.existsSync(absolute)) includeFile(absolute);
  }

  if (included.size === 0) failures.push('No project CLAUDE.md entry file was found.');

  for (const rule of findRuleFiles(path.join(repoRoot, '.claude', 'rules'))) {
    const source = fs.readFileSync(rule, 'utf8');
    if (hasPathsFrontmatter(source)) {
      const resolved = path.resolve(rule);
      if (included.has(resolved)) {
        failures.push(
          `Duplicate startup/rules-engine reachability: ${path.relative(repoRoot, resolved)} is explicitly reached from ${firstParent.get(resolved)} and is also reachable through official paths: frontmatter`,
        );
      }
    } else {
      failures.push(
        `Rule lacks official \`paths:\` frontmatter and would load at startup: ${path.relative(repoRoot, rule)}`,
      );
      includeFile(rule);
    }
  }

  const files = [...included.entries()]
    .map(([absolute, chars]) => ({
      path: path.relative(repoRoot, absolute).replaceAll(path.sep, '/'),
      chars,
      approximateTokens: Math.ceil(chars / APPROXIMATE_CHARS_PER_TOKEN),
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const totalChars = files.reduce((total, file) => total + file.chars, 0);
  const approximateTokens = Math.ceil(totalChars / APPROXIMATE_CHARS_PER_TOKEN);

  if (approximateTokens > maxTokens) {
    failures.push(
      `Startup context is approximately ${approximateTokens.toLocaleString()} tokens; budget is ${maxTokens.toLocaleString()}. ` +
        'Move task-specific instructions to path-scoped rules or skills instead of adding another always-loaded layer.',
    );
  }

  return {
    ok: failures.length === 0,
    root: repoRoot,
    maxTokens,
    totalChars,
    approximateTokens,
    files,
    failures,
  };
}

function runCli() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`check-agent-context-budget: FAILED — ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const report = inspectAgentStartupContext(options.root, options.maxTokens);
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else if (report.ok) {
    console.log(
      `check-agent-context-budget: OK — ~${report.approximateTokens.toLocaleString()} startup tokens ` +
        `across ${report.files.length} files (budget ${report.maxTokens.toLocaleString()}).`,
    );
    for (const file of report.files) {
      console.log(`  ${file.path}: ~${file.approximateTokens.toLocaleString()} tokens`);
    }
  } else {
    console.error('check-agent-context-budget: FAILED');
    for (const failure of report.failures) console.error(`  - ${failure}`);
  }
  process.exitCode = report.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli();
