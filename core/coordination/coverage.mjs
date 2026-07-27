import path from 'node:path';

import { defaultAssuranceStateDirectory, writeJson } from '../lifecycle/evidence-runtime.mjs';
import { COORDINATION_COVERAGE_METRICS, openCoordinationLedger } from './ledger.mjs';
import { COORDINATION_MODES, coordinationMode } from './mode.mjs';

const MODE_SET = new Set(COORDINATION_MODES);
export const COORDINATION_DISPATCH_PATHS = Object.freeze({
  boundedAgent: 'agent-run',
  claudeCli: 'dispatch-claude-cli',
  claudeTaskCreated: 'claude-task-created',
});
export const KNOWN_UNINSTRUMENTED_DISPATCHERS = Object.freeze([]);
const MILLISECONDS_PER_HOUR = 60 * 60 * 1_000;
export const COORDINATION_PROMOTION_THRESHOLDS = Object.freeze({
  minimumClaimsRegistered: 100,
  minimumObserveDurationMs: 24 * MILLISECONDS_PER_HOUR,
  maximumCoordinationErrorRate: 0.01,
});
const REQUIRED_INSTRUMENTED_DISPATCH_PATHS = Object.freeze(
  Object.values(COORDINATION_DISPATCH_PATHS),
);

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function requireMode(mode) {
  if (!MODE_SET.has(mode)) throw new TypeError(`Unsupported coordination coverage mode: ${mode}`);
  return mode;
}

function requireCounter(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative safe integer`);
  }
  return value;
}

function requirePath(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireKnownUninstrumentedDispatchers(dispatchers) {
  if (!Array.isArray(dispatchers)) {
    throw new TypeError('knownUninstrumentedDispatchers must be an array');
  }
  return [
    ...new Set(
      dispatchers.map((dispatcher, index) =>
        requirePath(dispatcher, `knownUninstrumentedDispatchers[${index}]`),
      ),
    ),
  ];
}

function projectionFrom(snapshot) {
  return {
    schema_version: 2,
    ...Object.fromEntries(
      COORDINATION_COVERAGE_METRICS.map((metric) => [
        metric,
        requireCounter(snapshot[metric], metric),
      ]),
    ),
    dispatch_path_hits: { ...snapshot.dispatch_path_hits },
    uninstrumented_path_hits: { ...snapshot.uninstrumented_path_hits },
    mode_epoch: snapshot.mode_epoch,
    mode: requireMode(snapshot.mode),
    started_at: snapshot.started_at,
    ended_at: snapshot.ended_at,
    updated_at: snapshot.updated_at,
  };
}

function writeCoverageProjection(file, snapshot) {
  const projection = projectionFrom(snapshot);
  writeJson(file, projection);
  return projection;
}

function incrementLedgerCoverage({
  repoRoot,
  mode,
  modeEpoch,
  increments,
  dispatchPath,
  uninstrumentedPath,
}) {
  const ledger = openCoordinationLedger({ cwd: repoRoot });
  try {
    return ledger.incrementCoverage({
      mode,
      modeEpoch,
      increments,
      dispatchPath,
      uninstrumentedPath,
    });
  } finally {
    ledger.close();
  }
}

function recordFailureBestEffort({ repoRoot, mode, modeEpoch }) {
  try {
    return incrementLedgerCoverage({
      repoRoot,
      mode,
      modeEpoch,
      increments: { coordination_errors: 1 },
    });
  } catch {
    return undefined;
  }
}

function safeCoverageIncrement({
  repoRoot = process.cwd(),
  file = coordinationCoveragePath(repoRoot),
  mode = coordinationMode(repoRoot),
  modeEpoch,
  increments = {},
  dispatchPath,
  uninstrumentedPath,
  countFailure = true,
}) {
  const resolvedRoot = path.resolve(repoRoot);
  let snapshot;
  try {
    snapshot = incrementLedgerCoverage({
      repoRoot: resolvedRoot,
      mode: requireMode(mode),
      modeEpoch,
      increments,
      dispatchPath,
      uninstrumentedPath,
    });
    return {
      coverage: writeCoverageProjection(file, snapshot),
      modeEpoch: snapshot.mode_epoch,
    };
  } catch (error) {
    const failureSnapshot = countFailure
      ? recordFailureBestEffort({
          repoRoot: resolvedRoot,
          mode,
          modeEpoch: snapshot?.mode_epoch ?? modeEpoch,
        })
      : undefined;
    return {
      error: errorMessage(error),
      modeEpoch: failureSnapshot?.mode_epoch ?? snapshot?.mode_epoch ?? modeEpoch,
    };
  }
}

export function coordinationCoveragePath(repoRoot = process.cwd()) {
  return path.join(defaultAssuranceStateDirectory(repoRoot), 'coordination-coverage.json');
}

export function readCoordinationCoverage({
  repoRoot = process.cwd(),
  file = coordinationCoveragePath(repoRoot),
} = {}) {
  const resolvedRoot = path.resolve(repoRoot);
  const ledger = openCoordinationLedger({ cwd: resolvedRoot });
  let snapshot;
  try {
    const epoch = ledger.peekModeEpoch();
    snapshot = ledger.coverageSnapshot({ modeEpoch: epoch.mode_epoch });
  } finally {
    ledger.close();
  }
  const projection = projectionFrom(snapshot);
  try {
    writeJson(file, projection);
  } catch {
    // SQLite is authoritative. A stale or unavailable JSON projection cannot invalidate a read.
  }
  return projection;
}

export function countDispatch(mode, outcome) {
  if (outcome === null || typeof outcome !== 'object' || Array.isArray(outcome)) {
    return { error: 'Coordination dispatch outcome must be an object' };
  }
  try {
    return safeCoverageIncrement({
      repoRoot: outcome.repoRoot,
      mode: requireMode(mode),
      increments: {
        dispatches_seen: 1,
        claims_skipped_no_editpaths: outcome.skippedNoEditPaths ? 1 : 0,
      },
      dispatchPath: requirePath(outcome.dispatchPath, 'outcome.dispatchPath'),
      uninstrumentedPath: outcome.uninstrumentedPath,
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export function recordRegistrationCoverage({
  repoRoot,
  mode = coordinationMode(repoRoot),
  modeEpoch,
  conflictCount = 0,
  claimRegistered = true,
}) {
  if (typeof claimRegistered !== 'boolean') {
    throw new TypeError('claimRegistered must be a boolean');
  }
  return safeCoverageIncrement({
    repoRoot,
    mode,
    modeEpoch,
    increments: {
      claims_registered: claimRegistered ? 1 : 0,
      conflicts_observed: requireCounter(conflictCount, 'conflictCount'),
    },
  });
}

export function recordCoordinationErrorCoverage({
  repoRoot,
  mode = coordinationMode(repoRoot),
  modeEpoch,
}) {
  return safeCoverageIncrement({
    repoRoot,
    mode,
    modeEpoch,
    increments: { coordination_errors: 1 },
    countFailure: false,
  });
}

export function recordCoordinationActivityCoverage({
  repoRoot,
  mode = coordinationMode(repoRoot),
  modeEpoch,
}) {
  return safeCoverageIncrement({ repoRoot, mode, modeEpoch });
}

function readinessReason(code, message, observed, required) {
  return { code, message, observed, required };
}

export function promotionReadiness({
  repoRoot = process.cwd(),
  now = Date.now(),
  knownUninstrumentedDispatchers = KNOWN_UNINSTRUMENTED_DISPATCHERS,
} = {}) {
  const policyMode = coordinationMode(repoRoot);
  try {
    const coverage = readCoordinationCoverage({ repoRoot });
    const unresolvedDispatchers = requireKnownUninstrumentedDispatchers(
      knownUninstrumentedDispatchers,
    );
    const evaluatedAt = now instanceof Date ? now.getTime() : Number(now);
    if (!Number.isFinite(evaluatedAt)) {
      throw new TypeError('promotionReadiness now must resolve to milliseconds since epoch');
    }
    const observeDurationMs =
      coverage.mode === 'observe' ? Math.max(0, evaluatedAt - Date.parse(coverage.started_at)) : 0;
    const coordinationErrorRate =
      coverage.dispatches_seen === 0 ? 0 : coverage.coordination_errors / coverage.dispatches_seen;
    const reasons = [];
    if (coverage.mode !== 'observe') {
      reasons.push(
        readinessReason(
          'MODE_NOT_OBSERVE',
          'The current coordination mode epoch is not OBSERVE.',
          coverage.mode,
          'observe',
        ),
      );
    }
    if (unresolvedDispatchers.length > 0) {
      reasons.push(
        readinessReason(
          'DISPATCHER_NOT_INSTRUMENTED',
          `Known dispatcher paths are not instrumented: ${unresolvedDispatchers.join(', ')}.`,
          unresolvedDispatchers,
          [],
        ),
      );
    }
    if (coverage.claims_registered < COORDINATION_PROMOTION_THRESHOLDS.minimumClaimsRegistered) {
      reasons.push(
        readinessReason(
          'INSUFFICIENT_CLAIMS',
          'The current OBSERVE epoch has too few registered claims.',
          coverage.claims_registered,
          COORDINATION_PROMOTION_THRESHOLDS.minimumClaimsRegistered,
        ),
      );
    }
    for (const dispatchPath of REQUIRED_INSTRUMENTED_DISPATCH_PATHS) {
      const pathHits = coverage.dispatch_path_hits[dispatchPath] ?? 0;
      if (pathHits === 0) {
        reasons.push(
          readinessReason(
            'DISPATCH_PATH_UNSEEN',
            `The current OBSERVE epoch has not seen dispatcher ${dispatchPath}.`,
            pathHits,
            1,
          ),
        );
      }
    }
    for (const [dispatchPath, pathHits] of Object.entries(coverage.uninstrumented_path_hits)) {
      if (pathHits > 0) {
        reasons.push(
          readinessReason(
            'UNINSTRUMENTED_PATH_SEEN',
            `The current OBSERVE epoch saw uninstrumented dispatcher ${dispatchPath}.`,
            pathHits,
            0,
          ),
        );
      }
    }
    if (coordinationErrorRate > COORDINATION_PROMOTION_THRESHOLDS.maximumCoordinationErrorRate) {
      reasons.push(
        readinessReason(
          'ERROR_RATE_TOO_HIGH',
          'The current OBSERVE epoch coordination error rate is above the promotion ceiling.',
          coordinationErrorRate,
          COORDINATION_PROMOTION_THRESHOLDS.maximumCoordinationErrorRate,
        ),
      );
    }
    if (observeDurationMs < COORDINATION_PROMOTION_THRESHOLDS.minimumObserveDurationMs) {
      reasons.push(
        readinessReason(
          'OBSERVE_WINDOW_TOO_SHORT',
          'The current OBSERVE epoch has not run for the minimum promotion window.',
          observeDurationMs,
          COORDINATION_PROMOTION_THRESHOLDS.minimumObserveDurationMs,
        ),
      );
    }
    return {
      ready: reasons.length === 0,
      reasons,
      mode: coverage.mode,
      modeEpoch: coverage.mode_epoch,
      evaluatedAt: new Date(evaluatedAt).toISOString(),
      thresholds: COORDINATION_PROMOTION_THRESHOLDS,
      observed: {
        claimsRegistered: coverage.claims_registered,
        dispatchPathHits: coverage.dispatch_path_hits,
        uninstrumentedPathHits: coverage.uninstrumented_path_hits,
        coordinationErrorRate,
        observeDurationMs,
      },
    };
  } catch (error) {
    return {
      ready: false,
      reasons: [
        readinessReason(
          'COVERAGE_UNAVAILABLE',
          'Coordination coverage could not be evaluated.',
          errorMessage(error),
          'readable SQLite coverage ledger',
        ),
      ],
      mode: policyMode,
      modeEpoch: null,
      evaluatedAt: Number.isFinite(Number(now)) ? new Date(Number(now)).toISOString() : null,
      thresholds: COORDINATION_PROMOTION_THRESHOLDS,
      observed: null,
    };
  }
}
