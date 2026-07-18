<!-- AUTHORING GUIDE — not a rule file itself. It teaches how to write THIS project's domain rule(s) from its crown jewels.
     The domain rule is the twin of the domain auditor: the rule states the posture; the auditor checks code against it. Both are
     authored per project and are the adaptation-heavy pieces. Delete this guide from the repo after authoring the rule(s). -->
# Authoring the project's domain rule(s)

The domain rule is where the project's crown-jewel invariants live as task-relevant doctrine — the posture every agent must honor and the domain-auditor checks against. It is NOT generic. A generic domain rule is useless; every clause must name a real invariant of THIS product. For Claude, give the generated `.md` official `paths:` frontmatter covering the domain's real source/docs; AGENTS.md routes the same rule by topic for Codex. Do not make a large domain rule unconditional startup context.

## Step 1 — name the crown jewels (from the user's Step-1 answer)
What can this product absolutely not get wrong? Write them as a short list. Examples of the SAME step producing different lists:
- **Auxara Dialer (telephony):** STIR/SHAKEN attestation, 10DLC registration, TCPA/CASL calling-hours + consent, DNC scrub freshness, recording-disclosure by state, STOP suppression, tenant isolation, the authority tiers (who is the legal actor). → produced `authority-boundary.md` (the tier model) + `auxara-dialer-project-rules.md` §3 (Set A / Set B compliance).
- **Nuvora CoachAI (AI coaching):** AI owns the coaching/sales meaning-judgment; deterministic code only validates; guards never override a schema-valid verdict; validation feeds back via bounded repair; the accepted judgment reaches the screen; paid calls metered. → produced the AI-decision-boundary rule + the source-to-screen authority rule.

## Step 2 — pick the invariant shape
Most crown jewels are one of two shapes (mirror the two domain-auditor skeletons):

### Shape A — an ACTION-AUTHORITY tier model (regulated / money / who-may-act products)
When the product ACTS, CONTACTS, or DECIDES something with legal/financial/safety weight, classify who is the legitimate actor. The generic tiers (name the concrete members per project):
- **Tier 1 — hard gate the system MUST enforce.** Split by *who is liable*: **1a** platform/carrier-enforced, no override; **1b** tenant/caller-owned capability, safe-default ON but configurable + liable-party-owned (audit logs `disabled` HONESTLY, never a fabricated pass).
- **Tier 2 — operational signal.** System recommends; the human decides and acts. Autonomy only by explicit opt-in, default OFF.
- **Tier 3 — strategy / lifecycle / the relationship.** NOT this product's job — sync to the system-of-record, surface to the human.
Rule clauses: a Tier-2/3 concern acted on autonomously by default → STOP; a Tier-1 gate with no honest disabled state → STOP; spot a violation → flag + fix same turn, never defer.

### Shape B — a COMPUTE-AUTHORITY / AI-decision boundary (AI/semantic products)
When a decision turns on MEANING, AI owns the semantic judgment from grounded evidence; deterministic code only validates (grounding/schema/policy/provenance/persistence) and its guards are non-blocking signals that never override a schema-valid AI verdict. Rule clauses: deterministic meaning-logic needs a `SEMANTIC_DETERMINISM_ALLOW:` comment + a scope-proving regression; validation feeds back into generation via bounded repair with truthful traces (`rejected` ≠ `repaired`); AI-output bugs are fixed at the AI contract, not a phrase-list; the accepted judgment drives the final user-visible output; every paid call is metered.

Many products need BOTH shapes (an AI product that also acts). Author whichever apply.

## Step 3 — write the rule with named fail-states
Every clause names its **fail-state** — the shape of the mistake it catches — so it bites at plan, fix, and done time. A rule without a fail-state is a suggestion. Cross-reference the global `authority-boundary.md` (Part A compute / Part B action) — the project rule INSTANTIATES those parts for this domain, it doesn't restate them.

## Step 4 — wire it + build its auditor
- `@`-reference the rule from `CLAUDE.md` and name it in `AGENTS.md` (so `gate:rules-wiring` passes).
- Author the matching domain auditor from `templates/agents/domain-auditor.template.md`, checklist ← the rule's clauses. The rule states the posture; the auditor cites the `file:line` where code obeys or violates it.

## The test to apply
Read your draft rule as an adversary: could an agent obey every clause and still ship the bug the crown jewels forbid? If yes, a clause is missing or too soft. Could an agent be blocked by a clause that's actually fine (a false-positive posture)? If yes, state the correct behavior explicitly so the auditor doesn't flag a correct implementation as drift (the dialer's DNC two-mechanism clause is the canonical example — it states BOTH correct behaviors so neither is misread as a violation).
