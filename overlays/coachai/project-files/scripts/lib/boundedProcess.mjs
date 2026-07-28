/**
 * boundedProcess — spawn a local command under a HARD wall-clock bound and terminate its ENTIRE
 * descendant tree before returning.
 *
 * ================================================================================================
 * THE BUG CLASS (incident 2026-07-20, Sprint 1.4 integration tree)
 *
 * Two bounded `claude -p` delegations were launched through a plain shell. The PARENT shell hit its
 * 904s tool timeout and was reaped — but the shell's timeout reaches only the shell. The `claude.exe`
 * children (PIDs 41880 and 33868) SURVIVED as orphans, kept running to completion, and kept WRITING
 * into a worktree that the surviving orchestrator believed was quiescent. One restored a deleted RCA
 * document; the other modified `.claude/rules/loop-discipline.md` in the window between another
 * agent's `git status` staging check and its commit. The orchestrator only found them by explicitly
 * enumerating and stopping the PIDs by hand.
 *
 * The failure is NOT "the command ran too long" — it is that a timeout was enforced at a boundary
 * (the parent shell) that has no authority over descendants. A timeout that does not terminate the
 * tree is not a timeout; it is a lie that converts a slow agent into an INVISIBLE CONCURRENT WRITER.
 * That is strictly worse than no timeout at all, because the caller now believes the work stopped.
 *
 * WHY NO EXISTING CONTROL CAUGHT IT
 *
 * The canonical bounded Claude dispatcher
 * (`~/.codex/skills/bootstrap-orchestrator/scripts/dispatch-claude-cli.mjs`) already implements this
 * correctly. It was simply BYPASSED: nothing in this repository routed a bounded local agent run
 * through it, no package command existed, and no rule forbade the raw-shell form. A control that is
 * available but unrouted is not a control.
 *
 * ================================================================================================
 * RELATIONSHIP TO THE CANONICAL DISPATCHER (deliberately NOT a parallel system)
 *
 * The termination semantics here are intentionally IDENTICAL to that dispatcher's
 * `terminateProcessTree` — Windows `taskkill /PID <pid> /T /F` resolved through an exact `SystemRoot`
 * path; POSIX detached process group addressed by negative PID, SIGTERM then SIGKILL after a grace
 * window. This module does NOT replace it and does not reimplement Claude-CLI dispatch (tool
 * allow-lists, strict MCP config, boundary probes, tool-use auditing all remain there).
 *
 * It exists because that dispatcher lives OUTSIDE this repository, at an unversioned user-level path
 * that is absent in CI and in containers, and because it can only bound the Claude CLI specifically.
 * This module is the in-repo, command-agnostic sibling: the thing any repo script can import to make
 * "run something with a real deadline" mechanically correct. For bounded Claude CLI dispatch, that
 * canonical helper remains the path — see `.claude/rules/loop-discipline.md`.
 *
 * ================================================================================================
 * HONEST LIMITATION
 *
 * Tree termination walks the parent/child relation as the OS reports it at kill time. A grandchild
 * that has been deliberately re-parented (its parent exited first, or it double-forked to daemonize)
 * is no longer in the tree and will not be reached — on any platform, by any tool short of a Windows
 * Job Object or a POSIX cgroup. This bounds the class the incident actually exhibited (a live child
 * holding live descendants) and does not claim more. Callers running a known daemonizing command must
 * not rely on this for containment.
 *
 * Redaction is by VALUE, so it covers only secrets this process can see in the environment it passed
 * to the child. A credential the child mints itself, reads from a file, or receives over the network
 * is unknown to us and is not redacted. That is not claimed as covered.
 */

/* global process */

import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';

/**
 * GNU `timeout(1)`'s exit status for "the command was killed because the deadline elapsed". Reused
 * rather than invented so a bounded run's exit code means the same thing to a shell, a CI step, and a
 * human as every other timeout on the system.
 */
export const BOUNDED_TIMEOUT_EXIT_CODE = 124;

/** Outcome discriminants. A timeout is a DISTINCT result, never a plain nonzero exit. */
export const BOUNDED_OUTCOME = Object.freeze({
  COMPLETED: 'completed',
  TIMED_OUT: 'timed_out',
});

/** Grace between "asked the tree to stop" and "force-killed whatever is still standing". */
export const DEFAULT_TERMINATION_GRACE_MS = 5_000;

/** Per-stream capture ceiling. Output beyond this is dropped from the buffer, never unbounded. */
export const DEFAULT_MAX_CAPTURED_BYTES = 8 * 1024 * 1024;

/**
 * Environment variable names whose VALUES must never appear in captured or streamed output. Matched
 * case-insensitively as substrings, because provider keys arrive under many prefixes.
 */
const SECRET_NAME_PATTERN =
  /(SECRET|TOKEN|PASSWORD|PASSWD|APIKEY|API_KEY|PRIVATE_KEY|CREDENTIAL|SESSION_KEY|ACCESS_KEY|AUTH|DSN|CONNECTION_STRING|DATABASE_URL|REDIS_URL)/i;

/**
 * There is NO length floor, and that is a deliberate reversal.
 *
 * The previous rule skipped any secret-named value shorter than 8 characters, on the theory that a
 * short value is "more likely a flag than a credential". That reasoning inverts the risk. Length is a
 * proxy for credential-ness, and a bad one: a 6-character PIN, a short shared password, and a legacy
 * 4-character provider code are all real credentials, and a SHORT secret is the most damaging class
 * to leak per character — low entropy means the leaked value plus its length is very nearly the whole
 * secret, with nothing left to brute-force. The floor protected exactly the values whose exposure is
 * hardest to recover from.
 *
 * The cost of removing it is over-redaction: if an operator names a non-credential `AUTH_MODE=on`,
 * every literal "on" in the stream becomes `[redacted]`. That is accepted, because the two failure
 * modes are not symmetric. Over-redaction is LOUD, immediately visible in the output, and fixed by
 * renaming one variable the operator controls. A leaked credential is SILENT, already in a console
 * scrollback or a CI log by the time anyone notices, and unfixable without rotating it. Fail closed.
 *
 * The only exclusion is the empty string, which is not a secret and whose zero-length regexp match
 * would match at every position in the stream.
 */
const MIN_REDACTABLE_SECRET_LENGTH = 1;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Collect the concrete secret VALUES present in an environment, so output can be scrubbed by value
 * rather than by guessing at output shape.
 */
export function collectSecretValues(environment = process.env) {
  const values = new Set();
  for (const [name, value] of Object.entries(environment)) {
    if (typeof value !== 'string') continue;
    if (value.length < MIN_REDACTABLE_SECRET_LENGTH) continue;
    if (!SECRET_NAME_PATTERN.test(name)) continue;
    values.add(value);
  }
  return values;
}

/**
 * Replace every occurrence of a known secret value with an opaque marker. Longest-first so a secret
 * that contains a shorter secret as a substring is redacted whole rather than partially.
 */
export function redactSecrets(text, secretValues) {
  if (typeof text !== 'string' || text === '' || !secretValues || secretValues.size === 0) {
    return text;
  }
  let output = text;
  for (const secret of [...secretValues].sort((a, b) => b.length - a.length)) {
    output = output.replace(new RegExp(escapeRegExp(secret), 'g'), '[redacted]');
  }
  return output;
}

/**
 * A STATEFUL, per-stream redactor for LIVE output.
 *
 * Redacting each chunk independently cannot work, and the reason is structural rather than
 * incidental: a chunk boundary is decided by the OS pipe and the child's write pattern, not by the
 * content. A child that writes a credential one byte at a time — or simply writes across a 64 KiB
 * pipe buffer edge — hands us `sk-live-00` and then `0-abcdef`, neither of which contains the secret,
 * so a per-chunk `String.replace` finds nothing and streams both halves verbatim. The console then
 * shows the complete credential. The captured buffer was already safe (it is scrubbed whole at the
 * end); it was the LIVE path that leaked, which is the worse of the two, because a console scrollback
 * and a CI log are outside our control the instant the bytes are written.
 *
 * Two independent boundary problems have to be solved together:
 *
 * 1. SECRET boundaries. Never emit a tail that could still become a secret. After redacting what is
 *    provably complete, hold back the longest suffix of the pending text that is a PROPER prefix of
 *    some known secret, and prepend it to the next chunk. The hold is bounded by
 *    (longest secret length - 1), so a silent child can never grow the carry without limit.
 *
 * 2. UTF-8 boundaries. A multi-byte character split across chunks would decode to replacement
 *    characters if each Buffer were `toString('utf8')`'d on its own — corrupting ordinary output AND
 *    potentially mangling a non-ASCII secret into a form the matcher no longer recognizes. A
 *    `StringDecoder` holds the partial sequence until its remaining bytes arrive.
 *
 * `flush()` releases whatever the two carries still hold when the stream closes, so a run whose final
 * bytes happen to look like the start of a secret still shows its complete ordinary output. Emitted
 * text is removed from the carry as it goes, so flush can neither duplicate nor drop.
 */
export function createStreamRedactor(secretValues) {
  const secrets =
    secretValues && secretValues.size > 0
      ? [...secretValues].filter((secret) => secret.length > 0)
      : [];
  // A one-character secret can never straddle a boundary, so it needs no carry at all.
  const maxHeldLength =
    secrets.reduce((longest, secret) => Math.max(longest, secret.length), 0) - 1;
  const decoder = new StringDecoder('utf8');
  let carry = '';

  /**
   * Length of the longest suffix of `text` that is a PROPER prefix of some secret — i.e. the text
   * that must not be emitted yet because the next chunk could complete a secret from it. Proper
   * matters: a suffix equal to a whole secret is a COMPLETE occurrence, which redaction already
   * handled and which must not be held hostage waiting for a continuation that will never come.
   */
  const heldSuffixLength = (text) => {
    for (let length = Math.min(maxHeldLength, text.length); length > 0; length -= 1) {
      const tail = text.slice(text.length - length);
      for (const secret of secrets) {
        if (secret.length > length && secret.startsWith(tail)) return length;
      }
    }
    return 0;
  };

  return {
    /** Consume raw bytes; return the text that is SAFE to emit right now (possibly empty). */
    push(chunk) {
      const decoded = decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      if (maxHeldLength <= 0) return redactSecrets(decoded, secretValues);
      const pending = carry + decoded;
      const held = heldSuffixLength(pending);
      carry = held === 0 ? '' : pending.slice(pending.length - held);
      return redactSecrets(pending.slice(0, pending.length - held), secretValues);
    },
    /** Release both carries at end-of-stream. Redacted anyway — closing changes nothing about risk. */
    flush() {
      const remainder = carry + decoder.end();
      carry = '';
      return redactSecrets(remainder, secretValues);
    },
  };
}

/**
 * Liveness probe. Signal 0 performs permission/existence checking without delivering a signal.
 * EPERM means the process exists but belongs to another user — alive, and not ours to judge.
 */
export function isProcessAlive(pid, killProcess = process.kill) {
  try {
    killProcess(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === 'ESRCH') return false;
    if (error?.code === 'EPERM') return true;
    throw error;
  }
}

function assertPositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive safe integer; received ${String(value)}`);
  }
  return value;
}

/**
 * Terminate a process and every descendant it still owns.
 *
 * Windows has no process groups usable from Node, so this shells to `taskkill /T` — resolved through
 * an EXACT `%SystemRoot%\System32` path rather than PATH lookup, because a PATH-resolved `taskkill`
 * is an arbitrary-binary-execution surface.
 *
 * POSIX children are spawned `detached`, which places each in its OWN process group whose ID equals
 * the child PID. Signalling `-pid` therefore reaches exactly this dispatch's descendants and NOTHING
 * else — it can never reach an unrelated process, because the group was created for this spawn.
 */
export function terminateProcessTree(
  pid,
  {
    platform = process.platform,
    force = false,
    spawnSyncProcess = spawnSync,
    killProcess = process.kill,
    processAlive = (candidatePid) => isProcessAlive(candidatePid, killProcess),
    environment = process.env,
  } = {},
) {
  const exactPid = assertPositiveInteger(pid, 'child PID');

  if (platform === 'win32') {
    const systemRoot =
      environment.SystemRoot ?? environment.SYSTEMROOT ?? environment.WINDIR ?? environment.windir;
    if (typeof systemRoot !== 'string' || systemRoot.trim() === '') {
      throw new Error('Windows process-tree termination requires an exact SystemRoot or WINDIR');
    }
    const taskkillExecutable = path.win32.join(systemRoot, 'System32', 'taskkill.exe');
    // `/T` is load-bearing: without it taskkill terminates ONLY the named process, and any
    // descendant Windows did not co-terminate (measurably: one spawned `detached`) survives as an
    // orphaned concurrent writer — the exact 2026-07-20 incident shape.
    const result = spawnSyncProcess(taskkillExecutable, ['/PID', String(exactPid), '/T', '/F'], {
      env: environment,
      shell: false,
      windowsHide: true,
      stdio: 'ignore',
    });
    if (result?.error) throw result.error;
    // taskkill reports nonzero when the tree is ALREADY gone, which is success for our purpose.
    // Only an actually-surviving process is a failure.
    if (result?.status !== 0 && processAlive(exactPid)) {
      throw new Error(
        `taskkill failed for child process tree ${exactPid} with exit ${result?.status ?? 'unknown'}`,
      );
    }
    return;
  }

  try {
    killProcess(-exactPid, force ? 'SIGKILL' : 'SIGTERM');
  } catch (error) {
    // The group is already gone — the desired end state, reached without us.
    if (error?.code !== 'ESRCH') throw error;
  }
}

/**
 * Run a command under a hard deadline.
 *
 * Resolves — it does NOT reject — for a nonzero exit or a timeout, because both are legitimate
 * RESULTS a caller must branch on. It rejects only when the process could not be spawned or could not
 * be terminated (a tree we failed to kill is exactly the incident condition and must never be
 * reported as a clean timeout).
 *
 * @returns {Promise<{outcome: string, timedOut: boolean, code: number, signal: string|null,
 *   stdout: string, stderr: string, durationMs: number, pid: number|undefined,
 *   truncated: {stdout: boolean, stderr: boolean}}>}
 */
export function runBounded(executable, argv = [], options = {}) {
  const {
    timeoutMs,
    cwd = process.cwd(),
    environment = process.env,
    platform = process.platform,
    stdin = null,
    streamTo = null,
    label = executable,
    maxCapturedBytes = DEFAULT_MAX_CAPTURED_BYTES,
    terminationGraceMs = DEFAULT_TERMINATION_GRACE_MS,
    spawnProcess = spawn,
    terminateTree = terminateProcessTree,
    now = () => Date.now(),
  } = options;

  assertPositiveInteger(timeoutMs, 'timeoutMs');
  assertPositiveInteger(maxCapturedBytes, 'maxCapturedBytes');
  assertPositiveInteger(terminationGraceMs, 'terminationGraceMs');
  if (typeof executable !== 'string' || executable.trim() === '') {
    throw new Error('runBounded requires an exact executable path or name');
  }
  if (!Array.isArray(argv) || argv.some((entry) => typeof entry !== 'string')) {
    throw new Error('runBounded requires an argument ARRAY of strings (never a shell string)');
  }

  const secretValues = collectSecretValues(environment);
  const startedAt = now();

  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnProcess(executable, argv, {
        cwd,
        env: environment,
        // POSIX: own process group, so the negative-PID signal reaches descendants and only them.
        // Windows: detached would orphan the child from the job the console owns — taskkill /T does
        // the walking there instead.
        detached: platform !== 'win32',
        shell: false,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      reject(error);
      return;
    }

    // One redactor PER STREAM, feeding BOTH the live path and the capture buffer.
    //
    // Per-stream because stdout and stderr are interleaved by the OS: a single shared carry would
    // splice one stream's held tail onto the other's next chunk and corrupt both.
    //
    // Shared between live and capture — rather than a second, capture-only redactor — because the two
    // consume the identical chunk sequence and want the identical answer. A parallel redactor would be
    // a second carry to keep in step, and the moment the two disagreed one of them would be wrong.
    //
    // It runs UNCONDITIONALLY, not only when `streamTo` is set, because the capture buffer now depends
    // on it: the ceiling is enforced on REDACTED text (see `appendCaptured`).
    const redactors = {
      stdout: createStreamRedactor(secretValues),
      stderr: createStreamRedactor(secretValues),
    };

    const emitStreamed = (stream, text) => {
      if (streamTo && text !== '') streamTo(text, stream);
    };

    const captured = { stdout: [], stderr: [] };
    const usedBytes = { stdout: 0, stderr: 0 };
    const truncated = { stdout: false, stderr: false };
    let settled = false;
    let timedOut = false;
    let fatalError;
    let deadlineTimer;
    let forceTimer;

    const clearTimers = () => {
      if (deadlineTimer !== undefined) clearTimeout(deadlineTimer);
      if (forceTimer !== undefined) clearTimeout(forceTimer);
      deadlineTimer = undefined;
      forceTimer = undefined;
    };

    const settle = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimers();
      if (error) reject(error);
      else resolve(value);
    };

    /**
     * Enforce the capture ceiling on text that has ALREADY been redacted.
     *
     * ORDER IS THE WHOLE POINT. Truncating raw bytes and redacting the survivors at the end cannot
     * work: the ceiling falls at a byte offset chosen by the child's write volume, not by content, so
     * it can land INSIDE a credential. Whole-value redaction then finds no match — `sk-live-abcdef`
     * is simply not present when the buffer ends `…sk-li` — and the run returns a buffer whose final
     * characters are a verbatim prefix of a real secret, in a result a caller will log. Redacting
     * first makes the ceiling content-blind again in the way it is safe to be: the text it cuts holds
     * no secret to cut into, only ordinary output and opaque `[redacted]` markers.
     *
     * Bounded on both sides. The redactor's carry is capped at (longest secret - 1) characters, and
     * everything past the ceiling is DROPPED rather than accumulated — a chatty child grows neither.
     */
    const appendCaptured = (stream, text) => {
      if (text === '') return;
      const buffer = Buffer.from(text, 'utf8');
      const remaining = Math.max(0, maxCapturedBytes - usedBytes[stream]);
      if (remaining > 0) captured[stream].push(buffer.subarray(0, remaining));
      if (buffer.length > remaining) truncated[stream] = true;
      usedBytes[stream] += buffer.length;
    };

    const append = (stream, chunk) => {
      // The redactor holds back anything that could still BECOME a secret once the next chunk
      // arrives, so no complete secret can cross either boundary regardless of how the child chose to
      // split its writes. Whatever it returns is already safe to print AND safe to cut.
      const safeText = redactors[stream].push(Buffer.from(chunk));
      appendCaptured(stream, safeText);
      emitStreamed(stream, safeText);
    };

    child.stdout?.on('data', (chunk) => append('stdout', chunk));
    child.stderr?.on('data', (chunk) => append('stderr', chunk));

    // A broken pipe to a child that already died is not a failure of the run.
    child.stdin?.on('error', () => {});
    if (stdin !== null && stdin !== undefined) child.stdin?.end(stdin);
    else child.stdin?.end();

    const terminate = (reason) => {
      if (settled || timedOut) return;
      timedOut = true;
      if (deadlineTimer !== undefined) clearTimeout(deadlineTimer);
      deadlineTimer = undefined;
      try {
        // Windows force-kills immediately: taskkill has no graceful mode that reaches a tree.
        terminateTree(child.pid, { platform, force: platform === 'win32', environment });
      } catch (error) {
        settle(new Error(`${reason}; failed to terminate child tree: ${error.message}`));
        return;
      }
      // Escalate for any POSIX child that ignored SIGTERM. If it survives even SIGKILL we must
      // REJECT: an unkilled tree is the incident, and reporting it as a tidy timeout would recreate
      // exactly the false quiescence this module exists to prevent.
      forceTimer = setTimeout(() => {
        try {
          terminateTree(child.pid, { platform, force: true, environment });
        } catch (error) {
          settle(
            new Error(
              `${reason}; child tree did not close and force termination failed: ${error.message}`,
            ),
          );
          return;
        }
        if (isProcessAlive(child.pid)) {
          settle(new Error(`${reason}; child tree survived force termination (pid ${child.pid})`));
        }
      }, terminationGraceMs);
      forceTimer?.unref?.();
    };

    deadlineTimer = setTimeout(() => {
      terminate(`${label} exceeded its bounded timeout of ${timeoutMs} ms`);
    }, timeoutMs);

    child.on('error', (error) => {
      fatalError = error;
    });

    child.on('close', (code, signal) => {
      // Flush BEFORE any branch: every terminal path — clean exit, nonzero exit, timeout, spawn
      // error — reaches `close`, and a held tail is ordinary output the caller is owed. Placing this
      // after the `fatalError` return would silently swallow up to (longest secret - 1) characters of
      // the very output a failing run needs to be diagnosed from — from the CAPTURE as well as the
      // live stream, now that both are fed from the same carry.
      for (const stream of ['stdout', 'stderr']) {
        const tail = redactors[stream].flush();
        appendCaptured(stream, tail);
        emitStreamed(stream, tail);
      }
      if (fatalError) {
        settle(fatalError);
        return;
      }
      settle(null, {
        outcome: timedOut ? BOUNDED_OUTCOME.TIMED_OUT : BOUNDED_OUTCOME.COMPLETED,
        timedOut,
        // A signalled or timed-out child reports code === null; the timeout code is what a caller
        // and a shell can both branch on.
        code: timedOut ? BOUNDED_TIMEOUT_EXIT_CODE : (code ?? BOUNDED_TIMEOUT_EXIT_CODE),
        signal: signal ?? null,
        // Already redacted on the way IN — a second pass here would be a no-op that implied the
        // capture path could still be carrying something raw. It cannot.
        stdout: Buffer.concat(captured.stdout).toString('utf8'),
        stderr: Buffer.concat(captured.stderr).toString('utf8'),
        durationMs: now() - startedAt,
        pid: child.pid,
        truncated: { ...truncated },
      });
    });
  });
}
