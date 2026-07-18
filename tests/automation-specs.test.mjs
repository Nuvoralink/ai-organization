import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAutomationSpecs } from '../scripts/lib/control-plane.mjs';

function fixtures() {
  return {
    registry: {
      automations: [{ id: 'universal-biweekly-orchestration-backflow', rrule: 'FREQ=WEEKLY;INTERVAL=2', prompt: 'compare both project overlays against canonical truth', mode: 'read-only' }],
      forbiddenActions: ['edit', 'merge', 'deploy', 'production mutation', 'external message']
    },
    projects: {
      'auxara-dialer': {
        updateExistingExactName: true,
        verifyAfterWrite: true,
        createAtBootstrap: [
          { id: 'auxara-daily-orchestration-drift', rrule: 'daily', prompt: 'inspect drift', mode: 'read-only', targetRoot: '${PROJECT:auxara-dialer}' },
          { id: 'auxara-weekly-fleet-doctrine-review', rrule: 'weekly', prompt: 'inspect doctrine', mode: 'read-only', targetRoot: '${PROJECT:auxara-dialer}' }
        ]
      },
      coachai: {
        updateExistingExactName: true,
        verifyAfterWrite: true,
        createAtBootstrap: [
          { id: 'coachai-daily-orchestration-drift', rrule: 'daily', prompt: 'inspect drift', mode: 'read-only', targetRoot: '${PROJECT:coachai}' },
          { id: 'coachai-weekly-fleet-doctrine-review', rrule: 'weekly', prompt: 'inspect doctrine', mode: 'read-only', targetRoot: '${PROJECT:coachai}' }
        ]
      }
    }
  };
}

test('Proves: ORG-AUTO-001; Test type: lifecycle mutation; Surface: clean-machine bootstrap; Authority: automation registry; Killer mutation: omit a project automation or its prompt; Gated command: npm test', () => {
  const f = fixtures();
  assert.deepEqual(validateAutomationSpecs(f.registry, f.projects), []);
  f.projects.coachai.createAtBootstrap.pop();
  f.projects['auxara-dialer'].createAtBootstrap[0].prompt = '';
  const problems = validateAutomationSpecs(f.registry, f.projects);
  assert.ok(problems.some((problem) => problem.includes('coachai bootstrap automation is missing')));
  assert.ok(problems.some((problem) => problem.includes('auxara-dialer automation is not reconstructable')));
});
