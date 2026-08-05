/**
 * Proves: NFR-011
 * Test type: regression
 * Surface: fleet wiring of the managed-edit guard — the shared runtime module, the per-overlay thin
 * entries, the PreToolUse settings registration in every overlay, the validators that REQUIRE it, the
 * manifest/lock pinning, and the bootstrap scaffold.
 * Authority: overlays/<p>/project-files (settings + manifests) + core/authority + the bootstrap templates
 *
 * What this test proves about the product:
 * - Every overlay project ships the SAME thin PreToolUse entry (byte-identical across overlays and to
 *   the bootstrap template), wired in its settings.json with matcher Edit|Write, so the fork trap is
 *   stopped at edit time in every project, not just the one that learned the lesson.
 * - Every overlay's control-plane validator REQUIRES the guard hook, so a project silently dropping
 *   the registration fails its own gate — a registered guard that never fires is not a control.
 * - The guard's runtime module + test are digest-pinned managed files in the manifests that track
 *   runtime files, so a delivered-copy fork of the guard itself is caught by parity.
 *
 * Killer mutation: each one below must turn the NAMED case red, not merely redden the suite.
 * - Remove the PreToolUse block from one overlay's settings.json → "every overlay registers" fails.
 * - Fork one overlay's thin entry → "thin entries are byte-identical" fails.
 * - Drop the guard requirement from a validator → "validators require the guard" fails.
 * - Unpin the guard from the dialer manifest → "digest-pinned" fails.
 * Gated command: npm test
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n');
const OVERLAYS = ['auxara-dialer', 'coachai', 'nuvora-link'];
const ENTRY = 'scripts/claude-pretooluse-guard.mjs';

test('the shared runtime module and its test exist at the canonical source', () => {
  for (const f of ['core/authority/managed-edit-guard.mjs', 'core/authority/managed-edit-guard.test.mjs']) {
    assert.ok(fs.existsSync(path.join(root, f)), `missing ${f}`);
  }
});

test('every overlay registers the guard: PreToolUse Edit|Write → rooted claude-pretooluse-guard.mjs', () => {
  for (const overlay of OVERLAYS) {
    const settings = JSON.parse(read(`overlays/${overlay}/project-files/.claude/settings.json`));
    const pre = settings.hooks?.PreToolUse;
    assert.ok(Array.isArray(pre) && pre.length === 1, `${overlay}: PreToolUse must have exactly one registration`);
    assert.equal(pre[0].matcher, 'Edit|Write', `${overlay}: matcher`);
    const hooks = pre[0].hooks ?? [];
    assert.equal(hooks.length, 1, `${overlay}: exactly one hook command`);
    assert.equal(hooks[0].command, 'node');
    assert.deepEqual(hooks[0].args, ['${CLAUDE_PROJECT_DIR}/scripts/claude-pretooluse-guard.mjs'], `${overlay}: rooted args`);
  }
});

test('thin entries are byte-identical across every overlay AND the bootstrap template', () => {
  const reference = read(`overlays/auxara-dialer/project-files/${ENTRY}`);
  for (const overlay of OVERLAYS.slice(1)) {
    assert.equal(read(`overlays/${overlay}/project-files/${ENTRY}`), reference, `${overlay} entry diverged`);
  }
  assert.equal(
    read('skills/bootstrap-orchestrator/templates/lifecycle/claude-pretooluse-guard.mjs.template'),
    reference,
    'the bootstrap template must ship the same entry a live overlay ships',
  );
  assert.match(reference, /runtime\/core\/authority\/managed-edit-guard\.mjs/, 'entry must bind the managed runtime');
});

test('validators require the guard, so a project cannot silently drop the registration', () => {
  const dialerLib = read('overlays/auxara-dialer/project-files/scripts/lib/validateClaudeHookSettings.mjs');
  assert.match(dialerLib, /preToolUseScript: 'claude-pretooluse-guard\.mjs'/);
  assert.match(dialerLib, /PreToolUse must be Edit\|Write with exactly one rooted exec-form managed-edit guard command/);
  const coachai = read('overlays/coachai/project-files/scripts/check-agent-control-plane.mjs');
  assert.match(coachai, /claude-pretooluse-guard\.mjs/);
  assert.match(coachai, /PreToolUse managed-edit guard is missing/);
  const nuvora = read('overlays/nuvora-link/project-files/scripts/check-agent-control-plane.mjs');
  assert.match(nuvora, /'PreToolUse'/);
  assert.match(nuvora, /claude-pretooluse-guard\.mjs/);
});

test('the guard runtime, its test, and every thin entry are digest-pinned managed files', () => {
  const dialer = JSON.parse(read('overlays/auxara-dialer/project-files/.ai-organization/ownership.json'));
  const dialerPaths = new Set(dialer.managedFiles.map((r) => r.path));
  for (const p of [
    '.ai-organization/runtime/core/authority/managed-edit-guard.mjs',
    '.ai-organization/runtime/core/authority/managed-edit-guard.test.mjs',
    ENTRY,
  ]) {
    assert.ok(dialerPaths.has(p), `dialer manifest must pin ${p}`);
  }
  const gate = read('overlays/auxara-dialer/project-files/scripts/check-organization-overlay.mjs');
  assert.match(gate, /managed-edit-guard\.mjs/, 'REQUIRED_MANAGED_FILES must include the guard runtime');
  for (const overlay of ['coachai', 'nuvora-link']) {
    const o = JSON.parse(read(`overlays/${overlay}/project-files/.ai-organization/ownership.json`));
    assert.ok(o.managed_files.includes(ENTRY), `${overlay} ownership must list ${ENTRY}`);
    const lock = JSON.parse(read(`overlays/${overlay}/project-files/.ai-organization/overlay-lock.json`));
    assert.ok(lock.files.some((r) => r.path === ENTRY), `${overlay} lock must pin ${ENTRY}`);
  }
});

test('the dialer manifest declares the FOUNDING trap file and the generated roots (guard visibility)', () => {
  // The guard's first live-fire run missed docs/agent-prompts/orchestration-playbook.md — delivered by
  // the installer but absent from the digest-pinned list, so the guard read it as unmanaged. The
  // manifest now declares the full installer-owned set; this pins the founding trap file and the roots.
  const dialer = JSON.parse(read('overlays/auxara-dialer/project-files/.ai-organization/ownership.json'));
  assert.ok(dialer.managed_files.includes('docs/agent-prompts/orchestration-playbook.md'));
  assert.ok(dialer.managed_files.includes('AGENTS.md'));
  assert.ok(dialer.managed_files.includes('.claude/settings.json'));
  for (const r of ['.claude/agents', '.claude/rules']) assert.ok(dialer.managed_roots.includes(r), r);
});

test('the installer delivers the entry: every overlay ownership.v1.json carries the asset row', () => {
  for (const overlay of OVERLAYS) {
    const j = JSON.parse(read(`overlays/${overlay}/ownership.v1.json`));
    assert.ok(
      j.assets.some((a) => a.destination === ENTRY && a.sourcePath === ENTRY),
      `${overlay} installer asset row for ${ENTRY} is missing`,
    );
  }
});

test('the bootstrap settings template wires PreToolUse for newly bootstrapped projects', () => {
  const t = read('skills/bootstrap-orchestrator/templates/settings.json.template');
  assert.match(t, /"PreToolUse"/);
  assert.match(t, /claude-pretooluse-guard\.mjs/);
});
