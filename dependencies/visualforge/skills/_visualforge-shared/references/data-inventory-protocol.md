# Data Inventory Protocol

Design that ignores the data layer ends up either inventing fields that don't exist or missing fields that do. This protocol makes VisualForge data-aware: before designing screens and components, read what the backend actually produces.

## When this runs

- **Retrofit mode:** always. Critical for not inventing or missing fields.
- **Specforge-enhanced mode:** when Specforge has data contracts (`docs/app-plan/data/*.md` typically), read them as the data inventory.
- **Greenfield mode:** skip — there is no data yet. But the data shape designed during VisualForge becomes input for whoever builds the backend.

Invoked from `visualforge-ux-flows` and `visualforge-component-system` in retrofit mode, before screen specs are written. Output is also consumed by `ia-restructuring-protocol.md`.

## What to read

### Tier A — Authoritative schemas

- **OpenAPI / Swagger:** `openapi.yaml`, `swagger.json`, `*.openapi.yml`.
- **GraphQL schema:** `schema.graphql`, `*.graphql`, GraphQL introspection output.
- **gRPC / proto:** `*.proto`.
- **Database schemas:**
  - Prisma: `schema.prisma`.
  - Drizzle: `schema.ts` in `db/`.
  - TypeORM: `*.entity.ts`.
  - Sequelize / Mongoose: model files.
  - Raw SQL migrations: `migrations/`, `db/migrations/`.
- **JSON Schema files** for any internal data contracts.
- **Specforge data contracts:** `docs/app-plan/data/*.md` if present.

### Tier B — Data shape in code (when no formal schema)

- TypeScript interfaces / types in `types/`, `models/`, `api/`.
- Zod / Yup / Valibot schemas for API parsing.
- TanStack Query / SWR / Apollo query definitions — extract response shapes.
- State management slices (Redux, Zustand, Jotai) — observed state shapes.
- Mock data, fixtures, seed files.

### Tier C — Generated data (sample data the app actually produces)

When possible, sample real data in the dev environment:

- Run a representative API call and capture the response shape and value ranges.
- Look at fixture files (`fixtures/`, `seed/`, `__fixtures__/`).
- Look at test data factories (`factories/`, `*.factory.ts`).

This catches fields that exist in code but are always-null, always-empty, or have a value range different from what the schema suggests.

## What to capture per entity

For every entity surfaced from Tier A/B/C, produce a record:

```markdown
### Entity — [Name]

- **Source:** [file path + line if applicable]
- **Tier:** A (authoritative) | B (code-shape) | C (sampled)
- **Description:** one line.
- **Fields:**

| Field | Type | Required | Range / cardinality | Display category | Sensitive |
|---|---|---|---|---|---|
| id | uuid | yes | unique | hidden / identifier | no |
| name | string | yes | 1–80 chars | primary heading | no |
| email | string | yes | valid email | identifier / contact | yes (PII) |
| created_at | timestamp | yes | recent dates | metadata / date display | no |
| metadata | json | no | arbitrary | rare display / debug | depends |
| internal_score | float | yes | 0.0–1.0 | hidden / operational | yes (internal) |

- **Relations:** [Entity X — kind (one-to-one, one-to-many, many-to-many)].
- **Lifecycle:** created when [event]; updated when [event]; soft-deleted / hard-deleted on [event].
- **Permissions:** which roles can read / write each field (if surfaced from code).
- **Notes:** anything that affects design (always-loaded vs lazy, paginated vs full, search-indexed, real-time vs polled).
```

## Field classification — `Display category`

For every field, classify how it should appear in UI:

- **identifier:** name, ID, slug — appears in headings, breadcrumbs, URLs.
- **primary heading:** the main visible label of the record.
- **secondary:** subtitle, supporting attribute.
- **metadata:** dates, counts, status — appears in chrome, headers, lists.
- **content:** body text, descriptions — primary content area.
- **media:** image, video, file — needs aspect-ratio + lazy-load.
- **measure / metric:** numeric, often charted or shown as KPI.
- **relation reference:** foreign-key link to another entity.
- **status / enum:** small fixed set, often rendered as badge / chip.
- **boolean:** often rendered as switch / checkbox / indicator dot.
- **timestamp:** rendered as relative or absolute date.
- **rich content:** Markdown / HTML / blocks — needs renderer.
- **operational / hidden:** scoring, flags, debug — should not appear in normal UI.
- **sensitive:** PII, financial, secret — needs masking / disclosure rules.

This classification drives:

- Which component renders the field (text, badge, avatar, image, date, chart, etc.).
- Whether the field appears in a card preview vs detail page only.
- Whether the field is searchable / filterable / sortable.
- Whether the field appears for some roles and not others.
- Whether the field requires special accessibility treatment (e.g., sensitive fields need explicit disclosure controls).

## Data-design crosswalk

After the inventory is complete, produce a crosswalk:

| Screen | Entity | Fields surfaced | Fields omitted (with reason) | Fields needed-but-missing |
|---|---|---|---|---|
| /team/overview | TeamMetric, Team | team.name, team.member_count, metric.daily_active, metric.revenue | metric.internal_score (operational) | None |
| /team/members | Member, User | user.name, user.avatar, user.role, member.last_active, member.invite_status | user.password_hash (sensitive), user.feature_flags (operational) | None |
| /account | User | user.name, user.email, user.avatar | user.internal_score, user.team_ids (relation) | user.preferred_language (missing from current schema — flag for backend) |

The crosswalk is the contract: every screen design references the crosswalk for its data; if the design needs a field that isn't in the inventory, flag it as a backend gap and decide whether to wait for the field, design with a placeholder, or design without it.

## Inventing-fields prevention

When writing screen specs and component specs in retrofit mode:

- Every data point displayed must reference a field in the data inventory.
- If a design needs a field that doesn't exist, do not silently render a mock — write a `BackendGap` entry:

```markdown
### BackendGap — [SCR-NNN] / [field name]

- **Screen:** [SCR-ID]
- **Needed field:** [name + type + purpose]
- **Why needed:** [design rationale]
- **Backend impact:** [new field, new endpoint, new aggregation]
- **Resolution:** [wait for backend / placeholder for now / cut from design]
- **Owner:** [backend team / product]
```

`BackendGap` entries live in `docs/design-system/retrofit/backend-gaps.md`.

## Forgetting-fields prevention

After the crosswalk is built, the opposite check: every entity in the data inventory must appear in *some* screen, or be explicitly justified as not displayed.

For each entity:

- If displayed → list which screens.
- If not displayed → mark as operational / hidden / sensitive, justify why no user-facing surface exists.

Entities with no user-facing surface and no explicit operational justification are a finding — likely the team has data they're not surfacing, which is a missed product opportunity.

For each such finding produce a `MissingSurface` entry:

```markdown
### MissingSurface — [Entity]

- **Entity:** [name]
- **Fields:** [key fields]
- **Why this matters:** [why the data being unused is a missed opportunity]
- **Suggested surface:** [proposed page, component, or surface where this data would help users]
- **Persona benefit:** [which persona benefits]
- **Priority:** P0 / P1 / P2.
```

`MissingSurface` entries flow into `ia-restructuring.md`'s "Missing pages" section.

## Sensitive data handling

Every field marked `sensitive` triggers design rules:

- **PII** (name, email, phone, address): masking in screenshots, careful logging, redaction in admin views, never in URL params.
- **Financial:** explicit confirmation flows for changes, audit log surface, sensitive-action re-auth.
- **Children's data:** stricter visibility, parental controls if applicable.
- **Health / medical:** access-controlled, audit-logged, never in client-side analytics.
- **Internal / operational** (scores, flags): never user-visible without role escalation.

These rules become inputs to the accessibility / privacy sections of design QA.

## Adapter robustness — testing the data inventory itself

The data inventory reader is an adapter / parser at the boundary between the backend's data layer and VisualForge's design world. Adapters at this boundary fail on real-world messy input. Test (or at minimum verify by walking each case mentally) before trusting the inventory:

### Realistic messy inputs

- **Aliases and descriptive field names** — `acctId` vs `accountId` vs `account_id` — same concept, three spellings. Inventory must normalize, capturing alias trace.
- **Mixed case conventions** — camelCase / snake_case / kebab-case mixing within the same schema.
- **Generated columns** — Postgres `GENERATED ALWAYS AS`, computed fields in ORM — present in the schema but never written to directly; classify as `operational` / derived.
- **Nullable vs required mismatch** — schema says nullable, sample data shows always-present (or reverse). Flag.
- **Polymorphic / discriminated unions** — `type: 'A' | 'B'` with branch-specific fields. Inventory must capture the discriminator and the per-branch field set.
- **JSON / JSONB columns with no schema** — arbitrary nested data. Mark as `flexible — design treats as opaque`.
- **Soft-delete vs hard-delete** — `deletedAt` columns mean the entity has a lifecycle. Surface as a lifecycle field, not regular data.
- **Audit columns** — `createdAt` / `updatedAt` / `createdBy` ubiquitous and should be classified as `metadata` automatically.
- **Foreign keys without a relation in the ORM** — raw `userId` field without a defined relation. Inventory must still capture the relationship.
- **Schema migrations not yet applied** — schema files describe a future state; production data has prior state. Reconcile against actual sample data.

### Malformed inputs

- **OpenAPI with missing `components.schemas`** — relies on inline schemas. Inventory must traverse paths instead.
- **OpenAPI with circular `$ref`** — must not infinite-loop.
- **OpenAPI custom extensions** (`x-vendor-*`) — recognized as vendor-specific, skipped or captured with a label.
- **GraphQL with custom scalars** — `JSON`, `DateTime`, `Email` — must be classified, not skipped.
- **GraphQL federation directives** — `@key`, `@external`, `@override` — recognize and preserve meaning.
- **Prisma with `@@map` / `@map`** — model name vs table name; inventory follows both.
- **Drizzle / TypeORM raw migrations** — SQL files that the ORM doesn't model. Read them too.
- **YAML with anchors and aliases** — common in OpenAPI; resolve them.
- **Schema files with syntax errors** — fail loud with file + line, don't silently skip.

### Duplicate / normalized-duplicate keys

- Two fields with names that normalize to the same key (`user_id` and `userId` in the same model) — flag as schema bug.
- Same field defined in two places (model file + migration file disagree) — flag as authority conflict.
- Same entity name across two services — namespace clearly, don't merge.

### Size and count limits

- A schema with > 200 entities — reading is slow; consider lazy / paginated traversal.
- An entity with > 100 fields — flag for the design team (probably should be split).
- A response shape with deep nesting (> 5 levels) — flag for the design team (probably needs flattening for UI).

### Privacy leakage prevention

When sampling actual data (Tier C):

- **Never log raw values** of any field marked `sensitive` (PII, financial, secret).
- **Truncate or hash** sampled values in inventory output.
- **Never persist sample data** to `retrofit/data-inventory.md` — only structural facts.
- **Redact in `backend-gaps.md` and `data-crosswalk.md`** — describe shape, not contents.

### Unsafe-fallback behavior

When the data layer is unreadable (no schema files, no API spec, no DB access):

- Do **not** invent entities. Mark the data inventory `BLOCKED — no readable data layer` and continue retrofit without designing screens dependent on data.
- Surface the gap explicitly to the user; recommend running primary research (talk to the backend team).
- Mark every screen spec that *would* depend on data as `BLOCKED — pending data inventory`.

## Anti-slop data-inventory rules

- "We'll figure out the data later" — fails. The data exists; read it.
- A screen spec that lists fields without referencing the inventory — fails.
- An invented field that "should exist" without a `BackendGap` entry — fails.
- A field marked "sensitive" with no design treatment for it — fails.
- An entity with no user-facing surface and no operational justification — flagged for `MissingSurface`.

## Quality gate

- Tier A schemas read (or absence documented).
- Tier B code shapes read for missing entities.
- Tier C sample data captured where dev environment access exists.
- Every entity has a field-level inventory record with display classification.
- Crosswalk built screen × entity × field.
- BackendGap entries written for invented fields.
- MissingSurface entries written for unused entities.
- Sensitive fields have design-rule notes.

## Output files

- `docs/design-system/retrofit/data-inventory.md` — full entity / field table.
- `docs/design-system/retrofit/data-crosswalk.md` — screen × entity × field map.
- `docs/design-system/retrofit/backend-gaps.md` — fields needed but missing.
- `docs/design-system/retrofit/missing-surfaces.md` — entities present but not surfaced.

These feed IA restructuring, UX flows, and component-system in retrofit mode.
