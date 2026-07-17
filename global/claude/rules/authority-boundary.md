---
paths:
  - "backend/**/*"
  - "frontend/**/*"
  - "shared/**/*"
  - "src/**/*"
  - "app/**/*"
  - "docs/app-plan/**/*"
---

# Authority Boundary — Who Judges, and Who May Act

Purpose: two distinct authorities decide whether software behaves correctly, and conflating them is a recurring class of bug. **Compute/decision authority** = *who is allowed to JUDGE meaning.* **Action/autonomy authority** = *who is allowed to ACT on a judgment.* This rule keeps both explicit. Always-on; each project instantiates the action tiers for its own domain (a telephony product's legal/carrier gates, a coaching product's evidence/honesty gates, etc.).

---

## Part A — Compute / decision authority (AI judges meaning; deterministic code validates)

When a decision turns on **meaning** (is this a real objection? the booking moment? the right speaker? does this evidence support this claim?), **AI owns the semantic judgment from compact grounded evidence.** Deterministic code's job is to **validate** — grounding, schema/contract shape, policy/safety, speaker/source authority, provenance, persistence — never to *compute the meaning itself*.

- **A schema-valid AI verdict is authoritative** (valid enum/shape, required fields, rationale) and reaches the final user-visible output.
- **Deterministic guards are non-blocking signals, never authoritative.** Grounding, speaker, time-window, and confidence checks may attach a *confidence discount* or an *`unverified`/low-trust provenance flag* — they must **never reject, discard, override, or substitute** a schema-valid verdict, trigger a fallback that overwrites it, or trip a `limited`/degraded state on their own. Guards compound: one upstream model slip feeding an authoritative downstream guard cascades into a wrong verdict AND a wrong honesty state. **Gate on schema + security/policy only; signal everything else.**
- **Teach the intent, not the keywords**, when surface words would mislead (look-alikes, paraphrases, indirect phrasings, who-is-driving-vs-reacting). State what each option is *doing* in context; give the decision rule as a question about function; pin it with examples AND counterexamples. Skip this when the decision is structural or the surface form *is* the truth (an explicit enum/ID/label).
- **Validation feeds back into generation.** When a generated field fails validation, don't let the validator silently rewrite it — run a **bounded retry** that tells the model exactly what failed, why, and the correct authority; send back only the failed fields; merge the repaired field into the previously-validated-good payload, then move the whole validated payload downstream. **Bounded-repair trace truth:** if the second pass still fails, the trace says `rejected`, not `repaired` — the trace, the product output, the warnings, and the telemetry tell one story.
- **The only escape hatch** for genuinely-unavoidable deterministic semantic logic is a nearby `SEMANTIC_DETERMINISM_ALLOW:` comment stating why AI judgment doesn't fit, the exact scope, and the regression that proves the scope can't silently expand.

*Compute-authority fail-state:* a deterministic guard rejected/overrode a schema-valid AI verdict (or tripped `limited`), so one upstream slip cascaded into a wrong user-visible verdict AND a wrong degraded state — or the validator silently rewrote AI output instead of asking the model to regenerate the failed part.

---

## Part B — Action / autonomy authority (the system informs; the human/system-of-record decides)

Before building any feature that **changes state, contacts someone, or decides something**, classify *who is the legitimate actor* on a tiered ladder. The generic tiers (each project names its concrete members):

- **Tier 1 — hard gate the system MUST enforce.** Legal/regulatory/safety/contract invariants the product cannot violate. Enforced deterministically; fail-closed when inputs are unknown; the audit log records a disabled/exempt state **honestly**, never a fabricated pass. (Sub-split where useful by *who is liable* — platform-enforced no-override vs. tenant-owned capability with safe-default-ON-but-configurable-and-tenant-liable.)
- **Tier 2 — operational signal.** The system **recommends; the human decides and acts.** Autonomy only by explicit opt-in, **default OFF**.
- **Tier 3 — strategy / lifecycle / the relationship.** **Not this product's job** — surface it to the human or sync to the external system-of-record.

Rules:
- A feature that has the system **autonomously acting on a Tier-2/3 concern by default** → STOP and reframe.
- A Tier-1 gate **hard-enforced with no honest disabled/exempt state**, or one a tenant disabled but the audit shows a fabricated pass → STOP.
- Spot an existing violation anywhere → **flag it immediately and fix it in the same turn; never defer.**
- Action authority is distinct from compute authority: AI may *recommend* (Tier 2), but the *act* still needs the right actor, and AI never becomes the authority for billing/RBAC/entitlement/lifecycle gating.

*Action-authority fail-state:* the system autonomously did a thing the product reserves for a human or an external system-of-record (auto-acting on strategy, auto-mutating protected state, deciding who to pursue) — or a mandatory gate shipped with no honest disabled state.
