/**
 * Proves: NFR-011
 * Test type: regression
 * Surface: core/authority/managed-edit-guard.mjs — manifest discovery (walk-up from the TARGET file),
 * both ownership schemas, the .ai-organization-by-definition rule, exclusion globs, append-only
 * regions, managed JSON sections, the control-plane-source allowance, and the override hatch.
 * Authority: each project's delivered `.ai-organization/ownership.json` + the control-plane root marker
 *
 * What this test proves about the product:
 * - An Edit/Write aimed at a DELIVERED managed copy is DENIED with a redirect to the overlay source —
 *   the fork trap is stopped at edit time instead of being discovered at gate time (three live
 *   instances on 2026-08-05 motivated this guard).
 * - The manifest is resolved by walking up from the EDITED FILE, so cross-repo edits (a session rooted
 *   in one project editing another project's delivered files) are guarded — two of the three founding
 *   instances were exactly that shape.
 * - Editing the CANONICAL SOURCE (overlays/** inside the control-plane repo, recognized by its root
 *   marker) is always allowed: that is the fix path, and blocking it would re-create the problem.
 * - Append-only regions of managed files (the learned-classes live log) stay editable; structural
 *   edits above the marker are denied. All comparisons are CRLF-insensitive.
 * - Partially-managed JSON (managed_json_sections) denies precisely: a Write that changes a managed
 *   section value, or an Edit whose strings carry a managed leaf key — while dependency edits pass.
 * - A corrupt manifest blocks only the definitionally-generated .ai-organization/ root and lets the
 *   rest through with a notice — the guard is the shift-left warning, the parity gate stays the
 *   fail-closed authority.
 *
 * Killer mutation: each one below must turn the NAMED case red, not merely redden the suite.
 * - Resolve the manifest from cwd instead of the target file → "cross-repo" fails.
 * - Drop the control-plane root-marker check → "canonical source is always allowed" fails.
 * - Drop the .ai-organization-by-definition rule → "unlisted file under .ai-organization" fails.
 * - Ignore excluded_project_owned → "excluded path is project-owned" fails.
 * - Drop the marker-position check (allow any edit to marker-bearing files) → "edit ABOVE the
 *   append-only marker" fails.
 * - Skip CRLF normalization in comparisons → "append-only across CRLF/LF" fails.
 * - Drop the managed-section Write comparison → "Write changing a managed JSON section" fails.
 * Gated command: npm test
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  CONTROL_PLANE_ROOT_MARKER,
  OVERRIDE_ENV_VAR,
  classifyPath,
  decideEdit,
  evaluateToolCall,
  globRegex,
  resolveOwnership,
} from './managed-edit-guard.mjs';

const ENV = {}; // never inherit the real environment into verdict tests

function scaffold(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'meg-'));
  for (const [rel, body] of Object.entries(structure)) {
    const full = path.join(root, ...rel.split('/'));
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, 'utf8');
  }
  return root;
}

const SCHEMA_A = JSON.stringify({
  schemaVersion: 1,
  managedFiles: [
    { path: 'scripts/check-organization-overlay.mjs', sha256: 'x' },
    { path: '.claude/loop.md', sha256: 'x' },
    { path: '.claude/agents/premise-and-architecture-challenger.md', sha256: 'x' },
  ],
  projectOwnedRoots: ['backend/', 'frontend/'],
  appendOnlyMarkers: ['## Learned classes'],
});

const SCHEMA_B = JSON.stringify({
  version: '1.0.0',
  overlay_source: 'universal-private-orchestrator/overlays/coachai',
  managed_roots: ['.ai-organization', '.claude/agents', '.cursor/rules'],
  managed_files: ['AGENTS.md', 'scripts/check-overlay-parity.mjs'],
  managed_json_sections: { 'package.json': ['scripts.gates:all', 'scripts.verify'] },
  excluded_project_owned: ['backend/**', '.ai-organization/policies/coordination-mode.v1.json'],
  append_only_markers: ['## Learned classes'],
});

// ---------------------------------------------------------------------------------------------------
// Discovery — walk up from the TARGET, canonical-source recognition
// ---------------------------------------------------------------------------------------------------

test('no ownership manifest anywhere → allow (not an overlay project)', () => {
  const root = scaffold({ 'src/app.ts': 'x' });
  try {
    const v = evaluateToolCall({
      toolName: 'Edit',
      toolInput: { file_path: path.join(root, 'src/app.ts'), old_string: 'x', new_string: 'y' },
      env: ENV,
    });
    assert.equal(v.verdict, 'allow');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('cross-repo: the manifest is found by walking up from the TARGET file, wherever cwd is', () => {
  // The guard runs in a session rooted elsewhere; only the target's own tree may classify it.
  const other = scaffold({
    '.ai-organization/ownership.json': SCHEMA_B,
    'AGENTS.md': '# router\n',
  });
  try {
    const v = evaluateToolCall({
      toolName: 'Edit',
      toolInput: { file_path: path.join(other, 'AGENTS.md'), old_string: 'router', new_string: 'x' },
      env: ENV,
    });
    assert.equal(v.verdict, 'deny', 'a managed file in ANOTHER repo must still be guarded');
    assert.match(v.redirect, /overlays\/coachai\/project-files\/AGENTS\.md/);
  } finally {
    fs.rmSync(other, { recursive: true, force: true });
  }
});

test('canonical source is always allowed: a project-files manifest under the control-plane repo never blocks', () => {
  const root = scaffold({
    [CONTROL_PLANE_ROOT_MARKER]: '{}',
    'overlays/coachai/project-files/.ai-organization/ownership.json': SCHEMA_B,
    'overlays/coachai/project-files/AGENTS.md': '# router\n',
  });
  try {
    const v = evaluateToolCall({
      toolName: 'Edit',
      toolInput: {
        file_path: path.join(root, 'overlays/coachai/project-files/AGENTS.md'),
        old_string: 'router',
        new_string: 'better router',
      },
      env: ENV,
    });
    assert.equal(v.verdict, 'allow', 'editing the SOURCE is the fix path — blocking it re-creates the trap');
    assert.match(v.notice ?? '', /SOURCE repo/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('resolveOwnership reports a corrupt manifest as corrupt, never as absent', () => {
  const root = scaffold({ '.ai-organization/ownership.json': '{ not json', 'x.md': 'x' });
  try {
    const o = resolveOwnership(path.join(root, 'x.md'));
    assert.equal(o.corrupt, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('corrupt manifest: generated .ai-organization/ root still blocked, other paths pass with a notice', () => {
  const root = scaffold({
    '.ai-organization/ownership.json': '{ not json',
    '.ai-organization/agents.json': '{}',
    'src/app.ts': 'x',
  });
  try {
    const gen = evaluateToolCall({
      toolName: 'Write',
      toolInput: { file_path: path.join(root, '.ai-organization/agents.json'), content: '{}' },
      env: ENV,
    });
    assert.equal(gen.verdict, 'deny');
    const src = evaluateToolCall({
      toolName: 'Edit',
      toolInput: { file_path: path.join(root, 'src/app.ts'), old_string: 'x', new_string: 'y' },
      env: ENV,
    });
    assert.equal(src.verdict, 'allow');
    assert.match(src.notice ?? '', /unreadable/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------------------------------
// Classification — both schemas
// ---------------------------------------------------------------------------------------------------

test('schema A: listed file denied; unlisted project file allowed; unlisted file under .ai-organization denied', () => {
  const m = JSON.parse(SCHEMA_A);
  assert.equal(classifyPath('scripts/check-organization-overlay.mjs', m).managed, true);
  assert.equal(classifyPath('scripts/reservation-config.mjs', m).managed, false);
  // The by-definition rule: delivered-but-unlisted generated state is still managed.
  assert.equal(classifyPath('.ai-organization/runtime/core/authority/assess-action.mjs', m).managed, true);
});

test('schema B: managed root subtree denied; excluded path is project-owned even under a managed root', () => {
  const m = JSON.parse(SCHEMA_B);
  assert.equal(classifyPath('.cursor/rules/agent-product-intent.mdc', m).managed, true);
  assert.equal(classifyPath('backend/src/app.ts', m).managed, false);
  // Boundary fixture: the exclusion list EXISTS but does not cover this path → still managed.
  assert.equal(classifyPath('.ai-organization/proof-profiles.json', m).managed, true);
  // The carved-out generated file is genuinely project-owned.
  assert.equal(classifyPath('.ai-organization/policies/coordination-mode.v1.json', m).managed, false);
});

test('globRegex: ** spans directories, * does not', () => {
  assert.equal(globRegex('backend/**').test('backend/src/deep/file.ts'), true);
  assert.equal(globRegex('backend/*').test('backend/src/deep/file.ts'), false);
  assert.equal(globRegex('**/.env*').test('backend/.env.local'), true);
});

// ---------------------------------------------------------------------------------------------------
// Append-only regions
// ---------------------------------------------------------------------------------------------------

const AGENT_FILE = '# Challenger\n\nCharter text.\n\n## Learned classes\n\n- old row\n';

test('append-only: edit BELOW the marker allowed; edit ABOVE the append-only marker denied', () => {
  const m = JSON.parse(SCHEMA_A);
  const below = decideEdit({
    toolName: 'Edit',
    relPath: '.claude/agents/premise-and-architecture-challenger.md',
    manifest: m,
    oldString: '- old row',
    newContent: '- old row\n- new row',
    currentContent: AGENT_FILE,
    env: ENV,
  });
  assert.equal(below.verdict, 'allow');
  const above = decideEdit({
    toolName: 'Edit',
    relPath: '.claude/agents/premise-and-architecture-challenger.md',
    manifest: m,
    oldString: 'Charter text.',
    newContent: 'Rewritten charter.',
    currentContent: AGENT_FILE,
    env: ENV,
  });
  assert.equal(above.verdict, 'deny');
});

test('append-only Write: preserving the managed prefix allowed; mutating above the marker denied', () => {
  const m = JSON.parse(SCHEMA_A);
  const ok = decideEdit({
    toolName: 'Write',
    relPath: '.claude/agents/premise-and-architecture-challenger.md',
    manifest: m,
    newContent: `${AGENT_FILE}- appended row\n`,
    currentContent: AGENT_FILE,
    env: ENV,
  });
  assert.equal(ok.verdict, 'allow');
  const bad = decideEdit({
    toolName: 'Write',
    relPath: '.claude/agents/premise-and-architecture-challenger.md',
    manifest: m,
    newContent: AGENT_FILE.replace('Charter text.', 'Rewritten.'),
    currentContent: AGENT_FILE,
    env: ENV,
  });
  assert.equal(bad.verdict, 'deny');
});

test('append-only across CRLF/LF: a CRLF file with LF edit strings gets the same verdicts', () => {
  const m = JSON.parse(SCHEMA_A);
  const crlfFile = AGENT_FILE.replace(/\n/g, '\r\n');
  const below = decideEdit({
    toolName: 'Edit',
    relPath: '.claude/loop.md',
    manifest: m,
    oldString: '- old row',
    currentContent: crlfFile,
    env: ENV,
  });
  assert.equal(below.verdict, 'allow', 'checkout line endings must not change the verdict');
  const write = decideEdit({
    toolName: 'Write',
    relPath: '.claude/loop.md',
    manifest: m,
    newContent: `${AGENT_FILE}- appended\n`, // LF content over a CRLF current file
    currentContent: crlfFile,
    env: ENV,
  });
  assert.equal(write.verdict, 'allow');
});

test('a managed file with NO marker in its content is fully protected', () => {
  const m = JSON.parse(SCHEMA_A);
  const v = decideEdit({
    toolName: 'Edit',
    relPath: '.claude/loop.md',
    manifest: m,
    oldString: 'anything',
    currentContent: '# loop\n\nno markers here\n',
    env: ENV,
  });
  assert.equal(v.verdict, 'deny');
});

// ---------------------------------------------------------------------------------------------------
// Managed JSON sections
// ---------------------------------------------------------------------------------------------------

const PKG = JSON.stringify(
  { name: 'p', scripts: { 'gates:all': 'a && b', verify: 'x', dev: 'vite' }, dependencies: { react: '18' } },
  null,
  2,
);

test('Write changing a managed JSON section is denied and NAMES the section; preserving it passes', () => {
  const m = JSON.parse(SCHEMA_B);
  const changed = JSON.parse(PKG);
  changed.scripts['gates:all'] = 'a && b && npm run gate:new';
  const bad = decideEdit({
    toolName: 'Write',
    relPath: 'package.json',
    manifest: m,
    newContent: JSON.stringify(changed, null, 2),
    currentContent: PKG,
    env: ENV,
  });
  assert.equal(bad.verdict, 'deny');
  assert.match(bad.reason, /scripts\.gates:all/);

  const depsOnly = JSON.parse(PKG);
  depsOnly.dependencies.zod = '3';
  const ok = decideEdit({
    toolName: 'Write',
    relPath: 'package.json',
    manifest: m,
    newContent: JSON.stringify(depsOnly, null, 2),
    currentContent: PKG,
    env: ENV,
  });
  assert.equal(ok.verdict, 'allow');
});

test('Edit touching a managed leaf key is denied; a dependency edit passes', () => {
  const m = JSON.parse(SCHEMA_B);
  const bad = decideEdit({
    toolName: 'Edit',
    relPath: 'package.json',
    manifest: m,
    oldString: '"gates:all": "a && b"',
    newContent: '"gates:all": "a && b && c"',
    currentContent: PKG,
    env: ENV,
  });
  assert.equal(bad.verdict, 'deny');
  const ok = decideEdit({
    toolName: 'Edit',
    relPath: 'package.json',
    manifest: m,
    oldString: '"react": "18"',
    newContent: '"react": "19"',
    currentContent: PKG,
    env: ENV,
  });
  assert.equal(ok.verdict, 'allow');
});

// ---------------------------------------------------------------------------------------------------
// Override hatch + full evaluate wiring
// ---------------------------------------------------------------------------------------------------

test('the override env var allows, with a notice that lands in the transcript', () => {
  const m = JSON.parse(SCHEMA_B);
  const v = decideEdit({
    toolName: 'Edit',
    relPath: 'AGENTS.md',
    manifest: m,
    oldString: 'x',
    currentContent: 'x',
    env: { [OVERRIDE_ENV_VAR]: '1' },
  });
  assert.equal(v.verdict, 'allow');
  assert.match(v.notice, new RegExp(OVERRIDE_ENV_VAR));
});

test('evaluateToolCall end-to-end: deny carries the redirect, and non-file tools pass through', () => {
  const root = scaffold({
    '.ai-organization/ownership.json': SCHEMA_A,
    'scripts/check-organization-overlay.mjs': '// managed\n',
  });
  try {
    const denyV = evaluateToolCall({
      toolName: 'Edit',
      toolInput: {
        file_path: path.join(root, 'scripts/check-organization-overlay.mjs'),
        old_string: '// managed',
        new_string: '// forked',
      },
      env: ENV,
    });
    assert.equal(denyV.verdict, 'deny');
    assert.match(denyV.redirect, /fork trap/);
    assert.equal(evaluateToolCall({ toolName: 'Bash', toolInput: {}, env: ENV }).verdict, 'allow');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
