#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function assessAction(policy, action, evidence = {}) {
  if (policy.human_required.includes(action)) return { verdict: 'human_required', action, missing: [] };
  if (policy.autonomous.includes(action)) return { verdict: 'allowed', action, missing: [] };
  const conditional = policy.conditional[action];
  if (conditional) {
    const missing = conditional.all.filter((predicate) => evidence[predicate] !== true);
    return missing.length === 0
      ? { verdict: 'conditional_pass', action, missing: [] }
      : { verdict: conditional.on_uncertainty ?? policy.default, action, missing };
  }
  return { verdict: policy.default, action, missing: ['unclassified_action'] };
}

function cli(argv) {
  const [policyFile, action, evidenceFile] = argv;
  if (!policyFile || !action) {
    console.error('Usage: assess-action.mjs policy.json action [evidence.json]');
    return 2;
  }
  const policy = JSON.parse(fs.readFileSync(path.resolve(policyFile), 'utf8'));
  const evidence = evidenceFile ? JSON.parse(fs.readFileSync(path.resolve(evidenceFile), 'utf8')) : {};
  const result = assessAction(policy, action, evidence);
  console.log(JSON.stringify(result, null, 2));
  return result.verdict === 'allowed' || result.verdict === 'conditional_pass' ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = cli(process.argv.slice(2));
