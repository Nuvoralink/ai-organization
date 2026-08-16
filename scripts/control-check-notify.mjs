#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const entrypointPath = path.resolve(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(path.dirname(entrypointPath), '..');

function portableIdentifier(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._-]*$/iu.test(value) ? value : undefined;
}

function portableRelative(value) {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  const normalized = value.replaceAll('\\', '/');
  if (path.posix.isAbsolute(normalized) || path.win32.isAbsolute(value) || normalized.includes('../')) return undefined;
  return /^[a-z0-9 ._@()+/-]+$/iu.test(normalized) ? normalized : undefined;
}

function portableTokenPath(value) {
  return typeof value === 'string' && /^\$\{[A-Z0-9:_-]+\}(?:\/[a-z0-9 ._@()+/-]+)?$/iu.test(value)
    ? value
    : undefined;
}

function parsePortableOutput(output, extra = {}) {
  const findings = [];
  let unstructuredFindingCount = 0;
  for (const line of String(output ?? '').split(/\r?\n/u).map((value) => value.trim()).filter(Boolean)) {
    if (line === 'control-plane check passed' || /^control-plane check failed: \d+ problem\(s\)$/u.test(line)) continue;
    let finding;
    try {
      const parsed = JSON.parse(line);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
      finding = {
        type: portableIdentifier(parsed.type) ?? 'finding',
        project: portableIdentifier(extra.project),
        mapping: portableIdentifier(parsed.mapping),
        destination: portableTokenPath(parsed.destination),
        relative: portableRelative(parsed.relative),
        reason: portableRelative(parsed.reason),
      };
      for (const key of Object.keys(finding)) if (finding[key] === undefined) delete finding[key];
    } catch {
      unstructuredFindingCount += 1;
      continue;
    }
    findings.push(finding);
  }
  return { findings, unstructuredFindingCount };
}

function controlCheckInvocation(platform, environment) {
  if (platform === 'win32') {
    return {
      command: environment.ComSpec || environment.COMSPEC || 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm run control:check --silent'],
    };
  }
  return { command: 'npm', args: ['run', 'control:check', '--silent'] };
}

// The overlay parity check (canonical delivered-to-project source vs the installed project) is run
// directly through node so it is portable and needs no per-project npm alias. This is the arm that
// covers ALL projects — the global `control:check` above only sees ~/.claude, ~/.codex, and the skills.
// Adding it here closes the delivered-vs-canonical hole: `gate:organization-overlay`/`gate:fleet-parity`
// only compare a delivered file to its OWN digest, so a delivered-copy fork whose digest was updated to
// match itself diverges from canonical invisibly (the #386→#393 coverage.mjs fork trap) until this alarm
// or an install reverts it. See docs/runbooks/control-plane-fork-trap.md.
function overlayCheckInvocation(execPath, project) {
  return { command: execPath, args: ['scripts/project-overlay.mjs', 'check', project] };
}

/** Overlay project ids are the immediate subdirectories of `overlays/`. */
export function discoverOverlayProjects(repoRoot) {
  const overlaysRoot = path.join(repoRoot, 'overlays');
  if (!fs.existsSync(overlaysRoot)) return [];
  return fs
    .readdirSync(overlaysRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^[a-z0-9][a-z0-9-]+$/u.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

export function runControlCheckNotify({
  spawn = spawnSync,
  platform = process.platform,
  environment = process.env,
  repoRoot = defaultRepoRoot,
  execPath = process.execPath,
  overlayProjects,
  stdout = console.log,
  stderr = console.error,
} = {}) {
  const projects = overlayProjects ?? discoverOverlayProjects(repoRoot);
  const checks = [
    { command: 'npm run control:check', invocation: controlCheckInvocation(platform, environment) },
    ...projects.map((project) => ({
      command: `overlay:check ${project}`,
      project,
      invocation: overlayCheckInvocation(execPath, project),
    })),
  ];

  const findings = [];
  let unstructuredFindingCount = 0;
  let exitCode = 0;
  let runnerCode;
  const checkReports = [];

  for (const check of checks) {
    const result = spawn(check.invocation.command, check.invocation.args, {
      cwd: repoRoot,
      env: environment,
      encoding: 'utf8',
      windowsHide: true,
    });
    const parsed = parsePortableOutput(`${result.stdout ?? ''}\n${result.stderr ?? ''}`, {
      project: check.project,
    });
    const checkExit = Number.isInteger(result.status) ? result.status : 1;
    findings.push(...parsed.findings);
    unstructuredFindingCount += parsed.unstructuredFindingCount;
    if (checkExit !== 0 && exitCode === 0) exitCode = checkExit;
    if (result.error && !runnerCode) runnerCode = portableIdentifier(result.error.code) ?? 'runner-error';
    const checkReport = {
      command: check.command,
      exitCode: checkExit,
      findingCount: parsed.findings.length,
    };
    if (check.project) checkReport.project = check.project;
    checkReports.push(checkReport);
  }

  const report = {
    status: exitCode === 0 ? 'ok' : 'drift',
    command: 'npm run control:check + overlay:check (all projects)',
    exitCode,
    checks: checkReports,
    findings,
    unstructuredFindingCount,
  };
  if (runnerCode) report.runnerCode = runnerCode;
  (exitCode === 0 ? stdout : stderr)(JSON.stringify(report));
  return exitCode;
}

if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === entrypointPath.toLowerCase()) {
  process.exitCode = runControlCheckNotify();
}
