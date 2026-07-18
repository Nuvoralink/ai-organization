#!/usr/bin/env node
/**
 * gate:rules-wiring — the agent-rules loader wiring is intact + single-sourced.
 *
 * WHY THIS EXISTS (2026-07-02, mirror-drift retirement):
 *   The repo used to keep agent rules in TWO hand-synced directories — `.claude/rules/` (Claude Code)
 *   and a manual `.codex/rules/` mirror (Codex). The mirror DRIFTED silently: 5 files diverged and
 *   Codex never saw the 2026-06-30 tx-rollback rule for weeks. The fix was to single-source the rules
 *   under `.claude/rules/` and point BOTH agents at it (Codex via the paths listed in AGENTS.md — it
 *   has no native auto-loader). This gate replaces mirror-sync vigilance with a mechanical check:
 *   fail the build if a rule reference dangles, a rule goes undiscoverable from AGENTS.md, or the
 *   deleted `.codex/rules/` mirror silently returns.
 *
 * THE RULE (see AGENTS.md + CLAUDE.md "Cross-Agent Parity" + docs/Journey L15):
 *   1. Every `@.claude/rules/*.md` reference in CLAUDE.md resolves to an existing file.
 *   2. Every `.claude/rules/*.md` path listed in AGENTS.md resolves to an existing file.
 *   3. Every file present in `.claude/rules/` is referenced at least once from AGENTS.md (always-on
 *      OR contextual) — so Codex can discover every rule.
 *   4. `.codex/rules/` does NOT exist (the retired mirror must not silently come back).
 *
 * Exit code 0 = pass; 1 = fail.
 *
 * Run: `npm run gate:rules-wiring`
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const RULES_DIR = '.claude/rules';
const CLAUDE_MD = 'CLAUDE.md';
const AGENTS_MD = 'AGENTS.md';
const RETIRED_MIRROR = '.codex/rules';

const failures = [];

function read(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), 'utf8');
  } catch {
    return null;
  }
}

// Extract every `.claude/rules/<name>.md` path referenced in a document (both the CLAUDE.md
// `@.claude/rules/x.md` @-load form and the AGENTS.md `` `.claude/rules/x.md` `` inline form).
function referencedRulePaths(text) {
  const out = new Set();
  if (!text) return out;
  for (const m of text.matchAll(/\.claude\/rules\/([A-Za-z0-9._-]+\.md)/g)) out.add(m[1]);
  return out;
}

// ----- 4. The retired `.codex/rules/` mirror must not silently return --------
// (Checked first + unconditionally: it must hold even before the rules dir / entry docs exist.)
if (fs.existsSync(path.join(root, RETIRED_MIRROR))) {
  failures.push(
    `The retired \`${RETIRED_MIRROR}/\` mirror exists again — rules are single-sourced under ` +
      `\`${RULES_DIR}/\` and point both agents at it (mirror retired 2026-07-02). Delete ` +
      `\`${RETIRED_MIRROR}/\` and keep the single source (see docs/Journey/AI_BUILD_JOURNEY_LESSONS.md L15).`,
  );
}

const rulesDirAbs = path.join(root, RULES_DIR);
if (!fs.existsSync(rulesDirAbs)) {
  // No rules dir yet — only the "mirror must not return" check applies at bootstrap.
  if (failures.length === 0) {
    console.log(`check-rules-wiring: ${RULES_DIR}/ not present yet — skipping (bootstrap).`);
    process.exit(0);
  }
} else {
  const ruleFiles = new Set(
    fs.readdirSync(rulesDirAbs).filter((f) => f.endsWith('.md') && !f.startsWith('.')),
  );
  const ruleExists = (name) => ruleFiles.has(name);

  const claudeText = read(CLAUDE_MD);
  const agentsText = read(AGENTS_MD);
  if (claudeText === null) failures.push(`Missing entry doc: ${CLAUDE_MD}`);
  if (agentsText === null) failures.push(`Missing entry doc: ${AGENTS_MD}`);

  // ----- 1. Every @.claude/rules/*.md ref in CLAUDE.md resolves --------------
  const claudeAtRefs = new Set();
  if (claudeText) {
    for (const m of claudeText.matchAll(/@\.claude\/rules\/([A-Za-z0-9._-]+\.md)/g)) {
      claudeAtRefs.add(m[1]);
    }
    for (const name of [...claudeAtRefs].sort()) {
      if (!ruleExists(name)) {
        failures.push(
          `${CLAUDE_MD} @-loads \`${RULES_DIR}/${name}\` which does not exist (dangling rule reference).`,
        );
      }
    }
    if (claudeAtRefs.size === 0) {
      failures.push(
        `${CLAUDE_MD} has no \`@${RULES_DIR}/*.md\` always-on rule references — the loader wiring is missing.`,
      );
    }
  }

  // ----- 2. Every .claude/rules/*.md path in AGENTS.md resolves --------------
  const agentsRefs = referencedRulePaths(agentsText);
  for (const name of [...agentsRefs].sort()) {
    if (!ruleExists(name)) {
      failures.push(
        `${AGENTS_MD} lists \`${RULES_DIR}/${name}\` which does not exist (dangling rule reference).`,
      );
    }
  }

  // ----- 3. Every rule file is discoverable from AGENTS.md -------------------
  // AGENTS.md is Codex's ONLY discovery surface (no native auto-loader), so every rule — always-on
  // OR contextual — must be named there at least once.
  for (const name of [...ruleFiles].sort()) {
    if (!agentsRefs.has(name)) {
      failures.push(
        `${RULES_DIR}/${name} is not referenced from ${AGENTS_MD} — Codex cannot discover it. ` +
          `Add it to the always-on or the contextual rules list.`,
      );
    }
  }
}

// ----- Report ---------------------------------------------------------------
if (failures.length > 0) {
  console.error('check-rules-wiring: FAILED — agent-rules loader wiring is broken:\n');
  for (const f of failures) console.error('  ✖ ' + f);
  console.error(
    '\nRules are single-sourced under `.claude/rules/` and discovered by Codex via AGENTS.md. ' +
      'See AGENTS.md + CLAUDE.md "Cross-Agent Parity".',
  );
  process.exit(1);
}

console.log(
  `check-rules-wiring: OK — every ${RULES_DIR}/*.md is discoverable from ${AGENTS_MD}, every ` +
    `CLAUDE.md/AGENTS.md rule reference resolves, and the retired ${RETIRED_MIRROR}/ mirror is absent.`,
);
process.exit(0);
