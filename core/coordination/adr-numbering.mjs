/* global process, console */

/**
 * gate:adr-numbering engine — the ADR sibling of a migration-numbering gate.
 *
 * THIS IS THE CANONICAL MANAGED SOURCE (`core/coordination/adr-numbering.mjs` in the AI-Organization
 * control plane), delivered to `.ai-organization/runtime/core/coordination/adr-numbering.mjs` in every
 * consuming project. DO NOT EDIT A DELIVERED COPY. A project ships a thin entry script that binds its
 * own ADR directory and naming convention and calls `runAdrNumberingGate`.
 *
 * WHY. ADR files are per-namespace sequential, one file each. Two parallel agents in isolated worktrees
 * can each add the SAME ADR number for different decisions — a git-clean collision (different files)
 * invisible until integration, exactly the class the namespace-reservation `adr` namespace PREVENTS.
 * This gate is the mechanical backstop: it fails the build when two ADR files share a number key, or
 * when an ADR-shaped file is malformed.
 *
 * TWO CONVENTIONS ship here because both are real in the fleet, and a project picks one:
 *   `domain-numbered` — `ADR-<DOMAIN>-NNN-kebab-title.md`, sequential PER DOMAIN.
 *   `sequential`      — `NNN-kebab-title.md`, one global sequence.
 * A project needing a third convention adds it HERE (so every project can use it), never by forking a
 * delivered copy. `conventionFor` throws on an unknown id rather than silently scanning nothing.
 *
 * Exit 0 = every number key unique and well-formed. Exit 1 = a collision, a malformed ADR name, or an
 * unreadable ADR directory (fail-closed: a gate that cannot see cannot certify).
 */

import fs from 'node:fs';

/**
 * A convention is: which files in the directory ARE ADRs (`isCandidate`), the exact filename shape
 * (`pattern`), the collision key a match folds to (`keyFor`), the human shape description used in the
 * malformed message, and the reservation hint printed with a collision.
 */
export const ADR_CONVENTIONS = Object.freeze({
  /**
   * `ADR-<DOMAIN>-<NNN>-<kebab-title>.md`. The DOMAIN may be multi-segment uppercase (`ARC`, but also
   * `COMPANION-RAW-DIAL`); the NUMBER is the last digit-run before the lowercase title, so backtracking
   * resolves `ADR-COMPANION-RAW-DIAL-001-…` to domain `COMPANION-RAW-DIAL`.
   */
  'domain-numbered': Object.freeze({
    id: 'domain-numbered',
    isCandidate: (name) => name.startsWith('ADR-'),
    pattern: /^ADR-([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)-(\d+)-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u,
    keyFor: (match) => `${match[1]}-${Number.parseInt(match[2], 10)}`,
    shape: 'ADR-<DOMAIN>-NNN-kebab-title.md (uppercase domain, digits, lowercase title)',
    reserveArgs: (key) => `adr ${key.slice(0, key.lastIndexOf('-'))} <title>`,
  }),

  /** `<NNN>-<kebab-title>.md` — one global sequence, no domain segment. */
  sequential: Object.freeze({
    id: 'sequential',
    isCandidate: (name) => /^\d/u.test(name),
    pattern: /^(\d+)-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u,
    keyFor: (match) => String(Number.parseInt(match[1], 10)),
    shape: 'NNN-kebab-title.md (digits, hyphen, lowercase title)',
    reserveArgs: () => 'adr <title>',
  }),
});

export const ADR_CONVENTION_IDS = Object.freeze(Object.keys(ADR_CONVENTIONS));

/** Resolve a convention id to its definition. Fail-closed: an unknown id is a wiring bug, not a skip. */
export function conventionFor(id) {
  const convention = ADR_CONVENTIONS[id];
  if (!convention) {
    throw new Error(
      `unknown ADR naming convention ${JSON.stringify(id)}; known: ${ADR_CONVENTION_IDS.join(', ')}`,
    );
  }
  return convention;
}

/** Pure core so the meta-test can drive it without scaffolding a repo. */
export function analyzeAdrNames(names, convention) {
  const errors = [];
  const byKey = new Map(); // number key -> [filename, …]
  let candidates = 0;
  for (const name of names) {
    // Non-ADR files (e.g. a README) are not this gate's concern.
    if (!convention.isCandidate(name)) continue;
    candidates += 1;
    const match = convention.pattern.exec(name);
    if (match == null) {
      errors.push(`malformed ADR filename: ${name} — expected ${convention.shape}`);
      continue;
    }
    const key = convention.keyFor(match);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(name);
  }
  for (const [key, group] of [...byKey.entries()].sort()) {
    if (group.length > 1) {
      errors.push(
        `duplicate ADR number ${key} — ${group.sort().join(' AND ')}. Two ADRs share one number, ` +
          `so the identifier no longer names a single decision. The branch merging SECOND renumbers to the ` +
          `next free number (reserve it with: node <reserve-cli> ${convention.reserveArgs(key)}).`,
      );
    }
  }
  return { errors, count: candidates, uniqueKeys: byKey.size };
}

export function collectAdrNames(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name);
}

/**
 * Run the gate against one project's ADR directory. Returns the exit code (0 pass / 1 fail) instead of
 * calling `process.exit`, so the meta-test drives every branch in-process.
 */
export function runAdrNumberingGate({
  adrDir,
  convention: conventionId,
  reserveCli = 'scripts/reserve.mjs',
  stdout = (line) => console.log(line),
  stderr = (line) => console.error(line),
} = {}) {
  let convention;
  try {
    convention = conventionFor(conventionId);
  } catch (err) {
    stderr(`check-adr-numbering: FAILED — ${err.message}`);
    return 1;
  }
  let names;
  try {
    names = collectAdrNames(adrDir);
  } catch (err) {
    stderr(`check-adr-numbering: FAILED — cannot read ${adrDir}: ${err.message}`);
    return 1;
  }
  if (names.length === 0) {
    stderr(
      `check-adr-numbering: FAILED — no ADR files found in ${adrDir}. A gate that sees nothing cannot certify.`,
    );
    return 1;
  }
  const { errors, count, uniqueKeys } = analyzeAdrNames(names, convention);
  if (errors.length > 0) {
    stderr('check-adr-numbering: FAILED');
    for (const e of errors) stderr(`  - ${e.replace('<reserve-cli>', reserveCli)}`);
    return 1;
  }
  stdout(
    `check-adr-numbering: OK — ${count} ADR(s) under the ${convention.id} convention in ${adrDir}, ` +
      `${uniqueKeys} unique number key(s), no collisions. ` +
      'Scope: filename numbering only — it does not certify ADR CONTENT, status, or that the ' +
      'decision-log row citing an ADR exists.',
  );
  return 0;
}
