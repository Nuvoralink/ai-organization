import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAutomationSpecs } from '../scripts/lib/control-plane.mjs';

function fixtures() {
  return {
    registry: {
      automations: [
        { id: 'universal-biweekly-orchestration-backflow', rrule: 'FREQ=WEEKLY;INTERVAL=2', prompt: 'compare both project overlays against canonical truth', mode: 'read-only' },
        {
          id: 'universal-weekday-control-plane-drift-alarm',
          rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
          prompt: 'run scripts/control-check-notify.mjs',
          mode: 'read-only',
          activation: 'recommend-only',
          targetRoot: '${PROJECT:control-plane}'
        }
      ],
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
      },
      'nuvora-link': {
        updateExistingExactName: true,
        verifyAfterWrite: true,
        createAtBootstrap: [
          { id: 'nuvora-link-daily-orchestration-drift', rrule: 'daily', prompt: 'inspect drift', mode: 'read-only', targetRoot: '${PROJECT:nuvora-link}' },
          { id: 'nuvora-link-weekly-fleet-doctrine-review', rrule: 'weekly', prompt: 'inspect doctrine', mode: 'read-only', targetRoot: '${PROJECT:nuvora-link}' }
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

test('Proves: ORG-AUTO-002; Test type: schedule/action-boundary mutation; Surface: universal control-plane drift alarm; Authority: automation registry; Killer mutation: enable it, broaden beyond weekdays, change its root, or bypass the checked-in notifier; Gated command: npm test', () => {
  const f = fixtures();
  const alarm = f.registry.automations.find((automation) => automation.id === 'universal-weekday-control-plane-drift-alarm');
  alarm.activation = 'enabled';
  alarm.rrule = 'FREQ=DAILY';
  alarm.targetRoot = '${HOME}';
  alarm.prompt = 'run something else';
  assert.ok(validateAutomationSpecs(f.registry, f.projects)
    .some((problem) => problem.includes('must be weekday, reconstructable, read-only, and recommend-only')));
});
