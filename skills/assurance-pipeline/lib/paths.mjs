/** Resolve the assurance-pipeline's vendored schema files relative to this module. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCHEMA_DIR = fileURLToPath(new URL('../schemas/', import.meta.url));

export function schemaPath(name) {
  return path.join(SCHEMA_DIR, name);
}

export const SARIF_SCHEMA = schemaPath('sarif-2.1.0.schema.json');
export const RUN_MANIFEST_SCHEMA = schemaPath('run-manifest.v1.schema.json');
