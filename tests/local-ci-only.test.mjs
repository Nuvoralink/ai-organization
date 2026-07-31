/**
 * Proves: ORG-LOCAL-CI-ONLY-001; Test type: retirement and executable-contract mutation;
 * Surface: repository merge gate; Authority: package.json local CI script;
 * Killer mutations: add a root GitHub Actions workflow, remove tracked-scope drift detection,
 * remove any required local CI lane, or restore a documented lane-skip escape hatch;
 * Gated command: npm run ci.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

test('Proves: GitHub-hosted workflows stay retired and local CI retains every control-plane lane', () => {
  const workflowsRoot = path.join(repoRoot, '.github', 'workflows');
  const hostedWorkflows = fs.existsSync(workflowsRoot)
    ? fs.readdirSync(workflowsRoot).filter((name) => /\.ya?ml$/u.test(name))
    : [];

  assert.deepEqual(hostedWorkflows, [], 'root GitHub Actions workflows would re-enable paid remote execution');

  const localCi = packageJson.scripts?.ci;
  assert.equal(typeof localCi, 'string', 'package.json must expose one portable local CI command');
  for (const requiredLane of [
    'npm test',
    'npm run control:scope:check',
    'npm run control:validate',
    'npm run overlay:validate:auxara',
    'npm run overlay:validate:coachai',
  ]) {
    assert.ok(localCi.includes(requiredLane), `local CI omitted ${requiredLane}`);
  }

  const auxaraEngineeringRule = fs.readFileSync(
    path.join(
      repoRoot,
      'overlays',
      'auxara-dialer',
      'project-files',
      '.claude',
      'rules',
      'auxara-dialer-engineering-rules.md',
    ),
    'utf8',
  );
  assert.doesNotMatch(
    auxaraEngineeringRule,
    /--skip-docker/u,
    'generated Auxara doctrine must not advertise a retired partial-CI option',
  );
  assert.match(
    auxaraEngineeringRule,
    /ci` command exposes no lane-skip option/u,
    'generated Auxara doctrine must explicitly preserve the indivisible merge gate',
  );
});
