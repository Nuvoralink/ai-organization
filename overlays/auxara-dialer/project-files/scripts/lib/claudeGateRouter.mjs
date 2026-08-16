import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GATE_OUTPUT_LIMIT = 3_000;
const TOTAL_FAILURE_OUTPUT_LIMIT = 12_000;
// Hook handlers inherit Claude's current shell directory, which may be `backend/`, `frontend/`, or
// another subdirectory. Gate scripts are root-workspace npm commands, so derive their cwd from this
// module's own stable repository location rather than the caller's mutable process.cwd().
const DEFAULT_GATE_CWD = fileURLToPath(new URL('../..', import.meta.url));

export const GATE_ORDER = Object.freeze([
  'gate:rules-wiring',
  'gate:rule-test-citations',
  'gate:agent-context',
  'gate:agent-control-plane',
  'gate:organization-overlay',
  'gate:task-assurance',
  'gate:decision-sprint-linkage',
  'gate:project-ledger-drift',
  'check:ui-guardrails',
  'check:layout',
  'check:ui-source-of-truth',
  'gate:authority-placeholders',
  'check:call-drop-gate',
  'check:ui-testid',
  'gate:test-intent',
  'gate:doc-registry-refs',
  'gate:endpoint-wiring',
  'gate:page-reachability',
  'gate:delivery-lifecycle',
  'gate:provider-doc-evidence',
]);

export function normalizeGatePath(filePath) {
  const normalized = String(filePath ?? '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  return normalized ? `/${normalized}` : '';
}

export function gatesForFile(filePath) {
  const p = normalizeGatePath(filePath);
  if (!p) return [];

  const gates = new Set();
  if (
    /\/(?:AGENTS|CLAUDE)\.md$/.test(p) ||
    /\/\.claude\/rules\/.*\.md$/.test(p) ||
    /\/\.claude\/agents\/.*\.md$/.test(p) ||
    /\/scripts\/check-(?:rules-wiring|agent-context-budget)\.mjs$/.test(p)
  ) {
    gates.add('gate:rules-wiring');
    gates.add('gate:agent-context');
  }
  if (
    /\/\.claude\/rules\/testing-guardrails\.md$/.test(p) ||
    /\/scripts\/check-rule-test-citations\.mjs$/.test(p) ||
    /\/backend\/src\/__tests__\/rule-test-citations-gate\.test\.ts$/.test(p)
  ) {
    gates.add('gate:rule-test-citations');
  }
  if (
    /\/\.github\/ISSUE_TEMPLATE\/agent-slice\.yml$/.test(p) ||
    /\/\.github\/PULL_REQUEST_TEMPLATE\.md$/.test(p) ||
    /\/\.claude\/settings\.json$/.test(p) ||
    /\/\.claude\/agents\/.*\.md$/.test(p) ||
    /\/\.claude\/workflows\/orchestration-drift-audit\.js$/.test(p) ||
    /\/\.claude\/loop\.md$/.test(p) ||
    /\/docs\/agent-prompts\/goal-templates\.md$/.test(p) ||
    /\/docs\/agent-prompts\/orchestration-playbook\.md$/.test(p) ||
    /\/scripts\/check-agent-control-plane\.mjs$/.test(p)
  ) {
    gates.add('gate:agent-control-plane');
  }
  if (/\/\.ai-organization\//.test(p) || /\/scripts\/check-organization-overlay\.mjs$/.test(p)) {
    gates.add('gate:agent-control-plane');
    gates.add('gate:organization-overlay');
    gates.add('gate:task-assurance');
  }
  if (
    /\/docs\/app-plan\/auditability\/decision-log\.md$/.test(p) ||
    /\/docs\/app-plan\/implementation\/sprints\/sprint-[^/]+\.md$/.test(p) ||
    /\/scripts\/check-decision-sprint-linkage\.mjs$/.test(p)
  ) {
    gates.add('gate:decision-sprint-linkage');
  }
  if (
    /\/docs\/app-plan\/auditability\/decision-log\.md$/.test(p) ||
    /\/docs\/app-plan\/implementation\/sprints\/sprint-[^/]+\.md$/.test(p) ||
    /\/docs\/app-plan\/implementation\/project-ledgers\/.*\.project-ledger\.json$/.test(p) ||
    /\/scripts\/check-project-ledger-drift\.test\.mjs$/.test(p) ||
    /\/scripts\/(?:check-decision-sprint-linkage|check-project-ledger-drift|audit-project-ledger-live)\.mjs$/.test(
      p,
    ) ||
    /\/scripts\/lib\/(?:project-ledger-contract|claudeGateRouter)\.mjs$/.test(p)
  ) {
    gates.add('gate:project-ledger-drift');
  }
  if (/\/frontend\/src\//.test(p)) {
    gates.add('check:ui-guardrails');
    gates.add('check:layout');
    gates.add('check:ui-source-of-truth');
    gates.add('gate:authority-placeholders');
  }
  if (/\/frontend\/src\/(pages|components)\//.test(p)) gates.add('check:call-drop-gate');
  if (
    /\/(?:AGENTS|CLAUDE)\.md$/.test(p) ||
    /\/\.claude\/(?:rules|agents)\//.test(p) ||
    /\/\.ai-organization\/(?:policies|schemas)\/delivery-lifecycle\.v1\.(?:json|schema\.json)$/.test(p) ||
    /\/\.github\/(?:PULL_REQUEST_TEMPLATE\.md|ISSUE_TEMPLATE\/agent-slice\.yml)$/.test(p) ||
    /\/docs\/agent-prompts\/orchestration-playbook\.md$/.test(p) ||
    /\/scripts\/check-delivery-lifecycle(?:\.test)?\.mjs$/.test(p)
  ) {
    gates.add('gate:delivery-lifecycle');
  }
  if (
    /\/(?:backend|shared)\/src\//.test(p) ||
    /\/docs\/app-plan\/auditability\/provider-proof\/change-evidence\.json$/.test(p) ||
    /\/scripts\/check-provider-doc-evidence(?:\.test)?\.mjs$/.test(p)
  ) {
    gates.add('gate:provider-doc-evidence');
  }
  if (/\/frontend\/src\/components\/ui\//.test(p)) gates.add('check:ui-testid');
  if (/\.(test|spec)\.(ts|tsx|mts|mjs)$/.test(p) || /Regression[^/]*\.(ts|mjs)$/.test(p)) {
    gates.add('gate:test-intent');
  }
  if (/\/shared\/src\/copy\//.test(p) || /\/(docs|frontend\/docs)\/.*\.md$/.test(p)) {
    gates.add('gate:doc-registry-refs');
  }
  if (
    /\/shared\/src\/contracts\/endpoints\.ts$/.test(p) ||
    /\/frontend\/src\/lib\/api\.ts$/.test(p)
  ) {
    gates.add('gate:endpoint-wiring');
  }
  // Page reachability is decided by exactly three inputs: the two route authorities and the page tree
  // itself. Routing it here is what makes it bite at EDIT time — the moment a new page file appears is
  // the moment it is cheapest to route, and the moment the author still remembers where it belongs.
  if (
    /\/frontend\/src\/App\.tsx$/.test(p) ||
    /\/frontend\/src\/app\/pageRegistry\.tsx$/.test(p) ||
    /\/frontend\/src\/pages\//.test(p) ||
    /\/scripts\/check-page-reachability\.mjs$/.test(p)
  ) {
    gates.add('gate:page-reachability');
  }

  return GATE_ORDER.filter((gate) => gates.has(gate));
}

export function gatesForFiles(filePaths) {
  const selected = new Set();
  for (const filePath of filePaths) {
    for (const gate of gatesForFile(filePath)) selected.add(gate);
  }
  return GATE_ORDER.filter((gate) => selected.has(gate));
}

const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const completionPolicy = JSON.parse(
  fs.readFileSync(path.join(moduleRoot, '.ai-organization', 'completion-profiles.json'), 'utf8'),
);

export function completionProfilesForFile(filePath) {
  const p = normalizeGatePath(filePath);
  if (!p) return [];
  const profiles = new Set();
  if (
    /\/(?:AGENTS|CLAUDE)\.md$/.test(p) ||
    /\/\.claude\//.test(p) ||
    /\/\.github\//.test(p) ||
    /\/\.ai-organization\//.test(p) ||
    /\/scripts\/(?:check-|lib\/|claude-)/.test(p) ||
    /\/package(?:-lock)?\.json$/.test(p)
  ) {
    profiles.add('control');
  }
  if (/\/backend\//.test(p)) profiles.add('backend');
  if (/\/backend\/prisma\//.test(p)) profiles.add('database');
  if (/\/frontend\//.test(p)) profiles.add('frontend');
  if (/\/shared\//.test(p)) profiles.add('shared');
  if (/\/docs\//.test(p)) profiles.add('docs');
  if (profiles.size === 0) profiles.add('project');
  return [...profiles];
}

export function completionProofForFiles(filePaths) {
  const profiles = new Set();
  for (const filePath of filePaths) {
    for (const profile of completionProfilesForFile(filePath)) profiles.add(profile);
  }
  if (profiles.size === 0) profiles.add('project');
  const commands = new Set();
  for (const profile of profiles) {
    const configured = completionPolicy?.profiles?.[profile]?.commands;
    if (!Array.isArray(configured) || configured.length === 0) {
      throw new Error(`Completion proof profile ${profile} has no commands.`);
    }
    for (const command of configured) commands.add(command);
  }
  const orderedCommands = [...commands];
  const prioritizedCommands = ['prisma:generate', 'format:check'];
  for (const command of prioritizedCommands.toReversed()) {
    const commandIndex = orderedCommands.indexOf(command);
    if (commandIndex >= 0) {
      orderedCommands.splice(commandIndex, 1);
      orderedCommands.unshift(command);
    }
  }
  return { profiles: [...profiles].sort(), commands: orderedCommands };
}

function outputText(value) {
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  return '';
}

function tail(value, maxLength = GATE_OUTPUT_LIMIT) {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}

export function runGatesForFiles(
  filePaths,
  {
    cwd = DEFAULT_GATE_CWD,
    env = process.env,
    timeoutMs = 90_000,
    outputLimit = GATE_OUTPUT_LIMIT,
    totalOutputLimit = TOTAL_FAILURE_OUTPUT_LIMIT,
  } = {},
) {
  const gates = gatesForFiles(filePaths);
  const failures = [];
  /**
   * Gates that COULD NOT RUN — a spawn error, a timeout, a missing executable. Kept separate from
   * `failures` because they are a different claim: "the gate did not produce a verdict", not "the
   * gate produced a failing verdict". `spawnSync` reports both through the same result shape, which
   * is exactly how they got conflated.
   */
  const unrunnable = [];
  let remainingOutput = totalOutputLimit;

  for (const gate of gates) {
    const executable = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
    const args =
      process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', 'run', gate] : ['run', gate];
    const result = spawnSync(executable, args, {
      cwd,
      encoding: 'utf8',
      env: { ...env, CALL_DROP_GATE_STRICT: '1' },
      timeout: timeoutMs,
      windowsHide: true,
    });

    if (result.status === 0 && !result.error) continue;

    const rawOutput = `${outputText(result.stdout)}${outputText(result.stderr)}${
      result.error ? `\n${result.error.message}` : ''
    }`;
    const bounded = tail(rawOutput, Math.min(outputLimit, Math.max(remainingOutput, 0)));
    remainingOutput = Math.max(remainingOutput - bounded.length, 0);

    // A gate that COULD NOT RUN is not a gate that FAILED. Conflating them told two separate agents
    // on 2026-07-29 that `check:layout` had FAILED and to "fix the violation now" — when the real
    // cause was ETIMEDOUT under CPU contention from parallel agents. Running the gate directly
    // exited 0 both times. A hook that reports a violation which does not exist sends agents hunting
    // ghosts, and worse, teaches them to distrust the hook — at which point a REAL finding gets
    // waved through too.
    if (result.error) {
      unrunnable.push({
        gate,
        reason: result.error.code ?? result.error.message,
        output: bounded,
      });
      continue;
    }
    failures.push({ gate, status: result.status, output: bounded });
  }

  return {
    gates,
    failures,
    unrunnable,
    passedCount: gates.length - failures.length - unrunnable.length,
  };
}

export function runCompletionProofForFiles(filePaths, options = {}) {
  const proof = completionProofForFiles(filePaths);
  const result = runNamedCommands(proof.commands, options);
  return { ...result, profiles: proof.profiles };
}

export function runNamedCommands(
  commands,
  {
    cwd = process.cwd(),
    env = process.env,
    timeoutMs = 120_000,
    outputLimit = GATE_OUTPUT_LIMIT,
    totalOutputLimit = TOTAL_FAILURE_OUTPUT_LIMIT,
    stopOnFailure = false,
  } = {},
) {
  const failures = [];
  let executedCount = 0;
  let remainingOutput = totalOutputLimit;
  for (const gate of commands) {
    executedCount += 1;
    const executable = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
    const args =
      process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', 'run', gate] : ['run', gate];
    const result = spawnSync(executable, args, {
      cwd,
      encoding: 'utf8',
      env: { ...env, CALL_DROP_GATE_STRICT: '1' },
      timeout: timeoutMs,
      windowsHide: true,
    });
    if (result.status === 0 && !result.error) continue;
    const rawOutput = `${outputText(result.stdout)}${outputText(result.stderr)}${
      result.error ? `\n${result.error.message}` : ''
    }`;
    const bounded = tail(rawOutput, Math.min(outputLimit, Math.max(remainingOutput, 0)));
    remainingOutput = Math.max(remainingOutput - bounded.length, 0);
    failures.push({ gate, status: result.status, output: bounded });
    if (stopOnFailure) break;
  }
  return {
    gates: commands,
    failures,
    passedCount: executedCount - failures.length,
    skippedCount: commands.length - executedCount,
  };
}
