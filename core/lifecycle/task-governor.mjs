#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonAgainstSchema } from '../schema/validate-json-schema.mjs';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
function assuranceSchema(name) {
  const candidates = [
    path.resolve(moduleDirectory, '..', '..', 'schemas', name),
    path.resolve(moduleDirectory, '..', '..', '..', 'schemas', name)
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error(`Assurance schema is not installed: ${name}`);
  return found;
}

const RISK_CLASSES = new Set([
  'frontend', 'auth', 'security', 'privacy', 'billing', 'database', 'data_migration', 'provider',
  'ai_semantics', 'production', 'destructive', 'external_contact', 'architecture', 'documentation', 'control_plane'
]);
const REVIEW_TIERS = new Set(['review_verified', 'deployed_verified']);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalize(value) {
  return String(value).replaceAll('\\', '/').replace(/^\.\//u, '').replace(/\/+/gu, '/');
}

function patternRegex(pattern) {
  const normalized = normalize(pattern);
  const escaped = normalized.replace(/[.+^${}()|[\]\\]/gu, '\\$&');
  const globbed = escaped.replaceAll('**', '\u0000').replaceAll('*', '[^/]*').replaceAll('\u0000', '.*');
  return new RegExp(`^${globbed}${normalized.endsWith('/') ? '.*' : ''}$`, 'u');
}

export function matchesAny(file, patterns) {
  const normalized = normalize(file);
  return patterns.some((pattern) => patternRegex(pattern).test(normalized));
}

function nonEmptyStrings(value) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.trim().length > 0);
}

export function validateTaskContract(contract) {
  const failures = validateJsonAgainstSchema(assuranceSchema('task-assurance.v1.schema.json'), contract);
  if (!contract || typeof contract !== 'object') return ['Task contract must be an object'];
  if (typeof contract.id !== 'string' || contract.id.length < 2) failures.push('Task id is required');
  if (typeof contract.product_intent !== 'string' || contract.product_intent.trim().length < 10) failures.push('Product intent must be substantive');
  if (!contract.paths || !nonEmptyStrings(contract.paths.edit)) failures.push('At least one editable path is required');
  if (!Array.isArray(contract.paths?.read_only)) failures.push('Read-only paths must be declared');
  if (!contract.risk || !nonEmptyStrings(contract.risk.classes)) failures.push('At least one risk class is required');
  for (const risk of contract.risk?.classes ?? []) if (!RISK_CLASSES.has(risk)) failures.push(`Unknown risk class: ${risk}`);
  if (!Array.isArray(contract.proofs) || contract.proofs.length === 0) failures.push('At least one proof is required');

  const proofIds = new Set();
  const covered = new Set();
  for (const proof of contract.proofs ?? []) {
    if (!proof?.id || proofIds.has(proof.id)) failures.push(`Duplicate or missing proof id: ${proof?.id ?? '<missing>'}`);
    proofIds.add(proof?.id);
    if (!proof?.command || !proof?.proves || !proof?.authority || !proof?.surface) failures.push(`Proof ${proof?.id ?? '<missing>'} lacks command/proves/authority/surface`);
    if (!proof?.killer_mutation) failures.push(`Proof ${proof?.id ?? '<missing>'} lacks a killer mutation`);
    if (!nonEmptyStrings(proof?.risk_classes)) failures.push(`Proof ${proof?.id ?? '<missing>'} lacks risk-class coverage`);
    if (proof?.required) for (const risk of proof.risk_classes ?? []) covered.add(risk);
  }
  for (const risk of contract.risk?.classes ?? []) if (!covered.has(risk)) failures.push(`Risk class has no required proof: ${risk}`);
  if ((contract.risk?.classes ?? []).includes('control_plane') && !covered.has('control_plane')) failures.push('Control-plane changes cannot complete with zero control-plane proof');
  return [...new Set(failures)];
}

export function validateTaskEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') return ['Evidence must be an object'];
  return validateJsonAgainstSchema(assuranceSchema('task-evidence.v1.schema.json'), evidence);
}

export function validateCompletion(contract, evidence) {
  const failures = validateTaskContract(contract);
  if (!evidence || typeof evidence !== 'object') return [...failures, 'Evidence must be an object'];
  failures.push(...validateTaskEvidence(evidence));
  if (evidence.task_id !== contract.id) failures.push('Evidence task_id does not match the contract');
  if (!Array.isArray(evidence.changed_files)) failures.push('Evidence changed_files must be an array');
  for (const file of evidence.changed_files ?? []) {
    if (!matchesAny(file, contract.paths.edit)) failures.push(`Changed file is outside editable paths: ${normalize(file)}`);
    if (matchesAny(file, contract.paths.read_only ?? [])) failures.push(`Changed file is read-only: ${normalize(file)}`);
  }

  const evidenceById = new Map((evidence.proofs ?? []).map((proof) => [proof.id, proof]));
  for (const proof of (contract.proofs ?? []).filter((candidate) => candidate.required)) {
    const actual = evidenceById.get(proof.id);
    if (!actual) {
      failures.push(`Required proof was not run: ${proof.id}`);
      continue;
    }
    if (actual.command !== proof.command) failures.push(`Proof command drifted: ${proof.id}`);
    if (actual.exit_code !== 0) failures.push(`Required proof failed: ${proof.id} (exit ${actual.exit_code})`);
    if (actual.artifact_opened !== true) failures.push(`Proof output was not opened: ${proof.id}`);
    if (actual.killer_mutation_observed !== true) failures.push(`Killer mutation was not observed: ${proof.id}`);
  }

  const review = evidence.independent_review;
  const reviewRequired = REVIEW_TIERS.has(contract.completion?.tier) || review?.required === true;
  if (reviewRequired && (!review?.reviewer || review.verdict !== 'pass')) failures.push('Independent review is required and must pass');
  if (typeof evidence.doctrine_loop !== 'string' || evidence.doctrine_loop.trim().length === 0) failures.push('Doctrine-loop result is required');
  if (!Array.isArray(evidence.unreached_surfaces)) failures.push('Unreached surfaces must be explicit');
  return [...new Set(failures)];
}

function printResult(label, failures) {
  if (failures.length === 0) {
    console.log(`${label} passed`);
    return 0;
  }
  console.error(`${label} failed`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  return 1;
}

function cli(argv) {
  const [command, contractFile, evidenceFile] = argv;
  if (!['validate', 'complete'].includes(command) || !contractFile || (command === 'complete' && !evidenceFile)) {
    console.error('Usage: task-governor.mjs <validate contract.json|complete contract.json evidence.json>');
    return 2;
  }
  const contract = readJson(path.resolve(contractFile));
  if (command === 'validate') return printResult('task contract validation', validateTaskContract(contract));
  return printResult('task completion validation', validateCompletion(contract, readJson(path.resolve(evidenceFile))));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = cli(process.argv.slice(2));
