#!/usr/bin/env node
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const entrypointPath = path.resolve(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(path.dirname(entrypointPath), '..');
const npmArguments = ['run', 'control:check', '--silent'];
const windowsNpmCommand = 'npm run control:check --silent';

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

function parsePortableOutput(output) {
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

function invocation(platform, environment) {
  if (platform === 'win32') {
    return {
      command: environment.ComSpec || environment.COMSPEC || 'cmd.exe',
      args: ['/d', '/s', '/c', windowsNpmCommand],
    };
  }
  return { command: 'npm', args: npmArguments };
}

export function runControlCheckNotify({
  spawn = spawnSync,
  platform = process.platform,
  environment = process.env,
  repoRoot = defaultRepoRoot,
  stdout = console.log,
  stderr = console.error,
} = {}) {
  const command = invocation(platform, environment);
  const result = spawn(command.command, command.args, {
    cwd: repoRoot,
    env: environment,
    encoding: 'utf8',
    windowsHide: true,
  });
  const parsed = parsePortableOutput(`${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  const exitCode = Number.isInteger(result.status) ? result.status : 1;
  const report = {
    status: exitCode === 0 ? 'ok' : 'drift',
    command: 'npm run control:check',
    exitCode,
    findings: parsed.findings,
    unstructuredFindingCount: parsed.unstructuredFindingCount,
  };
  if (result.error) report.runnerCode = portableIdentifier(result.error.code) ?? 'runner-error';
  (exitCode === 0 ? stdout : stderr)(JSON.stringify(report));
  return exitCode;
}

if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === entrypointPath.toLowerCase()) {
  process.exitCode = runControlCheckNotify();
}
