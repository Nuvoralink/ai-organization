/**
 * Proves: Phase 1a `assurance doctor` reports the Semgrep runtime and a concrete remedy when it is
 *         absent (D-P1-7 — Semgrep-via-Docker is a provisioned initialization dependency).
 * Test type: unit
 * Surface: lib/doctor.mjs
 * Given a detected runtime the check is ok with no remedy; given none it is not ok and names the
 * `docker pull` remedy — so a new machine's init can fail closed with actionable guidance.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { checkSemgrep, runDoctor } from '../lib/doctor.mjs';

test('doctor: semgrep check is ok when a runtime is detected', () => {
  const check = checkSemgrep({ detect: () => 'docker' });
  assert.equal(check.ok, true);
  assert.equal(check.runtime, 'docker');
  assert.equal(check.remedy, null);
  assert.equal(runDoctor({ detect: () => 'native' }).ok, true);
});

test('doctor: semgrep check fails with a remedy when no runtime is present', () => {
  const check = checkSemgrep({ detect: () => null });
  assert.equal(check.ok, false);
  assert.equal(check.runtime, null);
  assert.match(check.remedy, /docker pull semgrep\/semgrep/u);
  const doctor = runDoctor({ detect: () => null });
  assert.equal(doctor.ok, false);
  assert.equal(doctor.checks[0].ok, false);
});
