/**
 * Normalize SARIF 2.1.0 static-analysis results into the assurance pipeline's StaticFinding
 * contract. Identity and downstream decisions depend only on structural evidence
 * (tool/rule/location), never on raw snippet bytes (D7 redaction invariance).
 */
import { sha256 } from '../../artifacts.mjs';

const SARIF_VERSION = '2.1.0';
const VALID_LEVELS = new Set(['none', 'note', 'warning', 'error']);

function malformed(message) {
  return new Error(`Malformed SARIF 2.1.0 document: ${message}`);
}

/**
 * Relativize a SARIF artifact URI to the scan root so a finding's identity is independent of HOW it
 * was scanned (a native run vs. the `/src` Docker mount, D-P1-7). A guarded no-op when the URI is not
 * under `stripPrefix` (i.e. already repo-relative).
 */
function relativizeUri(uri, stripPrefix) {
  if (!stripPrefix) return uri;
  const normalizedUri = uri.replace(/\\/gu, '/');
  const prefix = stripPrefix.replace(/\\/gu, '/').replace(/\/+$/u, '');
  if (normalizedUri === prefix) return '';
  if (normalizedUri.startsWith(`${prefix}/`)) return normalizedUri.slice(prefix.length + 1);
  return uri;
}

function ruleFor(run, result) {
  const rules = Array.isArray(run.tool?.driver?.rules) ? run.tool.driver.rules : [];
  if (Number.isInteger(result.ruleIndex) && rules[result.ruleIndex]) return rules[result.ruleIndex];
  return rules.find((rule) => rule?.id === result.ruleId) ?? {};
}

function textOf(message) {
  if (typeof message?.text === 'string') return message.text;
  if (typeof message?.markdown === 'string') return message.markdown;
  return undefined;
}

function stringArray(value) {
  if (typeof value === 'string') return [value];
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((item) => typeof item === 'string');
  return strings.length > 0 ? strings : undefined;
}

function optionalInteger(target, key, value) {
  if (Number.isInteger(value)) target[key] = value;
}

/**
 * @param {object} sarifDoc SARIF 2.1.0 log
 * @param {object} options
 * @param {string} options.tool normalized tool name
 * @returns {Array<object>} normalized StaticFinding values
 */
export function normalizeSarif(sarifDoc, { tool, stripPrefix } = {}) {
  if (!sarifDoc || typeof sarifDoc !== 'object' || Array.isArray(sarifDoc)) {
    throw malformed('expected an object envelope');
  }
  if (!Object.hasOwn(sarifDoc, 'version')) throw malformed('missing version');
  if (sarifDoc.version !== SARIF_VERSION) {
    throw malformed(`unsupported version ${JSON.stringify(sarifDoc.version)}; expected ${SARIF_VERSION}`);
  }
  if (!Array.isArray(sarifDoc.runs)) throw malformed('missing runs array');
  if (typeof tool !== 'string' || tool.length === 0) throw new Error('normalizeSarif requires a non-empty tool');

  const findings = [];
  for (let runIndex = 0; runIndex < sarifDoc.runs.length; runIndex += 1) {
    const run = sarifDoc.runs[runIndex];
    if (!run || typeof run !== 'object' || Array.isArray(run)) {
      throw malformed(`runs[${runIndex}] must be an object`);
    }
    if (run.results !== undefined && !Array.isArray(run.results)) {
      throw malformed(`runs[${runIndex}].results must be an array`);
    }

    for (let resultIndex = 0; resultIndex < (run.results ?? []).length; resultIndex += 1) {
      const result = run.results[resultIndex];
      const label = `runs[${runIndex}].results[${resultIndex}]`;
      if (!result || typeof result !== 'object' || Array.isArray(result)) {
        throw malformed(`${label} must be an object`);
      }
      const rule = ruleFor(run, result);
      const ruleId = typeof result.ruleId === 'string' && result.ruleId.length > 0 ? result.ruleId : rule.id;
      const physicalLocation = result.locations?.[0]?.physicalLocation;
      const uri = physicalLocation?.artifactLocation?.uri;
      const region = physicalLocation?.region ?? {};
      const startLine = region.startLine;
      if (typeof ruleId !== 'string' || ruleId.length === 0) throw malformed(`${label} is missing ruleId`);
      if (typeof uri !== 'string' || uri.length === 0) throw malformed(`${label} is missing locations[0] artifact uri`);
      if (!Number.isInteger(startLine)) throw malformed(`${label} is missing locations[0] startLine`);

      // Relativize to the scan root BEFORE hashing so the fingerprint is runtime-independent
      // (same finding, same id, whether scanned natively or via the /src Docker mount — D-P1-7).
      const relativeUri = relativizeUri(uri, stripPrefix);
      const fingerprint = sha256(`${tool}\0${ruleId}\0${relativeUri}\0${startLine}`);
      const message = textOf(result.message) ?? textOf(rule.shortDescription) ?? ruleId;
      const ruleName =
        (typeof rule.name === 'string' && rule.name.length > 0 && rule.name) ||
        textOf(rule.shortDescription) ||
        ruleId;
      const finding = {
        id: fingerprint,
        tool,
        ruleId,
        ruleName,
        level: VALID_LEVELS.has(result.level) ? result.level : 'warning',
        message,
        uri: relativeUri,
        startLine,
        fingerprint,
      };

      const description = textOf(rule.fullDescription) ?? textOf(rule.shortDescription);
      if (typeof description === 'string') finding.ruleDescription = description;
      optionalInteger(finding, 'startColumn', region.startColumn);
      optionalInteger(finding, 'endLine', region.endLine);
      const snippet = textOf(region.snippet);
      if (typeof snippet === 'string') finding.snippet = snippet;
      if (Array.isArray(result.codeFlows)) finding.dataflow = result.codeFlows;
      const confidence = result.properties?.confidence ?? rule.properties?.confidence;
      if (typeof confidence === 'string') finding.confidence = confidence;
      const cwe = stringArray(result.properties?.cwe ?? rule.properties?.cwe);
      if (cwe) finding.cwe = cwe;
      findings.push(finding);
    }
  }
  return findings;
}
