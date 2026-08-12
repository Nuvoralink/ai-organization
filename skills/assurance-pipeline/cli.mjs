#!/usr/bin/env node
/**
 * assurance CLI (Phase 0 spine + Phase 1a deterministic static evidence).
 *
 *   assurance estimate --target <ref> [--via mock] [--config <file>]
 *       Preview scope + token/cost with ZERO backend calls.
 *   assurance scan --target <ref> [--run-id <id>] [--run-root <dir>] [--via mock] [--config <file>]
 *       Run the toy spine pipeline (produce -> verify -> emit), checkpointing + resuming by run id.
 *   assurance scan --repo <path> [--run-id <id>] [--run-root <dir>] [--config <file>]
 *       Run the deterministic S0 -> S2 -> S3 security pipeline with Semgrep OSS.
 *   assurance report --run-id <id> [--run-root <dir>]
 *       Re-emit SARIF + report from the persisted verify artifact (no re-run, no backend calls).
 *
 * Phase 0 ships only the `mock` backend; `cli` (Claude) and `codex-cli` (Codex) are documented stubs
 * and a scan through them fails closed. The functions below are also the programmatic API the tests
 * drive; `main` is the thin argv wrapper.
 */
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RunStore, resolveDefaultRunRoot } from './lib/run-store.mjs';
import { runPipeline } from './lib/stage-runner.mjs';
import { createBackend } from './lib/backend.mjs';
import { previewScope } from './lib/estimate.mjs';
import { digestObject, readJsonFile } from './lib/artifacts.mjs';
import {
  buildToyStages,
  emitFromVerdicts,
  TOY_PIPELINE_ID,
  TOY_DEFAULT_CONFIG,
} from './pipelines/toy-pipeline.mjs';
import {
  DEFAULT_SECURITY_CONFIG,
  runSecurityPipeline,
  SECURITY_PIPELINE_ID,
} from './pipelines/security-pipeline.mjs';
import { runDoctor } from './lib/doctor.mjs';

export function resolveConfig(config) {
  if (!config) return { ...TOY_DEFAULT_CONFIG };
  if (typeof config === 'object') return { ...TOY_DEFAULT_CONFIG, ...config };
  return { ...TOY_DEFAULT_CONFIG, ...readJsonFile(config) };
}

export function resolveSecurityConfig(config) {
  const supplied = !config ? {} : typeof config === 'object' ? config : readJsonFile(config);
  const rulesets = supplied.rulesets ?? DEFAULT_SECURITY_CONFIG.rulesets;
  if (!Array.isArray(rulesets) || rulesets.some((ruleset) => typeof ruleset !== 'string' || ruleset.length === 0)) {
    throw new Error('security config rulesets must be an array of non-empty strings');
  }
  return {
    ...DEFAULT_SECURITY_CONFIG,
    ...supplied,
    rulesets: [...rulesets],
  };
}

function makeStore({ runRoot, runId }) {
  return new RunStore({ runRoot: runRoot ?? resolveDefaultRunRoot(), runId });
}

function makeBackend({ via = 'mock', backend }) {
  return backend ?? createBackend({ via }, { hash: digestObject });
}

export async function runScan({ target, runRoot, runId, config, via = 'mock', backend, now } = {}) {
  if (!target) throw new Error('scan requires --target');
  const effectiveConfig = resolveConfig(config);
  const store = makeStore({ runRoot, runId: runId ?? `run-${crypto.randomBytes(8).toString('hex')}` });
  const resolvedBackend = makeBackend({ via, backend });
  const stages = buildToyStages();
  const result = await runPipeline({
    store,
    pipeline: TOY_PIPELINE_ID,
    config: effectiveConfig,
    target,
    stages,
    initialInput: { target, plant_secret: effectiveConfig.plant_secret !== false },
    ctx: { backend: resolvedBackend, config: effectiveConfig, store, target, runId: store.runId },
    now,
  });
  return {
    run_id: store.runId,
    run_dir: store.runDir,
    pipeline: TOY_PIPELINE_ID,
    backend: resolvedBackend.via,
    executed: result.executed,
    skipped: result.skipped,
    output: result.output,
  };
}

export async function runSecurityScan({ repo, runRoot, runId, config, adapters, now } = {}) {
  if (!repo) throw new Error('security scan requires --repo');
  const target = path.resolve(repo);
  const effectiveConfig = resolveSecurityConfig(config);
  const store = makeStore({ runRoot, runId: runId ?? `run-${crypto.randomBytes(8).toString('hex')}` });
  const result = await runSecurityPipeline({
    store,
    target,
    config: effectiveConfig,
    adapters,
    now,
  });
  return {
    run_id: store.runId,
    run_dir: store.runDir,
    pipeline: SECURITY_PIPELINE_ID,
    engine: 'oss',
    executed: result.executed,
    skipped: result.skipped,
    output: result.output,
    emit: result.emit,
  };
}

export function runEstimate({ target, config, via = 'mock', backend } = {}) {
  if (!target) throw new Error('estimate requires --target');
  const effectiveConfig = resolveConfig(config);
  const lensCount = (effectiveConfig.lenses ?? TOY_DEFAULT_CONFIG.lenses).length;
  const stagePlan = [
    { name: 'produce', kind: 'det' },
    { name: 'verify', kind: 'llm', lensCount },
    { name: 'emit', kind: 'det' },
  ];
  // A backend is passed so "zero spend" is a testable property of a function that COULD call it.
  const resolvedBackend = makeBackend({ via, backend });
  return { pipeline: TOY_PIPELINE_ID, ...previewScope({ target, config: effectiveConfig, stages: stagePlan, backend: resolvedBackend }) };
}

export function runReport({ runRoot, runId, target } = {}) {
  if (!runId) throw new Error('report requires --run-id');
  const store = makeStore({ runRoot, runId });
  const manifest = store.loadManifest();
  if (!manifest) throw new Error(`No run found for run id: ${runId}`);
  if (!store.isStageCheckpointValid(manifest, 'verify')) {
    throw new Error(`Run ${runId} has no valid verify checkpoint to re-emit from`);
  }
  const verdicts = store.readStage('verify');
  return { run_id: runId, ...emitFromVerdicts({ store, verdicts, target: target ?? manifest.target_ref }) };
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = {};
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (typeof flag !== 'string' || !flag.startsWith('--') || value === undefined) {
      throw new Error(`Malformed option near: ${flag ?? '<end>'}`);
    }
    opts[flag.slice(2).replaceAll('-', '_')] = value;
  }
  return { command, opts };
}

export async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    console.error(error.message);
    return 2;
  }
  const { command, opts } = parsed;
  const common = {
    target: opts.target,
    repo: opts.repo,
    runRoot: opts.run_root,
    runId: opts.run_id,
    via: opts.via,
    config: opts.config,
  };
  try {
    if (command === 'estimate') {
      console.log(JSON.stringify(runEstimate(common), null, 2));
      return 0;
    }
    if (command === 'scan') {
      if (common.repo && common.target) throw new Error('scan accepts either --repo or --target, not both');
      if (common.repo) {
        console.log(JSON.stringify(await runSecurityScan(common), null, 2));
        return 0;
      }
      console.log(JSON.stringify(await runScan(common), null, 2));
      return 0;
    }
    if (command === 'report') {
      console.log(JSON.stringify(runReport(common), null, 2));
      return 0;
    }
    if (command === 'doctor') {
      const result = runDoctor();
      console.log(JSON.stringify(result, null, 2));
      return result.ok ? 0 : 1;
    }
    console.error(
      'Usage: assurance doctor | estimate|scan|report --target <ref> | scan --repo <path> [--run-id <id>] [--run-root <dir>] [--via mock|cli|codex-cli] [--config <file>]',
    );
    return 2;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
if (invokedPath && invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = await main(process.argv.slice(2));
}
