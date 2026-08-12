/**
 * Resumable run-state store for the assurance pipeline (Phase 0 spine component "a", persistence half).
 *
 * This is the spine's OWN lightweight store, deliberately NOT task-assurance: per plan decision D1,
 * `schemas/task-evidence.v3` is a closed completion-proof contract, not a multi-stage artifact
 * carrier. A run is a directory under `runRoot`:
 *
 *   <runRoot>/<runId>/run-manifest.json        run id, config sha, target ref, ordered stage records
 *   <runRoot>/<runId>/stages/<stage>.json      one redacted JSON artifact per stage
 *   <runRoot>/<runId>/emit/...                 emitter outputs (SARIF, report)
 *
 * It follows the artifacts-dir + hashing convention of `core/lifecycle/evidence-runtime.mjs`
 * (git-common-dir default root, canonical JSON, sha256 checkpoints), reusing its helpers via
 * `artifacts.mjs`. Resume = a stage whose record is `completed`, whose artifact file exists, and
 * whose bytes still hash to the recorded sha256 is reused; the first stage that fails any of those
 * re-executes, and so does every stage after it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeRedactedJson, readJsonFile, hashFileBytes, validateArtifact } from './artifacts.mjs';
import { redactString } from './redaction.mjs';
import { RUN_MANIFEST_SCHEMA } from './paths.mjs';

const MANIFEST_SCHEMA_VERSION = 1;

/**
 * Default run root, following the task-assurance convention of living under the repository's shared
 * git-common-dir (worktree-independent, never inside the tracked tree). Falls back to a repo-local
 * dotdir when git is unavailable.
 */
export function resolveDefaultRunRoot(cwd = process.cwd()) {
  const result = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
  });
  if (result.status === 0 && !result.error) {
    const commonDir = result.stdout.trim();
    if (commonDir.length > 0) return path.join(path.resolve(commonDir), 'assurance-pipeline-runs');
  }
  return path.join(path.resolve(cwd), '.assurance-pipeline-runs');
}

export class RunStore {
  constructor({ runRoot, runId }) {
    if (!runRoot || !runId) throw new Error('RunStore requires runRoot and runId');
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(runId)) throw new Error(`Unsafe runId: ${runId}`);
    this.runRoot = path.resolve(runRoot);
    this.runId = runId;
    this.runDir = path.join(this.runRoot, runId);
  }

  manifestPath() {
    return path.join(this.runDir, 'run-manifest.json');
  }

  stageRelativePath(stageName) {
    return path.posix.join('stages', `${stageName}.json`);
  }

  stageAbsolutePath(stageName) {
    return path.join(this.runDir, 'stages', `${stageName}.json`);
  }

  emitAbsolutePath(relative) {
    return path.join(this.runDir, 'emit', relative);
  }

  loadManifest() {
    const file = this.manifestPath();
    if (!fs.existsSync(file)) return undefined;
    return readJsonFile(file);
  }

  /** Create (or reset) the run directory + a manifest whose stages are all `pending`. */
  init({ pipeline, configSha256, targetRef, stageNames, now = new Date() }) {
    fs.mkdirSync(path.join(this.runDir, 'stages'), { recursive: true });
    const manifest = {
      schema_version: MANIFEST_SCHEMA_VERSION,
      run_id: this.runId,
      pipeline,
      config_sha256: configSha256,
      target_ref: targetRef,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      stages: stageNames.map((name) => ({
        name,
        status: 'pending',
        artifact_path: this.stageRelativePath(name),
        sha256: null,
        bytes: null,
        started_at: null,
        ended_at: null,
      })),
    };
    this.#persistManifest(manifest);
    return manifest;
  }

  #persistManifest(manifest) {
    validateArtifact(RUN_MANIFEST_SCHEMA, manifest, 'run-manifest');
    // The manifest carries only structural metadata; redaction-on-write is still applied for
    // uniformity (sha256 hex and paths match no secret pattern, so it is a byte-for-byte no-op).
    writeRedactedJson(this.manifestPath(), manifest);
  }

  stageRecord(manifest, stageName) {
    return manifest.stages.find((stage) => stage.name === stageName);
  }

  /**
   * A stage is validly checkpointed when its record is `completed`, its artifact file exists, and
   * the file's current bytes still hash to the recorded sha256. This is the ONLY function that
   * decides checkpoint validity — the killer mutation targets exactly this read.
   */
  isStageCheckpointValid(manifest, stageName) {
    const record = this.stageRecord(manifest, stageName);
    if (!record || record.status !== 'completed' || typeof record.sha256 !== 'string') return false;
    const file = this.stageAbsolutePath(stageName);
    if (!fs.existsSync(file)) return false;
    return hashFileBytes(file) === record.sha256;
  }

  /** Read a persisted stage artifact from disk (the redacted, checkpointed value). */
  readStage(stageName) {
    return readJsonFile(this.stageAbsolutePath(stageName));
  }

  /** Persist a completed stage: write the redacted artifact, record its digest + timings. */
  completeStage({ manifest, stageName, value, startedAt, now = new Date() }) {
    const reference = writeRedactedJson(this.stageAbsolutePath(stageName), value);
    const record = this.stageRecord(manifest, stageName);
    record.status = 'completed';
    record.sha256 = reference.sha256;
    record.bytes = reference.bytes;
    record.started_at = startedAt instanceof Date ? startedAt.toISOString() : startedAt;
    record.ended_at = now.toISOString();
    manifest.updated_at = now.toISOString();
    this.#persistManifest(manifest);
    return record;
  }

  /** Persist an emitter output (e.g. SARIF, report) under emit/, redacted on write. */
  writeEmitJson(relative, value) {
    const file = this.emitAbsolutePath(relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    return { file, ...writeRedactedJson(file, value) };
  }

  /** Persist a redacted text emitter output (e.g. the Markdown report) under emit/. */
  writeEmitText(relative, text) {
    const file = this.emitAbsolutePath(relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const body = redactString(text);
    fs.writeFileSync(file, body, { encoding: 'utf8', mode: 0o600 });
    return { file, bytes: Buffer.byteLength(body, 'utf8') };
  }
}
