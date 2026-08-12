/**
 * Backend abstraction for the assurance pipeline (Phase 0 spine component "c").
 *
 * A Backend runs a model-shaped "lens" call for a stage. The `via` selector chooses the transport:
 *
 *   - `mock`       fully implemented here; deterministic; used by the toy pipeline and every test.
 *   - `cli`        Claude via CLI — DOCUMENTED STUB (Phase 1).
 *   - `codex-cli`  Codex via CLI — DOCUMENTED STUB (Phase 1).
 *
 * `via: sdk` / `via: openai` (raw API endpoints) are intentionally NOT implemented and ship OFF:
 * constructing them throws, so a stage can never silently egress product source to a new vendor
 * path without an explicit future founder opt-in (plan decision D6).
 *
 * The interface is `{ via, describe(), async invoke({ role, input, seed }) }`. `invoke` returns a
 * plain-JSON output; determinism is a hard requirement so runs are reproducible and resumable.
 */

export const BACKEND_VIAS = Object.freeze(['mock', 'cli', 'codex-cli']);
export const DISABLED_VIAS = Object.freeze(['sdk', 'openai']);

/**
 * The Phase-1 Claude adapter (stub).
 *
 * Wiring note for Phase 1 (do NOT force-fit now): reuse the HARDENED SPAWN PRIMITIVES of
 * `skills/bootstrap-orchestrator/scripts/dispatch-claude-cli.mjs` — `buildDispatchChildEnvironment`
 * (secret-free env allowlist), `terminateProcessTree` + `DEFAULT_MAX_RUNTIME_MS` (bounded child),
 * and `buildClaudeArgv` with the `read_only` profile — NOT its `dispatchClaude` entrypoint, which is
 * PR-bound (it materializes a PR diff, requires a handoff ref, and enforces an edit boundary). A
 * generic read-only analysis call needs the primitives, not the PR entrypoint, so this stays a
 * Phase-1 wiring decision rather than a forced reuse of the wrong seam.
 */
function createClaudeCliStub() {
  return {
    via: 'cli',
    describe: () => ({ via: 'cli', implemented: false, phase: 1, transport: 'claude-cli-hardened-primitives' }),
    invoke() {
      throw new Error(
        'CAPABILITY_BLOCKED: the `cli` (Claude) backend is a Phase-1 stub. Wire it to ' +
          'dispatch-claude-cli.mjs hardened primitives (buildDispatchChildEnvironment / ' +
          'terminateProcessTree / buildClaudeArgv read_only), not the PR-bound dispatchClaude entrypoint.',
      );
    },
  };
}

/**
 * The Phase-1 Codex adapter (stub).
 *
 * Attestation note for Phase 1: Codex has NO authenticated local lifecycle hook —
 * `core/lifecycle/codex-task-status.mjs` is deliberately read-only and "cannot create, complete, or
 * attest attempts". So Codex-dispatched stage output is UNATTESTED and must be deterministically
 * verified by the spine (schema + grounding checks), never self-attested (plan decision D6).
 */
function createCodexCliStub() {
  return {
    via: 'codex-cli',
    describe: () => ({ via: 'codex-cli', implemented: false, phase: 1, attested: false }),
    invoke() {
      throw new Error(
        'CAPABILITY_BLOCKED: the `codex-cli` backend is a Phase-1 stub. Codex output is UNATTESTED ' +
          '(codex-task-status.mjs is read-only) and must be deterministically verified, never self-attested.',
      );
    },
  };
}

/**
 * The mock backend: deterministic, offline, no child processes. It echoes the input and derives a
 * stable verdict/score from a canonical hash of `{ role, input, seed }`, so identical calls always
 * yield identical output. This is what proves the spine end-to-end in Phase 0.
 */
function createMockBackend({ hash }) {
  return {
    via: 'mock',
    describe: () => ({ via: 'mock', implemented: true, deterministic: true }),
    async invoke({ role, input, seed = 0 }) {
      const digest = hash({ role, input, seed });
      // Map the first hex nibble to a bounded pseudo-confidence in [0,1); deterministic per input.
      const confidence = parseInt(digest.slice(0, 4), 16) / 0x10000;
      return {
        role,
        seed,
        confidence,
        digest,
        // Deterministic grounding echo: the lens "agrees" a finding is real when it carries evidence.
        grounded: Boolean(input && typeof input === 'object' && 'evidence' in input),
        input_digest: hash(input),
      };
    },
  };
}

/**
 * Construct a backend for the given `via`. `dependencies.hash` is injected so the mock reuses the
 * control-plane's canonical `digestObject` (via artifacts.mjs) rather than a private hasher.
 */
export function createBackend({ via }, dependencies = {}) {
  if (DISABLED_VIAS.includes(via)) {
    throw new Error(
      `CAPABILITY_BLOCKED: backend via="${via}" (raw API endpoint) is OFF by default and not built in Phase 0.`,
    );
  }
  if (via === 'mock') {
    if (typeof dependencies.hash !== 'function') throw new Error('mock backend requires a hash dependency');
    return createMockBackend({ hash: dependencies.hash });
  }
  if (via === 'cli') return createClaudeCliStub();
  if (via === 'codex-cli') return createCodexCliStub();
  throw new Error(`Unknown backend via="${via}". Known: ${BACKEND_VIAS.join(', ')}.`);
}
