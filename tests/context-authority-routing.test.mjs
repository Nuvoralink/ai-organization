/**
 * Proves: ORG-CONTEXT-ROUTING-001
 * Test type: authority-reachability and physical source mutation
 * Surface: compact global routers plus clean-context dispatch authorities
 * Authority: registries/context-authorities.v1.json
 * Killer mutation: delete one load-bearing router trigger or make full-history inheritance the bounded-agent default
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
  assert.equal(registry.version, '1.0.0');
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
