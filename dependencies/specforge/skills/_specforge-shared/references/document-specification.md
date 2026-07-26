# App Documentation Specification

Default output directory: `docs/app-plan/`.

The root of `docs/app-plan/` is a routing surface, not a dumping ground. Keep
`README.md` at the root, then organize generated docs by product purpose.
Focused and existing-repo packages should use descriptive lowercase kebab-case
filenames inside the relevant folder. Legacy flat filenames remain accepted
only when repairing older packages.

## Scope profiles

Use one of these profiles before generating or validating docs:

- Full package: create every required document listed below, plus `auditability/documentation-quality-review.md` after review.
- Focused package: create or update only the docs needed for the requested outcome, plus `README.md`, `auditability/decision-log.md`, and `auditability/research-ledger.md` when the work creates assumptions, decisions, sources, or cross-doc links. Add `auditability/documentation-quality-review.md` for material changes.
- Existing repo repair: inspect repo evidence first, then update the smallest set of docs required to make docs truthful. Include `auditability/documentation-audit.md` when repo-derived facts or stale docs were audited.

Do not create empty not-applicable documents in focused packages. In focused mode, record omitted docs in `README.md` with the reason they were outside scope and the trigger that would require them later.

Every generated document must include:

- Title
- Purpose
- Status: Draft, Repo-derived, User-confirmed, Standard-backed, Assumption-heavy, Needs-user-confirmation, or Not-applicable-with-reason
- Inputs used
- Sources and basis
- Assumptions
- Decisions
- Decision depth policy: material decisions must use options, pros, cons, recommendation, verification, and reversal trigger
- Open questions
- Traceability links to related docs
- Last generated or last verified date

Every material recommendation must include:

- Decision ID
- Source type: User-confirmed, Repo-derived, Standard-backed, Assumption, or AI-recommended default
- Options considered
- Pros and cons
- Final recommendation
- Why this is the best course
- Why not the easier shortcut, when relevant
- Verification method
- Reversal trigger
- Related requirements, risks, controls, ADRs, and docs

Every requirement table must include:

- Requirement ID
- Requirement
- Source type: User-confirmed, Repo-derived, Standard-backed, or Assumption
- Source detail
- Affected role or component
- Data touched
- Risk level
- Verification method
- Related docs

Rules:

- Use `Unknown` with an impact note when information is missing.
- Do not use filler.
- In a full package, if a required document is not applicable, still create it with `Status: Not-applicable-with-reason`, an applicability decision, reasons, and reactivation triggers. In a focused package, omit not-applicable docs and record the omission in `README.md`.
- Security, privacy, payments, minors, admin actions, AI tools, production config, and data deletion must never be marked low risk without evidence.
- When a required document is in scope and evidence is available, create or update the actual document. Do not only write a recommendation that a future user or agent should create it. If a living doc already owns the area, update and route that living doc instead of creating a duplicate authority.

## Focused package canonical filenames

Use these locations for new packages:

| Canonical path | Legacy flat alias |
| --- | --- |
| `README.md` | `00-docs-index.md` |
| `product/01-product-brief.md` | `01-product-brief.md` |
| `product/02-prd.md` | `02-prd.md` |
| `product/03-feature-scope.md` | `03-feature-scope.md` |
| `product/04-user-flows-and-screen-map.md` | `04-user-flows-and-screen-map.md` |
| `product/05-ux-ui-content-contract.md` | `05-ux-ui-content-contract.md` |
| `architecture/06-architecture.md` | `06-architecture.md` |
| `architecture/07-adr-index.md` | `07-adr-index.md` |
| `architecture/adr/` | `adr/` |
| `data-and-api/08-data-model-and-data-contracts.md` | `08-data-model-and-data-contracts.md` |
| `data-and-api/09-api-and-integration-contracts.md` | `09-api-and-integration-contracts.md` |
| `security/10-security-design.md` | `10-security-design.md` |
| `security/11-threat-model.md` | `11-threat-model.md` |
| `engineering/12-engineering-rules.md` | `12-engineering-rules.md` |
| `engineering/13-testing-quality-release-observability.md` | `13-testing-quality-release-observability.md` |
| `engineering/14-ai-development-guardrails.md` | `14-ai-development-guardrails.md` |
| `engineering/15-blast-radius-and-change-risk.md` | `15-blast-radius-and-change-risk.md` |
| `auditability/documentation-audit.md` | `16-documentation-audit.md`, `documentation-audit.md` |
| `auditability/documentation-quality-review.md` | `17-document-quality-review.md`, `documentation-quality-review.md` |
| `security/18-privacy-data-protection.md` | `18-privacy-data-protection.md` |
| `product/19-business-gtm-monetization.md` | `19-business-gtm-monetization.md` |
| `security/20-compliance-policy-and-review.md` | `20-compliance-policy-and-review.md` |
| `security/21-trust-safety-abuse-prevention.md` | `21-trust-safety-abuse-prevention.md` |
| `engineering/22-environment-config-secrets.md` | `22-environment-config-secrets.md` |
| `engineering/23-operational-runbooks.md` | `23-operational-runbooks.md` |
| `engineering/24-dependency-supply-chain.md` | `24-dependency-supply-chain.md` |
| `engineering/25-cost-capacity-performance.md` | `25-cost-capacity-performance.md` |
| `product/26-analytics-events-metrics.md` | `26-analytics-events-metrics.md` |
| `product/27-glossary-taxonomy.md` | `27-glossary-taxonomy.md` |
| `product/28-platform-feature-contracts.md` | `28-platform-feature-contracts.md` |
| `implementation/29-ai-implementation-task-plan.md` | `29-ai-implementation-task-plan.md` |
| `auditability/decision-log.md` | `30-decision-and-defaults-register.md`, `decision-log.md` |
| `assurance/product-assurance-contract.md` | `31-product-assurance-contract.md` |
| `assurance/source-of-truth-map.md` | `32-source-of-truth-map.md` |
| `assurance/decision-boundary-matrix.md` | `33-decision-boundary-and-decision-matrix.md` |
| `assurance/surface-authority-map.md` | `34-surface-and-output-authority-map.md` |
| `assurance/validation-fixture-plan.md` | `35-assurance-fixtures-and-validation.md` |
| `auditability/documentation-lifecycle.md` | `36-documentation-authority-lifecycle.md` |
| `auditability/research-ledger.md` | `99-research-ledger.md`, `research-ledger.md` |

Folder meanings:

- `product/`: product and user-facing product contracts.
- `architecture/`: system structure and ADRs.
- `data-and-api/`: persisted data, API, DTO, integration, and schema contracts.
- `security/`: security, privacy, compliance, threat, and abuse controls.
- `engineering/`: engineering rules, release, observability, operations, dependencies, costs, and change-risk controls.
- `assurance/`: product-truth, source-of-truth, decision-boundary, surface-authority, and validation-fixture controls.
- `auditability/`: meta-docs, research, quality review, documentation audit, decision log, and documentation lifecycle.
- `implementation/`: implementation task plan and post-docs implementation artifact pack.

## Required documents

### 00-docs-index.md

Required sections:

- Document map
- Generation context
- App summary
- Source and evidence policy
- Source register
- Assumption register
- Open question register
- Decision register
- Decision recommendation policy
- Defaults adopted without user input
- Risk register
- Requirement ID map
- Terminology and ID registry
- Change control rules

### 01-product-brief.md

Required sections:

- One sentence app definition
- Problem statement
- Target audience
- Non-target audience
- User roles
- Core value proposition
- Product boundaries
- Success metrics
- Failure metrics
- Monetization hypothesis
- Marketing positioning
- Competitor and alternative categories
- Explicit non-goals

### 02-prd.md

Required sections:

- Product overview
- Scope
- User stories
- Acceptance criteria
- Functional requirements
- Non-functional requirements
- Feature-by-feature edge cases
- Empty states
- Error states
- Permissions
- Analytics events
- Abuse and misuse cases
- Security and privacy notes
- Traceability matrix

### 03-feature-scope.md

Required sections:

- MVP features
- V1 features
- Future backlog
- Out-of-scope list
- Dependency map
- Feature risk rating
- Feature acceptance gates

### 04-user-flows-and-screen-map.md

Required sections:

- Role-based flows
- Entry points
- Happy paths
- Error paths
- Permission denied paths
- Screen inventory
- Navigation map
- State transition map
- Permission-dependent UI states

### 05-ux-ui-content-contract.md

Required sections:

- Design principles
- Layout system
- Typography contract
- Color and contrast contract
- Component contract
- State contract: loading, empty, error, success, disabled, offline
- Form contract
- Content style guide
- Accessibility contract
- Responsive contract
- Localization readiness

### 06-architecture.md

Required sections:

- Architecture summary
- Goals and constraints
- Architecture principles
- Future capability map
- Evolution and extension strategy
- Bounded-context and authority ownership map
- Extension-point register and activation proofs
- C4 context diagram
- C4 container diagram
- Component map
- Runtime flows
- Deployment view
- Environment model
- Dependency map
- Failure modes
- Performance budgets
- Scalability assumptions
- Security-relevant architecture choices
- Blast radius overview
- Tradeoffs

### 07-adr-index.md and adr files

Required sections:

- ADR list
- Decision status
- Decision owner or source
- Decision date
- Decision context
- Options considered
- Decision
- Why this is the best course
- Consequences
- Reversal trigger

### 08-data-model-and-data-contracts.md

Required sections:

- Data inventory
- Data classification
- Entity model
- Data dictionary
- Validation rules
- Ownership and access rules
- Data lifecycle
- Retention and deletion
- Backup and restore notes
- Migration rules
- Event and job payloads
- Privacy notes

### 09-api-and-integration-contracts.md

Required sections:

- API style
- Auth model
- Endpoint inventory
- Request schemas
- Response schemas
- Error contract
- Pagination contract
- Rate limit contract
- Idempotency rules
- Webhook contract, if applicable
- Third-party integration contract
- OpenAPI, GraphQL, gRPC, or AsyncAPI output plan

### 10-security-design.md

Required sections:

- Security goals
- Security non-goals
- Trust boundaries
- Authentication
- Authorization
- Session management
- Input validation
- Output handling
- Secrets management
- Encryption plan
- Audit logging
- Abuse prevention
- Dependency and supply chain controls
- Security requirements mapped to standards
- Security testing requirements

### 11-threat-model.md

Required sections:

- Assets
- Actors
- Entry points
- Trust boundaries
- Data flow diagram
- Threat analysis
- Abuse cases
- Control mapping
- Residual risk
- Security assumptions
- Review triggers

### 12-engineering-rules.md

Required sections:

- Repo rules
- Folder structure
- Naming rules
- Code style
- Dependency policy
- Error handling rules
- Logging rules
- Environment variable rules
- Migration rules
- Pull request checklist
- Protected files and high-risk areas
- Documentation update policy

### 13-testing-quality-release-observability.md

Required sections:

- Quality model
- Unit test strategy
- Integration test strategy
- End-to-end test strategy
- Contract test strategy
- Accessibility checks
- Security checks
- Performance checks
- CI quality gates
- Release checklist
- Rollback plan
- Monitoring plan
- Alerting plan
- Incident response outline

### 14-ai-development-guardrails.md

Required sections:

- AI operating rules
- Codex task contract
- Allowed changes
- Blocked changes
- Approval gates
- Research rules
- Diff review rules
- Dependency approval rules
- Secret handling rules
- Production access rules
- Prompt templates
- No-shortcut decision protocol
- Root-cause analysis requirements
- Existing repo documentation update rules
- AI feature safety rules, if the app includes AI

### 15-blast-radius-and-change-risk.md

Required sections:

- Critical assets
- High-risk workflows
- Protected boundaries
- Change risk levels
- Blast radius by component
- Blast radius by data type
- Required controls by risk level
- Required tests by risk level
- Rollback and containment notes
- Documentation impact matrix

### 16-documentation-audit.md / documentation-audit.md

Required only in existing repo mode.

Required sections:

- Repo scan summary
- Existing docs inventory
- Code-derived facts
- Stale docs found
- Missing docs found
- Conflicts between docs and code
- Updated docs
- Remaining gaps
- Evidence paths
- Commands run

### 17-document-quality-review.md / documentation-quality-review.md

Required after full-package generation.

Required sections:

- Review summary
- Validation result
- Anti-slop findings
- Traceability findings
- Cross-document consistency findings
- Source coverage findings
- Missing evidence
- Highest-risk assumptions
- Required fixes applied
- Remaining gaps

### 18-privacy-data-protection.md

Required sections:

- Data minimization rules
- Personal data inventory
- Sensitive data inventory
- Data not to collect
- Collection purpose by data type
- Consent and notice points
- User access, export, correction, and deletion behavior
- Retention and deletion schedule
- Analytics and tracking rules
- Cookie or local storage rules, if applicable
- Vendor and third-party data sharing table
- Age and child-data screening
- Privacy risk register
- Review-needed items

### 19-business-gtm-monetization.md

Required sections:

- Business model hypothesis
- Monetization model
- Pricing and packaging assumptions
- Free tier or trial rules, if applicable
- Payment and subscription implications
- Go-to-market channels
- Launch positioning
- Competitor and alternative analysis
- Acquisition funnel
- Activation and retention metrics
- Support and feedback channels
- Business risks and invalidation signals

### 20-compliance-policy-and-review.md

Required sections:

- Applicability decision
- Jurisdictions and launch regions
- Platform policy map
- App store or marketplace review requirements, if applicable
- Payments and tax review triggers
- Accessibility compliance target
- Privacy and data protection review triggers
- Children, minors, and age-gating review triggers
- AI regulatory review triggers, if applicable
- Health, finance, education, employment, biometrics, or legal-domain review triggers
- Terms, privacy policy, and user notice requirements
- Qualified review needed

### 21-trust-safety-abuse-prevention.md

Required sections:

- Applicability decision
- Abuse surface map
- User-generated content risks, if applicable
- Messaging and social interaction risks, if applicable
- Marketplace or transaction abuse, if applicable
- AI output abuse, if applicable
- Minor-safety risks, if applicable
- Reporting and appeal flows
- Moderation and enforcement states
- Rate limits and anti-spam controls
- Admin and moderator abuse controls
- Safety logging and privacy limits

### 22-environment-config-secrets.md

Required sections:

- Environment inventory
- Environment purpose and isolation
- Config variable inventory
- Secret inventory without secret values
- Secret storage and rotation rules
- Local development safety rules
- Test and staging data rules
- Production access rules
- Third-party credential rules
- Feature flag rules
- Config validation rules
- Leak prevention and response

### 23-operational-runbooks.md

Required sections:

- Production readiness checklist
- Deployment runbook
- Rollback runbook
- Backup and restore runbook
- Database migration runbook
- Incident triage runbook
- Security incident runbook
- Outage communication templates
- Maintenance windows
- Post-incident review template

### 24-dependency-supply-chain.md

Required sections:

- Dependency inventory policy
- Package manager and lockfile rules
- Dependency approval policy
- Vulnerability scanning requirements
- License review requirements
- SBOM plan
- Build provenance plan
- CI/CD supply-chain risks
- Artifact integrity rules
- Third-party service risk register
- Update and patch cadence

### 25-cost-capacity-performance.md

Required sections:

- Capacity assumptions
- Traffic and usage model
- Performance budgets
- Rate limits and quotas
- Storage growth model
- Background job capacity
- AI or external API cost controls, if applicable
- Cloud and vendor cost drivers
- Cost alerts and budget thresholds
- Scaling triggers
- Performance test plan

### 26-analytics-events-metrics.md

Required sections:

- Measurement goals
- Product event taxonomy
- Event naming contract
- Event payload contract
- Privacy-safe analytics rules
- Consent and opt-out behavior, if applicable
- Funnel metrics
- Activation metrics
- Retention metrics
- Reliability metrics
- Security and abuse metrics
- Data retention for analytics


### 27-glossary-taxonomy.md

Required sections:

- Canonical glossary
- Forbidden or ambiguous terms
- Role ID registry
- Feature ID registry
- Requirement ID registry
- Entity and data object registry
- API operation ID registry
- Screen ID registry
- Event ID registry
- Component ID registry
- Risk and control ID registry
- ADR ID registry
- Naming rules
- Rename and deprecation rules
- Requirement impact map

### 28-platform-feature-contracts.md

Required sections:

- Platform applicability matrix
- Web contract
- Mobile contract
- PWA and offline contract
- Push notification contract
- Email and SMS contract
- File upload and media contract
- Payments and subscriptions contract
- Admin and support tooling contract
- Search and indexing contract
- Webhook and event delivery contract
- Third-party integration edge cases
- Provider policy review-needed items
- Requirement impact map

### 29-ai-implementation-task-plan.md

Required sections:

- Implementation principles
- Vertical slice map
- Task dependency graph
- Task contract template
- Feature slice tasks
- High-risk task gates
- Root-cause and decision-depth gates
- Protected files and components
- Required tests per task
- Required docs updates per task
- Rollback or containment per task
- Codex prompt templates
- Do-not-build-yet list
- Assumptions blocking implementation
- Requirement impact map
- Future consumer and foundation seam map

### Post-docs implementation artifacts

Use `$specforge-implementation-artifacts` after the core docs package has been generated or repaired, reviewed, and strictly validated, when the user asks for implementation documents, implementation artifacts, build docs, coding handoff docs, engineering execution docs, or task specs.

Default output directory:

```text
docs/app-plan/implementation/
```

This post-docs package is not a substitute for the core docs. It reads the core docs, resolves source-of-truth conflicts first, researches current official implementation guidance for the selected stack, and creates concrete build artifacts that future Codex coding work can execute.

Create only applicable artifacts. Record omitted artifacts in `docs/app-plan/implementation/README.md` with the reason and reactivation trigger.

Potential artifacts:

- `README.md`
- `implementation-roadmap.md`
- `vertical-slice-specs.md`
- `repo-change-map.md`
- `data-migration-and-backfill-plan.md`
- `api-and-contract-implementation.md`
- `ui-implementation-contract.md`
- `state-jobs-and-runtime-flow.md`
- `security-privacy-implementation-controls.md`
- `ai-decision-implementation-matrix.md`
- `verification-and-test-harness.md`
- `release-rollout-runbook.md`
- `codex-implementation-prompts.md`
- `implementation-risk-register.md`

Every implementation artifact must map product intent through source-of-truth ownership, affected files or proposed file locations, data/API/UI/runtime impacts, verification gates, rollout/rollback, observability, and required docs updates. It must also map approved later capabilities to the foundation authority they extend, classify build-now versus document-only seams, name a current liveness consumer for every planted seam, and forbid a later parallel authority. Validators and tests are backstops; they must not become the primary source of product intelligence when an upstream product, data, API, AI, or permission decision should own the behavior.

Validate the implementation pack before marking it ready:

```bash
python .agents/skills/_specforge-shared/scripts/validate_implementation_artifacts.py --docs-dir docs/app-plan --strict
```

When running from the SpecForge plugin checkout, use:

```bash
python skills/_specforge-shared/scripts/validate_implementation_artifacts.py --docs-dir docs/app-plan --strict
```

Add `--existing-repo` for repo-derived implementation evidence. Add `--require-ai-matrix` when runtime AI, semantic decisions, generated content, ranking, scoring, classification, recommendations, or model-owned outputs are in scope. The validator checks required implementation artifacts, source labels, traceability, evidence paths or proposed paths, slice completeness, verification coverage, rollback, observability, documentation updates, weak generic language, placeholders, and pack-level surface coverage.


### 30-decision-and-defaults-register.md / decision-log.md

Required after full-package generation.

Required sections:

- Decision support policy
- Decision-blocking questions
- User-confirmed decisions
- AI-recommended defaults
- Options considered
- Pros and cons
- Final recommendations
- Source basis
- Assumptions and impact
- Risks and mitigations
- Reversal triggers
- Decisions requiring user confirmation
- No-shortcut review log
- Root-cause review notes, if existing repo mode
- Requirement impact map


### Assurance extension docs

Create docs 31-36 only when the assurance extension is triggered by the applicability decision in `$specforge-assurance-architecture`.

For focused or existing-repo packages, use the canonical organized locations:
`assurance/product-assurance-contract.md`,
`assurance/source-of-truth-map.md`,
`assurance/decision-boundary-matrix.md`,
`assurance/surface-authority-map.md`,
`assurance/validation-fixture-plan.md`, and
`auditability/documentation-lifecycle.md`.

If the app is Tier 0, do not create filler docs. Record `not-applicable-with-reason` in `README.md` and `auditability/decision-log.md`.

If the app is Tier 1, Codex may either create the assurance docs or add the required sections into existing docs, as long as `README.md` records where the sections live.

If the app is Tier 2 or Tier 3, create the full docs below.

### 31-product-assurance-contract.md

Required sections:

- Applicability decision
- App claims and decisions
- Claims the app must never fake
- User trust dependencies
- Evidence requirements
- Low-confidence behavior
- Limited, pending, and unavailable states
- Human or qualified review triggers
- Traceability to requirements

### 32-source-of-truth-map.md

Required sections:

- Authority inventory
- Decision-to-authority table
- Source freshness rules
- Validation and provenance rules
- Remediation and fail-closed rules
- Downstream consumer map
- Status precedence rules
- Fallback retirement rules
- Test proof map

### 33-decision-boundary-and-decision-matrix.md

Required sections:

- Applicability decision
- Decision owner inventory
- Human-owned decisions
- Product policy or rule-engine decisions
- External-provider-owned decisions
- AI-owned or automated decisions, if applicable
- Deterministic-owned validations
- Disallowed hidden domain logic
- Domain-determinism exception register
- Prompt and model stage registry, if applicable
- Decision matrix template
- Examples and counterexamples requirements
- Bounded remediation rules
- Prompt compaction rules, if applicable
- Cost and metering notes, if applicable

### 34-surface-and-output-authority-map.md

Required sections:

- Surface and output inventory
- First-useful-viewport questions
- Source-to-surface table
- DTO, API, report, and export ownership
- Display-copy ownership
- Empty, limited, pending, and unavailable states
- Role and filter rules
- Object identity rules
- Screenshot, geometry, or export rendering checks
- Debug label policy

### 35-assurance-fixtures-and-validation.md

Required sections:

- Validation ladder
- Golden scenario catalog
- Perturbation matrix
- Source-to-surface assertions
- Role, API, browser, and export smoke tests
- Synthetic tests before paid or scarce runtime calls
- One production-path or model-runtime proof, if applicable
- Regression ownership
- Stop condition

### 36-documentation-authority-lifecycle.md

Required sections:

- Documentation authority hierarchy
- Active living docs
- Historical docs
- Generated inventory rules
- Marketing docs rules
- Future backlog routing
- Link and file-map sanity checks
- Code-vs-doc audit rules
- Deletion and retirement rules
- Agent instruction routing

### 99-research-ledger.md / research-ledger.md

Required after full-package generation.

Required sections:

- Research status
- Source entries
- Sources rejected or unavailable
- Requirements affected by source
- Draft sources used only as awareness
- Stack-specific docs checked
- Date checked
