import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function tempFixture(prefix = 'coachai-org-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function copyRel(sourceRoot, targetRoot, rel) {
  const source = path.join(sourceRoot, rel);
  const target = path.join(targetRoot, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function organizationFixture(sourceRoot) {
  const root = tempFixture();
  for (const rel of ['AGENTS.md', 'CLAUDE.md', '.ai-organization', '.claude/agents', '.claude/settings.json', '.cursor/rules', '.github', 'docs/app-plan/decision-log.md', 'docs/app-plan/adr', 'package.json', 'scripts/check-agent-context.mjs', 'scripts/check-rules-wiring.mjs', 'scripts/check-agent-control-plane.mjs', 'scripts/check-fleet-parity.mjs', 'scripts/check-overlay-parity.mjs', 'scripts/task-governor.mjs', 'scripts/claude-lifecycle-hook.mjs', 'scripts/run-risk-selected-proof.mjs', 'scripts/claude-posttooluse-gate.mjs', 'scripts/ci-local.mjs', 'scripts/check-test-intent.mjs', 'scripts/check-doc-code-drift.mjs', 'scripts/tests']) {
    copyRel(sourceRoot, root, rel);
  }
  return root;
}
