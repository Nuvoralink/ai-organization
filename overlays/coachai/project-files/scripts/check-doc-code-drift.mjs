import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const auditMode = process.argv.includes('--audit');

const failures = [];
const warnings = [];
let passed = 0;

function fullPath(relativePath) {
  return path.join(root, relativePath);
}

function exists(relativePath) {
  return existsSync(fullPath(relativePath));
}

function read(relativePath) {
  return readFileSync(fullPath(relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function toRepoPath(value) {
  return value.replace(/\\/g, '/');
}

function listFiles(relativeDir, pattern) {
  if (!exists(relativeDir)) return [];
  const found = [];
  function walk(currentRelativeDir) {
    for (const entry of readdirSync(fullPath(currentRelativeDir), { withFileTypes: true })) {
      const child = toRepoPath(path.join(currentRelativeDir, entry.name));
      if (entry.isDirectory()) {
        walk(child);
      } else if (pattern.test(child)) {
        found.push(child);
      }
    }
  }
  walk(relativeDir);
  return found.sort();
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function isIgnoredLocalScript(file) {
  // This inventory owns PRODUCT/V2 authority surfaces. Organization-control adapters are governed
  // by `.ai-organization/ownership.json` + overlay parity, and tests are evidence rather than runtime
  // authority. Classifying either here would layer organizational ownership into the product plan.
  const organizationControl = new Set([
    'scripts/check-agent-context.mjs',
    'scripts/check-agent-control-plane.mjs',
    'scripts/check-fleet-parity.mjs',
    'scripts/check-overlay-parity.mjs',
    'scripts/check-rules-wiring.mjs',
    'scripts/claude-lifecycle-hook.mjs',
    'scripts/run-risk-selected-proof.mjs',
    'scripts/task-governor.mjs',
  ]);
  return file.startsWith('scripts/local/') || file.startsWith('scripts/tests/') || organizationControl.has(file);
}

function pass() {
  passed += 1;
}

function fail(id, message, evidence = []) {
  failures.push({ id, message, evidence });
}

function warn(id, message, evidence = []) {
  warnings.push({ id, message, evidence });
}

function requireIncludes(id, file, needle, message) {
  const text = read(file);
  if (text.includes(needle)) {
    pass();
    return;
  }
  fail(id, message ?? `${file} must include ${needle}`, [file, needle]);
}

function requirePattern(id, file, pattern, message) {
  const text = read(file);
  if (pattern.test(text)) {
    pass();
    return;
  }
  fail(id, message, [file, String(pattern)]);
}

function extractRequired(pattern, text, id, message) {
  const match = text.match(pattern);
  if (!match?.[1]) fail(id, message, [String(pattern)]);
  return match?.[1] ?? null;
}

function exportedAuthorityKeys(relativePath, pattern) {
  const text = read(relativePath);
  return [...text.matchAll(pattern)].map((match) => `${relativePath}#${match[1]}`);
}

function discoverAuthoritySurfaces() {
  return {
    apiRouteFiles: listFiles('backend/src/routes', /\.ts$/).filter((file) => !file.includes('.test.')),
    inlineApiRoutes: ['/api/health', '/api/ready'],
    prismaModels: [...read('backend/prisma/schema.prisma').matchAll(/^model\s+(\w+)/gm)]
      .map((match) => match[1])
      .sort(),
    sharedAuthorityExports: uniqueSorted([
      ...exportedAuthorityKeys(
          'shared/src/coaching/contracts.ts',
          /export\s+(?:interface|type|const|function|enum)\s+(\w*(?:Authority|Analytics|EventMetadata|ScoreAvailability|CoachingObservationContract|DiscoveryQuestion|DiscoveryDepth|DiscoverySequenceDiscipline|DiscoveryLeadingQuestionAvoidance|DiscoveryPauseDiscipline|Judgment)\w*)/g,
        ),
      ...exportedAuthorityKeys(
        'shared/src/coaching/taxonomy.ts',
        /export\s+(?:interface|type|const|function|enum)\s+(\w*(?:Analytics|EventMetadata)\w*)/g,
      ),
      ...exportedAuthorityKeys(
        'shared/src/dialer/contracts.ts',
        /export\s+(?:interface|type|const|function|enum)\s+(\w+)/g,
      ),
    ]),
    frontendAuthorityConsumers: uniqueSorted([
      // Test files are never runtime authority consumers — exclude the __tests__/ dir
      // AND co-located *.test.* files (consistent with apiRouteFiles above). A co-located
      // page/component test must not require an authority-inventory classification.
      ...listFiles('frontend/src/pages', /\.tsx$/).filter((file) => !file.includes('/__tests__/') && !file.includes('.test.')),
      'frontend/src/app/pageRegistry.tsx',
      'frontend/src/context/AuthContext.tsx',
      'frontend/src/components/ProtectedRoute.tsx',
      'frontend/src/lib/api.ts',
      'frontend/src/lib/roleHelpers.ts',
      'frontend/src/lib/trustedNavigation.ts',
      ...listFiles('frontend/src/components/coaching/callReview/v2', /\.(ts|tsx)$/).filter((file) => !file.includes('/__tests__/') && !file.includes('.test.')),
      ...listFiles('frontend/src/components/dashboard/tabs', /\.tsx$/).filter((file) => !file.includes('/__tests__/') && !file.includes('.test.')),
      // IA-1: the rep's unified "My coaching" home (data-fetching MyCoachingTab +
      // its Progress/History/FocusRail sub-views) is the successor to the
      // dashboard/tabs/ rep cockpit — same authority-consuming job, sibling folder.
      ...listFiles('frontend/src/components/dashboard/myCoaching', /\.tsx$/).filter((file) => !file.includes('/__tests__/') && !file.includes('.test.')),
      'frontend/src/components/feedbacks/types.ts',
    ]),
    scriptsAndRules: uniqueSorted([
      ...listFiles('scripts', /\.(mjs|js|ps1)$/).filter((file) => !isIgnoredLocalScript(file)),
      ...listFiles('backend/scripts', /\.(ts|js|mjs|ps1)$/),
      ...listFiles('.cursor/rules', /\.mdc$/),
      ...listFiles('.agents/skills', /\/SKILL\.md$/),
      'AGENTS.md',
      'backend/package.json',
      'package.json',
    ]),
  };
}

function defaultClassificationFor(sectionName, surface, inventory) {
  const defaults = inventory.defaultClassifications?.[sectionName];
  if (!defaults || typeof defaults !== 'object' || Array.isArray(defaults)) return null;
  for (const [prefix, classification] of Object.entries(defaults)) {
    if (surface.startsWith(prefix)) return classification;
  }
  return null;
}

function checkInventorySection(sectionName, discovered, inventory, allowedClassifications) {
  const section = inventory[sectionName];
  if (!section || typeof section !== 'object' || Array.isArray(section)) {
    fail(
      'DCD-AUTHORITY-MANIFEST-0',
      `V2 authority source inventory must define object section ${sectionName}.`,
      ['docs/app-plan/v2-authority-source-inventory.json', sectionName],
    );
    return;
  }

  const discoveredSet = new Set(discovered);
  for (const surface of discovered) {
    const classification = Object.hasOwn(section, surface)
      ? section[surface]
      : defaultClassificationFor(sectionName, surface, inventory);
    if (classification && allowedClassifications.has(classification)) {
      pass();
    } else {
      fail(
        'DCD-AUTHORITY-MANIFEST-1',
        `Discovered authority surface is missing from the machine-readable inventory section ${sectionName}.`,
        ['docs/app-plan/v2-authority-source-inventory.json', surface],
      );
    }
  }

  for (const [surface, classification] of Object.entries(section)) {
    if (!allowedClassifications.has(classification)) {
      fail(
        'DCD-AUTHORITY-MANIFEST-2',
        'Machine-readable authority inventory contains an invalid classification.',
        ['docs/app-plan/v2-authority-source-inventory.json', `${surface}: ${classification}`],
      );
    } else {
      pass();
    }
    if (!discoveredSet.has(surface)) {
      fail(
        'DCD-AUTHORITY-MANIFEST-3',
        `Machine-readable authority inventory section ${sectionName} contains a stale surface that is no longer discovered from source.`,
        ['docs/app-plan/v2-authority-source-inventory.json', surface],
      );
    }
  }
}

function checkAppPlanIndex() {
  const docsIndex = read('docs/DOCUMENTATION_INDEX.md');
  const appPlanReadme = read('docs/app-plan/README.md');
  const files = readdirSync(fullPath('docs/app-plan'))
    .filter((name) => name.endsWith('.md'))
    .sort();

  for (const file of files) {
    const indexNeedle = `./app-plan/${file}`;
    const readmeNeedle = file === 'README.md' ? '`README.md`' : `\`${file}\``;
    if (!docsIndex.includes(indexNeedle)) {
      fail('DCD-DOC-INDEX-1', 'Every docs/app-plan markdown file must be routed from docs/DOCUMENTATION_INDEX.md.', [
        `docs/app-plan/${file}`,
      ]);
    } else {
      pass();
    }
    if (!appPlanReadme.includes(readmeNeedle)) {
      fail('DCD-DOC-INDEX-2', 'Every docs/app-plan markdown file must be listed in docs/app-plan/README.md.', [
        `docs/app-plan/${file}`,
      ]);
    } else {
      pass();
    }
  }
}

function checkAuthorityInventoryGate() {
  for (const file of [
    'docs/app-plan/v2-authority-known-bug-closure-plan.md',
    'docs/app-plan/v2-authority-findings-ledger.md',
    'docs/app-plan/v2-authority-migration-inventory.md',
    'docs/app-plan/v2-authority-source-inventory.json',
  ]) {
    if (exists(file)) {
      pass();
    } else {
      fail('DCD-AUTHORITY-0', 'V2 authority plan, ledger, and inventory must stay checked into docs/app-plan.', [file]);
    }
  }

  const inventory = read('docs/app-plan/v2-authority-migration-inventory.md');
  const requiredRouteFamilies = [
    'auth',
    'admin',
    'analysis',
    'appConfig',
    'coaching',
    'feedback',
    'materials',
    'onboarding',
    'promocode',
    'public',
    'sandbox',
    'session',
    'sessionEvents',
    'settings',
    'storageLocal',
    'stripe',
    'team',
    'tokens',
    'uploadMode',
    'uploads',
    'user',
    '/api/health',
    '/api/ready',
  ];
  for (const routeFamily of requiredRouteFamilies) {
    const needle = routeFamily.startsWith('/api/')
      ? `| \`${routeFamily}\` |`
      : `| \`${routeFamily}\` |`;
    if (inventory.includes(needle)) {
      pass();
    } else {
      fail(
        'DCD-AUTHORITY-1',
        'Every API route family in the V2 authority plan must be classified in the migration inventory.',
        ['docs/app-plan/v2-authority-migration-inventory.md', routeFamily],
      );
    }
  }

  for (const classification of ['migrate', 'adapter', 'read-only legacy', 'remove', 'out of scope with reason']) {
    if (inventory.includes(`\`${classification}\``) || inventory.includes(`| ${classification} |`)) {
      pass();
    } else {
      fail(
        'DCD-AUTHORITY-2',
        'The V2 authority inventory must keep every allowed classification visible so new surfaces cannot be silently unclassified.',
        ['docs/app-plan/v2-authority-migration-inventory.md', classification],
      );
    }
  }

  const ledger = read('docs/app-plan/v2-authority-findings-ledger.md');
  for (const status of ['fix_now', 'validate_fixed', 'superseded_by_architecture', 'separate_root_plan_required', 'defer_with_explicit_risk']) {
    if (ledger.includes(status)) {
      pass();
    } else {
      fail(
        'DCD-AUTHORITY-3',
        'The findings ledger must preserve every allowed closure status, including separate root-plan handling.',
        ['docs/app-plan/v2-authority-findings-ledger.md', status],
      );
    }
  }

  const sourceInventory = readJson('docs/app-plan/v2-authority-source-inventory.json');
  const allowedClassifications = new Set(sourceInventory.allowedClassifications ?? []);
  for (const classification of ['migrate', 'adapter', 'read-only legacy', 'remove', 'out of scope with reason', 'separate root plan required']) {
    if (allowedClassifications.has(classification)) {
      pass();
    } else {
      fail(
        'DCD-AUTHORITY-MANIFEST-4',
        'Machine-readable authority inventory must declare every allowed classification.',
        ['docs/app-plan/v2-authority-source-inventory.json', classification],
      );
    }
  }
  for (const [sectionName, defaults] of Object.entries(sourceInventory.defaultClassifications ?? {})) {
    for (const [prefix, classification] of Object.entries(defaults ?? {})) {
      if (allowedClassifications.has(classification)) {
        pass();
      } else {
        fail(
          'DCD-AUTHORITY-MANIFEST-5',
          'Machine-readable authority inventory contains an invalid default classification.',
          ['docs/app-plan/v2-authority-source-inventory.json', `${sectionName}:${prefix}: ${classification}`],
        );
      }
    }
  }
  const discovered = discoverAuthoritySurfaces();
  for (const [sectionName, surfaces] of Object.entries(discovered)) {
    checkInventorySection(sectionName, surfaces, sourceInventory, allowedClassifications);
  }
}

function checkTenantSecurityBlackBoxGate() {
  const manifest = read('backend/src/lib/security/tenantSecurityProbeManifest.ts');
  const runner = read('backend/scripts/tenantSecurityBlackBoxRegression.ts');
  const tenantEnvironment = exists('backend/src/lib/security/tenantBlackboxEnvironment.ts')
    ? read('backend/src/lib/security/tenantBlackboxEnvironment.ts')
    : '';
  const runnerAndEnvironment = `${runner}\n${tenantEnvironment}`;
  const backendPackage = readJson('backend/package.json');
  const expectedFamilies = [
    'auth',
    'admin',
    'user',
    'team',
    'promocodes',
    'public',
    'sessions',
    'sessionEvents',
    'uploadMode',
    'uploads',
    'config',
    'tokens',
    'feedbacks',
    'analysis',
    'materials',
    'settings',
    'onboarding',
    'coaching',
    'sandbox',
    'storage',
    'stripe',
    'stripeWebhook',
    'health',
    'ready',
  ];
  for (const family of expectedFamilies) {
    if (manifest.includes(`id: '${family}'`) || manifest.includes(`id: "${family}"`)) {
      pass();
    } else {
      fail(
        'DCD-SRP001-1',
        'SRP-001 tenant security manifest must classify every mounted route family.',
        ['backend/src/lib/security/tenantSecurityProbeManifest.ts', family],
      );
    }
  }

  for (const classification of [
    'blackbox_probe_required',
    'covered_by_family_probe',
    'public_safe',
    'signed_url_boundary',
    'external_webhook_signature_boundary',
    'health_or_config',
    'not_runtime_probeable_with_reason',
  ]) {
    if (manifest.includes(classification)) {
      pass();
    } else {
      fail(
        'DCD-SRP001-2',
        'SRP-001 tenant security manifest must preserve every route classification.',
        ['backend/src/lib/security/tenantSecurityProbeManifest.ts', classification],
      );
    }
  }

  for (const golden of [
    'golden_cross_tenant_hidden_object',
    'golden_same_tenant_scope_denied',
    'golden_no_secret_exposure',
    'golden_denied_no_mutation',
    'golden_denied_no_egress',
    'golden_cookie_csrf_browser_path',
    'golden_signed_url_boundary',
  ]) {
    if (manifest.includes(golden) && runner.includes(golden)) {
      pass();
    } else {
      fail(
        'DCD-SRP001-3',
        'SRP-001 runner and manifest must preserve every golden black-box probe.',
        ['backend/src/lib/security/tenantSecurityProbeManifest.ts', 'backend/scripts/tenantSecurityBlackBoxRegression.ts', golden],
      );
    }
  }

  if (backendPackage.scripts?.['test:regression:tenant-security-blackbox']?.includes('tenantSecurityBlackBoxRegression.ts')) {
    pass();
  } else {
    fail(
      'DCD-SRP001-4',
      'Backend package scripts must expose the SRP-001 black-box tenant security gate.',
      ['backend/package.json', 'test:regression:tenant-security-blackbox'],
    );
  }

  for (const required of [
    'installEgressGuard',
    'guardedNetConnect',
    'guardedTlsConnect',
    'allowedNetworkHosts',
    'assertNoExposure',
    'mutationOracle',
    'actorTenant',
    'targetTenant',
    'assert.notEqual(probe.actorTenant, probe.targetTenant',
    'assert.equal(probe.actorTenant, probe.targetTenant',
    'missing-membership-materials',
    'missing-membership-billing',
    'missing-membership-promo',
    'missing-membership-tokens',
    'public-tier-policy',
    'public-contact-sales',
    'coachai_session',
    'coachai_csrf',
    '/api/stripe/webhook',
    'stripe-signature',
    'TENANT_SECURITY_BLACKBOX_ALLOW_PRODUCTION_LIKE_DB',
    'createApp',
  ]) {
    if (runnerAndEnvironment.includes(required)) {
      pass();
    } else {
      fail(
        'DCD-SRP001-5',
        'SRP-001 runner must keep egress, leak, mutation, cookie/CSRF, local-only, and createApp proof hooks.',
        ['backend/scripts/tenantSecurityBlackBoxRegression.ts', required],
      );
    }
  }

  const stripeRoute = read('backend/src/routes/stripe.ts');
  if (stripeRoute.includes('stripe_webhook_signature_rejected') && !stripeRoute.includes("Webhook signature verification failed:', message")) {
    pass();
  } else {
    fail(
      'DCD-SRP001-8',
      'Stripe webhook signature failures must log a sanitized security event without raw provider parser guidance.',
      ['backend/src/routes/stripe.ts', 'stripe_webhook_signature_rejected'],
    );
  }

  const app = read('backend/src/app.ts');
  const mountedRouteFamilies = [
    ['authRouter', 'auth'],
    ['userRouter', 'user'],
    ['adminRouter', 'admin'],
    ['teamRouter', 'team'],
    ['promoCodeRouter', 'promocodes'],
    ['publicRouter', 'public'],
    ['sessionRouter', 'sessions'],
    ['sessionEventsRouter', 'sessionEvents'],
    ['uploadModeRouter', 'uploadMode'],
    ['uploadsRouter', 'uploads'],
    ['uploadModeConfigRouter', 'config'],
    ['appConfigRouter', 'config'],
    ['tokensRouter', 'tokens'],
    ['feedbackRouter', 'feedbacks'],
    ['analysisRouter', 'analysis'],
    ['materialsRouter', 'materials'],
    ['settingsRouter', 'settings'],
    ['onboardingRouter', 'onboarding'],
    ['coachingRouter', 'coaching'],
    ['coachPlusSeatsRouter', 'coaching'],
    ['dialerRouter', 'dialer'],
    ['auxaraSsoRouter', 'auxaraSso'],
    ['sandboxRouter', 'sandbox'],
    ['storageLocalRouter', 'storage'],
    ['stripeRouter', 'stripe'],
    ['handleStripeWebhook', 'stripeWebhook'],
    ['aiPriceRouter', 'ai-prices'],
  ];
  for (const [routerSymbol, family] of mountedRouteFamilies) {
    if (!app.includes(routerSymbol)) continue;
    if (manifest.includes(`id: '${family}'`) || manifest.includes(`id: "${family}"`)) {
      pass();
    } else {
      fail(
        'DCD-SRP001-6',
        'Every mounted app router symbol must map to an SRP-001 tenant security route family.',
        ['backend/src/app.ts', 'backend/src/lib/security/tenantSecurityProbeManifest.ts', routerSymbol, family],
      );
    }
  }

  const mountedSymbols = [...app.matchAll(/app\.use\([\s\S]{0,160}?\b([A-Za-z][A-Za-z0-9_]*Router|handleStripeWebhook)\b/g)]
    .map((match) => match[1]);
  const knownMountedSymbols = new Set(mountedRouteFamilies.map(([routerSymbol]) => routerSymbol));
  for (const symbol of mountedSymbols) {
    if (knownMountedSymbols.has(symbol)) {
      pass();
    } else {
      fail(
        'DCD-SRP001-7',
        'A mounted app router is not classified by the SRP-001 manifest gate.',
        ['backend/src/app.ts', 'backend/src/lib/security/tenantSecurityProbeManifest.ts', symbol],
      );
    }
  }
}

function discoverBackendConsoleSinkFiles() {
  return listFiles('backend/src', /\.ts$/)
    .filter((file) => /console\.(log|info|warn|error)\b/.test(read(file)));
}

function discoverUnsafeFrontendDiagnosticFiles() {
  return listFiles('frontend/src', /\.(ts|tsx)$/)
    .filter((file) => file !== 'frontend/src/lib/clientDiagnostics.ts')
    .filter((file) => /console\.(warn|error)\s*\(/.test(read(file)));
}

function checkSrp002TelemetrySinkGate() {
  for (const file of [
    'docs/app-plan/srp-002-telemetry-sink-inventory.md',
    'docs/app-plan/srp-002-telemetry-sink-inventory.json',
    'backend/src/lib/telemetry.ts',
    'scripts/lib/diagnosticRedaction.mjs',
    'backend/scripts/observabilityRedactionRegression.ts',
  ]) {
    if (exists(file)) pass();
    else fail('DCD-SRP002-0', 'SRP-002 telemetry authority, inventory, and regression must stay checked in.', [file]);
  }

  const inventory = readJson('docs/app-plan/srp-002-telemetry-sink-inventory.json');
  const allowedClassifications = new Set(inventory.allowedClassifications ?? []);
  for (const classification of [
    'telemetry_authority_required',
    'safe_sink_adapter',
    'persistent_safe_metadata',
    'authorized_product_record_not_telemetry',
    'authorized_debug_export_boundary',
    'debug_payload_boundary',
    'script_only_allowed',
    'remove_or_migrate',
    'separate_root_plan_required',
  ]) {
    if (allowedClassifications.has(classification)) pass();
    else fail('DCD-SRP002-1', 'SRP-002 inventory must preserve every telemetry sink classification.', [
      'docs/app-plan/srp-002-telemetry-sink-inventory.json',
      classification,
    ]);
  }

  const sinks = inventory.sinks ?? {};
  const requiredSinks = [
    'backend/src/lib/telemetry.ts',
    'backend/src/middleware/errorHandler.ts',
    'backend/src/lib/apiResponse.ts',
    'backend/src/lib/sentry.ts',
    'backend/src/app.ts',
    'backend/src/server.ts',
    'backend/src/worker.ts',
    'backend/src/lib/perfLog.ts',
    'backend/src/lib/audit.ts',
    'backend/src/lib/analytics/recordAnalyticsEvent.ts',
    'backend/src/lib/aiUsageMeter.ts',
    'backend/src/lib/analysisTrace.ts',
    'backend/src/routes/admin.ts',
    'backend/src/routes/public.ts',
    'frontend/src/lib/sentry.ts',
    'frontend/src/lib/api.ts',
    'frontend/src/lib/clientDiagnostics.ts',
    'frontend/src/components/ManagerNotificationBell.tsx',
    'frontend/src/hooks/useRecording.ts',
    'scripts/lib/diagnosticRedaction.mjs',
    'scripts/runEndToEndSurfaceSmoke.mjs',
    'scripts/runManagerFrontendSmoke.mjs',
    'frontend/scripts/e2eSurfaceSmoke.mjs',
    'frontend/scripts/managerAuthSmoke.mjs',
    'backend/scripts/observabilityRedactionRegression.ts',
  ];
  for (const sink of requiredSinks) {
    if (allowedClassifications.has(sinks[sink])) pass();
    else fail('DCD-SRP002-2', 'A required telemetry sink is missing or misclassified.', [
      'docs/app-plan/srp-002-telemetry-sink-inventory.json',
      sink,
    ]);
  }

  const requiredAuthorityExports = [
    'safeLogEvent',
    'safeErrorEnvelope',
    'safeSentryContext',
    'safeTelemetryMetadata',
    'safeAuditMetadata',
    'safeAnalyticsMetadata',
    'safeAiUsageMetadata',
    'safeTraceSummary',
    'safeTraceAdminView',
    'safePerfMetadata',
    'safeProductFeedbackBrowserInfo',
    'assertNoTelemetryLeak',
    'installConsoleTelemetryGuard',
  ];
  const telemetry = read('backend/src/lib/telemetry.ts');
  for (const exportedName of requiredAuthorityExports) {
    if (telemetry.includes(`function ${exportedName}`)) pass();
    else fail('DCD-SRP002-3', 'Telemetry authority must export every required safe sink helper.', [
      'backend/src/lib/telemetry.ts',
      exportedName,
    ]);
  }

  const backendPackage = readJson('backend/package.json');
  if (backendPackage.scripts?.['test:regression:observability-redaction']?.includes('observabilityRedactionRegression.ts')) {
    pass();
  } else {
    fail('DCD-SRP002-4', 'Backend package scripts must expose the SRP-002 observability redaction regression.', [
      'backend/package.json',
      'test:regression:observability-redaction',
    ]);
  }

  const requiredUsage = [
    ['backend/src/middleware/errorHandler.ts', 'safeErrorEnvelope'],
    ['backend/src/middleware/errorHandler.ts', 'safeLogEvent'],
    ['backend/src/lib/sentry.ts', 'safeSentryContext'],
    ['backend/src/lib/apiResponse.ts', 'safeErrorEnvelope'],
    ['backend/src/lib/apiResponse.ts', 'safeLogEvent'],
    ['backend/src/app.ts', 'installConsoleTelemetryGuard'],
    ['backend/src/server.ts', 'installConsoleTelemetryGuard'],
    ['backend/src/worker.ts', 'installConsoleTelemetryGuard'],
    ['backend/src/lib/audit.ts', 'safeAuditMetadata'],
    ['backend/src/lib/analytics/recordAnalyticsEvent.ts', 'safeAnalyticsMetadata'],
    ['backend/src/lib/aiUsageMeter.ts', 'safeAiUsageMetadata'],
    ['backend/src/lib/analysisTrace.ts', 'safeTraceSummary'],
    ['backend/src/lib/analysisTrace.ts', 'canWriteRawTracePayload'],
    ['backend/src/lib/perfLog.ts', 'safePerfMetadata'],
    ['backend/src/routes/admin.ts', 'safeTraceAdminView'],
    ['backend/src/routes/public.ts', 'safeTelemetryMetadata'],
    ['backend/src/routes/public.ts', 'safeProductFeedbackBrowserInfo'],
    ['frontend/src/lib/api.ts', 'getErrorRequestId'],
    ['frontend/src/lib/clientDiagnostics.ts', 'logClientDiagnostic'],
    ['frontend/src/components/ManagerNotificationBell.tsx', 'logClientDiagnostic'],
    ['frontend/src/hooks/useRecording.ts', 'logClientDiagnostic'],
    ['scripts/runEndToEndSurfaceSmoke.mjs', 'redactSensitiveForLog'],
    ['scripts/runManagerFrontendSmoke.mjs', 'scanDiagnosticArtifacts'],
    ['frontend/scripts/e2eSurfaceSmoke.mjs', 'redactSensitiveForLog'],
    ['frontend/scripts/managerAuthSmoke.mjs', 'scanDiagnosticArtifacts'],
  ];
  for (const [file, needle] of requiredUsage) {
    requireIncludes('DCD-SRP002-5', file, needle, 'Required SRP-002 sink must route through the telemetry authority or artifact redactor.');
  }

  const frontendSentry = read('frontend/src/lib/sentry.ts');
  if (!/email:\s*user\.email/.test(frontendSentry) && !/username:\s*`?\$\{user\.firstName/.test(frontendSentry)) {
    pass();
  } else {
    fail('DCD-SRP002-6', 'Frontend Sentry user context must not include email or full name.', [
      'frontend/src/lib/sentry.ts',
    ]);
  }
  const backendSentry = read('backend/src/lib/sentry.ts');
  for (const [file, text] of [
    ['backend/src/lib/sentry.ts', backendSentry],
    ['frontend/src/lib/sentry.ts', frontendSentry],
  ]) {
    if (text.includes('sanitizeExceptionPayload') && text.includes('event.exception')) {
      pass();
    } else {
      fail('DCD-SRP002-8', 'Sentry beforeSend must sanitize exception messages and stack context, not only extras/user/request.', [
        file,
      ]);
    }
  }
  if (
    backendSentry.includes('activeCoreTags') &&
    backendSentry.includes('applyCoreSentryTags') &&
    read('backend/src/server.ts').includes("initSentry({ service: 'api' })") &&
    read('backend/src/worker.ts').includes("initSentry({ service: 'worker' })") &&
    frontendSentry.includes('VITE_APP_STACK') &&
    frontendSentry.includes('getCoreSentryTags') &&
    frontendSentry.includes("service: 'frontend'")
  ) {
    pass();
  } else {
    fail('DCD-SRP002-14', 'Sentry events must carry authoritative stack/service tags so paid/internal and api/worker/frontend stay separable when DSNs are shared.', [
      'backend/src/lib/sentry.ts',
      'backend/src/server.ts',
      'backend/src/worker.ts',
      'frontend/src/lib/sentry.ts',
    ]);
  }

  const adminRoute = read('backend/src/routes/admin.ts');
  if (adminRoute.includes('session_analysis_bundle.download') && inventory.authorizedBoundaries?.['backend/src/routes/admin.ts#session-analysis-bundle'] === 'authorized_debug_export_boundary') {
    pass();
  } else {
    fail('DCD-SRP002-7', 'Session analysis bundle export must remain explicitly classified as an authorized debug export boundary.', [
      'backend/src/routes/admin.ts',
      'docs/app-plan/srp-002-telemetry-sink-inventory.json',
    ]);
  }

  const legacyConsoleSinks = inventory.legacyConsoleSinks ?? {};
  const discoveredConsoleSinks = discoverBackendConsoleSinkFiles();
  const discoveredConsoleSet = new Set(discoveredConsoleSinks);
  for (const file of discoveredConsoleSinks) {
    if (allowedClassifications.has(legacyConsoleSinks[file])) {
      pass();
    } else {
      fail('DCD-SRP002-9', 'Every backend/src console sink must be classified so new direct runtime logging cannot drift around the telemetry authority.', [
        'docs/app-plan/srp-002-telemetry-sink-inventory.json',
        file,
      ]);
    }
  }
  for (const [file, classification] of Object.entries(legacyConsoleSinks)) {
    if (!allowedClassifications.has(classification)) {
      fail('DCD-SRP002-10', 'Legacy console sink inventory contains an invalid classification.', [
        'docs/app-plan/srp-002-telemetry-sink-inventory.json',
        `${file}: ${classification}`,
      ]);
    } else {
      pass();
    }
    if (!discoveredConsoleSet.has(file)) {
      fail('DCD-SRP002-11', 'Legacy console sink inventory contains a stale entry; remove it once the file has migrated to safeLogEvent.', [
        'docs/app-plan/srp-002-telemetry-sink-inventory.json',
        file,
      ]);
    }
  }

  if (read('backend/src/lib/authorize.ts').includes('getAuthorizationErrorDetails') && !read('backend/src/middleware/errorHandler.ts').includes('err.details')) {
    pass();
  } else {
    fail('DCD-SRP002-12', 'AuthorizationError policy details must stay server-only and must not be spread into public API error bodies.', [
      'backend/src/lib/authorize.ts',
      'backend/src/middleware/errorHandler.ts',
    ]);
  }

  const unsafeFrontendDiagnosticFiles = discoverUnsafeFrontendDiagnosticFiles();
  if (unsafeFrontendDiagnosticFiles.length === 0) {
    pass();
  } else {
    fail('DCD-SRP002-13', 'Frontend warning/error diagnostics must route through logClientDiagnostic instead of raw console channels.', [
      ...unsafeFrontendDiagnosticFiles,
    ]);
  }
}

function checkSrp004OpsClosureGate() {
  for (const file of [
    'docs/app-plan/srp-004-production-ops-closure-ledger.md',
    'docs/app-plan/srp-004-production-ops-closure-inventory.json',
    'docs/app-plan/srp-004-fu-001-historical-telemetry-cleanup-plan.md',
    'backend/src/lib/security/tenantBlackboxEnvironment.ts',
    'backend/scripts/tenantBlackboxEnvironmentRegression.ts',
    'backend/scripts/opsTopologyRegression.ts',
    'backend/scripts/opsSinkValidationRegression.ts',
    'backend/scripts/secretRotationReadinessRegression.ts',
    'backend/scripts/historicalTelemetryLeakScan.ts',
    'backend/scripts/historicalTelemetryCleanup.ts',
    'backend/scripts/historicalTelemetryLeakScanRegression.ts',
  ]) {
    if (exists(file)) pass();
    else fail('DCD-SRP004-0', 'SRP-004 ops closure docs, inventory, and offline regressions must stay checked in.', [file]);
  }

  const inventory = readJson('docs/app-plan/srp-004-production-ops-closure-inventory.json');
  const allowedStatuses = new Set(inventory.allowedStatuses ?? []);
  for (const status of ['validate_fixed', 'fix_now', 'external_access_required', 'separate_root_plan_required', 'out_of_scope_with_reason']) {
    if (allowedStatuses.has(status)) pass();
    else fail('DCD-SRP004-1', 'SRP-004 inventory must preserve every closure status.', [
      'docs/app-plan/srp-004-production-ops-closure-inventory.json',
      status,
    ]);
  }

  const requiredSurfaces = [
    'railway_api_service',
    'railway_worker_service',
    'railway_redis_attachment',
    'vercel_paid_frontend',
    'vercel_api_rewrite_fallback',
    'neon_paid_database',
    'tenant_blackbox_disposable_database',
    'cloudflare_r2_bucket',
    'sentry_live_project',
    'production_log_drain',
    'historical_telemetry_scan',
    'historical_telemetry_cleanup',
    'secret_rotation_ledger',
    'srp_live_closure_smoke',
    'ops_docs_and_rules',
    'ai_coaching_quality_backlog',
  ];
  for (const surface of requiredSurfaces) {
    const classification = inventory.surfaces?.[surface]?.status;
    if (allowedStatuses.has(classification)) pass();
    else fail('DCD-SRP004-2', 'SRP-004 inventory is missing or misclassifying a required ops surface.', [
      'docs/app-plan/srp-004-production-ops-closure-inventory.json',
      surface,
    ]);
  }

  const backendPackage = readJson('backend/package.json');
  for (const [scriptName, scriptFile] of [
    ['test:regression:tenant-blackbox-environment', 'tenantBlackboxEnvironmentRegression.ts'],
    ['test:regression:ops-topology', 'opsTopologyRegression.ts'],
    ['test:regression:ops-sink-validation', 'opsSinkValidationRegression.ts'],
    ['test:regression:secret-rotation-readiness', 'secretRotationReadinessRegression.ts'],
    ['test:regression:historical-telemetry-scan', 'historicalTelemetryLeakScanRegression.ts'],
    ['ops:scan-historical-telemetry', 'historicalTelemetryLeakScan.ts'],
    ['ops:cleanup-historical-telemetry', 'historicalTelemetryCleanup.ts'],
  ]) {
    if (backendPackage.scripts?.[scriptName]?.includes(scriptFile)) pass();
    else fail('DCD-SRP004-3', 'Backend package scripts must expose SRP-004 offline proof gates.', [
      'backend/package.json',
      scriptName,
    ]);
  }

  const ledger = read('docs/app-plan/srp-004-production-ops-closure-ledger.md');
  const findings = read('docs/app-plan/v2-authority-findings-ledger.md');
  if (findings.includes('| SRP-004 | Production ops closure') && findings.includes('| SRP-005 | Remaining AI/coaching-quality backlog architecture')) {
    pass();
  } else {
    fail('DCD-SRP004-4', 'SRP-004 id collision must stay resolved: ops closure owns SRP-004 and AI/coaching backlog moves to SRP-005.', [
      'docs/app-plan/v2-authority-findings-ledger.md',
    ]);
  }
  if (!findings.includes('| SRP-004 | Remaining AI/coaching-quality backlog architecture')) pass();
  else fail('DCD-SRP004-5', 'SRP-004 must not be reused for the AI/coaching backlog after ops closure is introduced.', [
    'docs/app-plan/v2-authority-findings-ledger.md',
  ]);

  for (const required of [
    'count-only',
    'Do not delete or rewrite historical telemetry rows',
    'Never record values',
    'TENANT_SECURITY_BLACKBOX_DATABASE_URL',
    'external_access_required',
    'AUXARA_LIVE_SMOKE=1 npm run test:srp-live-closure',
    'npm run ops:scan-historical-telemetry --workspace=backend',
    'srp-004-fu-001-historical-telemetry-cleanup-plan.md',
  ]) {
    if (ledger.includes(required)) pass();
    else fail('DCD-SRP004-6', 'SRP-004 ledger must preserve live-proof, historical telemetry, secret rotation, and test DB authority language.', [
      'docs/app-plan/srp-004-production-ops-closure-ledger.md',
      required,
    ]);
  }

  const tenantEnvironment = read('backend/src/lib/security/tenantBlackboxEnvironment.ts');
  const tenantRunner = read('backend/scripts/tenantSecurityBlackBoxRegression.ts');
  const tenantCombined = `${tenantEnvironment}\n${tenantRunner}`;
  for (const required of [
    'TENANT_SECURITY_BLACKBOX_DATABASE_URL',
    'TENANT_SECURITY_BLACKBOX_USE_EXISTING_DATABASE_URL',
    'TENANT_SECURITY_BLACKBOX_CONFIRM_DISPOSABLE_DB',
    'TENANT_SECURITY_BLACKBOX_ALLOW_PRODUCTION_LIKE_DB',
    'TENANT_SECURITY_BLACKBOX_SKIP_DB_PREFLIGHT',
    'TEST_DATABASE_UNREACHABLE',
    'preflightTenantSecurityBlackboxDatabaseReachability',
    'redactBlackboxError',
  ]) {
    if (tenantCombined.includes(required)) pass();
    else fail('DCD-SRP004-7', 'Tenant blackbox must use explicit disposable DB authority and sanitized failures.', [
      'backend/src/lib/security/tenantBlackboxEnvironment.ts',
      'backend/scripts/tenantSecurityBlackBoxRegression.ts',
      required,
    ]);
  }

  const secretValuePattern =
    /postgres(?:ql)?:\/\/[^\s"'<>]+|\bsk_(?:live|test)_[A-Za-z0-9_-]{12,}\b|\brk_(?:live|test)_[A-Za-z0-9_-]{12,}\b|\bwhsec_[A-Za-z0-9_-]{12,}\b|\bBearer\s+[A-Za-z0-9._~+/=-]{12,}|\bcoachai_(?:session|csrf)=([^;\s]+)/i;
  for (const file of [
    'docs/app-plan/srp-004-production-ops-closure-ledger.md',
    'docs/app-plan/srp-004-production-ops-closure-inventory.json',
  ]) {
    if (!secretValuePattern.test(read(file))) pass();
    else fail('DCD-SRP004-8', 'SRP-004 docs/inventory must not contain raw secret-shaped values.', [file]);
  }

  const historicalTelemetryScanner = read('backend/scripts/historicalTelemetryLeakScan.ts');
  const historicalTelemetryCleanup = read('backend/scripts/historicalTelemetryCleanup.ts');
  const backendPackageText = read('backend/package.json');
  for (const required of [
    'AuditEvent',
    'AnalyticsEvent',
    'AiModelUsageEvent',
    'AnalysisTraceEvent',
    'ProductFeedback',
    'countOnlyReport',
    'Do not delete or rewrite historical telemetry rows',
    'HISTORICAL_TELEMETRY_SCAN_REPORT_ONLY',
  ]) {
    if (historicalTelemetryScanner.includes(required)) pass();
    else fail('DCD-SRP004-9', 'SRP-004 historical telemetry scanner must scan every telemetry sink with count-only output and no destructive cleanup.', [
      'backend/scripts/historicalTelemetryLeakScan.ts',
      required,
    ]);
  }
  for (const required of [
    'sanitizeHistoricalTraceSummary',
    'HISTORICAL_TELEMETRY_CLEANUP_APPLY',
    'HISTORICAL_TELEMETRY_CLEANUP_BACKUP_REF',
    'machineFooterWarnings',
    'generatedDrillsEnvelope.drills.line',
    'b1Error',
    'countOnlyReport',
  ]) {
    if (historicalTelemetryCleanup.includes(required)) pass();
    else fail('DCD-SRP004-12', 'SRP-004 historical telemetry cleanup must be idempotent, backup-gated, and scoped to known unsafe summary fields.', [
      'backend/scripts/historicalTelemetryCleanup.ts',
      required,
    ]);
  }
  if (
    backendPackageText.includes('ops:scan-historical-telemetry') &&
    backendPackageText.includes('ops:cleanup-historical-telemetry') &&
    backendPackageText.includes('test:regression:historical-telemetry-scan')
  ) {
    pass();
  } else {
    fail('DCD-SRP004-13', 'SRP-004 package scripts must expose historical telemetry scan, cleanup, and regression gates.', [
      'backend/package.json',
    ]);
  }

  const frontendVercel = read('frontend/vercel.json');
  const frontendApi = read('frontend/src/lib/api.ts');
  if (!/["']source["']\s*:\s*["']\/api\/:path\*/.test(frontendVercel) && !/\.up\.railway\.app/i.test(frontendVercel)) {
    pass();
  } else {
    fail('DCD-SRP004-10', 'Production Vercel frontend must not keep a shared /api rewrite to a Railway app host; VITE_API_URL is the API authority.', [
      'frontend/vercel.json',
      'frontend/src/lib/api.ts',
    ]);
  }
  if (
    frontendApi.includes('VITE_API_URL is required for production frontend deployments') &&
    frontendApi.includes('absolute HTTPS custom API URL') &&
    frontendApi.includes('VITE_APP_STACK must be paid or internal in production') &&
    frontendApi.includes("hostname !== 'api.auxara.io'") &&
    frontendApi.includes('Internal production VITE_API_URL must not use the paid API domain') &&
    frontendApi.includes('same-site nuvoralink.com API domain for cookie auth') &&
    frontendApi.includes('VITE_ALLOW_CROSS_SITE_INTERNAL_API') &&
    frontendApi.includes('shouldRedirectOnUnauthorized') &&
    frontendApi.includes("path === '/api/auth/me'") &&
    frontendApi.includes('SESSION_INVALID_CODES') &&
    frontendApi.includes('VITE_APP_STACK is required when production VITE_API_URL does not use the paid API domain')
  ) {
    pass();
  } else {
    fail('DCD-SRP004-11', 'Production frontend API authority must fail closed when VITE_API_URL is missing, relative, stack is invalid, paid points away from api.auxara.io, internal points at paid, internal lacks a same-site API domain without explicit temporary override, or non-paid hosts lack stack authority.', [
      'frontend/src/lib/api.ts',
    ]);
  }
}

function checkPipelineTruthMatchesDocs() {
  const promptVersions = read('backend/src/lib/promptVersions.ts');
  const promptVersion = extractRequired(
    /COACH_GENERATE:\s*['"]([^'"]+)['"]/,
    promptVersions,
    'DCD-PIPELINE-1',
    'Could not extract COACH_GENERATE prompt version from backend/src/lib/promptVersions.ts.',
  );
  if (promptVersion) {
    for (const file of ['README.md', 'COACHING_ARCHITECTURE.md', 'MVP_CONTRACTS.md', 'docs/app-plan/documentation-audit.md']) {
      requireIncludes('DCD-PIPELINE-2', file, promptVersion, `${file} must name the current coaching prompt version ${promptVersion}.`);
    }
  }

  const analysisConfig = read('backend/src/lib/analysisConfig.ts');
  const b1Default = extractRequired(
    /B1_PRIMARY_PROVIDER['"][\s\S]{0,120}?['"]([^'"]+)['"]/,
    analysisConfig,
    'DCD-PIPELINE-3',
    'Could not extract the default B1 provider from backend/src/lib/analysisConfig.ts.',
  );
  if (b1Default) {
    for (const file of ['README.md', 'COACHING_ARCHITECTURE.md']) {
      requireIncludes('DCD-PIPELINE-4', file, b1Default, `${file} must name the current default B1 provider ${b1Default}.`);
    }
  }
}

function checkScoreAuthorityContract() {
  for (const field of ['scoreAuthorityStatus', 'scoreAuthoritySource', 'scoreAuthorityReason']) {
    requireIncludes('DCD-SCORE-1', 'backend/prisma/schema.prisma', field, `Feedback schema must keep ${field}.`);
  }
  requireIncludes('DCD-SCORE-2', 'backend/src/lib/coaching/scoreAuthority.ts', 'authoritativeFeedbackScore', 'Score authority helper must exist.');
  requireIncludes('DCD-SCORE-3', 'backend/src/lib/coaching/callReviewAuthority.ts', 'scoreAvailability', 'Call Review Authority must own score availability.');
  requireIncludes('DCD-SCORE-4', 'MVP_CONTRACTS.md', 'scoreAuthorityStatus === "authoritative"', 'MVP contracts must keep the canonical score authority rule.');
  requireIncludes('DCD-SCORE-5', 'docs/app-plan/source-of-truth-map.md', 'Score-dependent surfaces require current `scoreAuthorityStatus`.', 'Source-of-truth map must require current score authority.');

  const repHero = read('frontend/src/components/coaching/callReview/v2/sections/CallReviewHero.tsx');
  if (/callReviewAuthority|scoreAvailability/.test(repHero)) {
    pass();
  } else {
    fail(
      'DCD-SCORE-UI-1',
      'Rep Call Review v2 score display does not consume scoreAvailability, so null scores collapse to a dash without the documented limited/unavailable reason.',
      ['frontend/src/components/coaching/callReview/v2/sections/CallReviewHero.tsx', 'docs/app-plan/product-assurance-contract.md'],
    );
  }

  const managerReview = read('frontend/src/components/coaching/callReview/v2/ManagerCallReviewV2.tsx');
  if (/scoreAvailability|callReviewAuthority/.test(managerReview)) {
    pass();
  } else {
    fail(
      'DCD-SCORE-UI-2',
      'Manager Call Review v2 score card does not consume scoreAvailability, so unavailable scores can render as a bare dash on a /100 scale.',
      ['frontend/src/components/coaching/callReview/v2/ManagerCallReviewV2.tsx', 'docs/app-plan/product-assurance-contract.md'],
    );
  }

  const teamFeedbackTypes = read('frontend/src/components/feedbacks/types.ts');
  if (/scoreAuthority|scoreAvailability/.test(teamFeedbackTypes)) {
    pass();
  } else {
    fail(
      'DCD-SCORE-DTO-1',
      'Team feedback DTO exposes a canonical score but not the score authority status/reason, so the Calls tab cannot distinguish missing data from limited/unavailable score authority.',
      ['frontend/src/components/feedbacks/types.ts', 'backend/src/routes/feedback.ts'],
    );
  }

  const feedbackRoute = read('backend/src/routes/feedback.ts');
  if (/scoreAuthority:\s*{[\s\S]{0,250}scoreAuthorityStatus[\s\S]{0,250}scoreAuthorityReason/.test(feedbackRoute)) {
    pass();
  } else {
    fail(
      'DCD-SCORE-DTO-2',
      'Team feedback backend route must serialize score authority status/source/reason, not only the numeric score.',
      ['backend/src/routes/feedback.ts', 'frontend/src/components/feedbacks/types.ts'],
    );
  }

  const teamInsights = read('frontend/src/pages/TeamInsightsPage.tsx');
  if (/getTeamFeedbackScoreState[\s\S]{0,800}scoreAuthority/.test(teamInsights)) {
    pass();
  } else {
    fail(
      'DCD-SCORE-UI-3',
      'Team Insights must consume TeamFeedbackItem.scoreAuthority instead of deriving missing-score meaning from score alone.',
      ['frontend/src/pages/TeamInsightsPage.tsx', 'frontend/src/components/feedbacks/types.ts'],
    );
  }
}

function checkTestCoverageTracksActiveSurfaces() {
  const uiGuard = read('scripts/check-ui-guardrails.mjs');
  for (const surface of ['TeamRoster.tsx', 'ManagerDashboard.tsx', 'OverviewTab.tsx']) {
    if (uiGuard.includes(surface)) pass();
    else fail('DCD-TEST-1', 'UI guardrail must cover the active manager/team surfaces named by the docs.', ['scripts/check-ui-guardrails.mjs', surface]);
  }

  const repV2Test = read('frontend/src/components/coaching/callReview/v2/__tests__/RepCallReviewV2.smoke.test.tsx');
  if (/scoreAvailability[\s\S]{0,500}(limited|unavailable|skipped)/i.test(repV2Test)) {
    pass();
  } else {
    fail(
      'DCD-TEST-2',
      'Rep Call Review v2 tests do not cover limited/unavailable score authority even though the docs require explicit limited-state behavior.',
      ['frontend/src/components/coaching/callReview/v2/__tests__/RepCallReviewV2.smoke.test.tsx'],
    );
  }

  const managerV2Test = read('frontend/src/components/coaching/callReview/v2/__tests__/ManagerCallReviewV2.smoke.test.tsx');
  if (/scoreAvailability[\s\S]{0,500}(limited|unavailable|skipped)/i.test(managerV2Test)) {
    pass();
  } else {
    fail(
      'DCD-TEST-3',
      'Manager Call Review v2 tests do not cover limited/unavailable score authority even though the docs require explicit limited-state behavior.',
      ['frontend/src/components/coaching/callReview/v2/__tests__/ManagerCallReviewV2.smoke.test.tsx'],
    );
  }

  const repV2 = read('frontend/src/components/coaching/callReview/v2/RepCallReviewV2.tsx');
  const managerV2 = read('frontend/src/components/coaching/callReview/v2/ManagerCallReviewV2.tsx');
  const sharedContracts = read('shared/src/coaching/contracts.ts');
  const callReviewMapper = read('backend/src/lib/coaching/callReviewMapper.ts');
  const frontendApi = read('frontend/src/lib/api.ts');
  if (
    /CallReviewRecordingDTO/.test(sharedContracts) &&
    /status\?:\s*'available'\s*\|\s*'deleted'\s*\|\s*'missing'/.test(sharedContracts) &&
    /verifyRecordingAvailability\(session\.id\)/.test(callReviewMapper) &&
    /getSessionRecordingPlayback[\s\S]{0,1600}recording-url/.test(frontendApi) &&
    /getSessionRecordingObjectUrl[\s\S]{0,1200}getSessionRecordingPlayback/.test(frontendApi) &&
    !/getSessionRecordingObjectUrl[\s\S]{0,1200}responseType:\s*['"]blob['"]/.test(frontendApi) &&
    /recording\?\.available === false/.test(repV2) &&
    /recording\?\.available === false/.test(managerV2) &&
    /recordingUnavailableMessage/.test(managerV2)
  ) {
    pass();
  } else {
    fail(
      'DCD-TEST-9',
      'Call Review audio must use the recording-url lifecycle endpoint so unavailable recordings become audioUrl=null instead of direct legacy stream 404s.',
      ['frontend/src/lib/api.ts', 'frontend/docs/FRONTEND_BLAST_RADIUS.md'],
    );
  }

  const recordingAuthority = read('backend/src/lib/recordingStorageAuthority.ts');
  const storageTs = read('backend/src/lib/storage.ts');
  const sessionRoute = read('backend/src/routes/session.ts');
  const uploadFinalizationAuthority = read('backend/src/lib/uploadFinalizationAuthority.ts');
  const uploadIntentService = read('backend/src/lib/uploadIntentService.ts');
  const uploadIntentFinalizeSource = uploadIntentService.slice(uploadIntentService.indexOf('export async function finalizeUploadIntent'));
  if (
    /verifyRecordingAvailability/.test(recordingAuthority) &&
    /driver\.verifyChunks\(session\.id,\s*expected\)/.test(recordingAuthority) &&
    /requireFinalized\?:\s*boolean/.test(recordingAuthority) &&
    /options\.requireFinalized !== false/.test(recordingAuthority) &&
    /storageBackendOverride:\s*input\.storageBackend/.test(uploadFinalizationAuthority) &&
    /requireFinalized:\s*false/.test(uploadFinalizationAuthority) &&
    /DUPLICATE_CLEANUP_UNVERIFIED/.test(uploadFinalizationAuthority) &&
    !/deleteSessionRecordings\(input\.sessionId\)\.catch\(\(\) => undefined\)/.test(uploadFinalizationAuthority) &&
    /resolveStorageDriverForSession\(sessionId\)/.test(storageTs) &&
    /RecordingDeletionError/.test(storageTs) &&
    /resolved\.kind === 'backend_unavailable'/.test(storageTs) &&
    /error instanceof RecordingDeletionError/.test(sessionRoute) &&
    /persistSessionChunksToDurableStorage\(sessionId,\s*\{\s*requireAll:\s*true\s*\}\)/.test(sessionRoute) &&
    /function requireUploadIntentStorageDriver/.test(uploadIntentService) &&
    /async function verifyUploadIntentChunks/.test(uploadIntentService) &&
    /async function ensureFinalizedUploadIntentSessionAuthority/.test(uploadIntentService) &&
    /intent\.status !== 'URLS_ISSUED'/.test(uploadIntentFinalizeSource) &&
    /verifyUploadIntentChunks[\s\S]{0,260}requireUploadIntentStorageDriver\(intent\)/.test(uploadIntentService) &&
    /intent\.status === 'FINALIZED'[\s\S]{0,520}verifyUploadIntentChunks\(intent\)[\s\S]{0,220}ensureFinalizedUploadIntentSessionAuthority\(intent,\s*verification\.backend\)/.test(uploadIntentFinalizeSource) &&
    /STALE_FINALIZED_SESSION_STATUSES/.test(uploadIntentService) &&
    /UPLOAD_RECORDING_DELETED/.test(uploadIntentService) &&
    !/const driver = getStorageDriver\(\)/.test(uploadIntentFinalizeSource) &&
    /test:regression:recording-storage-authority/.test(read('backend/package.json'))
  ) {
    pass();
  } else {
    fail(
      'DCD-SRP003-RECORDING-AUTHORITY-1',
      'Recording lifecycle must be governed by per-session storage authority, durable object verification, and a regression gate; process-wide storage/local chunks cannot be the source of truth.',
      ['backend/src/lib/recordingStorageAuthority.ts', 'backend/src/routes/session.ts', 'backend/package.json'],
    );
  }

  if (/data-testid="call-review-content-shell"/.test(repV2)) {
    pass();
  } else {
    fail(
      'DCD-TEST-4',
      'Rep Call Review v2 must expose the shared call-review content-shell selector so browser geometry smokes keep covering the active rep review surface.',
      ['frontend/src/components/coaching/callReview/v2/RepCallReviewV2.tsx', 'frontend/scripts/e2eSurfaceSmoke.mjs'],
    );
  }

  const momentSection = read('frontend/src/components/coaching/callReview/v2/sections/TheMomentSection.tsx');
  // editorialHeadline AUTHORITY = the Layer-1 hero VERDICT (2026-07-11, ba7648c6): the mapper overwrites
  // summary.primaryIssue with the per-call AI `editorialHeadline` (newlines normalized to one line for the
  // short verdict), PREFERRED, falling back to primaryFixBundle.headline for legacy bundles with no
  // editorial — so the source-of-truth coaching focus reaches the hero verdict and a generic/static template
  // never replaces it. TheMomentSection is now deliberately HEADLINE-FIRST (the specific fix narrative;
  // editorialHeadline moved to the verdict so the two surfaces never render the same line twice), still
  // grounded on the bundle fields with pickMomentHeadline(fix) as the last-resort derivation (never a
  // generic template). Bites: revert the summary.primaryIssue overwrite to drop the editorialHeadline
  // preference OR the headline fallback → the mapper regex fails; swap either moment field for a static
  // string → the moment-grounding regex fails. (Superseded the pre-ba7648c6 model that rendered
  // editorialHeadline FIRST inside TheMomentSection; see callReviewMapper.ts summary.primaryIssue overwrite
  // + TheMomentSection.tsx headline line.)
  // (callReviewMapper is already read above in this check.)
  const heroVerdictAuthoritative =
    /editorialVerdict\s*=\s*[\s\S]{0,120}editorialHeadline/.test(callReviewMapper) &&
    /summary\.primaryIssue\s*=\s*editorialVerdict\s*\|\|[\s\S]{0,80}\.headline/.test(callReviewMapper);
  const momentGrounded =
    /fix\.headline/.test(momentSection) &&
    /fix\.editorialHeadline/.test(momentSection) &&
    /pickMomentHeadline\(fix\)/.test(momentSection);
  if (heroVerdictAuthoritative && momentGrounded) {
    pass();
  } else {
    fail(
      'DCD-TEST-5',
      'Rep Call Review v2 editorialHeadline authority: the hero verdict (callReviewMapper summary.primaryIssue) must prefer the per-call editorialHeadline with primaryFixBundle.headline as the grounded fallback, and TheMomentSection must stay grounded on the bundle fields (never a generic/static template).',
      [
        'backend/src/lib/coaching/callReviewMapper.ts',
        'frontend/src/components/coaching/callReview/v2/sections/TheMomentSection.tsx',
      ],
    );
  }

  if (/proofSpeakerLabel/.test(momentSection) && /evidenceEnvelope\?\.speaker/.test(momentSection)) {
    pass();
  } else {
    fail(
      'DCD-TEST-7',
      'Rep Call Review v2 proof quote labels must follow evidenceEnvelope.speaker so prospect-side objection proof is not mislabeled as rep speech.',
      ['frontend/src/components/coaching/callReview/v2/sections/TheMomentSection.tsx'],
    );
  }

  if (/authoritative primary-fix headline/i.test(repV2Test) && /Slow down and make the review necessary before the time ask/.test(repV2Test)) {
    pass();
  } else {
    fail(
      'DCD-TEST-6',
      'Rep Call Review v2 tests must prove the source primary-fix headline reaches the visible rep surface.',
      ['frontend/src/components/coaching/callReview/v2/__tests__/RepCallReviewV2.smoke.test.tsx'],
    );
  }

  if (/Client said · 0:18/.test(repV2Test) && /You said · 0:18/.test(repV2Test)) {
    pass();
  } else {
    fail(
      'DCD-TEST-8',
      'Rep Call Review v2 tests must prove prospect-side primary-fix proof is labeled as client speech, not rep speech.',
      ['frontend/src/components/coaching/callReview/v2/__tests__/RepCallReviewV2.smoke.test.tsx'],
    );
  }
}

function checkAnalyticsAndObservabilityContracts() {
  requireIncludes(
    'DCD-ANALYTICS-0',
    '.cursor/rules/instrumentation.mdc',
    'Each event type has a defined metadata shape in shared contracts (`EventMetadataMap`).',
    'Instrumentation rules must keep EventMetadataMap as the analytics metadata contract.',
  );
  requireIncludes(
    'DCD-ANALYTICS-0',
    '.cursor/rules/instrumentation.mdc',
    'Required metadata must be present for that event type.',
    'Instrumentation rules must require metadata presence.',
  );

  const coachingRoute = read('backend/src/routes/coaching.ts');
  if (/isAnalyticsEventType\(eventType\)/.test(coachingRoute)) {
    pass();
  } else {
    fail(
      'DCD-ANALYTICS-1',
      'POST /api/coaching/analytics must reject unknown event types before persistence.',
      ['backend/src/routes/coaching.ts', 'shared/src/coaching/taxonomy.ts'],
    );
  }

  if (/validateAnalyticsEventMetadata|parseAnalyticsEventMetadata|analyticsEventMetadataSchema|AnalyticsEventMetadataSchema/.test(coachingRoute)) {
    pass();
  } else {
    fail(
      'DCD-ANALYTICS-2',
      'POST /api/coaching/analytics accepts arbitrary metadata without runtime validation against EventMetadataMap, so required metadata can be missing even though the docs say it is enforced.',
      ['backend/src/routes/coaching.ts', 'shared/src/coaching/contracts.ts', '.cursor/rules/instrumentation.mdc'],
    );
  }

  requireIncludes(
    'DCD-ANALYTICS-4',
    'backend/package.json',
    'test:regression:analytics-metadata',
    'Backend package must expose analytics metadata contract regression.',
  );
	  requireIncludes(
	    'DCD-ANALYTICS-5',
	    'backend/scripts/analyticsMetadataRegression.ts',
	    'validateAnalyticsEventMetadata',
	    'Analytics metadata regression must exercise runtime validation.',
	  );
	  requireIncludes(
	    'DCD-ANALYTICS-6',
	    'backend/src/lib/analytics/recordAnalyticsEvent.ts',
	    'validateAnalyticsEventMetadata',
	    'Analytics persistence boundary must validate metadata before writing AnalyticsEvent rows.',
	  );
	  requireIncludes(
	    'DCD-ANALYTICS-7',
	    'backend/src/lib/analyticsMetadataValidation.ts',
	    '}).strict()',
	    'Analytics metadata schemas must reject unknown top-level fields so raw transcripts, secrets, and customer data cannot ride along beside valid metadata.',
	  );

  const frontendApi = read('frontend/src/lib/api.ts');
  if (
    /AnalyticsEventType/.test(frontendApi) &&
    /trackAnalytics:\s*async\s*<[^>]*T\s+extends\s+AnalyticsEventType|trackAnalytics:\s*async\s*\(\s*eventType:\s*AnalyticsEventType/.test(frontendApi)
  ) {
    pass();
  } else {
    fail(
      'DCD-ANALYTICS-3',
      'frontend coachingApi.trackAnalytics is typed as string + Record<string, unknown>, so component callers can drift from AnalyticsEventType and EventMetadataMap before the request reaches the server.',
      ['frontend/src/lib/api.ts', 'shared/src/coaching/contracts.ts'],
    );
  }

  const backendPkg = JSON.parse(read('backend/package.json'));
  const backendScripts = backendPkg.scripts ?? {};
  const hasReadinessScript =
    Object.keys(backendScripts).some((name) => /test:regression:(ready|readiness)/.test(name)) &&
    (exists('backend/scripts/readinessRegression.ts') || exists('backend/scripts/readyRegression.ts'));
  if (hasReadinessScript) {
    pass();
  } else {
    fail(
      'DCD-OBS-READY-1',
      '/api/ready is documented as a deployment gate, but there is no dedicated readiness regression that proves database, queue, rateLimit, and storage checks produce ready/not_ready behavior.',
      ['backend/src/index.ts', 'backend/package.json', 'docs/ACCESS_CONTROL_ARCHITECTURE.md', 'docs/SCALABILITY_AUDIT.md'],
    );
  }

	  requireIncludes(
	    'DCD-OBS-READY-2',
	    'backend/src/app.ts',
	    'evaluateReadiness',
	    '/api/ready must use the reusable readiness evaluator covered by the behavior regression.',
	  );
	  requireIncludes(
	    'DCD-OBS-READY-2B',
	    'backend/src/app.ts',
	    'await driver.healthCheck()',
	    '/api/ready must actively probe storage instead of reporting only the configured storage backend.',
	  );
	  requireIncludes(
	    'DCD-OBS-READY-3',
	    'backend/src/lib/readiness.ts',
	    'dependencyUnavailable',
	    '/api/ready must return sanitized dependency failure codes instead of raw exception messages.',
	  );
	  requireIncludes(
	    'DCD-OBS-READY-4',
	    'backend/scripts/readinessRegression.ts',
	    'includes(\'db down\')',
	    'Readiness regression must prove raw dependency exception text is not returned in the public readiness payload.',
	  );

  const analysisRoute = read('backend/src/routes/analysis.ts');
  if (/console\.error\(['"](?:Analysis start error|Analysis rerun error|Coaching rerun error|Analysis cancel error|Get feedback error)/.test(analysisRoute)) {
    fail(
      'DCD-OBS-LOG-1',
      'Critical analysis route catch blocks still log raw Error objects and some return raw error.message details instead of using the structured request-id/Sentry error path.',
      ['backend/src/routes/analysis.ts', 'backend/src/middleware/errorHandler.ts', '.cursor/rules/instrumentation.mdc'],
    );
  } else {
    pass();
  }
}

function checkSecurityAndAiMeteringContracts() {
  requireIncludes(
    'DCD-AUTH-1',
    'docs/ACCESS_CONTROL_ARCHITECTURE.md',
    '`OrgMembership.orgRole` plus `Organization.tenantKind` are the only authorization source.',
    'Access control doc must keep OrgMembership/tenantKind authority explicit.',
  );
  requireIncludes(
    'DCD-AUTH-2',
    'backend/scripts/roleAuthorityHardeningRegression.ts',
    'ORG_MEMBERSHIP_REQUIRED',
    'Role-authority regression must prove missing memberships fail closed.',
  );
  requireIncludes(
    'DCD-AUTH-3',
    'backend/scripts/unauthorizedAccessHardeningRegression.ts',
    'routeInventory',
    'Unauthorized-access regression must keep an object-scope route inventory.',
  );
  requireIncludes(
    'DCD-AUTH-4',
    'backend/scripts/csrfHardeningRegression.ts',
    'CSRF_ORIGIN_INVALID',
    'CSRF regression must keep Origin/Referer enforcement visible.',
  );
  requireIncludes(
    'DCD-AI-METER-1',
    'docs/AI_TIER_MODEL_METERING_ARCHITECTURE.md',
    'npm run test:regression:ai-provider-coverage --workspace=backend',
    'AI metering docs must point to provider coverage regression.',
  );
  requireIncludes(
    'DCD-AI-METER-2',
    'backend/package.json',
    'test:regression:ai-provider-coverage',
    'Backend package must expose provider coverage regression.',
  );
  requireIncludes(
    'DCD-AI-METER-3',
    'backend/scripts/aiProviderCoverageRegression.ts',
    'new OpenAI',
    'Provider coverage regression must scan direct OpenAI client construction.',
  );
  requireIncludes(
    'DCD-AI-METER-4',
    'backend/scripts/aiProviderCoverageRegression.ts',
    'generateContent',
    'Provider coverage regression must scan direct Gemini generateContent calls.',
  );
}

function checkRepoPackageHygiene() {
  const pkg = JSON.parse(read('package.json'));
  for (const workspace of pkg.workspaces ?? []) {
    if (exists(workspace)) {
      pass();
    } else {
      warn(
        'DCD-PKG-1',
        'Root package.json names a workspace directory that is not present; this is already documented as a non-blocking decision gap.',
        ['package.json', workspace, 'docs/app-plan/README.md OQ-DOC-1'],
      );
    }
  }

  const managerDashboard = read('frontend/src/components/dashboard/tabs/ManagerDashboard.tsx');
  if (/legacy `TeamRosterTab`/.test(managerDashboard)) {
    warn(
      'DCD-COMMENT-1',
      'Active ManagerDashboard comment still points future readers at legacy TeamRosterTab.',
      ['frontend/src/components/dashboard/tabs/ManagerDashboard.tsx'],
    );
  } else {
    pass();
  }
}

function checkScriptIsDocumented() {
  requireIncludes('DCD-DOC-SCRIPT-1', 'package.json', 'test:doc-code-drift', 'Root package.json must expose the doc-code drift gate.');
  requireIncludes('DCD-DOC-SCRIPT-2', 'README.md', 'npm run test:doc-code-drift', 'README root scripts table must document the doc-code drift gate.');
  requireIncludes('DCD-DOC-SCRIPT-3', 'docs/app-plan/validation-fixture-plan.md', 'source-to-surface assertions', 'Validation fixture plan must keep source-to-surface assertions visible.');

  for (const file of ['scripts/runEndToEndSurfaceSmoke.mjs', 'scripts/runManagerFrontendSmoke.mjs']) {
    const text = read(file);
    if (/await stopChildTree/.test(text) && /process\.exit\(0\)/.test(text)) {
      pass();
    } else {
      fail(
        'DCD-SMOKE-RUNNER-1',
        'Smoke runners that start dev servers must await child shutdown and exit cleanly after success so CI proof is based on command status, not only success text.',
        [file],
      );
    }
  }
}

checkAuthorityInventoryGate();
checkTenantSecurityBlackBoxGate();
checkSrp002TelemetrySinkGate();
checkSrp004OpsClosureGate();
checkAppPlanIndex();
checkPipelineTruthMatchesDocs();
checkScoreAuthorityContract();
checkTestCoverageTracksActiveSurfaces();
checkAnalyticsAndObservabilityContracts();
checkSecurityAndAiMeteringContracts();
checkRepoPackageHygiene();
checkScriptIsDocumented();

for (const failure of failures) {
  console.error(`[FAIL] ${failure.id}: ${failure.message}`);
  for (const item of failure.evidence) console.error(`       - ${item}`);
}
for (const item of warnings) {
  console.warn(`[WARN] ${item.id}: ${item.message}`);
  for (const evidence of item.evidence) console.warn(`       - ${evidence}`);
}
console.log(`[PASS] ${passed} checks passed`);
console.log(`[SUMMARY] ${failures.length} failures, ${warnings.length} warnings${auditMode ? ' (audit mode)' : ''}`);

if (failures.length > 0 && !auditMode) process.exit(1);
