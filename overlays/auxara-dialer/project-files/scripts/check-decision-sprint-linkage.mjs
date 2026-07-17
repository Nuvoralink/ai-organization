#!/usr/bin/env node

// Auxara — DECISION LOG ↔ SPRINT PLAN linkage gate.
//
// The class this catches (PARITY-S13-APPROVED-NOT-BUILT-001, 2026-07-13/14): approved
// decisions kept landing after the sprint docs' `## Included decision IDs` inventories had frozen.
// Planning therefore began from incomplete scope while every existing gate stayed green. This gate
// makes that plan-layer handoff bidirectional and fail-closed:
//   ORPHAN    a ✅ decision targets sprint X.Y, but sprint-X-Y.md does not include its ID → FAIL.
//   DANGLING  a ✅ decision targets a missing or README-scrapped sprint → FAIL.
//   INVERSE   a sprint includes an unknown, Deferred, or Scrapped/Dropped decision ID → FAIL.
//   FORMAT    the decision table, sprint index, or Included-IDs section cannot be parsed → FAIL.
//
// Sprint docs use two real formats: a Markdown table whose first column is the decision ID, or a
// prose comma-separated list with bolded IDs and explanatory parentheticals. Table rows are parsed
// structurally; prose parentheticals are removed before IDs are extracted so cross-references inside
// an item's explanation never impersonate additional included decisions.
//
// PENDING_LINKAGE is the ONLY deferral escape. Each exact decision ID carries a structured, dated,
// human-owned row `{ id, reason, owner, addedAt, decision }`. The gate fails a blank/invalid row, a
// DEAD row (ID no longer exists), a STALE row (the underlying violation is now resolved), or a
// duplicate row. A pending row may temporarily cover an ORPHAN, a DANGLING target, or a Deferred
// inverse while a named product fork is resolved. It can NEVER excuse an unknown ID or resurrect a
// Scrapped/Dropped decision.
//
// SCOPE: exact sprint targets are `X.Y` tokens in the decision table's Sprint column. Deliberately
// non-exact planning labels (`2.x`, `triggered`, `pre-first-external-tenant`, `—`) do not name a
// concrete sprint and are outside this mechanical floor until the authority assigns an exact target.
// The sprint-kickoff-auditor still owns semantic completeness, stale-echo, and whether a non-exact
// target should now be scheduled. This scanner does not decide product ownership or scheduling.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DECISION_LOG_FILE = 'docs/app-plan/auditability/decision-log.md';
const SPRINTS_DIR = 'docs/app-plan/implementation/sprints';
const SPRINT_INDEX_FILE = `${SPRINTS_DIR}/README.md`;
const DECISION_TABLE_HEADING = '## Decisions requiring user confirmation';
const INCLUDED_IDS_HEADING_RE = /^## Included decision IDs(?:\s|$)/;
const DECISION_ID_RE = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/;
const DECISION_ID_CANDIDATE_RE = /\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+\b/g;
const NON_DECISION_PREFIXES = ['ADR-', 'BENCH-', 'REQ-', 'NFR-'];
const SPRINT_TARGET_RE = /(?<![\d.])(\d+\.\d+)(?![\d.])/g;
const SPRINT_FILE_RE = /^sprint-(\d+)-(\d+)\.md$/;
const REQUIRED_PENDING_FIELDS = ['id', 'reason', 'owner', 'addedAt', 'decision'];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Honest, temporary product-fork deferrals. Rows are added only after the gate proves a real issue
 * and the fork is tracked durably in docs/BUG_BACKLOG.md. The live repo rows are populated in STEP 3.
 */
export const PENDING_LINKAGE = [
  {
    id: 'BUX-019',
    reason:
      'Ownership of the unified home and pop-out across Sprint 1.4 versus later is unsettled.',
    owner: 'Amin / sprint kickoff decision',
    addedAt: '2026-07-15',
    decision:
      'Choose whole-in-1.4 or an explicit split; do not infer the split from existing docs.',
  },
  {
    id: 'CMP-011',
    reason:
      'The row names missing Sprint 3.4, its notes say pre-external-tenant, and Sprint 3.3 includes it.',
    owner: 'Amin / sprint kickoff decision',
    addedAt: '2026-07-15',
    decision:
      'Choose one concrete trigger/sprint authority and remove the other scheduling claims.',
  },
  {
    id: 'MGR-004',
    reason:
      'The decision is explicitly Deferred and not Phase-3-committed, but Sprint 3.3 includes it.',
    owner: 'Amin / sprint kickoff decision',
    addedAt: '2026-07-15',
    decision: 'Remove it from Sprint 3.3 or explicitly schedule/reactivate it.',
  },
  {
    id: 'VOX-001',
    reason:
      'The approved Phase-5 decision targets Sprint 5.0, but no Sprint 5.0 plan authority exists.',
    owner: 'Amin / sprint kickoff decision',
    addedAt: '2026-07-15',
    decision:
      'Create/own Sprint 5.0 deliberately or assign a different concrete planning authority.',
  },
  {
    id: 'VOX-002',
    reason:
      'The approved Phase-5 decision targets Sprint 5.0, but no Sprint 5.0 plan authority exists.',
    owner: 'Amin / sprint kickoff decision',
    addedAt: '2026-07-15',
    decision:
      'Create/own Sprint 5.0 deliberately or assign a different concrete planning authority.',
  },
  {
    id: 'VOX-003',
    reason:
      'The approved Phase-5 decision targets Sprint 5.0, but no Sprint 5.0 plan authority exists.',
    owner: 'Amin / sprint kickoff decision',
    addedAt: '2026-07-15',
    decision:
      'Create/own Sprint 5.0 deliberately or assign a different concrete planning authority.',
  },
];

const norm = (value) => value.replace(/\\/g, '/');

function readLines(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return fs.readFileSync(absolutePath, 'utf8').replace(/\r\n/g, '\n').split('\n');
}

/** Split a Markdown table row on unescaped pipes. `human\|ai_agent` remains one cell. */
export function splitMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  const cells = [];
  let cell = '';
  for (let index = 1; index < trimmed.length - 1; index += 1) {
    const char = trimmed[index];
    if (char === '\\' && trimmed[index + 1] === '|') {
      cell += '|';
      index += 1;
      continue;
    }
    if (char === '|') {
      cells.push(cell.trim());
      cell = '';
      continue;
    }
    cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

function classifyStatus(status) {
  if (status.includes('✅')) return 'approved';
  if (/[❌⛔]/u.test(status) || /Dropped|N\/A/i.test(status)) return 'scrapped';
  if (/Deferred/i.test(status)) return 'deferred';
  return 'other';
}

function sprintTargets(sprintCell) {
  const withoutExplanatoryParentheticals = stripBalancedParentheticals(sprintCell);
  return {
    balanced: withoutExplanatoryParentheticals.balanced,
    targets: [...withoutExplanatoryParentheticals.value.matchAll(SPRINT_TARGET_RE)].map(
      (match) => match[1],
    ),
  };
}

function isDecisionCandidate(candidate) {
  return !NON_DECISION_PREFIXES.some((prefix) => candidate.startsWith(prefix));
}

function stripBalancedParentheticals(value) {
  let depth = 0;
  let output = '';
  for (const char of value) {
    if (char === '(') {
      depth += 1;
      continue;
    }
    if (char === ')') {
      if (depth > 0) depth -= 1;
      continue;
    }
    if (depth === 0) output += char;
  }
  return { value: output, balanced: depth === 0 };
}

/** Parse the one authoritative seven-column decision table. */
export function collectDecisions(root = process.cwd()) {
  const lines = readLines(root, DECISION_LOG_FILE);
  const errors = [];
  const decisions = new Map();
  if (lines == null) {
    errors.push(`${DECISION_LOG_FILE} is missing`);
    return { decisions, errors };
  }

  const headingIndex = lines.findIndex((line) => line.trim() === DECISION_TABLE_HEADING);
  if (headingIndex < 0) {
    errors.push(`${DECISION_LOG_FILE} is missing ${DECISION_TABLE_HEADING}`);
    return { decisions, errors };
  }
  const headerIndex = lines.findIndex(
    (line, index) => index > headingIndex && /^\|\s*ID\s*\|/.test(line),
  );
  if (headerIndex < 0) {
    errors.push(
      `${DECISION_LOG_FILE} has no decision-table header after ${DECISION_TABLE_HEADING}`,
    );
    return { decisions, errors };
  }
  const header = splitMarkdownRow(lines[headerIndex]);
  const expectedHeader = ['ID', 'Title', 'Area', 'Phase', 'Sprint', 'Status', 'Notes'];
  if (header == null || header.join('|') !== expectedHeader.join('|')) {
    errors.push(
      `${DECISION_LOG_FILE}:${headerIndex + 1} must be the seven-column ${expectedHeader.join(' | ')} table`,
    );
    return { decisions, errors };
  }
  const divider = splitMarkdownRow(lines[headerIndex + 1] ?? '');
  if (
    divider == null ||
    divider.length !== expectedHeader.length ||
    divider.some((c) => !/^:?-{3,}:?$/.test(c))
  ) {
    errors.push(`${DECISION_LOG_FILE}:${headerIndex + 2} has an invalid decision-table divider`);
    return { decisions, errors };
  }

  let rowCount = 0;
  for (let index = headerIndex + 2; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^##\s/.test(line)) break;
    if (line.trim().length === 0) continue;
    if (!line.trim().startsWith('|')) {
      let tableResumesBeforeNextHeading = false;
      for (let laterIndex = index + 1; laterIndex < lines.length; laterIndex += 1) {
        if (/^##\s/.test(lines[laterIndex])) break;
        if (lines[laterIndex].trim().startsWith('|')) {
          tableResumesBeforeNextHeading = true;
          break;
        }
      }
      if (tableResumesBeforeNextHeading) {
        errors.push(
          `${DECISION_LOG_FILE}:${index + 1} interrupts the decision table before later rows`,
        );
      }
      break;
    }
    const cells = splitMarkdownRow(line);
    if (cells == null || cells.length !== expectedHeader.length) {
      errors.push(
        `${DECISION_LOG_FILE}:${index + 1} decision row has ${cells?.length ?? 0} cells; expected 7`,
      );
      continue;
    }
    const [id, title, area, phase, sprint, status, notes] = cells;
    if (!DECISION_ID_RE.test(id)) {
      errors.push(
        `${DECISION_LOG_FILE}:${index + 1} has invalid decision ID ${JSON.stringify(id)}`,
      );
      continue;
    }
    if (decisions.has(id)) {
      errors.push(`${DECISION_LOG_FILE}:${index + 1} duplicates decision ID ${id}`);
      continue;
    }
    if ([title, area, phase, sprint, status, notes].some((cell) => cell.length === 0)) {
      errors.push(`${DECISION_LOG_FILE}:${index + 1} has a blank required cell for ${id}`);
      continue;
    }
    const targetResult = sprintTargets(sprint);
    if (!targetResult.balanced) {
      errors.push(
        `${DECISION_LOG_FILE}:${index + 1} has unbalanced Sprint-cell parentheticals for ${id}`,
      );
    }
    decisions.set(id, {
      id,
      title,
      area,
      phase,
      sprint,
      status,
      statusKind: classifyStatus(status),
      targets: targetResult.targets,
      line: index + 1,
    });
    rowCount += 1;
  }
  if (rowCount === 0) errors.push(`${DECISION_LOG_FILE} decision table has zero data rows`);
  return { decisions, errors };
}

function collectIdsFromIncludedBlock(block, relativePath, startLine, errors) {
  const tableRows = block.filter((line) => line.trim().startsWith('|'));
  const ids = new Set();
  if (tableRows.length > 0) {
    const header = splitMarkdownRow(tableRows[0]);
    if (header == null || header[0] !== 'ID') {
      errors.push(`${relativePath}:${startLine} Included-IDs table must start with an ID column`);
      return ids;
    }
    const divider = splitMarkdownRow(tableRows[1] ?? '');
    if (divider == null || !/^:?-{3,}:?$/.test(divider[0] ?? '')) {
      errors.push(`${relativePath}:${startLine + 1} Included-IDs table divider is invalid`);
      return ids;
    }
    for (let index = 2; index < tableRows.length; index += 1) {
      const cells = splitMarkdownRow(tableRows[index]);
      if (cells == null || cells.length !== header.length) {
        errors.push(`${relativePath} Included-IDs table has an inconsistent row shape`);
        continue;
      }
      const candidates = (cells[0].match(DECISION_ID_CANDIDATE_RE) ?? []).filter(
        isDecisionCandidate,
      );
      if (candidates.length !== 1) {
        errors.push(
          `${relativePath} Included-IDs first cell ${JSON.stringify(cells[0])} must contain exactly one decision ID`,
        );
        continue;
      }
      ids.add(candidates[0]);
    }
    return ids;
  }

  const prose = stripBalancedParentheticals(block.join('\n'));
  if (!prose.balanced) {
    errors.push(`${relativePath}:${startLine} Included-IDs prose has unbalanced parentheticals`);
    return ids;
  }
  for (const candidate of prose.value.match(DECISION_ID_CANDIDATE_RE) ?? []) {
    if (isDecisionCandidate(candidate)) ids.add(candidate);
  }
  return ids;
}

/** Parse every sprint-X-Y.md and its real table-or-prose Included decision IDs format. */
export function collectSprintDocs(root = process.cwd()) {
  const errors = [];
  const sprints = new Map();
  const absoluteDir = path.join(root, SPRINTS_DIR);
  if (!fs.existsSync(absoluteDir)) {
    errors.push(`${SPRINTS_DIR} is missing`);
    return { sprints, errors };
  }
  const files = fs
    .readdirSync(absoluteDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && SPRINT_FILE_RE.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (files.length === 0) errors.push(`${SPRINTS_DIR} contains no sprint-X-Y.md files`);

  for (const file of files) {
    const match = file.match(SPRINT_FILE_RE);
    const sprint = `${Number(match[1])}.${Number(match[2])}`;
    if (sprints.has(sprint)) {
      errors.push(`${SPRINTS_DIR}/${file} duplicates sprint ${sprint}`);
      continue;
    }
    const relativePath = `${SPRINTS_DIR}/${file}`;
    const lines = readLines(root, relativePath);
    const headingIndices = lines
      .map((line, index) => (INCLUDED_IDS_HEADING_RE.test(line.trim()) ? index : -1))
      .filter((index) => index >= 0);
    if (headingIndices.length !== 1) {
      errors.push(
        `${relativePath} must contain exactly one ## Included decision IDs section; found ${headingIndices.length}`,
      );
      continue;
    }
    const headingIndex = headingIndices[0];
    let endIndex = lines.length;
    for (let index = headingIndex + 1; index < lines.length; index += 1) {
      if (/^##\s/.test(lines[index])) {
        endIndex = index;
        break;
      }
    }
    const block = lines.slice(headingIndex + 1, endIndex).filter((line) => line.trim() !== '');
    const ids = collectIdsFromIncludedBlock(block, relativePath, headingIndex + 2, errors);
    if (ids.size === 0)
      errors.push(`${relativePath} Included decision IDs section resolved zero IDs`);
    sprints.set(sprint, { sprint, file: relativePath, ids });
  }
  return { sprints, errors };
}

/** The README struck-through/Removed rows are the authority for deliberately deleted sprints. */
export function collectDeletedSprints(root = process.cwd()) {
  const lines = readLines(root, SPRINT_INDEX_FILE);
  const errors = [];
  const deleted = new Set();
  if (lines == null) {
    errors.push(`${SPRINT_INDEX_FILE} is missing`);
    return { deleted, errors };
  }
  let sawIndex = false;
  for (const [index, line] of lines.entries()) {
    if (/^\|\s*Phase\s*\|\s*Sprint\s*\|/.test(line)) sawIndex = true;
    const match = line.match(/^\|\s*\d+\s*\|\s*~~(\d+\.\d+)~~\s*\|.*\|\s*Removed\s*\|\s*$/i);
    if (match) {
      deleted.add(match[1]);
    } else if (/^\|.*~~\d+\.\d+~~.*(?:SCRAPPED|Removed)/i.test(line)) {
      errors.push(`${SPRINT_INDEX_FILE}:${index + 1} has an unparseable deleted-sprint row`);
    }
  }
  if (!sawIndex) errors.push(`${SPRINT_INDEX_FILE} is missing the Phase | Sprint index table`);
  return { deleted, errors };
}

function invalidPendingReason(row) {
  if (row == null || typeof row !== 'object' || Array.isArray(row)) {
    return 'row must be an object with id, reason, owner, addedAt, and decision';
  }
  for (const field of REQUIRED_PENDING_FIELDS) {
    if (typeof row[field] !== 'string' || row[field].trim().length === 0) {
      return `missing non-empty ${field}`;
    }
  }
  if (!DECISION_ID_RE.test(row.id)) return 'id must be a canonical decision ID';
  const addedAtMs = Date.parse(`${row.addedAt}T00:00:00Z`);
  if (
    !ISO_DATE_RE.test(row.addedAt) ||
    Number.isNaN(addedAtMs) ||
    new Date(addedAtMs).toISOString().slice(0, 10) !== row.addedAt
  ) {
    return 'addedAt must be an ISO calendar date (YYYY-MM-DD)';
  }
  return null;
}

/**
 * Returns the complete gate result. Empty issue arrays = pass; format failures are never skipped.
 */
export function runDecisionSprintLinkageGate(
  root = process.cwd(),
  pendingLinkage = PENDING_LINKAGE,
) {
  const decisionResult = collectDecisions(root);
  const sprintResult = collectSprintDocs(root);
  const deletedResult = collectDeletedSprints(root);
  const formatErrors = [...decisionResult.errors, ...sprintResult.errors, ...deletedResult.errors];
  const { decisions } = decisionResult;
  const { sprints } = sprintResult;
  const { deleted } = deletedResult;

  const rawOrphans = [];
  const rawDangling = [];
  for (const decision of decisions.values()) {
    if (decision.statusKind !== 'approved') continue;
    for (const sprint of decision.targets) {
      if (deleted.has(sprint)) {
        rawDangling.push({ id: decision.id, sprint, reason: 'deleted' });
      } else if (!sprints.has(sprint)) {
        rawDangling.push({ id: decision.id, sprint, reason: 'missing' });
      } else if (!sprints.get(sprint).ids.has(decision.id)) {
        rawOrphans.push({ id: decision.id, sprint });
      }
    }
  }

  const rawInverse = [];
  for (const sprintDoc of sprints.values()) {
    for (const id of sprintDoc.ids) {
      const decision = decisions.get(id);
      if (!decision) rawInverse.push({ id, sprint: sprintDoc.sprint, reason: 'unknown' });
      else if (decision.statusKind === 'scrapped') {
        rawInverse.push({ id, sprint: sprintDoc.sprint, reason: 'scrapped' });
      } else if (decision.statusKind === 'deferred') {
        rawInverse.push({ id, sprint: sprintDoc.sprint, reason: 'deferred' });
      }
    }
  }

  const deferrableIssueIds = new Set([
    ...rawOrphans.map((issue) => issue.id),
    ...rawDangling.map((issue) => issue.id),
    ...rawInverse.filter((issue) => issue.reason === 'deferred').map((issue) => issue.id),
  ]);
  const invalidRows = [];
  const deadRows = [];
  const staleRows = [];
  const duplicateRows = [];
  const seenPendingIds = new Set();
  const validPendingIds = new Set();
  if (!Array.isArray(pendingLinkage)) {
    invalidRows.push({
      id: '(root)',
      reason: 'PENDING_LINKAGE must be an array of structured rows',
    });
  } else {
    for (const row of pendingLinkage) {
      const invalidReason = invalidPendingReason(row);
      const id = typeof row?.id === 'string' ? row.id : '(unknown)';
      if (invalidReason) {
        invalidRows.push({ id, reason: invalidReason });
        continue;
      }
      if (seenPendingIds.has(row.id)) {
        duplicateRows.push(row.id);
        continue;
      }
      seenPendingIds.add(row.id);
      if (!decisions.has(row.id)) {
        deadRows.push(row.id);
        continue;
      }
      if (!deferrableIssueIds.has(row.id)) {
        staleRows.push(row.id);
        continue;
      }
      validPendingIds.add(row.id);
    }
  }

  const orphans = rawOrphans.filter((issue) => !validPendingIds.has(issue.id));
  const dangling = rawDangling.filter((issue) => !validPendingIds.has(issue.id));
  const inverse = rawInverse.filter(
    (issue) => !(issue.reason === 'deferred' && validPendingIds.has(issue.id)),
  );

  return {
    orphans,
    dangling,
    inverse,
    invalidRows,
    deadRows,
    staleRows,
    duplicateRows,
    formatErrors,
    decisionCount: decisions.size,
    sprintCount: sprints.size,
  };
}

function main() {
  // Test-only seam: tmpdir fixtures supply their own exact pending rows. Real runs never set this.
  const pending = process.env.DECISION_SPRINT_LINKAGE_PENDING
    ? JSON.parse(process.env.DECISION_SPRINT_LINKAGE_PENDING)
    : PENDING_LINKAGE;
  const result = runDecisionSprintLinkageGate(process.cwd(), pending);
  const issueCount =
    result.orphans.length +
    result.dangling.length +
    result.inverse.length +
    result.invalidRows.length +
    result.deadRows.length +
    result.staleRows.length +
    result.duplicateRows.length +
    result.formatErrors.length;
  if (issueCount === 0) {
    console.log(
      `check-decision-sprint-linkage: OK — ${result.decisionCount} decisions and ${result.sprintCount} sprint docs are bidirectionally linked or explicitly pending.`,
    );
    process.exit(0);
  }

  console.error('check-decision-sprint-linkage FAILED — decision↔sprint plan drift:');
  for (const issue of result.orphans) {
    console.error(
      `  - ORPHAN   ${issue.id} targets Sprint ${issue.sprint}, but sprint-${issue.sprint.replace('.', '-')}.md does not include it.`,
    );
  }
  for (const issue of result.dangling) {
    const basis =
      issue.reason === 'deleted'
        ? 'is struck-through/Removed in the sprint index'
        : 'has no sprint doc';
    console.error(`  - DANGLING ${issue.id} targets Sprint ${issue.sprint}, which ${basis}.`);
  }
  for (const issue of result.inverse) {
    console.error(
      `  - INVERSE  Sprint ${issue.sprint} includes ${issue.id}, whose decision status is ${issue.reason}.`,
    );
  }
  for (const row of result.invalidRows) {
    console.error(`  - INVALID  PENDING_LINKAGE ${row.id} — ${row.reason}.`);
  }
  for (const id of result.deadRows) {
    console.error(`  - DEAD     PENDING_LINKAGE ${id} — no such decision exists.`);
  }
  for (const id of result.staleRows) {
    console.error(
      `  - STALE    PENDING_LINKAGE ${id} — its linkage issue is resolved; delete the row.`,
    );
  }
  for (const id of result.duplicateRows) {
    console.error(`  - DUPLICATE PENDING_LINKAGE ${id} — keep exactly one row.`);
  }
  for (const error of result.formatErrors) console.error(`  - FORMAT   ${norm(error)}`);
  console.error(
    '\n  Reconcile a mechanical mismatch at its owning authority. If ownership/scheduling is a real',
  );
  console.error(
    '  product fork, track it in docs/BUG_BACKLOG.md and add one structured PENDING_LINKAGE row;',
  );
  console.error('  never guess, silently skip, or reintroduce a Scrapped/Dropped decision.');
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
