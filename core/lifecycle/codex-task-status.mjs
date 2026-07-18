#!/usr/bin/env node
/** Read-only Codex status client. Codex has no authenticated local lifecycle event ingress in this integration. */
import path from 'node:path';
import process from 'node:process';
import { defaultAssuranceStateDirectory, loadTaskAttempt } from './evidence-runtime.mjs';

function cli(argv) {
  const [command, taskId] = argv;
  if (command === 'status' && taskId) {
    const attempt = loadTaskAttempt(defaultAssuranceStateDirectory(process.cwd()), taskId);
    console.log(JSON.stringify(attempt ? {
      task_id: attempt.task_id,
      attempt_id: attempt.attempt_id,
      state: attempt.state,
      contract_sha256: attempt.contract_sha256
    } : null));
    return attempt ? 0 : 1;
  }
  console.error(`Usage: ${path.basename(process.argv[1])} status <task-id>. Codex completion enforcement requires a future authenticated platform or external provider; this client cannot create or attest attempts.`);
  return 2;
}

process.exitCode = cli(process.argv.slice(2));
