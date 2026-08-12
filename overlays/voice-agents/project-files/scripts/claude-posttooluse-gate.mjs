// Voice Agent Platform PostToolUse hook — routes edited authorities to their fast doctrine gates.
//
// Wired from .claude/settings.json. Receives the tool-call JSON on stdin; routes the edited file to the matching gate(s).
// Exit 2 feeds the gate failure back to the agent so it must fix the violation before moving on ("wire the gate, not the rule").
//
// ⚠ WARN-TIER GATES ARE SWALLOWED BY THIS SHAPE (caught 2026-07-03, dialer PR #176): the success path
// discards the piped output — a gate that flags with exit 0 (WARN-only) prints to a pipe nobody reads,
// so its "edit-time visibility" is theater. For each WARN-tier gate routed through this hook, give the
// gate a STRICT env/--strict mode (exit 1 on a flag; WARN-only stays for gates:all/CI) and set that env
// here (see the `env:` below) — the catch branch then feeds the flags back to the agent. Keep the
// scanned tree at 0 warnings so strict never nags on pre-existing debt.
import { readFileSync, realpathSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isTestFile } from './lib/test-file-match.mjs';

function pathKey(value) {
  const normalized = path.resolve(value);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function configuredProjectRoot() {
  const scriptRoot = realpathSync.native(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  );
  const configured = String(process.env.CLAUDE_PROJECT_DIR ?? '').trim();
  if (!configured) return scriptRoot;
  const configuredRoot = realpathSync.native(path.resolve(configured));
  if (pathKey(configuredRoot) !== pathKey(scriptRoot)) {
    throw new Error('CLAUDE_PROJECT_DIR does not match the repository root containing this hook');
  }
  return configuredRoot;
}

function blockInvalidPayload(message) {
  console.error(`[gate-hook] ${message}`);
  process.exit(2);
}

let projectRoot;
let payload;
try {
  projectRoot = configuredProjectRoot();
  payload = JSON.parse(readFileSync(0, 'utf8'));
} catch (error) {
  blockInvalidPayload(`malformed or unrooted PostToolUse payload: ${error.message}`);
}
if (!['Edit', 'Write'].includes(payload?.tool_name)) process.exit(0);
const filePath = payload?.tool_input?.file_path;
if (typeof filePath !== 'string' || filePath.trim().length === 0) {
  blockInvalidPayload('invalid Edit/Write PostToolUse payload: tool_input.file_path is required');
}

const p = filePath.replace(/\\/g, '/');
const gates = [];

// Test-file edits → the test-intent gate (INVARIANT — every project has this):
if (isTestFile(p)) gates.push('gate:test-intent');
// Rule / entry-doc edits → wiring + startup-context budgets (INVARIANT):
if (/\/\.claude\/rules\/[^/]+\.md$/.test(p) || /\/(CLAUDE|AGENTS)\.md$/.test(p))
  gates.push('gate:rules-wiring', 'gate:agent-context');
// Fleet authorities / charters / projection / executable gate → effective-fleet parity (INVARIANT).
// The authored authority is the universal registry plus project extension; roles.json is a checked projection.
if (
  /\/\.ai-organization\/registries\/agent-roles(?:\.project)?\.v1\.json$/.test(p) ||
  /\/\.ai-organization\/schemas\/agent-role-(?:registry|project-extension)\.v1\.schema\.json$/.test(
    p,
  ) ||
  /\/\.ai-organization\/roles\.json$/.test(p) ||
  /\/\.ai-organization\/runtime\/core\/roles\/agent-role-registry\.mjs$/.test(p) ||
  /\/\.claude\/agents\/[^/]+\.md$/.test(p) ||
  /\/scripts\/check-fleet-parity\.mjs$/.test(p) ||
  /\/package\.json$/.test(p)
)
  gates.push('gate:fleet-parity');
if (
  /\/\.ai-organization\/(?:registries\/agent-roles(?:\.project)?\.v1\.json|roles\.json)$/.test(p) ||
  /\/scripts\/generate-agent-projections\.mjs$/.test(p)
)
  gates.push('gate:agent-projections');
// Durable permission/workflow artifacts → the agent-control-plane gate (INVARIANT). Keep the exact
// settings/playbook paths: otherwise a settings-only tool-permission regression or a playbook-only removal
// of the plan-mode boundary bypasses edit-time and TaskCompleted changed-file routing.
if (
  /\/\.github\/ISSUE_TEMPLATE\/agent-slice\.yml$/.test(p) ||
  /\/\.github\/pull_request_template\.md$/i.test(p) ||
  /\/\.claude\/settings\.json$/.test(p) ||
  /\/\.claude\/workflows\/orchestration-drift-audit\.js$/.test(p) ||
  /\/\.claude\/loop\.md$/.test(p) ||
  /\/docs\/agent-prompts\/(?:goal-templates|orchestration-playbook)\.md$/.test(p) ||
  /\/scripts\/(?:check-agent-control-plane|check-fleet-parity|claude-lifecycle-hook)\.mjs$/.test(
    p,
  ) ||
  /\/\.ai-organization\/(?:roles\.json|registries\/agent-roles(?:\.project)?\.v1\.json)$/.test(p) ||
  /\/\.ai-organization\/schemas\/agent-role-(?:registry|project-extension)\.v1\.schema\.json$/.test(
    p,
  ) ||
  /\/package\.json$/.test(p)
)
  gates.push('gate:agent-control-plane');
if (
  /\/\.ai-organization\/(?:runtime\/core|schemas|policies)\//.test(p) ||
  /\/\.ai-organization\/registries\/agent-roles\.v1\.json$/.test(p) ||
  /\/scripts\/(?:check-fleet-parity|check-control-plane-parity)\.mjs$/.test(p)
)
  gates.push('gate:control-plane-parity');
if (
  /\/packages\/(?:contracts|kernel|platform)\/src\//.test(p) ||
  /\/registries\/effect-release-bindings\.v1\.json$/.test(p) ||
  /\/scripts\/check-effect-release-bindings\.ts$/.test(p)
)
  gates.push('gate:effect-bindings');

if (gates.length === 0) process.exit(0);

let failed = false;
for (const gate of [...new Set(gates)]) {
  try {
    execSync(`npm run ${gate}`, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 90_000,
      env: { ...process.env },
    });
  } catch (err) {
    failed = true;
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`.slice(-3000);
    console.error(
      `[gate-hook] \`npm run ${gate}\` FAILED after editing ${p}.\n` +
        `Fix the violation now — do not proceed or work around the gate.\n${out}`,
    );
  }
}
process.exit(failed ? 2 : 0);
