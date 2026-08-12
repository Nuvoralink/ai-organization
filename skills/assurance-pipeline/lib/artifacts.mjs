/**
 * Artifact I/O + validation for the assurance pipeline (Phase 0).
 *
 * REUSE, not reinvention: hashing, canonical serialization, and atomic writes come from the
 * control-plane's own `core/lifecycle/evidence-runtime.mjs`, and JSON-schema validation from
 * `core/schema/validate-json-schema.mjs`. This module adds only (1) redaction-on-write and
 * (2) a throwing validation wrapper, so the rest of the spine has one import surface. The
 * runtime is repo-resident (per plan decision D1), which is why these relative imports reach
 * the control-plane core.
 */
import fs from 'node:fs';
import { sha256, canonicalJson, digestObject, writeJson } from '../../../core/lifecycle/evidence-runtime.mjs';
import { validateJsonAgainstSchema } from '../../../core/schema/validate-json-schema.mjs';
import { redactValue } from './redaction.mjs';

export { sha256, canonicalJson, digestObject };

/** Throw with the full failure list if `value` does not satisfy the schema; otherwise return it. */
export function validateArtifact(schemaPath, value, label = 'artifact') {
  const failures = validateJsonAgainstSchema(schemaPath, value);
  if (failures.length > 0) {
    throw new Error(`${label} failed schema validation against ${schemaPath}: ${failures.join('; ')}`);
  }
  return value;
}

/**
 * Redact `value`, then write it as canonical JSON atomically (0o600, parents created), matching
 * `evidence-runtime.writeJson` byte-for-byte. Returns the on-disk digest and size so the caller
 * can record a verifiable checkpoint. The value passed in is never mutated.
 */
export function writeRedactedJson(file, value) {
  const redacted = redactValue(value);
  writeJson(file, redacted);
  const body = `${canonicalJson(redacted)}\n`;
  return { sha256: sha256(body), bytes: Buffer.byteLength(body, 'utf8') };
}

/** Read and parse a JSON file. */
export function readJsonFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** SHA-256 of a file's exact bytes on disk (used to verify a checkpoint has not drifted). */
export function hashFileBytes(file) {
  return sha256(fs.readFileSync(file));
}
