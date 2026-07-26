# MarketForge Changelog

All notable changes to MarketForge will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.2.0] — 2026-05-20

### Added — Trust harness from `golden-mutation-trust-harness` skill

The most important methodology bake-in. The skill's core question:
> If I mutate the source-of-truth, does the downstream marketing output actually change?

Previously: MarketForge had documented producer-reconciliation cascades but no harness proving they fire.
Now: a mutation suite that mutates the golden fixture and verifies each oracle catches the wrongness.

#### New shared reference
- `_marketforge-shared/references/trust-harness-protocol.md` — codifies trust questions, source authority, blast radius, expected-values contract, harness architecture, mutation suite, pressure-test for the harness itself.

#### New subskill
- `marketforge-trust-harness` (Phase 11 step 7) — runs AFTER pressure-test + bias-audit. Pre-flight check requires marketing-qa PASS + pressure-test GOOD + self-test PASSED. Runs 12 mutation scenarios + producer-replay verification + harness pressure-test. Verdict: TRUST / PARTIAL TRUST / FAIL.

#### New oracles added to validator
- **Kill-criterion oracle** — every channel decision must declare `Kill criterion:`, `Reversal trigger:`, `Test window:`.
- **Window-type oracle** — compound channels (SEO, content, founder content, community, podcast) cannot have paid-window kill criteria (<90 days); paid channels (search, social, mobile, cold email) cannot have compound-window kill criteria (>=6 months).
- **Concentration-risk oracle** — flags single-channel budget allocations >50% (skips thresholds, ranges, benchmarks, hypotheticals).
- **Stage-presence oracle** — every copy-producing output (website-copy, landing-pages, ad-creative-brief, email-lifecycle, paid-search, paid-social) must declare target awareness stage.
- **Bias-flag oracle** — every D-grade citation must have commercial-bias flag within ±5 lines.
- **Supersession-stale-reference oracle** — when a DEC is marked `Status: Superseded`, consumer files still citing it (without "superseded" / "previously" / "historical" context) are flagged FIX-NEXT.
- **Cross-cite oracle (tightened)** — distinguishes between DEC declarations (`### [DEC-NNN] Title`) and references in body prose. References must point to a declared DEC.

#### Golden fixture for trust harness
- `examples/marketing-plan-golden/` — complete fixture with multiple ICPs (ICP-001 strong fit, ICP-002 lower fit), positioning, brand strategy, messaging, portfolio, website copy, paid search. 12 declared DECs across the producer-consumer chain.
- Passes strict + final validation with zero findings.

#### Mutation suite
- `tests/mutation/test_marketing_plan_mutations.py` — 16 tests covering 12 mutation scenarios + baseline + 3 harness pressure-test tests.

#### Wire-up
- Orchestrator Step 11 now includes `marketforge-trust-harness` between `bias-audit` and `agent-rules-update`.
- Completion criteria now require trust harness verdict TRUST / PARTIAL TRUST.

### Fixed
- `check_window_type_match` regex bug: `day\b` didn't match "days". Now `days?\b`.
- `check_cross_cite_validity` was treating any DEC mention as a "declaration." Now uses formal declaration detection.
- Concentration-risk oracle previously false-positive on threshold lines. Now skips thresholds, ranges, hypotheticals, benchmark phrases.

### Test count
- Previous: 66 tests passing.
- Now: 82 tests passing (+16 marketing-plan mutation tests).

## [1.1.0] — 2026-05-20

### Added — Pressure-test pass improvements
Based on critical review using `implementation-review-against-plan`, `full-slice-planner`, and `testing-strategy-and-tdd` methodologies:

- **Self-test subskill** (`marketforge-self-test`) — Phase 0 pre-flight that verifies skill integrity before orchestrator runs.
  - Subskill inventory check (all 71 subskills exist).
  - Shared reference inventory check.
  - DEC-NNN range collision detection.
  - Validator scripts executable check.
  - Top-level documentation check.

- **Producer / reconciliation matrix** (`producer-reconciliation-matrix.md`) — 14 producer events documented with downstream cascade.
  - New ICP discovered → 12 subskills re-run.
  - Positioning pivot → 12 subskills re-run.
  - Pricing change → 12 subskills re-run.
  - And 11 more producer events.

- **Hard-refuse gates** in orchestrator:
  - Gate A: Readiness <5/7 blocks paid subskills.
  - Gate B: Pre-PMF blocks >20% brand allocation.
  - Gate C: Channel concentration >50% requires explicit override.
  - Gate D: >4 active channels requires explicit override.
  - Gate E: Agentic mode without required MCPs.
  - Gate F: Hard-refuse content categories.
  - Gate G: Regulated domain without compliance plan.

- **Strengthened validator** (`scripts/validate_marketing_docs.py`):
  - AI cadence detection (three-word triplets, "Not just X — Y", "Where X meets Y", "Beyond X, beyond Y").
  - Evidence-grade presence checking on statistical claims.
  - Cross-cite validity checking (DEC-NNN references must exist in some file).
  - Stage-CTA mismatch detection.
  - DEC-NNN collision detection (header-declaration in multiple files).
  - Severity levels: BLOCK vs FIX-NEXT.

- **Real test suite** at `tests/`:
  - 66 tests covering unit, boundary, mutation, integration layers.
  - Mutation tests verify validator catches each banned phrase / stale ref.
  - Boundary tests on readiness thresholds (0/7 → 7/7) and channel scorer (7 → 35).
  - Paired-condition tests pair every "X is detected" with "clean content not falsely flagged."
  - Adapter / messy-fixture tests (empty file, non-UTF-8, 10K-line file, Unicode).
  - Verification evidence documented at `tests/VERIFICATION_EVIDENCE.md`.

- **Three protocol references** baked in from Anthropic skills:
  - `plan-pressure-test-protocol.md` (from `full-slice-planner`)
  - `implementation-review-protocol.md` (from `implementation-review-against-plan`)
  - `testing-strategy-protocol.md` (from `testing-strategy-and-tdd`)

- **Canonical example fixtures**:
  - `examples/marketing-plan-good-fixture/` — passes strict validation.
  - `examples/marketing-plan-bad-fixture/` — produces 25+ BLOCK findings.

- **Agentic mode operational artifacts**:
  - `examples/agentic-mode/approval-queue-template.md`
  - `examples/agentic-mode/daily-journal-template.md`
  - `examples/agentic-mode/mcp-wiring-example.md`

- **CHANGELOG.md** and **CONTRIBUTING.md**.

### Changed
- Validator `\bleverage\b` regex tightened (was: `\bleverage\b(?! \w+ to)`; now: `\bleverage\b`). The lookahead was too lenient — "leverage X to Y" is exactly the slop pattern.
- Validator `\bempower\b` regex tightened (same reasoning).
- Validator added severity tagging (BLOCK / FIX-NEXT).
- Validator added `--include-skill-md` flag (default: exclude SKILL.md files since they're skill instruction files, not marketing output).

### Fixed
- Encoding crash on Windows when validator prints Unicode em-dash (auto-reconfigure stdout to UTF-8 with replace error handler).

## [1.0.0] — 2026-05-20

### Added — Initial release

- **Orchestrator** (`marketforge`) — 11-phase sequenced workflow.
- **71 subskills** across phases 1-11:
  - Phase 1: Foundation (8): discovery, readiness-check, jtbd, icp-persona, positioning, awareness-stages, voice-of-customer, competitive-intel
  - Phase 2: Strategy (5): channel-strategy, portfolio-construction, brand-vs-performance, budget-planning, okr-quarterly-planning
  - Phase 3: Brand (5): brand-strategy, messaging-architecture, naming-and-tagline, distinctive-assets, narrative-and-story
  - Phase 4: Website + Content (6): website-copy, landing-pages, seo-strategy, geo-llmo, content-strategy, content-calendar
  - Phase 5: Paid (6): paid-search, paid-social, paid-mobile, ad-creative-brief, influencer-program, affiliate-program
  - Phase 6: Outbound (4): cold-email, cold-linkedin-outreach, direct-mail-abm, cold-calling
  - Phase 7: Organic + Social (11): linkedin-organic, x-twitter-organic, youtube-strategy, tiktok-organic, reddit-strategy, community-led-growth, podcast-strategy, pr-earned-media, newsletter-sponsorships, engineering-as-marketing, founder-content
  - Phase 8: Lifecycle (9): email-lifecycle, sms-program, push-notifications, in-app-messaging, referral-program, loyalty-program, onboarding-activation, customer-marketing, retention-churn
  - Phase 9: CRO + Measurement (6): landing-cro, pricing-strategy, ab-testing-discipline, attribution-stack, mmm-incrementality, analytics-stack
  - Phase 10: Visual Assets (5): visual-direction, ad-creative-production, social-imagery, website-imagery, video-scripts
  - Phase 11: Launch + QA (6): launch-plan, execution-calendar, marketing-qa, pressure-test, bias-audit, agent-rules-update

- **22 shared references** including anti-slop rubric, opinionated decision template, evidence grading rubric, commercial bias map, channel scoring matrix, business-model-channel-fit, kill criteria by channel, guided marketing interview, scope/tier model, mode detection, attribution protocol, AI saturation watch, agentic operations protocol, skill detection, glossary, portfolio construction, marketing-skills bridge, banana bridge, VisualForge bridge, SpecForge bridge.

- **4 templates**: ICP, persona, JTBD, message-stage matrix.

- **4 Python scripts**: validate_marketing_docs, channel_scorer, readiness_check, evidence_grader.

- **Top-level docs**: README, USAGE_GUIDE, ARCHITECTURE, MARKETING_GUIDE_V3, AGENTS.

## Migration notes

### From 1.0.0 to 1.1.0
- **Run `marketforge-self-test` first** if upgrading an in-progress marketing plan; new self-test is now required pre-flight.
- **Re-validate existing marketing-plan/** outputs with new validator; AI cadence + stage-CTA + cross-cite checks may surface new findings.
- **Decision logs** are backwards compatible; new severity tags only apply to new findings.
- **No schema migration** required for existing plans.

## Future roadmap

### v1.2 (planned)
- Property-based fuzzing of validator via `hypothesis`.
- Mutation testing automation via `mutmut`.
- Concurrent-orchestrator safety tests.
- Internationalization / non-English market support.
- "What changed since last run" diff helper.

### v2.0 (vision)
- Live MCP integrations for agentic mode (Klaviyo, Apollo, Meta Ads, Google Ads).
- End-to-end agentic operation with KPI dashboards.
- Multi-product portfolio support.
- Marketing-team multi-user approval workflows.
