// Claude Code PostToolUse hook — runs CoachAI's doctrine gates automatically after file edits.
// Wired from .claude/settings.json. Receives the tool-call JSON on stdin; routes the edited
// file to the matching gate(s). Exit 2 feeds the gate failure back to the agent so it must fix
// the violation before moving on ("wire the gate, not the rule" — doctrine-loop Arm 1).
//
// Routing:
//   frontend/src edits            -> check:ui + check:ui-continuity (UI guardrails)
//   backend|shared/src (non-test) -> gate:tx-seam (no unknown-typed Prisma write seam)
//   test files under backend/     -> gate:ephemeral-listen (no raw .listen(0); the gate scans
//                                    backend/src + backend/scripts)
//   test files (any path)         -> check-test-intent --file <p> (test-intent header; ratchet-on-touch:
//                                    touch a test, bring it up to the header standard — new tests must
//                                    comply, untouched legacy stays grandfathered in the repo-wide run)
import { readFileSync } from 'node:fs';
import { execSync, execFileSync } from 'node:child_process';
import { isTestFile } from './lib/test-file-match.mjs';

let filePath = '';
try {
  const payload = JSON.parse(readFileSync(0, 'utf8'));
  filePath = payload?.tool_input?.file_path ?? '';
} catch {
  process.exit(0); // unparseable payload — never block on hook plumbing
}
if (!filePath) process.exit(0);

const p = filePath.replace(/\\/g, '/');
const isTest = isTestFile(p); // single-sourced in scripts/lib/test-file-match.mjs

const gates = [];
if (/\/frontend\/src\//.test(p)) gates.push('check:ui', 'check:ui-continuity');
// A non-test backend/shared source edit can introduce an unknown-typed Prisma write seam.
if (/\/(backend|shared)\/src\/.*\.ts$/.test(p) && !isTest) gates.push('gate:tx-seam');
// A test file under backend/ can reintroduce a raw .listen(0) (the gate scans backend/src + scripts).
if (isTest && /\/backend\/(src|scripts)\//.test(p)) gates.push('gate:ephemeral-listen');
// Startup/rule edits get bounded structural checks here; full risk proof remains a completion gate.
if (/\/(AGENTS\.md|CLAUDE\.md)$/.test(p) || /\/\.cursor\/rules\//.test(p)) {
  gates.push('gate:agent-context', 'gate:rules-wiring');
}
// Claude-specific adapters are validated against the vendor-neutral organization authority.
if (
  /\/\.ai-organization\//.test(p) ||
  /\/\.claude\/agents\//.test(p) ||
  /\/\.claude\/settings\.json$/.test(p) ||
  /\/\.github\//.test(p) ||
  /\/scripts\/(check-agent-control-plane|claude-lifecycle-hook|task-governor|run-risk-selected-proof)\.mjs$/.test(p)
) {
  gates.push('gate:agent-control-plane');
}

if (gates.length === 0 && !isTest) process.exit(0);

let failed = false;
function reportFailure(label, err) {
  failed = true;
  const out = `${err.stdout ?? ''}${err.stderr ?? ''}`.slice(-3000);
  console.error(
    `[gate-hook] ${label} FAILED after editing ${p}.\n` +
      `Fix the violation now — do not proceed or work around the gate.\n${out}`,
  );
}

for (const gate of [...new Set(gates)]) {
  try {
    execSync(`npm run ${gate}`, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 90_000 });
  } catch (err) {
    reportFailure(`\`npm run ${gate}\``, err);
  }
}
if (isTest) {
  // execFileSync (no shell) so the absolute path — which contains a space ("Nuvora CoachAi") — is
  // passed as a single argv element without quoting hazards.
  try {
    execFileSync('node', ['scripts/check-test-intent.mjs', '--file', filePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 60_000,
    });
  } catch (err) {
    reportFailure('`check-test-intent --file`', err);
  }
}

process.exit(failed ? 2 : 0);
