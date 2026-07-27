import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonAgainstSchema } from './validate-json-schema.mjs';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const TASK_ASSURANCE_SCHEMAS = Object.freeze({
  2: 'task-assurance.v2.schema.json',
  3: 'task-assurance.v3.schema.json',
});

export function assuranceSchemaFile(name) {
  const found = [`../../schemas/${name}`, `../../../schemas/${name}`]
    .map((candidate) => path.resolve(moduleDirectory, candidate))
    .find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error(`Required assurance schema is not installed: ${name}`);
  return found;
}

export function validateTaskAssuranceSchema(contract) {
  if (contract === null || typeof contract !== 'object' || Array.isArray(contract))
    return ['Task contract must be an object'];
  const schemaName = TASK_ASSURANCE_SCHEMAS[contract.schema_version];
  if (!schemaName) return ['Task contract schema_version must be 2 or 3'];
  return validateJsonAgainstSchema(assuranceSchemaFile(schemaName), contract);
}

export function upgradeV2ToV3(contract) {
  if (contract?.schema_version !== 2)
    throw new TypeError('upgradeV2ToV3 requires a schema_version 2 task contract');
  const failures = validateTaskAssuranceSchema(contract);
  if (failures.length > 0)
    throw new TypeError(`Cannot upgrade invalid v2 task contract: ${failures.join('; ')}`);

  const upgraded = structuredClone(contract);
  upgraded.schema_version = 3;
  upgraded.requires = [];
  const upgradedFailures = validateTaskAssuranceSchema(upgraded);
  if (upgradedFailures.length > 0)
    throw new Error(
      `V2-to-v3 adapter produced an invalid contract: ${upgradedFailures.join('; ')}`,
    );
  return upgraded;
}
