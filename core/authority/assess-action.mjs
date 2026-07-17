#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function assessAction(policy, action, evidence = {}) {
  if (policy.human_required?.includes(action)) return { verdict: 'human_required', action, missing: [] };
  if (policy.autonomous?.includes(action)) return { verdict: 'allowed', action, missing: [] };
  const conditional = policy.conditional[action];
  if (conditional) {
    const missing = conditional.all.filter((predicate) => evidence[predicate] !== true);
    return missing.length === 0
      ? { verdict: 'conditional_pass', action, missing: [] }
      : { verdict: conditional.on_uncertainty ?? policy.default, action, missing };
  }
  return { verdict: policy.default, action, missing: ['unclassified_action'] };
}

export function validateActionPolicySemantics(policy) {
  const failures = [];
  if (!policy || typeof policy !== 'object') return ['Action policy must be an object'];
  const autonomous = Array.isArray(policy.autonomous) ? policy.autonomous : [];
  const humanRequired = Array.isArray(policy.human_required) ? policy.human_required : [];
  const conditional = policy.conditional && typeof policy.conditional === 'object' ? policy.conditional : {};
  const deferred = Array.isArray(policy.explicitly_deferred) ? policy.explicitly_deferred : [];
  const actionOwners = new Map();
  const register = (action, owner) => {
    if (actionOwners.has(action)) failures.push(`Action is classified by multiple authorities: ${action} (${actionOwners.get(action)}, ${owner})`);
    else actionOwners.set(action, owner);
  };
  autonomous.forEach((action) => register(action, 'autonomous'));
  humanRequired.forEach((action) => register(action, 'human_required'));
  Object.keys(conditional).forEach((action) => register(action, 'conditional'));
  deferred.forEach((action) => register(action, 'explicitly_deferred'));
  if (policy.default !== 'human_required') failures.push('Unknown actions must fail closed to human_required');
  for (const action of autonomous) if (assessAction(policy, action).verdict !== 'allowed') failures.push(`Autonomous action does not evaluate allowed: ${action}`);
  for (const action of humanRequired) if (assessAction(policy, action).verdict !== 'human_required') failures.push(`Human action does not evaluate human_required: ${action}`);
  for (const [action, rule] of Object.entries(conditional)) {
    const all = Array.isArray(rule?.all) ? rule.all : [];
    const complete = Object.fromEntries(all.map((predicate) => [predicate, true]));
    if (assessAction(policy, action, complete).verdict !== 'conditional_pass') failures.push(`Conditional action cannot pass with complete evidence: ${action}`);
    if (assessAction(policy, action, {}).verdict !== 'human_required') failures.push(`Conditional action does not fail closed when evidence is missing: ${action}`);
  }
  if (assessAction(policy, '__unclassified_action__').verdict !== 'human_required') failures.push('Unclassified action does not fail closed');
  return [...new Set(failures)];
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
