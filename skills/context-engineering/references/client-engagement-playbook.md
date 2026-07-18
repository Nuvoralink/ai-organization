# Client Engagement Playbook — Scoping & Delivering an AI Solution

The consulting workflow that wraps the other references: what to ask, how to pick the use case, how to phase delivery, what to hand over, and the traps that kill engagements. Written to be usable in the room with a client.

---

## 1. The first meeting — the 12 questions

Run these in order; they fill the whole downstream plan. (Long-form versions in §2.)

1. **"Walk me through the moment this would help."** (Get a concrete scene — who is stuck, doing what, in which tool. No scene = no use case yet.)
2. **"What does it cost you today?"** (Hours, tickets, deals, errors — the value metric the project will move.)
3. **"What happens when the AI is wrong here?"** (Reversible embarrassment vs money/legal/safety — sets the HITL tier and the accuracy bar.)
4. **"Where does the truth for this live?"** (Systems, docs, people's heads. Heads = a knowledge-capture workstream, price it in.)
5. **"Who owns that content, and when was it last reviewed?"** (Silence here predicts the whole project.)
6. **"Who is allowed to see what?"** (Same corpus for everyone, or role/region/tenant-scoped? ACL complexity is a top-2 cost driver.)
7. **"How fresh must answers be?"** (Quarterly-stable vs changes-daily → sync pipeline scope.)
8. **"What are the 20 questions it MUST get right?"** (Seed of the golden set — ask for real examples from tickets/chats.)
9. **"What may it do on its own vs only suggest?"** (Tier the actions in the room; clients usually haven't thought about it.)
10. **"Any data that must not leave / must stay in-region / is regulated?"** (Classification + provider constraints.)
11. **"What tools do people already live in?"** (Ship where the users are — Slack/Teams/CRM/portal — not a new tab.)
12. **"Who on your side owns this after launch?"** (Product owner + content owner. No named owner = the system decays from day one.)

## 2. Discovery — what a complete picture contains

- **Business:** use-case candidates with the scene + value metric each; failure tolerance per use case; success criteria as a NUMBER (deflection %, handle-time, cycle-time, error rate) with its current baseline measured BEFORE build.
- **Data:** the authority map draft (fact class → owning system → access path — `enterprise-data-and-context-readiness.md` §2); candidate corpus inventory with owners, formats, volumes, freshness; permission model; classification tiers present.
- **Users:** who asks what (pull real query samples from tickets/search logs); languages; where they work; what "trust" needs to look like for them (citations? links? a human fallback?).
- **Constraints:** compliance frames in play (`governance-and-human-policies.md` §8), residency, approved vendors, latency needs, budget envelope, integration surfaces (SSO/IdP, the tools from Q11).
- **Politics (real, name it privately):** who wins/loses if this works; whose content gets exposed as stale; who fears replacement. The content-owner role reframes threatened experts into the system's editors — use it.

## 3. Use-case triage — pick ONE lighthouse

Score each candidate 1–5 × 1–5:

- **Value** = frequency × cost-per-occurrence × strategic visibility.
- **Feasibility** = data readiness (scorecard, `enterprise-data-and-context-readiness.md` §6) × error tolerance (wrongness survivable?) × integration simplicity.

Pick the highest value×feasibility with **error tolerance ≥3** — never lead with a low-tolerance use case (medical/legal/financial advice to end customers) as engagement #1 even if its value scores highest; earn the harness first on a survivable surface.

Classic strong lighthouses: internal support/helpdesk deflection, sales/proposal knowledge assistant, policy/procedure Q&A for ops teams, onboarding assistant, ticket triage+draft. Classic traps as #1: "a bot for our customers that knows everything," anything that auto-acts externally, anything over a corpus nobody owns.

## 4. Phased delivery (each phase has a DoD; don't skip 0)

### Phase 0 — Readiness & baseline (1–3 weeks typical)
Build: golden question set (50–200 real questions + sourced answers + unanswerables — from Q8 + logs); readiness scorecard on the target corpus; authority map; data fixes for red rows (or corpus scope-down); classification + HITL tier table; baseline measurement of the success number.
**DoD:** scorecard ≥3 across the board on the SCOPED corpus; golden set signed by the client's SMEs; success metric baselined; go/no-go decision recorded. *Deliverable even if the project stops here — the client knows exactly where their data stands.*

### Phase 1 — Grounded assistant, narrow and honest (2–6 weeks typical)
Build: the pipeline (`rag-playbook.md`) over the scoped corpus; citations + abstention; ACL-inside-retrieval with the black-box isolation test; logging (reproduction tuple); eval harness in CI; the feedback loop wired to the content owner; ship inside the tool users already live in.
**DoD:** golden-set targets hit (typical bars: retrieval recall@k ≥0.85–0.9 on answerables; faithfulness ≥0.9; abstention accuracy ≥0.9 on unanswerables — tune per risk tier); isolation probe passes; runbook + owner handoff done; pilot cohort live.
**Explicitly OUT of Phase 1:** autonomous actions, write-tools, multi-corpus federation, fine-tuning.

### Phase 2 — Measure, expand, harden
Weekly: unanswered-query review → corpus backlog; answer incidents → debugging ladder. Expand by ADJACENCY: next corpus, next team, next language — each expansion re-runs Phase 0's scorecard on the new corpus (readiness is per-corpus, not per-project).
**DoD per expansion:** same bars as Phase 1 on the grown golden set; success metric moving against baseline (report it).

### Phase 3 — Actions & agents (only after Q&A trust is earned)
Tool-use for structured facts (SQL/APIs per the authority map), then Tier-3 autonomous actions (reversible, internal), then Tier-2 approve-to-act flows. Every action capability gets a row in the HITL matrix BEFORE it ships.
**DoD:** action audit trail; approval UX with evidence; override-rate monitoring; incident runbook extended to actions.

## 5. Deliverables checklist (what the client holds at the end)

- Discovery report + **use-case triage matrix** (Phase 0)
- **Authority map** + readiness scorecard (before/after) (Phase 0, living)
- **Golden eval set** + eval reports per release (Phase 0+, living — this is an ASSET they keep)
- **Architecture decision record** (chosen approach + rejected options' strongest arguments) (Phase 1)
- Pipeline spec + **runbook** (reindex, rollback, oncall) (Phase 1)
- **Governance pack**: the 8 policies + HITL matrix + use-case inventory (`governance-and-human-policies.md` §9) (Phase 1)
- **Dashboard**: success metric vs baseline, abstention rate, feedback, incident log (Phase 2)
- Named-owner handoff doc: content owner, product owner, feedback SLA (Phase 1)

## 6. Engagement anti-patterns (the ways these projects actually die)

1. **Demo-driven development.** A dazzling demo on 5 cherry-picked PDFs sells a system that collapses on the real corpus. *Counter:* demo ON the golden set, including the unanswerables; show the abstentions proudly.
2. **"Index everything."** *Counter:* one owned corpus; expansion is a phase, not a default. (Full argument: `enterprise-data-and-context-readiness.md` §1.)
3. **"We'll add permissions after the pilot."** The pilot's super-user index becomes production and leaks. *Counter:* ACL-inside-retrieval is Phase 1 DoD, non-negotiable; pilot data = prod permission shape.
4. **No eval set.** "If there's no eval set, there is no project — only a demo." *Counter:* Phase 0 gate; refuse to tune quality by anecdote.
5. **No content owner.** *Counter:* no owner, no serving — put it in the SOW.
6. **Treating hallucination as a model problem.** Weeks of prompt/model churn while the corpus contradicts itself. *Counter:* the debugging ladder; most "hallucinations" in grounded systems are rungs 1–5 (context failures).
7. **Success by vibes.** "People seem to like it." *Counter:* the baseline number from Phase 0; report movement or admit flatness.
8. **Scope-creep to agents before Q&A works.** Auto-acting on top of unreliable retrieval multiplies the blast radius. *Counter:* Phase 3 is gated on Phase 1–2 bars holding in production.
9. **Sandbox POC, prod surprise.** POC on clean exported data, prod on live messy permissioned data. *Counter:* POC on the real corpus slice with real ACLs from day one.
10. **Launch-and-leave.** No monitoring, no feedback triage; quality decays as the corpus drifts. *Counter:* Phase 2 rituals in the handoff, with the client's named owner running them before you leave.

## 7. Scoping heuristics (rough effort shape, for expectation-setting)

Drivers that move cost most, in order: **ACL complexity** (flat corpus vs role/tenant-scoped vs regulated tiers), **parsing difficulty** (clean markdown vs scanned PDFs/tables), **freshness SLA** (weekly batch vs event-driven sync), **integration surface** (standalone vs embedded in CRM/Slack with SSO), **action scope** (Q&A only vs Tier-2/3 actions). A flat-corpus, clean-format, batch-freshness, standalone Q&A assistant is the floor; each driver stepped up multiplies scope — say so at triage time, not at invoice time.

Present every scope honestly against the alternative: sometimes the right recommendation after Phase 0 is "fix these three data problems and revisit in a quarter — an AI layer today would serve your mess back to you politely." Saying that is what makes the next engagement yours.
