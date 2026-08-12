/**
 * Stage-runner for the assurance pipeline (Phase 0 spine component "a", orchestration half).
 *
 * A stage is `async (ctx, input) => output`. The runner chains stages in order, validating each
 * stage's declared input/output artifact against its JSON schema (reusing the control-plane
 * validator), and checkpoints every stage's output through the RunStore.
 *
 * Resume contract (plan Phase-0 DoD + killer mutation):
 *   - A stage is REUSED when RunStore.isStageCheckpointValid returns true (record completed AND
 *     artifact file present AND bytes still hash to the recorded sha256) AND no earlier stage in
 *     this run had to re-execute.
 *   - The FIRST stage that is not validly checkpointed re-executes, and because its output may
 *     differ, EVERY stage after it re-executes too (dependency-correct resume).
 *   - A changed config (config_sha256 mismatch) or a changed stage list invalidates the whole run,
 *     so it re-initializes from stage 0.
 *
 * `runPipeline` returns `{ executed, skipped }` so callers/tests can assert exactly which stages ran
 * — that is the signal the checkpoint/resume killer mutation flips.
 */
import { digestObject, validateArtifact } from './artifacts.mjs';

/** Normalize a stage descriptor and fail fast on a malformed one. */
export function defineStage({ name, kind = 'det', inputSchema, outputSchema, run }) {
  if (!name || !/^[a-z0-9][a-z0-9-]*$/u.test(name)) throw new Error(`Invalid stage name: ${name}`);
  if (kind !== 'det' && kind !== 'llm') throw new Error(`Stage kind must be 'det' or 'llm': ${name}`);
  if (typeof run !== 'function') throw new Error(`Stage ${name} requires a run function`);
  return { name, kind, inputSchema, outputSchema, run };
}

function manifestMatchesPlan({ manifest, pipeline, configSha256, stageNames }) {
  return Boolean(
    manifest &&
      manifest.pipeline === pipeline &&
      manifest.config_sha256 === configSha256 &&
      Array.isArray(manifest.stages) &&
      manifest.stages.length === stageNames.length &&
      manifest.stages.every((stage, index) => stage.name === stageNames[index]),
  );
}

/**
 * @param {object}   args
 * @param {import('./run-store.mjs').RunStore} args.store
 * @param {string}   args.pipeline      pipeline id (stored in the manifest)
 * @param {object}   args.config        hashed into config_sha256; a change invalidates checkpoints
 * @param {string}   args.target        target ref recorded in the manifest
 * @param {Array}    args.stages        ordered stage descriptors from defineStage
 * @param {*}        args.initialInput  input to the first stage
 * @param {object}   args.ctx           passed to every stage's run(ctx, input)
 * @param {() => Date=} args.now        injectable clock
 */
export async function runPipeline({ store, pipeline, config, target, stages, initialInput, ctx, now }) {
  if (!Array.isArray(stages) || stages.length === 0) throw new Error('runPipeline requires stages');
  const configSha256 = digestObject(config ?? {});
  const stageNames = stages.map((stage) => stage.name);
  const clock = typeof now === 'function' ? now : () => new Date();

  let manifest = store.loadManifest();
  if (!manifestMatchesPlan({ manifest, pipeline, configSha256, stageNames })) {
    manifest = store.init({ pipeline, configSha256, targetRef: target, stageNames, now: clock() });
  }

  const executed = [];
  const skipped = [];
  let input = initialInput;
  let replaying = false;

  for (const stage of stages) {
    const checkpointValid = !replaying && store.isStageCheckpointValid(manifest, stage.name);
    if (checkpointValid) {
      input = store.readStage(stage.name);
      skipped.push(stage.name);
      continue;
    }
    replaying = true;
    if (stage.inputSchema) validateArtifact(stage.inputSchema, input, `${stage.name} stage input`);
    const startedAt = clock();
    const output = await stage.run(ctx, input);
    if (stage.outputSchema) validateArtifact(stage.outputSchema, output, `${stage.name} stage output`);
    store.completeStage({ manifest, stageName: stage.name, value: output, startedAt, now: clock() });
    executed.push(stage.name);
    input = output;
  }

  return {
    run_id: store.runId,
    executed,
    skipped,
    output: input,
    manifest: store.loadManifest(),
  };
}
