/**
 * Proves: ORG-CONTEXT-ROUTING-001
 * Test type: authority-reachability and physical source mutation
 * Surface: compact global routers, complete global Claude startup graph, and clean-context dispatch authorities
 * Authority: registries/context-authorities.v1.json
 * Killer mutation: delete one router trigger, make full-history the default, or remove paths from a global Claude rule
 * Gated command: npm test
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_MAX_STARTUP_TOKENS,
  inspectAgentStartupContext,
} from '../overlays/auxara-dialer/project-files/scripts/check-agent-context-budget.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(repoRoot, 'registries', 'context-authorities.v1.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

function read(relative) {
  return fs.readFileSync(path.join(repoRoot, relative), 'utf8');
}

function findMarkdown(relativeRoot) {
  const absoluteRoot = path.join(repoRoot, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) return [];
  return fs.readdirSync(absoluteRoot, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(relativeRoot, entry.name).replaceAll(path.sep, '/');
    if (entry.isDirectory()) return findMarkdown(relative);
    return entry.isFile() && entry.name.endsWith('.md') ? [relative] : [];
  });
}

function hasPathsFrontmatter(source) {
  if (!source.startsWith('---')) return false;
  const end = source.indexOf('\n---', 3);
  return end !== -1 && /^paths\s*:/mu.test(source.slice(3, end));
}

function importTargets(source) {
  return source
    .split(/\r?\n/u)
    .map((line) => line.match(/^\s*@([^\s]+)\s*$/u)?.[1])
    .filter(Boolean);
}

function inspectGlobalClaudeStartup({ sourceOverrides = new Map(), extraRules = new Map() } = {}) {
  const config = registry.globalClaudeStartup;
  const failures = [];
  const registered = new Map();
  for (const row of config.rules) {
    if (registered.has(row.path)) failures.push(`Duplicate registered global Claude rule: ${row.path}`);
    registered.set(row.path, row);
  }

  const actualRules = new Set([...findMarkdown(config.rulesRoot), ...extraRules.keys()]);
  for (const relative of actualRules) {
    if (!registered.has(relative)) failures.push(`Unregistered global Claude rule: ${relative}`);
  }
  for (const relative of registered.keys()) {
    if (!actualRules.has(relative)) failures.push(`Registered global Claude rule is missing: ${relative}`);
  }

  const included = new Map();
  const firstParent = new Map();
  const readSource = (relative) => sourceOverrides.get(relative) ?? extraRules.get(relative) ?? read(relative);
  const include = (relative, ancestry = [], parent = '<entry>') => {
    const normalized = path.posix.normalize(relative.replaceAll('\\', '/'));
    const absolute = path.resolve(repoRoot, normalized);
    if (!absolute.startsWith(`${repoRoot}${path.sep}`)) {
      failures.push(`External global Claude startup import: ${relative}`);
      return;
    }
    if (included.has(normalized)) {
      failures.push(`Duplicate global Claude startup import: ${normalized} from ${firstParent.get(normalized)} and ${parent}`);
      return;
    }
    if (ancestry.includes(normalized)) {
      failures.push(`Cyclic global Claude startup import: ${[...ancestry, normalized].join(' -> ')}`);
      return;
    }
    if (!sourceOverrides.has(normalized) && !extraRules.has(normalized) && !fs.existsSync(absolute)) {
      failures.push(`Missing global Claude startup import: ${normalized}`);
      return;
    }
    const source = readSource(normalized);
    included.set(normalized, { path: normalized, chars: source.length, reachability: normalized === config.entryPath ? 'router' : 'explicit-import' });
    firstParent.set(normalized, parent);
    for (const target of importTargets(source)) {
      if (target.startsWith('~') || path.isAbsolute(target)) {
        failures.push(`External global Claude startup import: ${target}`);
      } else {
        include(path.posix.join(path.posix.dirname(normalized), target), [...ancestry, normalized], normalized);
      }
    }
  };
  include(config.entryPath);

  for (const relative of actualRules) {
    const source = readSource(relative);
    const hasPaths = hasPathsFrontmatter(source);
    const declared = registered.get(relative)?.reachability;
    const actual = hasPaths ? 'path-scoped' : 'startup';
    if (declared && declared !== actual) {
      failures.push(`Global Claude rule reachability drift: ${relative} is ${actual}, registry declares ${declared}`);
    }
    if (hasPaths && included.has(relative)) {
      failures.push(`Duplicate global Claude explicit/rules-engine reachability: ${relative}`);
    }
    if (!hasPaths && !included.has(relative)) {
      included.set(relative, { path: relative, chars: source.length, reachability: 'unscoped-rule' });
    }
  }

  const files = [...included.values()].sort((a, b) => a.path.localeCompare(b.path));
  const totalChars = files.reduce((sum, file) => sum + file.chars, 0);
  const approximateTokens = Math.ceil(totalChars / registry.approximateCharsPerToken);
  if (approximateTokens >= config.maxApproximateTokens) {
    failures.push(`Global Claude fixed startup is ~${approximateTokens} tokens; target requires <${config.maxApproximateTokens}`);
  }
  return { approximateTokens, failures, files };
}

function authorityRouterMarker(authority) {
  if (authority.startsWith('global/claude/rules/')) {
    return `~/.claude/rules/${path.basename(authority)}`;
  }
  if (authority.startsWith('skills/') && authority.endsWith('/SKILL.md')) {
    return authority.split('/')[1];
  }
  if (authority.startsWith('builtin-skill:')) return authority.slice('builtin-skill:'.length);
  throw new Error(`Unsupported context authority shape: ${authority}`);
}

function validateRouter(relative, source) {
  const failures = [];
  const row = registry.routers.find((candidate) => candidate.path === relative);
  if (!row) failures.push(`unregistered router: ${relative}`);
  else {
    const tokens = Math.ceil(source.length / registry.approximateCharsPerToken);
    if (tokens >= row.maxApproximateTokens) {
      failures.push(`${relative} is ~${tokens} tokens; target requires <${row.maxApproximateTokens}`);
    }
  }
  for (const topic of registry.topics) {
    if (!source.includes(topic.routerMarker)) failures.push(`${relative} missing topic ${topic.id}`);
    const marker = authorityRouterMarker(topic.authority);
    if (!source.includes(marker)) failures.push(`${relative} missing ${topic.id} authority pointer ${marker}`);
  }
  if (!source.includes('fork_turns: "none"')) failures.push(`${relative} lost clean-context default`);
  const allCount = source.split('fork_turns: "all"').length - 1;
  if (allCount !== 1 || !source.includes('explicit exception with a recorded reason, never a default')) {
    failures.push(`${relative} permits full-history default or lacks its exception boundary`);
  }
  return failures;
}

test('global routers stay compact and route every semantic class to one canonical JIT authority', () => {
  assert.equal(registry.version, '1.1.0');
  assert.equal(new Set(registry.topics.map((topic) => topic.id)).size, registry.topics.length);
  for (const topic of registry.topics) {
    assert.ok(topic.trigger.length > 0, `${topic.id} needs an exact trigger`);
    assert.equal(typeof topic.authority, 'string', `${topic.id} needs exactly one canonical authority`);
    if (topic.authority.startsWith('builtin-skill:')) {
      assert.match(topic.authority, /^builtin-skill:(?:documents|presentations|spreadsheets)$/u, `${topic.id}: ${topic.authority}`);
    } else {
      assert.equal(fs.existsSync(path.join(repoRoot, topic.authority)), true, `${topic.id}: ${topic.authority}`);
    }
  }
  for (const router of registry.routers) {
    assert.deepEqual(validateRouter(router.path, read(router.path)), [], router.path);
  }
});

test('global Claude startup inventories every rule and contains no unscoped rule', () => {
  const result = inspectGlobalClaudeStartup();
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.files.map((file) => file.path), [registry.globalClaudeStartup.entryPath]);
  assert.equal(result.approximateTokens, Math.ceil(read(registry.globalClaudeStartup.entryPath).length / 4));
});

test('global Claude startup gate catches removed paths and unknown rules while preserving path-scoped JIT rules', () => {
  const relative = 'global/claude/rules/decision-discipline.md';
  const unscoped = read(relative).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, '');
  const mutation = inspectGlobalClaudeStartup({ sourceOverrides: new Map([[relative, unscoped]]) });
  assert.ok(mutation.files.some((file) => file.path === relative && file.reachability === 'unscoped-rule'));
  assert.ok(mutation.failures.some((failure) => failure.includes(`${relative} is startup`)));

  const unknown = inspectGlobalClaudeStartup({
    extraRules: new Map([['global/claude/rules/unregistered.md', '---\npaths:\n  - "src/**/*"\n---\n']]),
  });
  assert.ok(unknown.failures.some((failure) => failure.includes('Unregistered global Claude rule')));

  const duplicate = inspectGlobalClaudeStartup({
    sourceOverrides: new Map([
      [registry.globalClaudeStartup.entryPath, `${read(registry.globalClaudeStartup.entryPath)}\n@rules/decision-discipline.md\n`],
    ]),
  });
  assert.equal(duplicate.files.filter((file) => file.path === relative).length, 1);
  assert.ok(duplicate.failures.some((failure) => failure.includes('Duplicate global Claude explicit/rules-engine reachability')));

  const counterexample = inspectGlobalClaudeStartup();
  assert.equal(counterexample.files.some((file) => file.path === relative), false);
});

test('clean-context dispatch stays present in every global/template authority', () => {
  for (const relative of registry.dispatchAuthorities) {
    const source = read(relative);
    assert.match(source, /fork_turns: "none"/u, relative);
    assert.match(source, /fork_turns: "all"/u, relative);
    assert.match(source, /recorded reason/u, relative);
    assert.match(source, /six-part brief|six-part brief below/u, relative);
  }
});

test('authority validator catches router-trigger deletion and full-history-default mutations', () => {
  const relative = 'global/codex/AGENTS.md';
  const baseline = read(relative);
  const removedTrigger = baseline.replace('<!-- context-topic:verify-output -->', '');
  assert.ok(validateRouter(relative, removedTrigger).some((failure) => failure.includes('missing topic verify-output')));

  const fullHistoryDefault = baseline.replace('fork_turns: "none"', 'fork_turns: "all"');
  assert.ok(validateRouter(relative, fullHistoryDefault).some((failure) => failure.includes('clean-context default')));
  assert.ok(validateRouter(relative, fullHistoryDefault).some((failure) => failure.includes('full-history default')));
});

test('Auxara gate rejects explicit plus path-scoped reachability while allowing path-scoped-only rules', (t) => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'context-authority-routing-'));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
  fs.mkdirSync(path.join(fixtureRoot, '.claude', 'rules'), { recursive: true });
  fs.writeFileSync(path.join(fixtureRoot, 'AGENTS.md'), '# compact router\n');
  fs.writeFileSync(
    path.join(fixtureRoot, '.claude', 'rules', 'scoped.md'),
    '---\npaths:\n  - "backend/**/*"\n---\n\n# Scoped\n',
  );

  fs.writeFileSync(path.join(fixtureRoot, 'CLAUDE.md'), '@AGENTS.md\n');
  const counterexample = inspectAgentStartupContext(fixtureRoot);
  assert.equal(DEFAULT_MAX_STARTUP_TOKENS, 6_000);
  assert.equal(counterexample.ok, true);
  assert.deepEqual(counterexample.files.map((file) => file.path), ['AGENTS.md', 'CLAUDE.md']);

  fs.writeFileSync(path.join(fixtureRoot, 'CLAUDE.md'), '@AGENTS.md\n@.claude/rules/scoped.md\n');
  const mutation = inspectAgentStartupContext(fixtureRoot);
  assert.equal(mutation.files.filter((file) => file.path === '.claude/rules/scoped.md').length, 1);
  assert.ok(mutation.failures.some((failure) => failure.includes('Duplicate startup/rules-engine reachability')));
});
