#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_AUTONOMOUS_ACTIONS = [
  'read_in_scope',
  'analyze_and_plan',
  'edit_in_isolated_workspace',
  'run_local_tests_and_safe_read_only_checks',
  'create_branch_or_worktree',
  'commit_in_scope_changes',
  'open_or_update_pull_request',
];
const REQUIRED_PUSH_PREDICATES = [
  'no_preview_or_production_deploy',
  'no_publish_or_billed_build',
  'no_production_write_or_external_contact',
];
const REQUIRED_MERGE_PREDICATES = [
  'no_deploy_or_production_effect',
  'low_risk',
  'additive_or_isolated_change',
  'no_active_conflicting_work',
  'fetched_current_base',
  'required_checks_passed',
  'independent_review_passed',
  'actual_diff_verified',
  'no_unresolved_human_decision',
  'not_security_auth_billing_schema_data_provider_ai_semantics_or_visible_ui',
];
const REQUIRED_HUMAN_ACTIONS = [
  'merge_that_deploys_or_mutates_production',
  'deploy_or_publish',
  'production_write_or_configuration_change',
  'database_or_data_migration',
  'destructive_or_irreversible_action',
  'billed_action_or_purchase',
  'external_message_or_contact',
  'secret_or_credential_change',
  'close_product_scope_decision',
  'approve_visible_design_or_copy_in_context',
  'close_material_architecture_decision',
];

export function assessAction(policy, action, evidence = {}) {
  if (policy.human_required?.includes(action)) return { verdict: 'human_required', action, missing: [] };
  if (policy.autonomous?.includes(action)) return { verdict: 'allowed', action, missing: [] };
  const conditional = Object.hasOwn(policy.conditional ?? {}, action) ? policy.conditional[action] : null;
  if (conditional) {
    if (!Array.isArray(conditional.all) || conditional.all.length === 0) {
      return { verdict: 'human_required', action, missing: ['invalid_conditional_policy'] };
    }
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
    if (all.length === 0) {
      failures.push(`Conditional action must declare at least one required predicate: ${action}`);
      continue;
    }
    const complete = Object.fromEntries(all.map((predicate) => [predicate, true]));
    if (assessAction(policy, action, complete).verdict !== 'conditional_pass') failures.push(`Conditional action cannot pass with complete evidence: ${action}`);
    if (assessAction(policy, action, {}).verdict !== 'human_required') failures.push(`Conditional action does not fail closed when evidence is missing: ${action}`);
  }
  for (const action of REQUIRED_AUTONOMOUS_ACTIONS) {
    if (!autonomous.includes(action)) failures.push(`Required autonomous action is not autonomous: ${action}`);
  }
  for (const action of REQUIRED_HUMAN_ACTIONS) {
    if (!humanRequired.includes(action)) failures.push(`Required human action is not human_required: ${action}`);
  }
  const pushRule = conditional.push_branch;
  if (!pushRule || autonomous.includes('push_branch') || humanRequired.includes('push_branch')) {
    failures.push('push_branch must be conditional');
  } else {
    for (const predicate of REQUIRED_PUSH_PREDICATES) {
      if (!pushRule.all?.includes(predicate)) failures.push(`Conditional push_branch missing required predicate: ${predicate}`);
    }
    if (pushRule.on_uncertainty !== 'human_required') failures.push('Conditional push_branch must fail closed to human_required');
  }
  const mergeRule = conditional.merge_pull_request;
  if (!mergeRule || autonomous.includes('merge_pull_request') || humanRequired.includes('merge_pull_request')) {
    failures.push('merge_pull_request must be conditional');
  } else {
    for (const predicate of REQUIRED_MERGE_PREDICATES) {
      if (!mergeRule.all?.includes(predicate)) failures.push(`Conditional merge_pull_request missing required predicate: ${predicate}`);
    }
    if (mergeRule.on_uncertainty !== 'human_required') failures.push('Conditional merge_pull_request must fail closed to human_required');
  }
  if (assessAction(policy, '__unclassified_action__').verdict !== 'human_required') failures.push('Unclassified action does not fail closed');
  return [...new Set(failures)];
}

export function cli(argv) {
  const [policyFile, action, evidenceFile] = argv;
  if (!policyFile || !action) {
    console.error('Usage: assess-action.mjs policy.json action [evidence.json]');
    return 2;
  }
  const policy = JSON.parse(fs.readFileSync(path.resolve(policyFile), 'utf8'));
  const policyFailures = validateActionPolicySemantics(policy);
  if (policyFailures.length > 0) {
    console.error(['Action policy is invalid:', ...policyFailures.map((failure) => `- ${failure}`)].join('\n'));
    return 2;
  }
  const evidence = evidenceFile ? JSON.parse(fs.readFileSync(path.resolve(evidenceFile), 'utf8')) : {};
  const result = assessAction(policy, action, evidence);
  console.log(JSON.stringify(result, null, 2));
  return result.verdict === 'allowed' || result.verdict === 'conditional_pass' ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = cli(process.argv.slice(2));
