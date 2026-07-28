import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  loadOverlay,
  parseProjectOverlayArgs,
  runProjectOverlayCli,
  validateOverlay,
  validateRunnerDeliveryContract,
} from '../scripts/project-overlay.mjs';
import { runCheck, runInstall } from '../scripts/lib/control-plane.mjs';
import { validatePortableOverlayLock } from '../scripts/project-overlay.mjs';
import { checkOverlayParity } from '../overlays/coachai/project-files/scripts/check-overlay-parity.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fixture(project = 'auxara-dialer') {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), `${project}-overlay-`));
  const root = path.join(base, 'project');
  const home = path.join(base, 'home');
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  const rootToken = project === 'coachai' ? 'PROJECT:coachai' : 'PROJECT:auxara-dialer';
  const roots = { [rootToken]: root, HOME: home };
  const { manifest } = loadOverlay(project, roots);
  return { root, roots, manifest };
}

test('Proves: ORG-OVERLAY-002 and OVERLAY-HYBRID-COMPAT-001 shared chokepoint; Test type: install/parity and reviewed-target mutation; Surface: project overlay; Authority: overlay manifest plus shared installer; Killer mutations: change or add a managed file, drop a reviewed digest/mapping, bypass target evolution in the overlay entrypoint, or accept a stale target digest; Gated command: npm test', () => {
  const { root, roots, manifest } = fixture();
  fs.writeFileSync(path.join(root, 'PRODUCT.md'), 'project owned\n');
  runInstall({ repoRoot, manifest, roots });
  assert.deepEqual(runCheck({ repoRoot, manifest, roots }), []);
  const runtimeLock = path.join(roots.HOME, '.nuvoralink-control-plane', 'project-locks', 'auxara-dialer', 'overlay-lock.json');
  assert.equal(fs.existsSync(runtimeLock), true);
  assert.equal(fs.readFileSync(runtimeLock, 'utf8').includes(path.resolve(root)), false);
  assert.equal(fs.existsSync(path.join(root, '.ai-organization', 'snapshots')), false);

  const managed = path.join(root, '.ai-organization', 'control-plane', 'project-profile.v1.json');
  fs.appendFileSync(managed, '\nchanged\n');
  assert.ok(runCheck({ repoRoot, manifest, roots }).some((finding) => finding.type === 'drift'));
  assert.throws(() => runInstall({ repoRoot, manifest, roots }), /Locally evolved managed target refused/u);

  const coachai = fixture('coachai');
  const output = [];
  const errors = [];
  const context = {
    rootsOverride: coachai.roots,
    stdout: (value) => output.push(value),
    stderr: (value) => errors.push(value),
  };
  const router = path.join(coachai.root, 'AGENTS.md');
  fs.writeFileSync(router, '# Reviewed pre-install authority\n');
  output.length = 0;
  assert.equal(
    runProjectOverlayCli(
      ['digest', 'coachai', '--mapping', 'coachai-project-agents-router'],
      context,
    ),
    0,
  );
  const reviewed = JSON.parse(output.at(-1));
  assert.match(reviewed.sha256, /^[a-f0-9]{64}$/u);
  output.length = 0;
  assert.equal(
    runProjectOverlayCli(
      [
        'install',
        'coachai',
        '--dry-run',
        '--mapping',
        'coachai-project-agents-router',
        '--reconcile-installed',
        `coachai-project-agents-router:${reviewed.sha256}`,
      ],
      context,
    ),
    0,
    errors.join('\n'),
  );
  assert.ok(output.some((line) => line.startsWith('reconcile-update\tcoachai-project-agents-router\t.')));
  assert.match(fs.readFileSync(router, 'utf8'), /Reviewed pre-install authority/u, 'reviewed dry-run must not write');
  output.length = 0;
  errors.length = 0;
  assert.equal(
    runProjectOverlayCli(
      [
        'install',
        'coachai',
        '--mapping',
        'coachai-project-agents-router',
        '--reconcile-installed',
        `coachai-project-agents-router:${reviewed.sha256}`,
      ],
      context,
    ),
    0,
    errors.join('\n'),
  );
  const canonicalRouter = fs.readFileSync(router, 'utf8');
  fs.writeFileSync(router, `${canonicalRouter}\nreviewed local divergence\n`);
  output.length = 0;
  errors.length = 0;
  assert.equal(
    runProjectOverlayCli(
      [
        'install',
        'coachai',
        '--root',
        coachai.root,
        '--mapping',
        'coachai-project-agents-router',
        '--adopt-existing',
      ],
      context,
    ),
    1,
  );
  const refusal = errors.join('\n');
  const currentDigest = /current-target-sha256=([a-f0-9]{64})/u.exec(refusal)?.[1];
  assert.match(currentDigest ?? '', /^[a-f0-9]{64}$/u, refusal);
  assert.ok(
    refusal.includes(
      `Exact reconciliation command: node scripts/project-overlay.mjs install coachai --root '${coachai.root}' --mapping coachai-project-agents-router --reconcile-target coachai-project-agents-router:${currentDigest}`,
    ),
    refusal,
  );
  assert.match(fs.readFileSync(router, 'utf8'), /reviewed local divergence/u);
  output.length = 0;
  errors.length = 0;
  assert.equal(
    runProjectOverlayCli(
      [
        'install',
        'coachai',
        '--root',
        coachai.root,
        '--dry-run',
        '--mapping',
        'coachai-project-agents-router',
        '--reconcile-target',
        `coachai-project-agents-router:${currentDigest}`,
      ],
      context,
    ),
    0,
    errors.join('\n'),
  );
  assert.ok(output.some((line) =>
    line.includes(`reconcile-target-update\tcoachai-project-agents-router\t.\treviewed-target-sha256=${currentDigest}`)));
  assert.match(fs.readFileSync(router, 'utf8'), /reviewed local divergence/u, 'reviewed target dry-run must not write');
  assert.throws(
    () =>
      parseProjectOverlayArgs([
        'install',
        'coachai',
        '--root',
        coachai.root,
        '--root',
        coachai.root,
      ]),
    /Duplicate --root/u,
  );
});

test('Proves: ORG-OVERLAY-003; Test type: ownership counterexample; Surface: project-owned files; Authority: overlay ownership; Killer mutation: treat PRODUCT.md as generated; Gated command: npm test', () => {
  const { root, roots, manifest } = fixture('coachai');
  fs.writeFileSync(path.join(root, 'PRODUCT.md'), 'project owned\n');
  runInstall({ repoRoot, manifest, roots });
  fs.writeFileSync(path.join(root, 'PRODUCT.md'), 'project changed independently\n');
  assert.deepEqual(runCheck({ repoRoot, manifest, roots }), []);
});

test('Proves: ORG-OVERLAY-004; Test type: registry mutation; Surface: overlay ownership; Authority: ownership.v1.json; Killer mutation: omit an installable mapping owner; Gated command: npm test', () => {
  assert.deepEqual(validateOverlay('auxara-dialer').map((failure) => failure.message ?? failure), []);
  assert.deepEqual(validateOverlay('coachai').map((failure) => failure.message ?? failure), []);
});

test('Proves: REQ-COACHAI-AUTHORITY-DOMAINS-001; Test type: parser and overlay-registration mutation; Surface: installed CoachAI semantic resource folding; Authority: CoachAI authority-domain registry plus generated overlay ownership; Killer mutation: empty any domain owns array or remove the generated mapping; Gated command: npm test', () => {
  const registryPath = path.join(
    repoRoot,
    'overlays',
    'coachai',
    'project-files',
    '.ai-organization',
    'policies',
    'authority-domains.v1.json',
  );
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  assert.equal(registry.version, 1);
  const domainEntries = Object.entries(registry.domains ?? {});
  assert.ok(domainEntries.length >= 4 && domainEntries.length <= 6);
  for (const [domain, definition] of domainEntries) {
    assert.ok(
      Array.isArray(definition?.owns) && definition.owns.length >= 1,
      `${domain} must own at least one path`,
    );
  }

  const { manifest } = loadOverlay('coachai');
  const mapping = manifest.mappings.find(
    ({ id }) => id === 'coachai-project-authority-domains',
  );
  assert.ok(mapping, 'CoachAI authority domains must be registered as an overlay mapping');
  assert.equal(
    mapping.source,
    'overlays/coachai/project-files/.ai-organization/policies/authority-domains.v1.json',
  );
  assert.deepEqual(mapping.destinations, [
    '${PROJECT:coachai}/.ai-organization/policies/authority-domains.v1.json',
  ]);
});

test('Proves: COORDINATION-RUNNER-DELIVERY-001; Test type: missing-mapping mutation; Surface: bootstrap project overlay and installed CoachAI organization parity; Authority: bounded runner ownership contract; Killer mutation: remove the runner mapping from an overlay copy; Gated command: npm test', () => {
  for (const project of ['auxara-dialer', 'coachai']) {
    const ownership = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'overlays', project, 'ownership.v1.json'), 'utf8'),
    );
    assert.deepEqual(validateRunnerDeliveryContract(project, ownership), []);
    const mutated = structuredClone(ownership);
    mutated.assets = mutated.assets.filter(
      (row) => row.destination !== 'scripts/run-bounded-agent.mjs',
    );
    assert.match(
      validateRunnerDeliveryContract(project, mutated).join('\n'),
      /Bounded runner delivery mapping is missing/u,
      `${project} must reject an overlay copy with no runner mapping`,
    );
  }

  const coachai = fixture('coachai');
  const mutatedManifest = structuredClone(coachai.manifest);
  mutatedManifest.mappings = mutatedManifest.mappings.filter(
    (mapping) => mapping.id !== 'coachai-project-bounded-runner',
  );
  const ownership = JSON.parse(
    fs.readFileSync(
      path.join(
        repoRoot,
        'overlays',
        'coachai',
        'project-files',
        '.ai-organization',
        'ownership.json',
      ),
      'utf8',
    ),
  );
  const packageJson = { scripts: {} };
  for (const dotted of ownership.managed_json_sections['package.json']) {
    packageJson.scripts[dotted.slice('scripts.'.length)] = `fixture:${dotted}`;
  }
  fs.writeFileSync(path.join(coachai.root, 'package.json'), `${JSON.stringify(packageJson)}\n`);
  runInstall({ repoRoot, manifest: mutatedManifest, roots: coachai.roots });
  const installedParity = checkOverlayParity(coachai.root);
  assert.equal(installedParity.ok, false);
  assert.match(
    installedParity.errors.join('\n'),
    /managed file missing: scripts\/run-bounded-agent\.mjs/u,
    'the installed organization gate must name the managed runner omitted by the mutated overlay',
  );
});

test('Proves: CONTROL-PLANE-LIFECYCLE-OVERLAY-DRIFT-001; Test type: scoped overlay install; Surface: installed lifecycle README in both declared projects; Authority: shared-runtime mappings; Killer mutation: exclude core/lifecycle/README.md from either shared-runtime delivery; Gated command: npm test', () => {
  const canonicalReadme = fs.readFileSync(
    path.join(repoRoot, 'core', 'lifecycle', 'README.md'),
    'utf8',
  );
  for (const project of ['auxara-dialer', 'coachai']) {
    const target = fixture(project);
    runInstall({
      repoRoot,
      manifest: target.manifest,
      roots: target.roots,
      mappingIds: [`${project === 'coachai' ? 'coachai' : 'auxara'}-shared-runtime`],
    });
    assert.equal(
      fs.readFileSync(
        path.join(
          target.root,
          '.ai-organization',
          'runtime',
          'core',
          'lifecycle',
          'README.md',
        ),
        'utf8',
      ),
      canonicalReadme,
      `${project} shared-runtime mapping must deliver the canonical lifecycle README`,
    );
  }
});

test('Proves: portable overlay locks can contain only normalized paths and SHA-256 integrity hashes without secret-shaped path/hash pairs on one line; Test type: secret-boundary mutation; Surface: project overlay lock; Authority: portable lock schema; Killer mutation: restore a path-keyed hash map or hide a generic API key in a lock entry; Gated command: npm test', () => {
  const valid = { version: 1, source: 'universal-private-orchestrator/overlays/coachai', files: [{ path: 'AGENTS.md', sha256: 'a'.repeat(64) }], json_sections: {} };
  assert.deepEqual(validatePortableOverlayLock(valid), []);
  const unsafe = structuredClone(valid);
  unsafe.files.push({ path: '../generic_api_key', sha256: 'not-a-sha256-secret-value' });
  const failures = validatePortableOverlayLock(unsafe).join('\n');
  assert.match(failures, /non-portable path/u);
  assert.match(failures, /non-SHA-256/u);
  assert.match(validatePortableOverlayLock({ ...valid, files: { 'AGENTS.md': 'a'.repeat(64) } }).join('\n'), /files must be an array/u);
});
