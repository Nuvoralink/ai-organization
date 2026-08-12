/**
 * Redaction-on-write for the assurance pipeline (Phase 0 spine component "d").
 *
 * EVERY artifact the spine writes to disk — stage artifacts, SARIF, and the human report —
 * passes through this module first. It masks payment card numbers (PAN, gated by Luhn + a
 * known issuer-identification prefix so arbitrary long digit strings are NOT over-redacted),
 * US Social Security numbers, and common secret / API-token shapes.
 *
 * Design note (do NOT "simplify" by removing the runtime assembly in the toy pipeline): the
 * control-plane's own `control:validate` gate and gitleaks scan every COMMITTED file for
 * secret-shaped literals, so a real secret literal can never live in tracked source. This
 * module operates on RUNTIME values, where a real secret can legitimately appear (a finding's
 * evidence snippet quoted from scanned product source) and must be masked before persistence.
 *
 * The in-memory value is never mutated: `redactValue` returns a redacted deep copy, so a stage
 * keeps the real value for downstream logic within a run while only the persisted copy is masked.
 */

const PAN_CANDIDATE = /(?<![0-9])(?:[0-9][ -]?){12,18}[0-9](?![0-9])/gu;
const SSN = /(?<![0-9-])[0-9]{3}[- ][0-9]{2}[- ][0-9]{4}(?![0-9-])/gu;

// Issuer Identification Number (IIN) prefixes for the major card networks. A PAN candidate is
// only masked when it is Luhn-valid AND its digits match one of these AND its length is 13-19,
// so a random 16-digit order id or timestamp is left untouched.
const IIN_NETWORKS = [
  /^4[0-9]{12}(?:[0-9]{3}){0,2}$/u, // Visa (13, 16, 19)
  /^(?:5[1-5][0-9]{14}|2(?:22[1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[01][0-9]|720)[0-9]{12})$/u, // Mastercard
  /^3[47][0-9]{13}$/u, // American Express
  /^6(?:011|5[0-9]{2}|4[4-9][0-9]|22[0-9])[0-9]{10,13}$/u, // Discover
  /^3(?:0[0-5]|[68][0-9])[0-9]{11,16}$/u, // Diners Club
  /^(?:2131|1800|35[0-9]{2})[0-9]{11,15}$/u, // JCB
];

// Named secret shapes, most-specific first. Each entry masks the whole match with a typed token.
const SECRET_PATTERNS = [
  [
    /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/gu,
    '[REDACTED:private-key]',
  ],
  [/\bAKIA[0-9A-Z]{16}\b/gu, '[REDACTED:aws-access-key-id]'],
  [/\bgh[opusr]_[A-Za-z0-9_]{20,}\b/gu, '[REDACTED:github-token]'],
  [/\bsk-[A-Za-z0-9_-]{16,}\b/gu, '[REDACTED:api-key]'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/gu, '[REDACTED:slack-token]'],
];

// Generic "<credential-key> = <value>" / bearer form. Preserves the key and any surrounding
// quote so the artifact stays readable while the value is masked.
const KEYED_SECRET =
  /((?:api[_-]?key|access[_-]?token|secret[_-]?key|client[_-]?secret|authorization|bearer)\s*[:=]\s*["']?)[A-Za-z0-9_\-./+=]{12,}(["']?)/giu;

function luhnValid(digits) {
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = digits.charCodeAt(index) - 48;
    if (value < 0 || value > 9) return false;
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

function isPaymentCard(candidate) {
  const digits = candidate.replace(/[ -]/gu, '');
  if (digits.length < 13 || digits.length > 19) return false;
  if (!luhnValid(digits)) return false;
  return IIN_NETWORKS.some((pattern) => pattern.test(digits));
}

/**
 * Mask every sensitive substring in a single string. Order: structured secrets → keyed secrets
 * → SSN → PAN (PAN last so a card inside a `key=<card>` pair is masked as a secret, not split).
 */
export function redactString(input) {
  if (typeof input !== 'string' || input.length === 0) return input;
  let output = input;
  for (const [pattern, replacement] of SECRET_PATTERNS) output = output.replace(pattern, replacement);
  output = output.replace(KEYED_SECRET, (match, prefix, suffix) => `${prefix}[REDACTED:secret]${suffix}`);
  output = output.replace(SSN, '[REDACTED:ssn]');
  output = output.replace(PAN_CANDIDATE, (match) => (isPaymentCard(match) ? '[REDACTED:pan]' : match));
  return output;
}

/**
 * Return a redacted DEEP COPY of any JSON-serializable value. Object keys are structural and are
 * left intact; every string value (including inside arrays and nested objects) is masked. The
 * input is never mutated.
 */
export function redactValue(value) {
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (value !== null && typeof value === 'object') {
    const output = {};
    for (const [key, child] of Object.entries(value)) output[key] = redactValue(child);
    return output;
  }
  return value;
}

/** True when `value` contains at least one substring this module would mask. */
export function containsSensitive(value) {
  if (typeof value === 'string') return redactString(value) !== value;
  return JSON.stringify(redactValue(value)) !== JSON.stringify(value);
}
