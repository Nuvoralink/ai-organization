/**
 * `assurance doctor` — verifies the machine can run the pipeline's external dependencies. Phase 1a's
 * only hard dependency is a Semgrep runtime: a native `semgrep` binary OR the `semgrep/semgrep`
 * Docker image (plan decision D-P1-7). This is the check machine initialization runs
 * (docs/new-machine-bootstrap.md) so a host that will run scans provisions Semgrep automatically —
 * never a manual per-machine step. It performs no scan and spends nothing.
 */
import { detectSemgrepRuntime } from './adapters/static/semgrep.mjs';

export function checkSemgrep({ detect = detectSemgrepRuntime } = {}) {
  const runtime = detect(); // 'native' | 'docker' | null
  return {
    name: 'semgrep',
    runtime,
    ok: runtime !== null,
    remedy:
      runtime !== null
        ? null
        : 'No Semgrep runtime. Provision the Docker image: `docker pull semgrep/semgrep` (or install a native `semgrep`). See docs/new-machine-bootstrap.md.',
  };
}

export function runDoctor(deps = {}) {
  const checks = [checkSemgrep(deps)];
  return { ok: checks.every((check) => check.ok), checks };
}
