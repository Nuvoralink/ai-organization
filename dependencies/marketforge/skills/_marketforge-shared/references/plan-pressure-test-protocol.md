# Plan Pressure-Test Protocol

Adapted from the `full-slice-planner` skill (Anthropic) for marketing-domain plans.

Use this BEFORE any MarketForge subskill output is declared final. A plan must force the right architecture questions early enough that the first implementation-ready plan is already correct.

## What This Must Prevent

A first-draft plan that is a "reasonable marketing plan" but later becomes a different strategy after pressure testing. The first plan must already name:

- The actual trust / timing / data / decision backbone — not only the visible channel mix.
- Every producer that can create, update, cancel, or stale a downstream marketing artifact (e.g., a pricing change cascades to website-copy, paid-search, paid-mobile, email-lifecycle).
- Every downstream consumer that can display, send, post, or act on the result (e.g., a positioning change cascades to every copy-producing subskill).
- Exact unavailable / error / unknown states instead of silent fallbacks (e.g., what if Klaviyo MCP is unavailable in agentic mode?).
- Realistic adapter / input coverage when external data enters the system (VOC mining from real customer transcripts, not synthetic).
- Concurrent duplicate-trigger safety for any agentic action that claims idempotency (e.g., what if two cron loops fire same minute?).
- Channel-decay / saturation watch that could invalidate the plan promise (e.g., cold email reply rate continued decay).
- Proof scenarios that would catch a source-of-truth bypass (e.g., did the plan still consume positioning DEC-008, or did copy drift away?).

If pressure testing would change the plan, the plan is not ready.

## The 7 Pressure-Test Questions (apply to every MarketForge subskill output)

1. **Did the accepted source of truth (V3 guide section / VOC quote / DEC card) actually drive the final output?**
   - Or did the subskill drift from V3 and invent its own claims?

2. **Is the same truth used by every connected surface?**
   - Did the ICP definition in `marketforge-icp-persona` get consumed by `marketforge-website-copy`, `marketforge-cold-email`, `marketforge-paid-search`, `marketforge-content-strategy`?
   - Or did each subskill subtly redefine the ICP?

3. **Did any stale fallback, duplicated logic, cache, or compatibility route bypass the truth?**
   - Did a subskill default to "best practices" because the V3 source was missing?

4. **Are error and limited states honest?**
   - Did the subskill plan for "what if budget is T1 and the recommended channel is T3-only"?
   - Did it plan for "what if SpecForge is absent and we don't have product brief"?

5. **Are tests proving the intended behavior, not only that a helper exists?**
   - Does the validator actually catch slop, or just count files?
   - Does the channel scorer actually recommend a 3-leg portfolio, or just sort?

6. **Are vendor-promoted claims flagged as bias and triangulated?**
   - Every D-grade citation that drives budget allocation must have a bias flag AND triangulation.

7. **Does this fully satisfy product intent, or only patch the current failure?**
   - Did we solve the customer's actual marketing problem, or just produce a plan that looks like a marketing plan?

## The 4 Wrong-Implementation Probes

Before declaring any subskill output ready, ask:

### Probe 1: Easiest wrong implementation
> "What's the easiest wrong implementation someone could build from this plan while still technically following it?"

For MarketForge subskills, common wrong implementations:

- **Channel inventory paste:** "I picked all 8 candidate channels with equal weighting." → violates 3-leg portfolio.
- **Skip readiness check:** "I went straight to paid channels because the user asked for ads." → readiness < 5/7 but paid spend approved.
- **AI slop output:** "I wrote homepage copy by following the template." → banned phrases present.
- **Single-source attribution:** "Meta Ads Manager reports $42K ROAS." → no triangulation.
- **HARO reference:** "PR strategy includes HARO outreach." → HARO shuttered late 2024.
- **Marketing Mary persona:** "ICP: marketing leaders at growing companies." → demographic vanity, no JTBD.

### Probe 2: Which exact sentence allows the wrong implementation?
> "Which exact sentence or missing matrix would allow that wrong implementation?"

### Probe 3: What did I add to close the ambiguity?
> "What specific words, validation, or structural constraint did I add to make the wrong implementation harder than the right one?"

### Probe 4: What final-output proof would fail if the wrong path was taken?
> "What test / validation / artifact would surface the wrong implementation when it happens?"

## Required Matrices For MarketForge Subskills

Apply each matrix to subskills where it's relevant:

### Backbone Decision Matrix
Required for:
- Async / scheduled / background flows (agentic operations).
- Provider-backed side effects (cold email, ad spend, social posts).
- AI / semantic flows where model-vs-code authority matters (content generation, voice consistency).

Format:
- User / product promise: [what does the marketing plan promise?]
- Candidate backbones: [in-product / email lifecycle / agent loop / human approval / etc.]
- Official / provider / platform constraints: [Gmail bulk-sender rules, Meta CPMs, iOS ATT]
- Authority source per candidate.
- Failure modes.
- Chosen backbone.
- Reversal trigger.
- Proof required before calling implemented.

### Producer / Reconciliation Matrix
Required for: any output consumed by multiple subskills.

For MarketForge: ICP, positioning, brand strategy, messaging architecture are all "producers" whose downstream "consumers" are many copy-producing subskills. See `producer-reconciliation-matrix.md`.

### State / Evidence Matrix
Required for: decision-card lifecycle (Draft → Active → Superseded → Deprecated).

For MarketForge:
- Draft: in current run, not yet validated.
- Active: validated, in current marketing plan.
- Superseded: a newer DEC replaces this; this one preserved for history.
- Deprecated: removed from plan; preserved for audit.

### Consumer / Surface Matrix
Required for: every important MarketForge output.

Example for positioning (DEC-008-015):
- Consumed by: `marketforge-messaging-architecture`, `marketforge-website-copy`, `marketforge-paid-search`, `marketforge-paid-social`, `marketforge-cold-email`, `marketforge-content-strategy`, `marketforge-awareness-stages`.
- Forbidden reconstruction: subskills must NOT invent their own positioning claims; must cite DEC-008-015.
- Empty / unavailable state: if positioning not yet run, the subskill blocks with "positioning required first."
- Test proving final output consumes the authority: validator scans for DEC-008-015 cross-cites in consuming subskills.

## Implementation Safety Contract For MarketForge Plans

A marketing plan from MarketForge is not implementation-ready unless it specifies:

- Exact source of truth (V3 §X.Y or DEC-NNN).
- Exact ICP / persona / segment.
- Required channels with budget allocation.
- Blocked channels (per portfolio concentration rules).
- Required messaging anchors (specific DEC-NNN messaging cards).
- Forbidden messaging (specific anti-patterns flagged).
- Exact KPI definitions per channel.
- Exact kill criteria per channel with channel-type-matched windows.
- Required regulatory compliance (GDPR / CAN-SPAM / TCPA / FTC).
- Exact approval requirements (agentic mode).
- Exact rollback / containment method per channel.
- Exact tests / proofs to run before declaring channel live.

If the plan uses vague phrases like "improve engagement", "optimize conversion", "scale paid acquisition", **rewrite as concrete requirements** or mark as open question.

## Decision Locking

Before any marketing plan is implementation-ready, every material decision is locked in one of these forms:

- **User-confirmed** — founder/marketing-lead explicitly approved.
- **V3-doc authority** — backed by V3 guide section with evidence grade A/B.
- **Existing-decision authority** — references prior DEC-NNN.
- **Recommended default** — researched best-fit; documented with reversal trigger.
- **Open question / blocked** — flagged for user input; subskill DOES NOT PROCEED past this.

Every Recommended default must include:
- Options considered.
- Chosen option.
- Why best fit NOW for this product.
- What would reverse it (channel-decay / saturation / customer-shift signal).
- How verified (KPI / cohort test / attribution-triangulation result).

## Anti-Ambiguity Rewrite Rules (for marketing plans)

Replace vague with concrete:

| Vague | Concrete |
|---|---|
| "improve content engagement" | "5 LinkedIn posts/week from founder; reply-to-every-comment in 90 min; carousel posts > link posts; KPI = DM-driven inbound + newsletter subs" |
| "scale Meta Ads" | "From $5K/mo to $8K/mo over 6 weeks; CAPI-verified ROAS gate at 1.5 minimum; CPM-r fatigue signal triggers creative refresh; 5-10 distinct concepts; AI-disclosure on AI-generated content" |
| "improve SEO" | "5 bottom-funnel comparison pages targeting [keywords with monthly volume]; brand SEO maintained; GEO citation tracking via Profound; NOT publishing top-funnel 'ultimate guide' content" |
| "optimize emails" | "Klaviyo Welcome / Browse / Cart / Post-Purchase / Win-back flows; KPI = revenue/recipient + clicks (NOT opens post-Apple-MPP); A/B testing only at 1000+/month volume" |
| "build community" | "Discord server with N expected members in 12 months; 30%+ ARR via community in 12 months OR re-evaluate / sunset" |
| "use AI for content" | "AI for outlines, first drafts, alt text, transcripts, repurposing. Human for: POV, original data, signed author content. Banned: AI-generated cold email at template-fill scale, AI-written LinkedIn content as primary" |

## When the Plan Pressure-Test FAILS

If any pressure-test question or wrong-implementation probe fails:

1. The subskill output is NOT ready.
2. Specific failing items are surfaced as findings.
3. Findings categorized BLOCK / FIX-NEXT / ACCEPT / WATCH.
4. Loop limit: 3 iterations per finding. After 3, escalate to user.

This is enforced by `marketforge-pressure-test` subskill (Phase 11 step 4).

## Sources and basis

- `full-slice-planner` skill methodology (Anthropic, adapted).
- V3 Marketing Guide §12.8 (Anti-patterns), §12.10 (When to recommend doing less).
