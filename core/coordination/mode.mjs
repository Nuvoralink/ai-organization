import fs from 'node:fs';
import path from 'node:path';

export const COORDINATION_MODES = Object.freeze(['off', 'observe', 'enforce']);
const COORDINATION_MODE_SET = new Set(COORDINATION_MODES);
const POLICY_RELATIVE_PATH = path.join('.ai-organization', 'policies', 'coordination-mode.v1.json');
const OFF_POLICY = Object.freeze({ mode: 'off', acceptNotReady: false });

export function coordinationPolicy(repoRoot = process.cwd()) {
  try {
    const policy = JSON.parse(
      fs.readFileSync(path.join(path.resolve(repoRoot), POLICY_RELATIVE_PATH), 'utf8'),
    );
    if (!COORDINATION_MODE_SET.has(policy?.mode)) return { ...OFF_POLICY };
    return {
      mode: policy.mode,
      acceptNotReady: policy.mode === 'enforce' && policy.acceptNotReady === true,
    };
  } catch {
    // Missing or unreadable policy must never activate live dispatch instrumentation.
    return { ...OFF_POLICY };
  }
}

export function coordinationMode(repoRoot = process.cwd()) {
  return coordinationPolicy(repoRoot).mode;
}
