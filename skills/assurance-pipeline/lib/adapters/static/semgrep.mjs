/**
 * Semgrep OSS adapter. Commands are argument-vector based (`shell:false`), telemetry is disabled,
 * execution is time/output bounded, and only the generated SARIF file crosses into normalization.
 *
 * Execution is PORTABLE (plan decision D-P1-7): a native `semgrep` binary is used when present;
 * otherwise Semgrep runs via the `semgrep/semgrep` Docker image (Windows-with-Docker, Linux CI).
 * `buildSemgrepArgv` is identical for both runtimes — only the process wrapper and path mounting
 * differ. If neither runtime is available the adapter fails closed with `SEMGREP_UNAVAILABLE`
 * (the `assurance doctor` check provisions it — see SKILL.md + docs/new-machine-bootstrap.md).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { normalizeSarif } from './normalize.mjs';

const SEMGREP_TIMEOUT_MS = 120_000;
const SEMGREP_IMAGE = 'semgrep/semgrep';

function requireOperand(name, value) {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Semgrep ${name} must be a non-empty string`);
  if (value === '--pro') throw new Error(`Semgrep ${name} must not be --pro`);
  return value;
}

/** Build the exact Semgrep OSS argv without executing a process. */
export function buildSemgrepArgv({ rulesets, target, outFile } = {}) {
  if (!Array.isArray(rulesets) || rulesets.length === 0) throw new Error('Semgrep requires at least one configured ruleset');
  const argv = [];
  for (const rulesetValue of rulesets) {
    const ruleset = requireOperand('ruleset', rulesetValue);
    if (ruleset.trim().toLowerCase() === 'auto') throw new Error('Semgrep --config auto is forbidden');
    argv.push('--config', ruleset);
  }
  argv.push(
    '--sarif',
    '--output',
    requireOperand('output file', outFile),
    '--metrics=off',
    requireOperand('target', target),
  );
  return argv;
}

/**
 * Which Semgrep runtime is available on this machine. `native` (a `semgrep` binary on PATH) is
 * preferred; otherwise `docker` when the `semgrep/semgrep` image is present; otherwise `null`.
 * Overridable for tests.
 */
export function detectSemgrepRuntime({ probe = spawnSync } = {}) {
  const native = probe('semgrep', ['--version'], { stdio: 'ignore', windowsHide: true });
  if (native && !native.error && native.status === 0) return 'native';
  const image = probe('docker', ['image', 'inspect', SEMGREP_IMAGE], { stdio: 'ignore', windowsHide: true });
  if (image && !image.error && image.status === 0) return 'docker';
  return null;
}

function runBounded(command, argv, { label = command } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = spawn(command, argv, { shell: false, windowsHide: true, stdio: 'ignore' });
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => {
      child.kill();
      const error = new Error(`SEMGREP_TIMEOUT: ${label} exceeded ${SEMGREP_TIMEOUT_MS}ms`);
      error.code = 'SEMGREP_TIMEOUT';
      finish(error);
    }, SEMGREP_TIMEOUT_MS);
    timer.unref?.();

    child.on('error', (cause) => {
      if (cause?.code === 'ENOENT') {
        const code = command === 'docker' ? 'DOCKER_NOT_INSTALLED' : 'SEMGREP_NOT_INSTALLED';
        const error = new Error(`${code}: ${command} was not found on PATH`, { cause });
        error.code = code;
        finish(error);
        return;
      }
      finish(cause);
    });
    child.on('close', (code, signal) => {
      if (code === 0) {
        finish();
        return;
      }
      const error = new Error(`SEMGREP_FAILED: ${label} exited with code ${code ?? 'null'}${signal ? ` signal ${signal}` : ''}`);
      error.code = 'SEMGREP_FAILED';
      finish(error);
    });
  });
}

function readAndNormalize(outFile, stripPrefix) {
  let sarifDoc;
  try {
    sarifDoc = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  } catch (cause) {
    throw new Error(`SEMGREP_INVALID_SARIF: unable to read Semgrep output at ${outFile}`, { cause });
  }
  return normalizeSarif(sarifDoc, { tool: 'semgrep', stripPrefix }).map((finding) => ({ ...finding, engine: 'oss' }));
}

async function runSemgrepNative({ rulesets, target }) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assurance-semgrep-'));
  const outFile = path.join(tempDir, 'semgrep.sarif');
  try {
    await runBounded('semgrep', buildSemgrepArgv({ rulesets, target, outFile }), { label: 'semgrep' });
    return readAndNormalize(outFile, path.resolve(target).replace(/\\/gu, '/'));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function runSemgrepViaDocker({ rulesets, target }) {
  // Mount the target dir at /src and a host temp dir at /out. `--mount source=` avoids the Windows
  // drive-letter colon ambiguity of `-v host:container`.
  const targetDir = path.resolve(target).replace(/\\/g, '/');
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assurance-semgrep-out-'));
  try {
    const semgrepArgv = buildSemgrepArgv({ rulesets, target: '/src', outFile: '/out/semgrep.sarif' });
    const dockerArgv = [
      'run', '--rm',
      '--mount', `type=bind,source=${targetDir},target=/src,readonly`,
      '--mount', `type=bind,source=${outDir.replace(/\\/g, '/')},target=/out`,
      SEMGREP_IMAGE, 'semgrep', ...semgrepArgv,
    ];
    await runBounded('docker', dockerArgv, { label: 'docker semgrep' });
    return readAndNormalize(path.join(outDir, 'semgrep.sarif'), '/src');
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

/**
 * Run Semgrep OSS over one target and return normalized, provenance-tagged findings. Uses a native
 * binary when present, else the Docker image (D-P1-7). `runtime` may be forced for tests.
 */
export async function runSemgrep({ rulesets, target, runtime } = {}) {
  const resolved = runtime ?? detectSemgrepRuntime();
  if (resolved === 'native') return runSemgrepNative({ rulesets, target });
  if (resolved === 'docker') return runSemgrepViaDocker({ rulesets, target });
  const error = new Error(
    'SEMGREP_UNAVAILABLE: no native `semgrep` on PATH and no `semgrep/semgrep` Docker image. ' +
      'Run `assurance doctor` to provision Semgrep (D-P1-7).',
  );
  error.code = 'SEMGREP_UNAVAILABLE';
  throw error;
}

export const semgrepAdapter = Object.freeze({
  name: 'semgrep',
  stacks: Object.freeze(['ts', 'node', 'js']),
  run: runSemgrep,
  buildArgv: buildSemgrepArgv,
});
