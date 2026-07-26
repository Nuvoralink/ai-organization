import assert from 'node:assert/strict';
import test from 'node:test';
import { runControlCheckNotify } from '../scripts/control-check-notify.mjs';

test('Proves: ORG-AUTO-DRIFT-001; Test type: executable-boundary mutation; Surface: weekday drift notifier; Authority: control:check exit plus portable metadata report; Killer mutation: invoke capture/install, flatten a nonzero exit, or forward raw output/content/absolute paths; Gated command: npm test', () => {
  const calls = [];
  const stdout = [];
  const stderr = [];
  const sentinel = 'SECRET_CONTENT_MUST_NOT_APPEAR';
  const spawn = (command, args, options) => {
    calls.push({ command, args, options });
    return {
      status: 3,
      stdout: `${JSON.stringify({
        type: 'drift',
        mapping: 'global-claude-rules',
        destination: '${HOME}/.claude/rules',
        relative: 'test-intent.md',
        reason: 'hash mismatch',
        content: sentinel,
      })}\n`,
      stderr: 'C:\\Users\\private\\absolute\\path\n',
    };
  };

  const exitCode = runControlCheckNotify({
    spawn,
    platform: 'win32',
    environment: { ComSpec: 'C:\\Windows\\System32\\cmd.exe' },
    repoRoot: 'C:\\portable-fixture',
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line),
  });

  assert.equal(exitCode, 3);
  assert.equal(stdout.length, 0);
  assert.equal(stderr.length, 1);
  assert.deepEqual(calls.map(({ args }) => args), [['/d', '/s', '/c', 'npm run control:check --silent']]);
  assert.ok(calls.every(({ args }) => !args.join(' ').includes('control:capture') && !args.join(' ').includes('control:install')));
  const report = JSON.parse(stderr[0]);
  assert.deepEqual(report.findings, [{
    type: 'drift',
    mapping: 'global-claude-rules',
    destination: '${HOME}/.claude/rules',
    relative: 'test-intent.md',
    reason: 'hash mismatch',
  }]);
  assert.equal(report.unstructuredFindingCount, 1);
  assert.doesNotMatch(stderr[0], /C:\\Users|SECRET_CONTENT_MUST_NOT_APPEAR/u);
});

test('Proves: ORG-AUTO-DRIFT-002; Test type: liveness and runner failure; Surface: weekday drift notifier; Authority: child process result; Killer mutation: turn a green check red or disclose a spawn error path; Gated command: npm test', () => {
  const greenOutput = [];
  assert.equal(runControlCheckNotify({
    spawn: () => ({ status: 0, stdout: 'control-plane check passed\n', stderr: '' }),
    platform: 'linux',
    environment: {},
    repoRoot: '/portable-fixture',
    stdout: (line) => greenOutput.push(line),
    stderr: () => assert.fail('green check must not write stderr'),
  }), 0);
  assert.deepEqual(JSON.parse(greenOutput[0]), {
    status: 'ok',
    command: 'npm run control:check',
    exitCode: 0,
    findings: [],
    unstructuredFindingCount: 0,
  });

  const failureOutput = [];
  assert.equal(runControlCheckNotify({
    spawn: () => ({ status: null, stdout: '', stderr: '', error: { code: 'ENOENT', message: 'C:\\private\\runner' } }),
    platform: 'linux',
    environment: {},
    repoRoot: '/portable-fixture',
    stdout: () => assert.fail('runner failure must not write stdout'),
    stderr: (line) => failureOutput.push(line),
  }), 1);
  assert.equal(JSON.parse(failureOutput[0]).runnerCode, 'ENOENT');
  assert.doesNotMatch(failureOutput[0], /C:\\private/u);
});
