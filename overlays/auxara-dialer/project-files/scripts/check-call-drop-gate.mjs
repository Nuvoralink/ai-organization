#!/usr/bin/env node
/**
 * check:call-drop-gate — a page/component call-drop handler that calls the raw local `hangup(`
 *   without a SERVER-side cancel in the same function orphans the prospect's server leg. Flag-only (WARN).
 *
 * WHY THIS EXISTS (journey L13 — the class bit 5-7×; latest 2026-07-03, PR #171 end/vmDrop):
 *   The local WebRTC `hangup()` tears down ONLY the local media leg. It never reaches the webhook-driven
 *   bridge orchestrator, so the PROSPECT's server leg keeps ringing/connected after the booker "ended"
 *   the call — an abandoned live party (ARC-006/TCPA compliance bug, not a UX bug). Every call-drop
 *   handler must route through the shared teardown gate, which server-cancels BOTH legs via
 *   api.calls.cancel (the teardown authority) before/alongside the local hangup:
 *     - CallProvider.teardownActiveCall — drop both legs + CLEAR the shared activeCallId (droppers
 *       that leave to IDLE: reset, endShift, skip/defer/callNow via endActiveCall, comms/Companion endCall).
 *     - CallProvider.cancelActiveLegs — drop both legs, KEEP activeCallId (droppers that go to WRAP_UP
 *       to disposition: cockpit end, vmDrop; and the cockpit cancel with its auto-answer abort guard).
 *   The pre-fix bug shape this gate flags: `end: () => { hangup(); dispatch({ type: 'END' }); }` — a
 *   local-only hangup with NO server cancel anywhere in the enclosing function.
 *
 * THE RULE (see .claude/rules/auxara-dialer-frontend-rules.md "Call teardown routes through the ONE
 *   shared gate"): page/feature code (frontend/src/pages, frontend/src/components) never calls the raw
 *   `hangup` primitive as a call-drop action. It routes through the CallProvider teardown gate. The raw
 *   primitive belongs to the gate's owners only (frontend/src/context/CallProvider.tsx,
 *   frontend/src/hooks/useWebRTC.ts) — both outside this gate's scan scope by design.
 *
 * WHY FLAG-ONLY (WARN, always exit 0):
 *   "The enclosing function contains a server-cancel" is a heuristic, not data-flow analysis: a hangup
 *   deferred inside a nested callback whose server-cancel lives one scope up would false-positive, and a
 *   sanctioned marker in an unrelated branch of the same function would false-negative. So it makes the
 *   L13 shape VISIBLE for a reviewer (the auditors' Learned-classes rows own the semantic enumeration);
 *   it never breaks the build.
 *
 * SCOPE + LIMITS: matches the CALL shape `hangup(` (member or bare) outside comments/strings. It cannot
 *   see a raw hangup passed as a REFERENCE (e.g. `onClick={hangup}`) — the reviewer rows cover that.
 *
 * ESCAPE HATCH: append `// call-drop-gate-ok: <reason>` on the flagged line (or the line directly
 *   above) when the hangup is genuinely not a call-drop action (or its server-cancel is proven at a
 *   different layer). The reason is required so the bypass is reviewable.
 *
 * Exit code: 0 (WARN-only) in gates:all/CI. With CALL_DROP_GATE_STRICT=1 (or --strict) — set by the
 *   PostToolUse hook so a flag actually reaches the editing agent — exits 1 when warnings exist.
 *   Run: `npm run check:call-drop-gate`
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['frontend/src/pages', 'frontend/src/components'];
const SKIP_DIR_SEGMENTS = ['__tests__', 'node_modules', 'dist'];

// The raw local-media hangup CALL — member (`webRTC.hangup(`) or bare destructured (`hangup(`).
const HANGUP_CALL = /\bhangup\s*\(/g;
// A sanctioned server-side teardown in the same enclosing function: the api authority or one of the
// shared-gate routes (CallProvider primitives + the cockpit's named wrappers).
const SANCTIONED =
  /\bapi\s*\.\s*calls\s*\.\s*cancel\b|\bteardownActiveCall\b|\bcancelActiveLegs\b|\bendActiveCall\b/;
const ESCAPE = /call-drop-gate-ok\b/;
// STRICT mode (the PostToolUse hook sets CALL_DROP_GATE_STRICT=1): exit 1 on any warning so the hook's
// catch branch feeds the flags back to the editing agent. In gates:all/CI the gate stays WARN-only
// (exit 0) — the heuristic's false-positive risk must never break the build.
const STRICT = process.env.CALL_DROP_GATE_STRICT === '1' || process.argv.includes('--strict');

function walk(dir, out) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (SKIP_DIR_SEGMENTS.some((s) => p.includes(s))) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p) && !p.endsWith('.d.ts') && !/\.(test|spec)\.(ts|tsx)$/.test(p))
      out.push(p);
  }
}

// Bootstrap-skip until the frontend workspace exists (mirrors the other gates).
if (!existsSync(join(ROOT, 'frontend', 'src'))) {
  console.log('check-call-drop-gate: frontend/src not present yet — skipping (bootstrap).');
  process.exit(0);
}

/**
 * Length-preserving mask of comments + string/template contents (newlines kept), so `hangup()` in a
 * comment, a CSS class string (`"comms-oncall__hangup"`), or copy (`C.pill.hangup`… inside a string)
 * never matches, while every source index / line number stays valid.
 */
function maskCommentsAndStrings(src) {
  const out = src.split('');
  let state = 'code';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const d = src[i + 1];
    if (state === 'code') {
      if (c === '/' && d === '/') {
        out[i] = ' ';
        state = 'line';
      } else if (c === '/' && d === '*') {
        out[i] = ' ';
        out[i + 1] = ' ';
        state = 'block';
        i++;
      } else if (c === "'") state = 'single';
      else if (c === '"') state = 'double';
      else if (c === '`') state = 'template';
    } else if (state === 'line') {
      if (c === '\n') state = 'code';
      else out[i] = ' ';
    } else if (state === 'block') {
      if (c === '*' && d === '/') {
        out[i] = ' ';
        out[i + 1] = ' ';
        state = 'code';
        i++;
      } else if (c !== '\n') out[i] = ' ';
    } else {
      // inside a string/template: mask contents (keep the delimiters + newlines), honor escapes.
      if (c === '\\') {
        out[i] = ' ';
        if (d !== undefined && d !== '\n') out[i + 1] = ' ';
        i++;
      } else if (
        (state === 'single' && c === "'") ||
        (state === 'double' && c === '"') ||
        (state === 'template' && c === '`')
      ) {
        state = 'code';
      } else if ((state === 'single' || state === 'double') && c === '\n') {
        state = 'code'; // unterminated line string — bail to code at the newline
      } else if (c !== '\n') out[i] = ' ';
    }
  }
  return out.join('');
}

/**
 * Is the `{` at braceIdx a FUNCTION body opener? Arrow (`=> {`), `function foo(…) {`, or method
 * shorthand (`foo(…) {` where the identifier before `(` is not a control keyword). Control blocks
 * (`if/for/while/switch/catch (…) {`), bare blocks, `try/else/do/finally {`, class bodies, and object
 * literals (`= {`) are NOT function bodies.
 */
function isFunctionBodyOpen(src, braceIdx) {
  let i = braceIdx - 1;
  while (i >= 0 && /\s/.test(src[i])) i--;
  if (i >= 1 && src[i] === '>' && src[i - 1] === '=') return true; // arrow body
  if (src[i] !== ')') return false;
  // find the matching '(' of the param list
  let depth = 0;
  let j = i;
  for (; j >= 0; j--) {
    if (src[j] === ')') depth++;
    else if (src[j] === '(') {
      depth--;
      if (depth === 0) break;
    }
  }
  if (j < 0) return false;
  let k = j - 1;
  while (k >= 0 && /\s/.test(src[k])) k--;
  const end = k;
  while (k >= 0 && /[\w$]/.test(src[k])) k--;
  const word = src.slice(k + 1, end + 1);
  if (word === '') return false; // `(…) {` after an expression — not a recognizable function opener
  return !['if', 'for', 'while', 'switch', 'catch'].includes(word);
}

/** The innermost enclosing FUNCTION body span [start, end] (exclusive of braces) around idx, or null. */
function enclosingFunctionBody(masked, idx) {
  const stack = [];
  const containing = [];
  for (let i = 0; i < masked.length; i++) {
    const c = masked[i];
    if (c === '{') stack.push(i);
    else if (c === '}') {
      const open = stack.pop();
      if (open !== undefined && open < idx && i > idx) containing.push([open, i]);
    }
  }
  containing.sort((a, b) => b[0] - a[0]); // innermost (largest open index) first
  for (const [open, close] of containing) {
    if (isFunctionBodyOpen(masked, open)) return [open + 1, close];
  }
  return null;
}

const lineStarts = (src) => {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return starts;
};
const lineOf = (starts, idx) => {
  let lo = 0,
    hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= idx) lo = mid;
    else hi = mid - 1;
  }
  return lo; // 0-based
};

const files = [];
for (const d of SCAN_DIRS) walk(join(ROOT, d), files);

const warnings = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const masked = maskCommentsAndStrings(src);
  const lines = src.split(/\r?\n/);
  const starts = lineStarts(src);

  HANGUP_CALL.lastIndex = 0;
  let m;
  while ((m = HANGUP_CALL.exec(masked))) {
    const ln = lineOf(starts, m.index); // 0-based
    const rawLine = lines[ln] ?? '';
    const prevLine = ln > 0 ? (lines[ln - 1] ?? '') : '';
    if (ESCAPE.test(rawLine) || ESCAPE.test(prevLine)) continue; // reviewed bypass

    const body = enclosingFunctionBody(masked, m.index);
    // A hangup with no recognizable enclosing function (top-level / unrecognized opener) falls back to
    // a PERMISSIVE whole-file marker scan — locality only holds where a function body was identified.
    const segment = body ? masked.slice(body[0], body[1]) : masked;
    if (SANCTIONED.test(segment)) continue; // server-cancel routed in the same function — sanctioned

    warnings.push({
      file: file.replace(ROOT + '\\', '').replace(ROOT + '/', ''),
      line: ln + 1,
      text: rawLine.trim().slice(0, 100),
    });
  }
}

// ----- Report (WARN-only; never fails the build) ---------------------------
if (warnings.length > 0) {
  console.warn(
    `check-call-drop-gate WARN — ${warnings.length} raw \`hangup(\` call(s) in page/component code ` +
      `with NO server-side cancel in the enclosing function (the L13 orphaned-server-leg shape):\n`,
  );
  for (const w of warnings) {
    console.warn(`  ⚠ ${w.file}:${w.line}  ${w.text}`);
  }
  console.warn(
    "\nA local hangup() drops ONLY the local media leg — the prospect's server leg keeps ringing/connected\n" +
      '(ARC-006/TCPA, journey L13). Every call-drop handler must route through the shared CallProvider\n' +
      'teardown gate: teardownActiveCall() (drop both legs + clear the id — droppers leaving to IDLE) or\n' +
      'cancelActiveLegs() (drop both legs, KEEP the id — droppers going to WRAP_UP to disposition).\n' +
      'See .claude/rules/auxara-dialer-frontend-rules.md ("Call teardown routes through the ONE shared gate").\n' +
      'If the hangup is genuinely not a call-drop action, append `// call-drop-gate-ok: <reason>`.',
  );
} else {
  console.log(
    `check-call-drop-gate: OK — ${files.length} file(s) scanned; every hangup( routes through the teardown gate.`,
  );
}
// WARN-only in gates:all/CI (exit 0 even when flagging); STRICT (the edit-time hook) exits 1 on a flag
// so the violation actually reaches the editing agent instead of dying in a swallowed pipe.
process.exit(STRICT && warnings.length > 0 ? 1 : 0);
