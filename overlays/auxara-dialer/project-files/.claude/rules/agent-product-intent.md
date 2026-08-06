---
description: Keep agent work anchored to product intent, business value, UX, psychology, and root-cause fixes
paths:
  - "backend/src/**/*"
  - "frontend/src/**/*"
  - "shared/src/**/*"
  - "docs/app-plan/**/*"
  - "docs/sprints/**/*"
---

# Agent Product Intent Rules

Purpose: keep implementation work outcome-oriented, valuable, and durable instead of technically correct but low-signal.

## 1. Start from intent

- Before applying a fix, adding a feature, or wiring a flow, ask what the original intention was.
- Identify the user outcome, business outcome, or product risk the change is supposed to improve.
- Do not optimize only for "request completed"; optimize for the reason the request exists.

## 2. Prefer value over output volume

- Favor changes that improve clarity, trust, conversion, usability, maintainability, or decision quality.
- Do not turn the product into an information dump.
- Prefer focused, actionable experiences that help the user understand what matters and what to do next.
- If extra information does not improve action, confidence, or understanding, it is probably noise.

## 2.1 Product Value Beats Graceful Failure

**Honesty is the rare real-outage case, not a substitute for building it to work.** A degraded/honest state ("stale — reconnecting", "unavailable", "no draft", "fall back to manual entry") is for the genuine edge case where the system *truly cannot* succeed — it is **never** the default you reach for instead of making the feature reliably work. Build it to refresh/succeed properly first; the honest fallback is the narrow exception, not the design. This applies beyond AI — real-time surfaces, sync, error states, degraded modes. (Surfaced 2026-05-29, MGR-001 wallboard: a "stale" label is not a substitute for a wallboard that reconnects and stays current.)

- The dialer's bounded AI value is concrete: an accurate AI disposition draft the booker accepts in one keystroke, a battlecard that fires on the right objection, a clean lead context-pop. The booker should spend attention on the conversation, not on data entry — that is the value the AI exists to deliver.
- Honest, limited, unavailable, or degraded states are required when evidence is truly missing, unsafe, stale, or unauthorized (no transcript, call too short, low ASR confidence, transcription unavailable). They protect trust; they do not replace product value.
- If transcript/keyword evidence exists and the AI output is blank, generic, or wrong, treat that as a product defect. Repair the upstream source, AI contract, validation/repair loop, persistence, DTO, mapper, or UI consumer instead of accepting a graceful failure.
- Do not call an AI feature done because it avoided fabricating. It is done when it reliably produces a usable draft/card/context (that the human then confirms, per ARC-003/ARC-006), or proves with evidence why it cannot and falls back to manual entry cleanly.
- (Coaching itself — scorecards, rubrics, behavior-change feedback — is the separate CoachAI product, not the dialer. This rule is about the dialer's own bounded AI surfaces.)

### An anti-fabrication guard must NAME the honest state it renders instead — silence is also a lie

Refusing to fabricate is correct. Rendering **nothing** is not the alternative to a fabricated success — an **honest intermediate state** is. A guard whose branch produces no state, no feedback, and no exit has traded a false claim for a dead end, and that is *worse*: with a false claim the user at least knows something happened and can dispute it; with silence they cannot tell whether the system failed, is working, or ignored them — and they have no way out.

**The rule:** whenever a guard withholds a success state, name and render what the user sees INSTEAD — `dialing` · `sending` · `confirming` · `unsaved` · `unavailable` · `couldn't reach the server, retry` — plus a way out of that state. *"We don't show X because it isn't true yet"* is half a decision; the other half is what IS true right now, said plainly. A guard is not finished until both halves exist.

**Three live instances, all correct reasoning that stopped halfway** (2026-08-06 — one founder-found, two audit-found):
- The comms call card rendered **only** on `CONNECTED`, commented *"never a made-up connected screen"*. Correct — but through DIALING and RINGING it rendered nothing, so an outbound call could not be cancelled, and if the callee never answered the card never appeared at all. The honest state was `dialing`, with a hang-up.
- `ForgotPasswordPage` deliberately refuses to *"locally advance to 'we've sent a link' before a real request succeeds"* — correct — but its submit handler is empty, so pressing the button does **literally nothing**. The honest state was either the wired request or a disabled control naming the real unavailable path.
- The call-note autosave sets `saving`, then on failure deliberately leaves the indicator *"as-is"* to avoid a fabricated "Saved" — leaving it on **`Saving…` forever**. The honest state was a third `unsaved` value with a retry.

**The tell, checkable at authoring time:** read the guard's negative branch and ask *"what does the user see here?"* If the answer is "nothing", "the previous state", or "the page as it was", the guard is incomplete — however correct its reasoning about fabrication. Composes with `auxara-dialer-frontend-rules.md` §9 (never ship a live-looking no-op): that rule bans the dead control; this one bans the dead *state* behind an honest one.

*Fail-state:* a guard correctly refused to show something untrue and rendered nothing in its place, so the user could not tell whether the action failed, succeeded, or was ignored — and had no exit from the state they were left in.

### A rule that blocks you is a FORK, not a stop — reason about what it is protecting

The clause above is one instance of a general failure: **treating a blocking rule as a terminal answer instead of a prompt to think.** "Don't fabricate" blocked showing a success, and the code stopped there — when the right answer was neither show nor hide, but show the honest middle. Every one of the three instances above is a guard that fired correctly and then simply *stopped*, because the rule was applied rather than reasoned about.

**When any rule, gate, guard, or invariant blocks you, run four questions before you accept the block:**
1. **What exactly is being blocked, and what is the rule protecting against?** Name the harm in one sentence. If you cannot, you do not yet understand the rule well enough to obey it correctly.
2. **Does the harm actually apply here?** A rule calibrated for one case can be firing on a different one it was never about. (A guard against a *fabricated* state firing on an *honest intermediate* state is exactly this — the block was right in general and wrong in the particular.)
3. **Is there a third option?** Blocks present as binary — do it or don't. Usually there is an in-between that satisfies the rule and still serves the user: the honest intermediate state, a narrower version, a different surface, the same outcome reached another way. **Look for it before accepting the block, because the binary framing is the trap.**
4. **If the block is right and there is no third option — is the DIRECTION wrong?** A rule blocking something the product genuinely needs is evidence the approach is wrong, not that the need is illegitimate. Escalate the design, do not quietly ship the blocked-and-empty version.

**What this does not license:** the block still holds until you have a *better* answer. This is not permission to override a rule because it is inconvenient — that is the opposite failure. A compliance gate, a security invariant, or a human-gated action stays blocked; what changes is that you go back and find the design that does not need to violate it, rather than shipping a dead end and calling the rule satisfied. When the answer is genuinely "this should not exist here", say so and remove it — that is also a valid outcome of the four questions.

*Fail-state:* a rule fired, the code stopped, and the result was a dead end nobody chose — the rule was technically satisfied and the user was worse off than if the rule had never existed.

## 3. Keep UX and psychology in mind

- Reduce confusion, friction, cognitive load, and unnecessary choice overload.
- Prefer wording and flows that feel clear, reassuring, and motivating.
- Surface the right amount of information at the right moment, not everything at once.
- Protect user trust: avoid misleading states, fake precision, or technically correct but confusing UX.

## 4. Fix the cause, not the symptom

- When fixing a bug, look for the root cause and solve that cause directly.
- Do not ship lazy workarounds or brittle patches that only hide the current symptom.
- Do not hardcode logic around one failing case if the same underlying issue can appear in similar scenarios.
- Prefer generic, durable fixes that address the broader failure mode without overengineering.

## 5. Definition of a good solution

- A good solution is technically sound and meaningfully improves the product outcome.
- The best fix is usually the smallest change that solves the real problem well for this case and related cases.
- If a requested approach adds complexity without clear business or user value, say so and prefer a better alternative.

## 6. Calibrate scope before acting

- Before planning or implementing a fix, feature, edit, or architecture addition, define the target product outcome, the proper blast radius, and what "good work done" means.
- Check whether the radius should stay local or expand upstream/downstream to contracts, source-of-truth registries, persistence, tests, UI states, docs, or guardrails.
- Explicitly avoid both undershoot (symptom patch, stale consumers, duplicated local logic) and overshoot (unrelated rewrites, one-note visual swings, complexity without user value).
- Add tests, smokes, or guardrails that prove the work makes logical sense for the user, not just code sense for the compiler.
