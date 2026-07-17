#!/usr/bin/env node
/** Select and run proof from changed paths. Unknown paths fail; DB-risk completion requires a disposable DB. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function globRegex(pattern) {
  let out = '^';
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*') { out += '.*'; i += 1; }
    else if (c === '*') out += '[^/]*';
    else out += c.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`${out}$`);
}
const matches = (file, patterns) => patterns.some((pattern) => globRegex(pattern).test(file));
function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
export function changedFiles(root, integrationBranch) {
  if (typeof integrationBranch !== 'string' || integrationBranch.length === 0) throw new Error('proof registry integration_branch is unavailable');
  let base;
  try { base = git(root, ['merge-base', `origin/${integrationBranch}`, 'HEAD']); }
  catch { base = git(root, ['merge-base', integrationBranch, 'HEAD']); }
  if (!base) throw new Error('unable to establish a trusted Git base');
  const lists = [git(root, ['diff', '--name-only', `${base}...HEAD`]), git(root, ['diff', '--name-only']), git(root, ['diff', '--cached', '--name-only']), git(root, ['ls-files', '--others', '--exclude-standard'])];
  return [...new Set(lists.flatMap((s) => s.split(/\r?\n/)).map((s) => s.trim().replace(/\\/g, '/')).filter(Boolean))].sort();
}

export function selectProof(root, files, lane = null) {
  const policy = JSON.parse(fs.readFileSync(path.join(root, '.ai-organization', 'proof-profiles.json'), 'utf8'));
  const normalized = [...new Set(files.map((f) => f.replace(/\\/g, '/').replace(/^\.\//, '')))];
  const allMatches = new Map(normalized.map((file) => [file, policy.profiles.filter((profile) => matches(file, profile.include))]));
  const unknown = [...allMatches].filter(([, profiles]) => profiles.length === 0).map(([file]) => file);
  const selected = policy.profiles.filter((profile) => (!lane || profile.lane === lane) && normalized.some((file) => matches(file, profile.include)));
  return { policy, files: normalized, unknown, profiles: selected };
}

export function runSelectedProof(root, files, options = {}) {
  const selected = selectProof(root, files, options.lane ?? null);
  const errors = [];
  if (selected.unknown.length && selected.policy.unknown_path_policy === 'fail') errors.push(`unmapped changed paths: ${selected.unknown.join(', ')}`);
  for (const profile of selected.profiles) {
    if (profile.requires_env_any?.length && !profile.requires_env_any.some((name) => process.env[name])) errors.push(`profile ${profile.id} requires one of: ${profile.requires_env_any.join(', ')}`);
  }
  if (selected.files.length > 0 && selected.profiles.length === 0) errors.push('changed paths selected zero applicable proof profiles');
  if (errors.length || options.dryRun) return { ...selected, errors, commands: [...new Set(selected.profiles.flatMap((p) => p.commands))], ok: errors.length === 0 };
  const commands = [...new Set(selected.profiles.flatMap((p) => p.commands))];
  const results = [];
  for (const command of commands) {
    const result = spawnSync(command, { cwd: root, shell: true, stdio: options.stdio ?? 'inherit', env: process.env });
    results.push({ command, exit: result.status });
    if (result.status !== 0) { errors.push(`command failed (${result.status}): ${command}`); break; }
  }
  return { ...selected, commands, results, errors, ok: errors.length === 0 };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const explicit = [];
  let lane = process.env.PROOF_LANE || null;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--file' && args[i + 1]) { explicit.push(args[++i]); }
    else if (args[i] === '--lane' && args[i + 1]) lane = args[++i];
  }
  let files;
  let registry;
  try { registry = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.ai-organization', 'proof-profiles.json'), 'utf8')); }
  catch (error) { console.error(`risk-proof: BLOCKED — proof registry unavailable: ${error.message}`); process.exit(1); }
  try { files = explicit.length ? explicit : changedFiles(process.cwd(), registry.integration_branch); }
  catch (error) { console.error(`risk-proof: BLOCKED — Git change authority unavailable: ${error.message}`); process.exit(1); }
  if (files.length === 0) { console.log('risk-proof: PASS — verified zero changed paths'); process.exit(0); }
  const result = runSelectedProof(process.cwd(), files, { lane });
  console.log(`risk-proof: files=${files.length} profiles=${result.profiles.map((p) => p.id).join(',') || 'none'} lane=${lane ?? 'all'}`);
  if (!result.ok) { console.error(result.errors.map((e) => `- ${e}`).join('\n')); process.exit(1); }
  console.log(`risk-proof: PASS — ${result.commands.length} unique command(s)`);
}
