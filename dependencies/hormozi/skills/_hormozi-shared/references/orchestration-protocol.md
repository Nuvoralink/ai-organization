# Orchestration Protocol

How the master orchestrator (`hormozi`) and the two sub-orchestrators (`hormozi-offers`,
`hormozi-leads`) route a request to the right sub-skills and assemble a finished deliverable.
Modeled on the universal orchestration model: detect task → gather bounded context → run sub-skills
in dependency order → assemble → self-check → deliver.

---

## Step 0 — Pre-flight (self-test)

Before a full build, run `hormozi-self-test` (Phase 0). It verifies every referenced sub-skill and
reference file exists and each sub-skill has its contract. FAIL blocks the run. (Skip for a single
direct sub-skill invocation.)

## Step 1 — Detect the task

Route on the verb/intent:

| Ask | Route |
|---|---|
| "build an offer", "make my offer", `build-offer` | Offers full chain (see below) |
| "grade / fix / pressure-test my offer", `grade-offer` | `hormozi-offer-grader` (+ targeted rebuild) |
| "just the guarantee / name / bonuses / pricing" | the single `hormozi-offer-*` sub-skill |
| "lead magnet", `lead-magnet` | `hormozi-lead-magnet` (needs an offer — see dependency) |
| "how do I get leads", "lead gen plan", `lead-gen-plan` | `hormozi-lead-roadmap` → Core Four sub-skills |
| "referrals / affiliates / cold outreach / content / ads" | the single `hormozi-lead-*` sub-skill |
| free-form | pick the smallest set of sub-skills that answers it; state which you ran |

Do not run the whole engine when the ask is narrow. Run only what the task needs.

## Step 2 — Bounded intake

Gather the product context the chosen sub-skills need — read it from any provided files/repo first,
then ask only for what's missing. Minimum viable context:

- **What the product is** and **who it's for** (the avatar / market).
- **Dream outcome** the customer actually wants (what they'd experience if it worked).
- **Current price** and **current offer** (if any).
- **Economics** enough to stack value honestly (rough cost to deliver) — or mark placeholders.
- **Constraints** (what you can/can't deliver, time, budget).

Ask as a short batch, not one-at-a-time. If the user says "just assume / use placeholders," proceed
and clearly flag every assumption.

## Step 3 — Run sub-skills in dependency order

### Offers full chain (`build-offer`)
Dependency order (each feeds the next):

1. `hormozi-offer-market` — confirm/choose the Starving Crowd + avatar. *(Skippable if the market is
   already fixed; still record it, because everything downstream is built for this avatar.)*
2. `hormozi-offer-value-equation` — establish the 4 value drivers to maximize for this avatar.
3. `hormozi-offer-builder` — the 5-step engine → the stacked high-value deliverable.
4. `hormozi-offer-enhancers` — add scarcity + urgency + bonuses.
5. `hormozi-offer-guarantees` — attach the right guarantee(s).
6. `hormozi-offer-pricing` — set the value-based price (uses the value equation + stack).
7. `hormozi-offer-naming` — give it a Magnetic Reason Why name (M-A-G-I-C).
8. `hormozi-offer-grader` — score the assembled offer against the Value Equation; loop back to the
   weakest driver if it scores low (bounded: at most 2 refinement passes, then surface).

### Leads
- `lead-magnet` → `hormozi-lead-magnet` (depends on a defined offer + avatar).
- `lead-gen-plan` → `hormozi-lead-roadmap` chooses the starting Core Four channel(s) for this
  business, then routes to `hormozi-lead-warm` / `-content` / `-cold` / `-paid`, and to Lead Getters
  (`-referrals`, `-employees`, `-agencies`, `-affiliates`) for scale, then `-more-better-new`.

## Step 4 — Assemble

Combine the sub-skill outputs into one coherent deliverable, in the book's presentation order.
For a full offer, that is the stacked "Final High Value Deliverable" with value-per-item, the total
value vs. price, the enhancers, the guarantee, and the name — presented as the customer would see it,
plus an internal appendix (assumptions, placeholders, the value-equation score).

## Step 5 — Fidelity self-check

Run `hormozi-fidelity-audit` on the assembled output (per `decision-and-fidelity-rubric.md` §5).
Fix any FAIL before delivering. This is the loop's exit gate — do not ship output that failed fidelity.

## Step 6 — Deliver + next step

Present the deliverable, the flagged assumptions/placeholders, and the next step in Hormozi's sequence
(e.g., after an offer: "next, build the lead magnet and pick your first Core Four channel").

## Composition dependency map (quick reference)

```
market ──▶ value-equation ──▶ offer-builder ──▶ enhancers ──▶ guarantees ──▶ pricing ──▶ naming ──▶ grader
                                    │                                                          │
                                    └──────────────── (offer feeds) ──────────────────────────┘
                                                                    ▼
offer + avatar ──▶ lead-magnet                     lead-roadmap ──▶ {warm｜content｜cold｜paid} ──▶ lead-getters ──▶ more-better-new
```
