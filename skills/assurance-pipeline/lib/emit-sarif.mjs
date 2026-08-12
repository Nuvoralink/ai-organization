/**
 * SARIF 2.1.0 emitter for the assurance pipeline (Phase 0 spine component "e", machine output).
 *
 * Builds a SARIF 2.1.0 log from normalized findings and validates it against the VENDORED official
 * SARIF 2.1.0 schema (schemas/sarif-2.1.0.schema.json) using the control-plane's own
 * `validateJsonAgainstSchema` — no new JSON-schema dependency (plan reuse inventory). The returned
 * document is the in-memory (unredacted) value; the caller persists it through the redaction-on-write
 * boundary, and redaction preserves SARIF validity because it only masks string values.
 *
 * SARIF `level` is one of: none | note | warning | error (enforced by the schema's enum).
 */
import { validateArtifact } from './artifacts.mjs';
import { SARIF_SCHEMA } from './paths.mjs';

const SARIF_VERSION = '2.1.0';
const SARIF_SCHEMA_URI = 'https://json.schemastore.org/sarif-2.1.0.json';
const VALID_LEVELS = new Set(['none', 'note', 'warning', 'error']);

function driverRules(findings) {
  const byRule = new Map();
  for (const finding of findings) {
    if (byRule.has(finding.ruleId)) continue;
    byRule.set(finding.ruleId, {
      id: finding.ruleId,
      name: finding.ruleName ?? finding.ruleId,
      shortDescription: { text: finding.ruleDescription ?? finding.ruleName ?? finding.ruleId },
    });
  }
  return [...byRule.values()];
}

function resultFor(finding) {
  const level = VALID_LEVELS.has(finding.level) ? finding.level : 'warning';
  const region = { startLine: finding.startLine ?? 1 };
  if (Number.isInteger(finding.startColumn)) region.startColumn = finding.startColumn;
  if (typeof finding.snippet === 'string') region.snippet = { text: finding.snippet };
  return {
    ruleId: finding.ruleId,
    level,
    message: { text: finding.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: finding.uri },
          region,
        },
      },
    ],
  };
}

/**
 * @param {object} args
 * @param {Array}  args.findings  normalized findings: { ruleId, ruleName?, level, message, uri, startLine?, startColumn?, snippet? }
 * @param {object} args.tool      { name, version?, informationUri? }
 * @returns {object} a schema-validated SARIF 2.1.0 log
 */
export function emitSarif({ findings, tool }) {
  if (!tool || typeof tool.name !== 'string') throw new Error('emitSarif requires tool.name');
  const driver = { name: tool.name };
  if (typeof tool.version === 'string') driver.version = tool.version;
  if (typeof tool.informationUri === 'string') driver.informationUri = tool.informationUri;
  driver.rules = driverRules(findings ?? []);

  const document = {
    $schema: SARIF_SCHEMA_URI,
    version: SARIF_VERSION,
    runs: [
      {
        tool: { driver },
        results: (findings ?? []).map((finding) => resultFor(finding)),
      },
    ],
  };

  return validateArtifact(SARIF_SCHEMA, document, 'SARIF 2.1.0 output');
}
