# IA Restructuring Protocol (Retrofit)

In retrofit mode, the existing application's page structure is almost certainly suboptimal. Pages accrete features over time: a "Team" page ends up showing team-level stats *and* individual member profiles *and* invite management. A "Settings" page becomes a junk drawer with twelve unrelated subsections. This protocol catches and fixes structural drift, not just visual drift.

## When this runs

- `MODE=retrofit` always.
- Runs after `data-inventory-protocol.md` (so we know what data drives each page) and after IA's normal pass on ideal nav.
- Produces `docs/design-system/retrofit/ia-restructuring.md`.
- Invoked from `visualforge-information-architecture` subskill in retrofit mode.

## What we analyze per existing page

For every existing route / screen identified in the retrofit inventory, capture:

- **Route:** path or screen ID.
- **Title / heading.**
- **Top-level data entities displayed** (from data inventory).
- **User tasks supported** (verbs the user accomplishes — "view team metrics", "invite member", "edit own profile").
- **Distinct user roles served** (who reaches this page).
- **Components present** (from inventory).
- **Estimated cognitive load:** low (single task) / medium (2–3 tasks) / high (≥ 4 tasks).
- **Navigation depth from root.**
- **Inbound links:** how users get here.
- **Outbound paths:** where users go next.
- **Engagement signal if available:** analytics, support tickets, user research notes.

## Findings the protocol must surface

### 1. Pages that should be split

A page is a split candidate when any of:

- It serves ≥ 2 user roles with materially different needs (admin + member + viewer).
- It mixes ≥ 2 task domains (e.g., "view team performance" + "manage individual member records").
- It mixes ≥ 2 data scopes (aggregate data + record-level data).
- It exceeds cognitive-load threshold (≥ 4 distinct tasks) without clear progressive disclosure.
- Different sections of the page have different update frequencies / data sources (a settings section next to a real-time dashboard).

For each split candidate produce:

```markdown
### Split candidate — [route]

**Current page:** [route] / [title]
**Why split:**
- Serves [N] roles: [list]
- Mixes [N] task domains: [list]
- Mixes [N] data scopes: [list]
- Cognitive load: [score with rationale]

**Proposed split:**
- New page A: [route + title + task focus + role focus + data scope]
- New page B: [route + title + task focus + role focus + data scope]
- (more if applicable)

**What lives where:**
| Existing element | Destination |
|---|---|
| Team KPI tiles | Page A (team-overview) |
| Member list | Page B (members) |
| Invite form | Page B as modal |
| Activity feed | Page A as right rail |

**Routing migration:**
- Old `/team` → 301 redirect to `/team/overview`.
- Old `/team#members` deep link → `/team/members`.

**Risk / cost:**
- Breaks existing links / shared URLs: [list].
- Affects analytics events: [list].
- Affects integrations: [list].
- Migration phase: [reference phase in migration-plan].

**Reversal trigger:**
[observable signal that would suggest the split was wrong — e.g., usage shows users constantly bounce between the two new pages]
```

Use the team-stats + member-data example as a canonical case: a page mixing aggregate team metrics with individual member records mixes two task domains (analyze team vs. manage member), two data scopes (aggregate vs. record), and often two roles (manager-of-team vs. peer-member). Split into `/team/overview` and `/team/members`.

### 2. Pages that should be merged

A page is a merge candidate when any of:

- Two pages serve the same user role doing the same task with arbitrary content division.
- A page exists for a single setting that should be a section of a parent page.
- A flow is fragmented across more pages than necessary, causing extra clicks for no benefit.
- A page exists only because the original team didn't know how to layer the content (e.g., separate "advanced settings" page with three rarely-used options that should be a disclosure on the main settings).

For each merge candidate produce:

```markdown
### Merge candidate — [routes]

**Current pages:** [list of routes]
**Why merge:**
- Same task / same role: [task]
- Fragmentation cost: [extra clicks, lost context, broken keyboard nav]
- No legitimate separation reason (e.g., different roles, different permission, different data scope)

**Proposed merged page:**
- New route: [route + title]
- Sections: [how the merged content is structured — tabs, accordions, scroll sections, progressive disclosure]
- Component pattern: [from layout pattern library]

**Routing migration:**
- Old `/account/email` → redirect to `/account#email`.
- Old `/account/password` → redirect to `/account#password`.

**Risk / cost:** [as above]

**Reversal trigger:** [signal]
```

### 3. Missing pages

Check the existing app against the *task inventory derived from personas and competitive audit*. Common missing-page categories:

- **Account lifecycle:** account deletion, data export, account merge.
- **Notification preferences:** in-app, email, push, digest cadence.
- **Help / support:** docs, contact support, status page, changelog.
- **Trust / legal:** privacy, terms, cookie preferences, accessibility statement.
- **Admin pages** (when product has admin role): audit log, billing, user management, integration management.
- **Error / system pages:** 404, 500, maintenance, rate-limited, account-suspended.
- **Auth flow completeness:** sign in, sign up, forgot password, reset password, verify email, magic link, SSO callback, MFA challenge, MFA enrollment, MFA recovery.
- **Onboarding:** welcome, setup wizard, sample-data toggle, invite team.
- **Empty states with first-action pivot:** every list view's empty state.
- **Data depth pages:** detail pages when only list pages exist, history pages when only current-state exists.

For each missing page produce:

```markdown
### Missing page — [proposed-name]

**Proposed route:** [route]
**Why needed:**
- Persona [name] needs to [task] but the app does not currently support it.
- Category gap: [account lifecycle | notifications | help | auth | etc.]
- Competitor pattern: [N of M audited products provide this; see competitive audit].

**Content / data:** [from data inventory]
**Components used:** [from component inventory]
**Layout pattern:** [from layout pattern library]
**Priority:** P0 (launch-blocking) / P1 (next release) / P2 (backlog).
**Migration phase:** [phase in migration plan].
```

### 4. Misplaced content

Content sitting in the wrong section per the ideal IA. Examples:

- Billing info under "Account" when ideal IA puts it under "Workspace" (because billing is per-workspace not per-user).
- Notification preferences under "Notifications" when ideal IA puts them under "Account" (because they're user-scoped, not workspace-scoped).
- A team-management feature under "Settings" that belongs in primary nav.

For each misplaced item:

```markdown
### Misplaced — [content]

**Current location:** [route + section]
**Ideal location:** [route + section]
**Reason for move:** [scoping principle — user-scope vs workspace-scope, frequency of use, role-of-actor]
**Migration approach:** [redirect, move with permanent old-route, parallel during transition]
```

### 5. Orphan pages

Pages with no inbound link from primary nav, sidebar, or search. Usually indicates a feature that was launched and then forgotten.

For each orphan:

- Decide: link it properly OR deprecate.
- If deprecate: redirect plan, deprecation timeline, communication plan.

### 6. Dead-end pages

Pages where the user completes a task but has no clear next step. Add primary next-action.

### 7. Permission / role leaks

A page that mixes content visible to multiple roles without filtering. Even though admin-only sections may render conditionally, the page's *purpose* should not span roles. Common patterns:

- "Settings" mixing personal preferences (user-scope) with workspace controls (admin-scope).
- "Team" mixing peer view with admin actions.

For each leak: propose role-segregated sub-pages or distinct nav entries per role.

## How findings convert into action

The protocol's output is *suggestions with rationale*, not unilateral changes. The orchestrator surfaces findings to the user with three response paths per finding:

- **Accept:** the finding flows into ideal IA + migration plan.
- **Defer:** kept in `auditability/deferred-findings.md` with reason; can be revisited.
- **Reject:** kept in `auditability/rejected-findings.md` with the user's stated reason (so future runs don't re-surface).

## Anti-slop IA-restructuring rules

- "Some pages feel cluttered" — fails. Specific page, specific elements, specific split proposal required.
- "Could use more organization" — fails. Concrete merge / split / move required.
- Proposing a split without considering migration cost — fails.
- Proposing a merge without acknowledging the deep-link / shared-URL cost — fails.
- A finding without a reversal trigger — fails. Every restructure must be reversible if it doesn't land.
- Surfacing a finding without checking the data inventory — fails. If you don't know what data the page shows, you don't know if it should split.

## Quality gate

- Every existing page in the retrofit inventory has been analyzed.
- Findings produced across all seven categories (split / merge / missing / misplaced / orphan / dead-end / role-leak), or each category explicitly marked "no findings" with rationale.
- Each finding has rationale, proposal, migration approach, risk, reversal trigger.
- Findings reviewed and triaged (accept / defer / reject) before they enter ideal IA.
- `ia-restructuring.md` is the source for any IA changes that aren't pure visual.

## Output file

`docs/design-system/retrofit/ia-restructuring.md`

Sections:

1. Existing-page analysis matrix (every page + dimensions captured).
2. Split candidates.
3. Merge candidates.
4. Missing pages.
5. Misplaced content.
6. Orphan pages.
7. Dead-end pages.
8. Permission / role leaks.
9. Triage summary (accept / defer / reject counts).
10. Cascade into ideal IA — list of decision-log entries affected.
