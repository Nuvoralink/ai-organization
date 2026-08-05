/* global process */

/**
 * Managed-edit guard — the EDIT-TIME half of managed-asset protection (the fork trap, killed at the root).
 *
 * PROBLEM CLASS. Control-plane MANAGED files live inside each project looking like ordinary files.
 * Editing one in the project forks the digest-pinned canonical source: the parity gate fails later,
 * and the next `project-overlay.mjs install` silently reverts the work. The knowledge that a file is
 * managed exists in the project the whole time (`.ai-organization/ownership.json`) — it just was never
 * consulted at the moment of the edit. The parity gate fires AFTER the mistake; nothing fired DURING
 * it. Proven 2026-08-05: three fork-trap instances in one session (a delivered orchestration playbook,
 * a delivered AGENTS.md, a delivered proof-profiles.json), each caught only at gate time.
 *
 * THIS MODULE decides, for one Edit/Write tool call, whether the target is a managed delivered copy —
 * and if so, refuses with a redirect to the overlay source. It is wired as a Claude Code PreToolUse
 * hook via a thin per-project entry (`scripts/claude-pretooluse-guard.mjs`). Exit-2 semantics live in
 * the entry; this module only returns verdicts, so the test drives every branch in-process.
 *
 * THIS IS THE CANONICAL MANAGED SOURCE (`core/authority/managed-edit-guard.mjs` in the AI-Organization
 * control plane), delivered to `.ai-organization/runtime/core/authority/managed-edit-guard.mjs` in
 * every consuming project. DO NOT EDIT A DELIVERED COPY — that is the exact defect this module exists
 * to prevent, applied to itself.
 *
 * DESIGN CONSTRAINTS (each learned from a live instance):
 * - The manifest is resolved by WALKING UP FROM THE EDITED FILE, never from the session project root:
 *   two of the three founding fork traps were CROSS-REPO edits (a dialer-rooted session editing
 *   CoachAI's delivered files). A session-root lookup would have missed both.
 * - Editing the CANONICAL SOURCE (`overlays/<p>/project-files/**` inside the control-plane repo) is
 *   the CORRECT action and must never be blocked. The control-plane repo is recognized by an ancestor
 *   containing `control-plane.manifest.json` — its own root marker, present nowhere else.
 * - Append-only regions (the `## Learned classes` live log) are LEGITIMATE edits to managed files:
 *   the parity hashers strip them before comparing, so the guard allows edits confined to at/after
 *   the marker and blocks structural edits above it.
 * - Every content comparison normalizes CRLF→LF first. A byte comparison would re-import the exact
 *   line-ending false-drift class fixed the same day this guard was written.
 * - Fail-open, loudly: a missing manifest means "not an overlay project" (allow); the guard is the
 *   shift-left warning, the parity gate remains the fail-closed authority.
 *
 * TWO MANIFEST SCHEMAS exist in the fleet and both are supported:
 *   A (dialer):  { managedFiles: [{path}], projectOwnedRoots, appendOnlyMarkers }
 *   B (coachai/nuvora-link): { managed_roots, managed_files, managed_json_sections,
 *                              excluded_project_owned, append_only_markers, overlay_source }
 * In BOTH schemas, anything under `.ai-organization/` is managed BY DEFINITION (the installer owns
 * that whole root in every project) unless the manifest's exclusion list carves it out — e.g.
 * CoachAI's project-owned `.ai-organization/policies/coordination-mode.v1.json`.
 */

import fs from 'node:fs';
import path from 'node:path';

export const OWNERSHIP_MANIFEST_RELATIVE = '.ai-organization/ownership.json';
export const CONTROL_PLANE_ROOT_MARKER = 'control-plane.manifest.json';
/** Escape hatch for a deliberate, human-directed local fork; the transcript records its use. */
export const OVERRIDE_ENV_VAR = 'CLAUDE_MANAGED_EDIT_ACK';

const WALK_LIMIT = 60;

/** CRLF→LF; all guard comparisons are content-identity comparisons, never byte comparisons. */
export function normalizeEol(text) {
  return String(text).replace(/\r\n/g, '\n');
}

const toPosix = (p) => String(p).replace(/\\/g, '/');

/** Minimal glob→regex for the manifest exclusion lists (`**`, `*`; same dialect as the parity gates). */
export function globRegex(pattern) {
  let out = '^';
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*') {
      out += '.*';
      i += 1;
      if (pattern[i + 1] === '/') i += 1; // `**/` also matches zero directories
    } else if (c === '*') out += '[^/]*';
    else out += c.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`${out}$`);
}

/**
 * Walk up from the TARGET FILE (not the session root — see design constraints) and resolve:
 *  - `controlPlaneSource: true` when any ancestor carries the control-plane root marker (the canonical
 *    repo, where editing IS the fix), regardless of nearer project-files manifests;
 *  - otherwise the NEAREST directory carrying `.ai-organization/ownership.json` plus its parsed manifest.
 * Returns null when neither exists (not an overlay-managed tree).
 */
export function resolveOwnership(targetPath, { readFile = fs.readFileSync, exists = fs.existsSync } = {}) {
  let dir = path.resolve(path.dirname(path.resolve(targetPath)));
  let nearest = null;
  for (let i = 0; i < WALK_LIMIT; i += 1) {
    if (exists(path.join(dir, CONTROL_PLANE_ROOT_MARKER))) return { controlPlaneSource: true, root: dir };
    if (!nearest && exists(path.join(dir, OWNERSHIP_MANIFEST_RELATIVE))) {
      nearest = { root: dir, manifestPath: path.join(dir, OWNERSHIP_MANIFEST_RELATIVE) };
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  if (!nearest) return null;
  let manifest;
  try {
    manifest = JSON.parse(String(readFile(nearest.manifestPath, 'utf8')));
  } catch (cause) {
    // A corrupt manifest cannot certify OR clear anything. Surface it as its own verdict kind so the
    // entry can warn loudly; the guard still only hard-blocks the definitionally-managed root.
    return { root: nearest.root, manifestPath: nearest.manifestPath, corrupt: true, cause };
  }
  return { root: nearest.root, manifestPath: nearest.manifestPath, manifest };
}

/**
 * Classify one repo-relative path against a manifest (either schema).
 * Returns { managed, reason, jsonSections, appendMarkers, overlaySource }.
 */
export function classifyPath(relPath, manifest) {
  const rel = toPosix(relPath);
  const appendMarkers = manifest.appendOnlyMarkers ?? manifest.append_only_markers ?? [];
  const overlaySource = typeof manifest.overlay_source === 'string' ? manifest.overlay_source : null;
  const none = { managed: false, reason: null, jsonSections: null, appendMarkers, overlaySource };

  const exclusions = Array.isArray(manifest.excluded_project_owned) ? manifest.excluded_project_owned : [];
  if (exclusions.some((g) => globRegex(toPosix(g)).test(rel))) {
    return { ...none, reason: 'excluded_project_owned' };
  }

  // Partial ownership: only named JSON sections of this file are managed (e.g. package.json scripts).
  const sections = manifest.managed_json_sections?.[rel];
  if (Array.isArray(sections) && sections.length > 0) {
    return { ...none, jsonSections: sections, reason: 'managed_json_sections' };
  }

  // The installer owns the entire .ai-organization root in every project, listed or not.
  if (rel === '.ai-organization' || rel.startsWith('.ai-organization/')) {
    return { ...none, managed: true, reason: 'under .ai-organization/ (generated root)' };
  }

  // Schema A: explicit digest-pinned file list.
  if (Array.isArray(manifest.managedFiles)) {
    if (manifest.managedFiles.some((row) => toPosix(row?.path ?? '') === rel)) {
      return { ...none, managed: true, reason: 'listed in managedFiles' };
    }
  }

  // Schema B: explicit file list + whole managed roots.
  if (Array.isArray(manifest.managed_files) && manifest.managed_files.some((p) => toPosix(p) === rel)) {
    return { ...none, managed: true, reason: 'listed in managed_files' };
  }
  if (Array.isArray(manifest.managed_roots)) {
    const root = manifest.managed_roots.map(toPosix).find((r) => rel === r || rel.startsWith(`${r}/`));
    if (root) return { ...none, managed: true, reason: `under managed root ${root}` };
  }

  return none;
}

/** First (earliest) append-only marker index in normalized content, or -1. */
function earliestMarkerIndex(normalizedContent, markers) {
  let best = -1;
  for (const marker of markers ?? []) {
    const idx = normalizedContent.indexOf(String(marker));
    if (idx !== -1 && (best === -1 || idx < best)) best = idx;
  }
  return best;
}

/**
 * Decide one tool call. Input mirrors the PreToolUse payload's tool_input; `currentContent` is the
 * target's on-disk content (null when absent). Returns:
 *   { verdict: 'allow' }
 *   { verdict: 'allow', notice }                 — allowed, with something worth saying
 *   { verdict: 'deny', reason, redirect }        — block; entry exits 2 with the message
 */
export function decideEdit({
  toolName,
  relPath,
  manifest,
  oldString = null,
  newContent = null,
  currentContent = null,
  env = process.env,
}) {
  if (String(env?.[OVERRIDE_ENV_VAR] ?? '').trim() !== '') {
    return { verdict: 'allow', notice: `${OVERRIDE_ENV_VAR} is set — managed-edit guard bypassed by explicit override.` };
  }
  const cls = classifyPath(relPath, manifest);

  // Partially managed JSON: precise for Write (compare each managed section), heuristic for Edit
  // (a managed section's LEAF KEY appearing as a JSON key in the edited strings).
  if (cls.jsonSections) {
    const leaves = cls.jsonSections.map((s) => String(s).split('.').pop());
    if (toolName === 'Write' && newContent !== null && currentContent !== null) {
      try {
        const before = JSON.parse(normalizeEol(currentContent));
        const after = JSON.parse(normalizeEol(newContent));
        const pick = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
        const changed = cls.jsonSections.filter(
          (s) => JSON.stringify(pick(before, s)) !== JSON.stringify(pick(after, s)),
        );
        if (changed.length > 0) {
          return deny(cls, relPath, `this Write changes the MANAGED JSON section(s) ${changed.join(', ')}`);
        }
        return { verdict: 'allow' };
      } catch {
        return deny(cls, relPath, 'this Write touches a file with managed JSON sections and the JSON could not be compared');
      }
    }
    const touched = leaves.filter((leaf) => {
      const probe = new RegExp(`"${leaf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:`);
      return probe.test(String(oldString ?? '')) || probe.test(String(newContent ?? ''));
    });
    if (touched.length > 0) {
      return deny(cls, relPath, `this Edit touches the MANAGED JSON key(s) ${touched.map((l) => `"${l}"`).join(', ')}`);
    }
    return { verdict: 'allow' };
  }

  if (!cls.managed) return { verdict: 'allow' };

  // Fully managed file: an edit confined to the append-only region stays legitimate.
  if (currentContent !== null && (cls.appendMarkers?.length ?? 0) > 0) {
    const current = normalizeEol(currentContent);
    const markerIdx = earliestMarkerIndex(current, cls.appendMarkers);
    if (markerIdx !== -1) {
      if (toolName === 'Edit' && oldString !== null) {
        const needle = normalizeEol(oldString);
        let at = current.indexOf(needle);
        if (at !== -1) {
          let confined = true;
          while (at !== -1) {
            if (at < markerIdx) {
              confined = false;
              break;
            }
            at = current.indexOf(needle, at + 1);
          }
          if (confined) {
            return { verdict: 'allow', notice: 'edit confined to the append-only region of a managed file.' };
          }
        }
      }
      if (toolName === 'Write' && newContent !== null) {
        const prefix = current.slice(0, markerIdx);
        if (normalizeEol(newContent).startsWith(prefix)) {
          return { verdict: 'allow', notice: 'write preserves the managed prefix above the append-only marker.' };
        }
      }
    }
  }

  return deny(cls, relPath, `it is MANAGED (${cls.reason})`);
}

function deny(cls, relPath, why) {
  const sourceHint = cls.overlaySource
    ? `${cls.overlaySource}/project-files/${toPosix(relPath)}`
    : `overlays/<project>/project-files/${toPosix(relPath)}`;
  return {
    verdict: 'deny',
    reason: why,
    redirect:
      `This file is a DELIVERED control-plane copy — editing it here forks the digest-pinned source: ` +
      `the parity gate will fail and the next install will revert your work (the fork trap).\n` +
      `Edit the CANONICAL SOURCE instead, in the AI-Organization control-plane repo:\n` +
      `    ${sourceHint}\n` +
      `then deliver it: node scripts/project-overlay.mjs install <project> [--root <this repo>]\n` +
      `(update the digest/lock in the same change). For a deliberate, human-directed local fork only, ` +
      `set ${OVERRIDE_ENV_VAR}=1 and re-run — the override is visible in the transcript.`,
  };
}

/**
 * Full evaluation for one PreToolUse payload against the real filesystem.
 * Returns the decideEdit verdict, plus 'allow' shortcuts for non-file tools, canonical-source edits,
 * and trees with no ownership manifest.
 */
export function evaluateToolCall({ toolName, toolInput, env = process.env, fsImpl = fs } = {}) {
  if (toolName !== 'Edit' && toolName !== 'Write') return { verdict: 'allow' };
  const filePath = toolInput?.file_path;
  if (typeof filePath !== 'string' || filePath.trim() === '') return { verdict: 'allow' };

  const ownership = resolveOwnership(filePath, {
    readFile: fsImpl.readFileSync,
    exists: fsImpl.existsSync,
  });
  if (!ownership) return { verdict: 'allow' };
  if (ownership.controlPlaneSource) {
    return { verdict: 'allow', notice: 'target is inside the control-plane SOURCE repo — editing here is the correct fix path.' };
  }

  const relPath = toPosix(path.relative(ownership.root, path.resolve(filePath)));
  if (relPath.startsWith('..')) return { verdict: 'allow' };

  if (ownership.corrupt) {
    // Only the definitionally-managed root is blocked off a manifest that cannot speak.
    if (relPath === '.ai-organization' || relPath.startsWith('.ai-organization/')) {
      return {
        verdict: 'deny',
        reason: `the ownership manifest at ${ownership.manifestPath} is unreadable and the target is under the generated .ai-organization/ root`,
        redirect: `Repair or re-install the manifest first (node scripts/project-overlay.mjs install <project>); a corrupt manifest cannot authorize edits to generated state.`,
      };
    }
    return { verdict: 'allow', notice: `ownership manifest at ${ownership.manifestPath} is unreadable — managed-edit guard could not classify this path.` };
  }

  let currentContent = null;
  try {
    currentContent = fsImpl.readFileSync(path.resolve(filePath), 'utf8');
  } catch {
    currentContent = null; // new file — classification alone decides
  }

  return decideEdit({
    toolName,
    relPath,
    manifest: ownership.manifest,
    oldString: toolInput?.old_string ?? null,
    newContent: toolName === 'Write' ? (toolInput?.content ?? null) : (toolInput?.new_string ?? null),
    currentContent,
    env,
  });
}
