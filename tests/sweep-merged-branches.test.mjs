import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sweep = path.join(root, 'scripts', 'sweep-merged-branches.mjs');

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}

test('Proves: ORG-GOV-005D; Test type: destructive-guard mutation; Surface: branch reconciliation apply mode; Authority: long-lived integration branch; Killer mutation: remove develop from protected branches and let --apply delete it; Gated command: npm test', (t) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'branch-sweep-protection-'));
  const repo = path.join(fixture, 'repo');
  const remote = path.join(fixture, 'remote.git');
  fs.mkdirSync(repo);
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));

  git(repo, 'init', '-b', 'main');
  git(repo, 'config', 'user.email', 'branch-sweep@example.invalid');
  git(repo, 'config', 'user.name', 'Branch Sweep Test');
  fs.writeFileSync(path.join(repo, 'README.md'), 'fixture\n');
  git(repo, 'add', 'README.md');
  git(repo, 'commit', '-m', 'fixture');
  git(repo, 'branch', 'develop');
  git(repo, 'branch', 'integration');
  git(repo, 'branch', 'topic/landed');
  git(fixture, 'init', '--bare', remote);
  git(repo, 'remote', 'add', 'origin', remote);
  git(repo, 'push', '--all', 'origin');

  const remoteApplied = spawnSync(process.execPath, [sweep, '--apply', '--protect', 'integration'], {
    cwd: repo,
    encoding: 'utf8',
  });
  assert.equal(remoteApplied.status, 0, remoteApplied.stderr);
  assert.match(remoteApplied.stdout, /PROTECTED origin\/develop — long-lived branch protection/u);
  assert.match(remoteApplied.stdout, /PROTECTED origin\/integration — long-lived branch protection/u);
  assert.match(remoteApplied.stdout, /PROTECTED origin\/main — long-lived branch protection/u);
  assert.match(remoteApplied.stdout, /deleted remote topic\/landed/u);
  const remoteBranches = git(repo, 'ls-remote', '--heads', 'origin')
    .split('\n')
    .map((line) => line.split('refs/heads/')[1]);
  assert.deepEqual(remoteBranches.sort(), ['develop', 'integration', 'main']);

  const applied = spawnSync(process.execPath, [sweep, '--local', '--apply', '--protect', 'integration'], {
    cwd: repo,
    encoding: 'utf8',
  });
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stdout, /PROTECTED develop — long-lived branch protection/u);
  assert.match(applied.stdout, /PROTECTED integration — long-lived branch protection/u);
  assert.match(applied.stdout, /PROTECTED main — long-lived branch protection/u);
  assert.match(applied.stdout, /deleted local\s+topic\/landed/u);

  const branches = git(repo, 'branch', '--format=%(refname:short)').split('\n');
  assert.deepEqual(branches.sort(), ['develop', 'integration', 'main']);
});
