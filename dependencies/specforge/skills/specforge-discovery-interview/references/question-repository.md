# Discovery Interview Question Repository

Use this as a question repository, not a script. Select questions only after extracting what the user already answered from the current conversation, repo evidence, attached docs, and prior SpecForge decisions.

## Selection rules

For each possible question, decide:

- Known: answered by user, repo evidence, or prior docs. Do not ask again.
- Inferable: can be responsibly inferred and recorded as an assumption or researched default. Do not ask unless risk is high.
- Ask: missing answer changes product value, usability, feasibility, viability, security, privacy, compliance, data model, source of truth, implementation order, or launch risk.
- Defer: useful later but not needed before docs generation.

Ask no more than 5 initial questions. Ask no more than 3 follow-ups. If more are needed, group them by risk trigger and explain why.

## Core intake questions

| Module | Ask when | Candidate questions | Infer/default when |
| --- | --- | --- | --- |
| Product identity | App purpose, user, or problem is vague | What is the app in one sentence? Who is the primary user? What problem should it solve? | Infer wording from the brief and mark Assumption with impact. |
| Desired outcome | Success is undefined | What outcome would make the first version worth using? What user behavior proves value? | Infer from user goal and record success metrics as assumptions. |
| MVP boundary | Scope can sprawl | What must the first useful version do? What are 3 to 5 must-have features? What is explicitly out of scope? | Use a lean MVP if user gives no hard scope. |
| User journey | Main workflow is unclear | What is the primary start-to-finish journey? What must the user see or receive at the end? | Infer a likely happy path and flag it for review. |
| Roles and permissions | Any protected data or actions exist | What roles exist? Who can create, view, edit, approve, export, delete, or administer records? | Simple public/static apps can default to no roles. |
| Source of truth | Multiple surfaces or systems may own a decision | Which record, service, or user action should be the authority for status, eligibility, scoring, or display? | Define a proposed authority and verify during architecture docs. |
| Data and retention | App stores user, business, uploaded, or sensitive data | What data is collected? What must never be stored? What must users export or delete? | Low-risk transient data can default to minimal retention. |
| Risk triggers | Legal, safety, privacy, trust, or abuse exposure is possible | Does it involve minors, payments, UGC, messaging, file uploads, location, sensitive data, AI, or regulated decisions? | If not mentioned, ask once as a combined trigger question. |
| AI or automation | AI output, ranking, scoring, agents, or generated content exists | What can the model decide? What must it never decide? What tools or data can it access? Who reviews wrong outputs? | Treat AI as not-applicable when only Codex is used for development. |
| Payments and business | App charges users or affects revenue | Subscription, one-time payment, invoices, marketplace, in-app purchase, or free MVP? | Future monetization can be hypothesis, not implementation scope. |
| Platform | Platform changes architecture or policy | Web, mobile, desktop, extension, API, internal tool, or multi-platform? Any app-store or marketplace requirement? | Recommend web-first for most unknown greenfield MVPs unless mobile hardware/offline/push is core. |
| Technical constraints | User has existing stack/provider/budget/deadline constraints | Required stack, provider, launch region, deadline, budget ceiling, integrations, or files not to touch? | Research and recommend defaults if no hard constraint exists. |
| Existing repo | Code or docs already exist | What is the repo path? Should changes be docs-only? What files or areas are protected? | Greenfield mode if no repo is provided. |
| Operations | Production readiness matters | What environments, deployment, rollback, backups, monitoring, support, or incident needs exist before launch? | Prototype docs can default to lightweight ops with clear upgrade triggers. |
| Market and distribution | Growth, positioning, or channel affects MVP | Who discovers the app? What alternative do users use now? What makes them switch? | Record as business hypothesis if not needed for first implementation. |

## Follow-up modules

### Payments

Ask only if payment exists or is launch-blocking:

- What payment model is required for the first release?
- Are subscriptions, refunds, invoices, trials, taxes, or app-store payment rules involved?
- What payment actions need admin/support access?

### Minors, students, schools, or families

Ask only if the app targets or may attract minors/students/families:

- What age range is expected?
- Are guardians, schools, teachers, or administrators involved?
- What personal data is collected, retained, shared, exported, or deleted?
- Is qualified legal/privacy review needed before launch?

### UGC, messaging, public content, uploads, or marketplace

Ask only if users can create or share content, contact others, upload files, or transact:

- What content can users create, upload, publish, message, or sell?
- What abuse cases are realistic?
- What reporting, blocking, moderation, appeal, and retention behavior is required?

### AI, scoring, recommendations, or agents

Ask only if runtime AI or non-deterministic decisions are in scope:

- What inputs can the model use?
- What output classes are allowed?
- What output classes are disallowed?
- What source authority and provenance must be shown?
- What validation failures trigger bounded remediation?
- What final user-visible surface consumes the AI decision?

### Existing repo or hybrid planning

Ask only if a repo exists or the user mentions existing code:

- What repo path should be inspected?
- Should Codex avoid product code changes?
- Which docs are current authorities and which may be stale?
- What files, migrations, secrets, deployments, or customer data must not be touched?

## Question wording rules

Prefer questions that ask for constraints and outcomes, not implementation preferences.

Use:

- What must the first useful version accomplish?
- What is explicitly out of scope?
- Which roles can perform protected actions?
- What data must never be stored?
- What hard constraints exist?

Avoid unless user gave a hard constraint:

- What database do you want?
- What auth provider do you want?
- What test framework should be used?
- What hosting provider should be used?
- What observability tool should be used?

For avoided questions, research and recommend defaults later.

## Dynamic interview output

Return a compact state table:

| Area | Status | Basis | Action |
| --- | --- | --- | --- |
| Product identity | Known / ask / infer / defer | User-confirmed / repo-derived / assumption | Ask question, default, or proceed |

Then ask only the selected questions.
