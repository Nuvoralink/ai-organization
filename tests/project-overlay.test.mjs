import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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
import { discoverProjectOverlays, runCheck, runInstall } from '../scripts/lib/control-plane.mjs';
import { validatePortableOverlayLock } from '../scripts/project-overlay.mjs';
import { checkOverlayParity } from '../overlays/coachai/project-files/scripts/check-overlay-parity.mjs';
import { findLayeredAuthorityMarkers } from '../overlays/auxara-dialer/project-files/scripts/check-decision-sprint-linkage.mjs';
import { checkOverlayParity as checkNuvoraLinkOverlayParity } from '../overlays/nuvora-link/project-files/scripts/check-overlay-parity.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fixture(project = 'auxara-dialer') {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), `${project}-overlay-`));
  const root = path.join(base, 'project');
  const home = path.join(base, 'home');
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  const rootToken = `PROJECT:${project}`;
  const roots = { [rootToken]: root, HOME: home };
  const { manifest } = loadOverlay(project, roots);
  return { root, roots, manifest };
}

function runNpm(cwd, args) {
  const npmCli = process.env.npm_execpath
    ?? (process.platform === 'win32'
      ? path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
      : undefined);
  return npmCli
    ? spawnSync(process.execPath, [npmCli, ...args], { cwd, encoding: 'utf8', timeout: 60_000 })
    : spawnSync('npm', args, { cwd, encoding: 'utf8', timeout: 60_000 });
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
  const discovered = discoverProjectOverlays(repoRoot);
  assert.deepEqual(discovered, ['auxara-dialer', 'coachai', 'nuvora-link']);
  for (const project of discovered) {
    assert.deepEqual(validateOverlay(project).map((failure) => failure.message ?? failure), []);
  }
});

test('Proves: AUXARA-DLR-014-CONTROL-001; Test type: stale-doctrine mutation; Surface: managed Auxara auditor and rule overlay; Authority: passive three-state AMD decision; Killer mutation: restore the blanket AMD ban, omit one mode, or make premium active; Gated command: npm test and overlay:validate:auxara', () => {
  const overlayRoot = path.join(repoRoot, 'overlays', 'auxara-dialer', 'project-files', '.claude');
  const sources = [
    ['agents', 'compliance-auditor.md'],
    ['agents', 'doctrine-drift-auditor.md'],
    ['rules', 'auxara-dialer-project-rules.md'],
    ['rules', 'centralization-doctrine.md'],
    ['rules', 'sprint-rigor.md'],
  ].map((parts) => fs.readFileSync(path.join(overlayRoot, ...parts), 'utf8'));
  const combined = sources.join('\n');
  assert.match(combined, /exactly three states \(`off`, `standard`, `premium`\)/u);
  assert.match(combined, /Standard is active; premium is a retained dormant option/u);
  assert.match(combined, /AMD-to-bridge/u);
  assert.doesNotMatch(combined, /parallel\/predictive dialing, AMD, per-number/u);
});

test('Proves: AUXARA-AUTHORITY-REPLACE-001 and REC-002; Test type: stale-authority mutation; Surface: managed Auxara decision gate and retention rule; Authority: replace-dont-layer plus 30-day offboarding policy; Killer mutation: restore a dated addendum or cancellation-plus-90-days claim; Gated command: npm test and overlay:validate:auxara', (t) => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'auxara-current-authority-'));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixtureRoot, 'README.md'), '# Current authority\n\n## Addendum\n');
  const issues = findLayeredAuthorityMarkers(fixtureRoot);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].marker, 'heading');
  fs.writeFileSync(path.join(fixtureRoot, 'README.md'), '# Current authority\n');
  assert.deepEqual(findLayeredAuthorityMarkers(fixtureRoot), []);

  const rule = fs.readFileSync(
    path.join(
      repoRoot,
      'overlays',
      'auxara-dialer',
      'project-files',
      '.claude',
      'rules',
      'auxara-dialer-project-rules.md',
    ),
    'utf8',
  );
  assert.match(rule, /30-day read-only export\/reactivation window/u);
  assert.doesNotMatch(rule, /cancellation \+ 90 days/u);
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
  for (const project of ['auxara-dialer', 'coachai', 'nuvora-link']) {
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

test('Proves: CONTROL-PLANE-LIFECYCLE-OVERLAY-DRIFT-001 and VERDICT-RUNTIME-OVERLAY-001; Test type: scoped overlay install; Surface: installed lifecycle runtime/schema and review adapters in every declared project; Authority: shared-runtime and assurance-schema mappings; Killer mutation: exclude the current evidence schema/runtime, or restore reviewer-authored aggregate verdict forwarding in any adapter; Gated command: npm test', () => {
  const canonicalReadme = fs.readFileSync(
    path.join(repoRoot, 'core', 'lifecycle', 'README.md'),
    'utf8',
  );
  const canonicalEvidenceSchema = fs.readFileSync(
    path.join(repoRoot, 'schemas', 'task-evidence.v3.schema.json'),
    'utf8',
  );
  for (const project of ['auxara-dialer', 'coachai', 'nuvora-link']) {
    const target = fixture(project);
    const prefix = project === 'auxara-dialer' ? 'auxara' : project;
    runInstall({
      repoRoot,
      manifest: target.manifest,
      roots: target.roots,
      mappingIds: [`${prefix}-shared-runtime`, `${prefix}-assurance-schemas`],
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
    assert.equal(
      fs.readFileSync(
        path.join(target.root, '.ai-organization', 'schemas', 'task-evidence.v3.schema.json'),
        'utf8',
      ),
      canonicalEvidenceSchema,
      `${project} assurance mapping must deliver the current computed-verdict evidence schema`,
    );
    const hook = fs.readFileSync(
      path.join(repoRoot, 'overlays', project, 'project-files', 'scripts', 'claude-lifecycle-hook.mjs'),
      'utf8',
    );
    assert.match(hook, /criterionStatuses:\s*review(?:Report)?\.criteria/u);
    assert.doesNotMatch(hook, /verdict:\s*review(?:Report)?\.verdict/u);
  }
});

test('Proves: NUVORA-LINK-OVERLAY-001; Test type: installed-fixture parity and product-boundary mutation; Surface: Nuvora Link organization overlay; Authority: project profile, portable lock, and package script ownership; Killer mutations: describe generalized SaaS tenancy, drift a managed gate command, remove or corrupt task-evidence v3, omit a generated file, or remove a required intent header from a managed runtime test; Gated command: npm test', (t) => {
  const profile = JSON.parse(fs.readFileSync(path.join(repoRoot, 'overlays', 'nuvora-link', 'control-plane', 'project-profile.v1.json'), 'utf8'));
  assert.equal(profile.productDeploymentMode, 'single-company-internal');
  assert.match(profile.organizationScopePurpose, /not-saas-tenancy/u);
  assert.doesNotMatch(
    fs.readFileSync(path.join(repoRoot, 'overlays', 'nuvora-link', 'project-files', 'AGENTS.md'), 'utf8'),
    /multi-tenant|tenant onboarding is required|generalized SaaS infrastructure is required/iu,
  );

  const target = fixture('nuvora-link');
  t.after(() => fs.rmSync(path.dirname(target.root), { recursive: true, force: true }));
  const packageJson = {
    scripts: {
      'agent:run': 'node scripts/run-bounded-agent.mjs',
      'gate:rules-wiring': 'node scripts/check-rules-wiring.mjs',
      'gate:agent-context': 'node scripts/check-agent-context.mjs',
      'gate:agent-control-plane': 'node scripts/check-agent-control-plane.mjs',
      'gate:fleet-parity': 'node scripts/check-fleet-parity.mjs',
      'gate:overlay-parity': 'node scripts/check-overlay-parity.mjs',
      'gate:test-intent': 'node scripts/check-test-intent.mjs',
      'gate:test-workspace-coverage': 'node scripts/check-test-workspace-coverage.mjs',
      'gate:documentation-authority': 'node scripts/check-documentation-authority.mjs',
      'test:workspace-build-contracts': 'node --test scripts/check-workspace-build-contracts.test.mjs scripts/check-test-workspace-coverage.test.mjs scripts/clean-workspace-dist.test.mjs scripts/check-build-artifacts.test.mjs scripts/migrate-production.test.mjs scripts/check-documentation-authority.test.mjs',
      'test:all': 'npm run --workspaces --if-present test',
      'gates:all': 'npm run gate:rules-wiring && npm run gate:agent-context && npm run gate:agent-control-plane && npm run gate:fleet-parity && npm run gate:overlay-parity && npm run gate:test-intent && npm run gate:test-workspace-coverage && npm run gate:documentation-authority',
      verify: 'npm run test:workspace-build-contracts && npm run typecheck && npm run build && npm run test:all && npm run gates:all',
    },
  };
  fs.writeFileSync(path.join(target.root, 'package.json'), `${JSON.stringify(packageJson)}\n`);
  fs.mkdirSync(path.join(target.root, 'docs'), { recursive: true });
  fs.writeFileSync(
    path.join(target.root, 'docs', 'DOCUMENTATION_INDEX.md'),
    '# Documentation authority\n\n| Document | Owner | Status | Purpose |\n|---|---|---|---|\n| `docs/DOCUMENTATION_INDEX.md` | Product engineering | living | Registry fixture |\n',
  );
  assert.equal(spawnSync('git', ['init'], { cwd: target.root, encoding: 'utf8' }).status, 0);
  assert.equal(spawnSync('git', ['add', 'package.json', 'docs/DOCUMENTATION_INDEX.md'], { cwd: target.root, encoding: 'utf8' }).status, 0);
  runInstall({ repoRoot, manifest: target.manifest, roots: target.roots });
  assert.deepEqual(runCheck({ repoRoot, manifest: target.manifest, roots: target.roots }), []);
  const parity = checkNuvoraLinkOverlayParity(target.root);
  assert.equal(parity.ok, true, `fresh Nuvora overlay parity failed:\n${parity.errors.join('\n')}`);
  assert.deepEqual(parity.errors, []);
  const portableLock = JSON.parse(
    fs.readFileSync(path.join(target.root, '.ai-organization', 'overlay-lock.json'), 'utf8'),
  );
  assert.equal(parity.managedFileCount, portableLock.files.length);

  const installedGates = runNpm(target.root, ['run', 'gates:all']);
  assert.equal(
    installedGates.status,
    0,
    `fresh Nuvora install gates:all failed\nstdout:\n${installedGates.stdout}\nstderr:\n${installedGates.stderr}`,
  );

  const currentEvidenceSchema = path.join(
    target.root,
    '.ai-organization',
    'schemas',
    'task-evidence.v3.schema.json',
  );
  const currentEvidenceSchemaSource = fs.readFileSync(currentEvidenceSchema, 'utf8');
  fs.rmSync(currentEvidenceSchema);
  const missingEvidenceSchema = runNpm(target.root, ['run', 'gate:agent-control-plane']);
  assert.notEqual(missingEvidenceSchema.status, 0, 'missing task-evidence v3 must fail gate:agent-control-plane');
  assert.match(
    `${missingEvidenceSchema.stdout}\n${missingEvidenceSchema.stderr}`,
    /missing required control file: \.ai-organization\/schemas\/task-evidence\.v3\.schema\.json/u,
  );
  fs.writeFileSync(currentEvidenceSchema, '{\n');
  const malformedEvidenceSchema = runNpm(target.root, ['run', 'gate:agent-control-plane']);
  assert.notEqual(malformedEvidenceSchema.status, 0, 'malformed task-evidence v3 must fail gate:agent-control-plane');
  assert.match(
    `${malformedEvidenceSchema.stdout}\n${malformedEvidenceSchema.stderr}`,
    /invalid JSON authority \.ai-organization\/schemas\/task-evidence\.v3\.schema\.json/u,
  );
  fs.writeFileSync(currentEvidenceSchema, currentEvidenceSchemaSource);

  const managedRuntimeTest = path.join(
    target.root,
    '.ai-organization',
    'runtime',
    'core',
    'coordination',
    'candidate.test.mjs',
  );
  const managedRuntimeSource = fs.readFileSync(managedRuntimeTest, 'utf8');
  fs.writeFileSync(
    managedRuntimeTest,
    managedRuntimeSource.replace(/^ \* Gated command:.*\r?\n/mu, ''),
  );
  const mutatedTestIntent = runNpm(target.root, ['run', 'gate:test-intent']);
  assert.notEqual(mutatedTestIntent.status, 0, 'missing managed-runtime Gated command must fail gate:test-intent');
  assert.match(`${mutatedTestIntent.stdout}\n${mutatedTestIntent.stderr}`, /candidate\.test\.mjs[\s\S]*missing "Gated command:"/u);
  fs.writeFileSync(managedRuntimeTest, managedRuntimeSource);

  packageJson.scripts['gate:agent-control-plane'] = 'node scripts/accept-everything.mjs';
  fs.writeFileSync(path.join(target.root, 'package.json'), `${JSON.stringify(packageJson)}\n`);
  const mutatedParity = checkNuvoraLinkOverlayParity(target.root);
  assert.equal(mutatedParity.ok, false);
  assert.deepEqual(mutatedParity.errors, [
    'managed JSON section modified or missing: package.json#scripts.gate:agent-control-plane',
  ]);
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
