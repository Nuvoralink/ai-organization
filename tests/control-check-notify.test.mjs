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
    overlayProjects: [],
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
    overlayProjects: [],
    stdout: (line) => greenOutput.push(line),
    stderr: () => assert.fail('green check must not write stderr'),
  }), 0);
  assert.deepEqual(JSON.parse(greenOutput[0]), {
    status: 'ok',
    command: 'npm run control:check + overlay:check (all projects)',
    exitCode: 0,
    checks: [{ command: 'npm run control:check', exitCode: 0, findingCount: 0 }],
    findings: [],
    unstructuredFindingCount: 0,
  });

  const failureOutput = [];
  assert.equal(runControlCheckNotify({
    spawn: () => ({ status: null, stdout: '', stderr: '', error: { code: 'ENOENT', message: 'C:\\private\\runner' } }),
    platform: 'linux',
    environment: {},
    repoRoot: '/portable-fixture',
    overlayProjects: [],
    stdout: () => assert.fail('runner failure must not write stdout'),
    stderr: (line) => failureOutput.push(line),
  }), 1);
  assert.equal(JSON.parse(failureOutput[0]).runnerCode, 'ENOENT');
  assert.doesNotMatch(failureOutput[0], /C:\\private/u);
});

test('Proves: ORG-AUTO-DRIFT-003; Test type: all-projects overlay parity coverage; Surface: weekday drift notifier; Authority: project-overlay check exit plus portable metadata report per project; Killer mutation: stop running the per-project overlay parity check, drop the project tag, or flatten an overlay drift to green; Gated command: npm test', () => {
  const calls = [];
  const stderr = [];
  // control:check is clean; the auxara overlay has a delivered-vs-canonical fork; coachai is clean.
  const spawn = (command, args) => {
    calls.push({ command, args });
    const joined = args.join(' ');
    if (joined.includes('check auxara-dialer')) {
      return {
        status: 1,
        stdout: `${JSON.stringify({
          type: 'drift',
          mapping: 'auxara-project-gate-router-lib',
          destination: '${PROJECT:auxara-dialer}/scripts/lib/claudeGateRouter.mjs',
        })}\n`,
        stderr: '',
      };
    }
    return { status: 0, stdout: 'control-plane check passed\n', stderr: '' };
  };

  const exitCode = runControlCheckNotify({
    spawn,
    platform: 'linux',
    environment: {},
    repoRoot: '/portable-fixture',
    execPath: '/usr/bin/node',
    overlayProjects: ['auxara-dialer', 'coachai'],
    stdout: () => assert.fail('a drift result must not write stdout'),
    stderr: (line) => stderr.push(line),
  });

  assert.equal(exitCode, 1);
  // control:check + BOTH overlays were exercised (the killer mutation "stop running the overlay check"
  // drops these two node invocations and this assertion goes red).
  assert.deepEqual(
    calls.map(({ args }) => args.join(' ')),
    [
      'run control:check --silent',
      'scripts/project-overlay.mjs check auxara-dialer',
      'scripts/project-overlay.mjs check coachai',
    ],
  );
  const report = JSON.parse(stderr[0]);
  assert.equal(report.status, 'drift');
  // The overlay drift is tagged with its project so the human knows WHICH delivered copy forked.
  assert.deepEqual(report.findings, [
    {
      type: 'drift',
      project: 'auxara-dialer',
      mapping: 'auxara-project-gate-router-lib',
      destination: '${PROJECT:auxara-dialer}/scripts/lib/claudeGateRouter.mjs',
    },
  ]);
  assert.deepEqual(
    report.checks,
    [
      { command: 'npm run control:check', exitCode: 0, findingCount: 0 },
      { command: 'overlay:check auxara-dialer', project: 'auxara-dialer', exitCode: 1, findingCount: 1 },
      { command: 'overlay:check coachai', project: 'coachai', exitCode: 0, findingCount: 0 },
    ],
  );
});
