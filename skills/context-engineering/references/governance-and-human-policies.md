# Governance & Human Policies for AI Solutions

The human/organizational layer: who may feed the AI what, who may act on its output, what gets logged, and what happens when it's wrong. Technology gates (ACLs, evals) live in the other references; this file is the POLICY pack an organization adopts around them. Every policy names its fail-state — a policy that can't fail isn't a policy.

---

## 1. Access & identity policy

- **The AI inherits the caller's permissions — never exceeds them.** Every retrieval, tool call, and API read executes as (or is filtered to) the requesting user's identity. No end-user-facing path runs on a super-user service account.
- **Identity is synced, not snapshotted:** revocations in the IdP/source systems propagate to AI surfaces on an SLA (target: minutes–hours). Offboarding checklist includes AI surfaces.
- **Tools get least privilege:** an assistant that answers questions holds no write/send/delete scopes; agents that act hold the narrowest scopes that do the job, per environment.
- *Fail-state:* an intern asks the assistant for exec-only content and gets it, because the bot reads with an admin token nobody scoped down.

## 2. Data classification & flow policy (what may enter which model)

Define tiers (typical: **Public / Internal / Confidential / Restricted**) and, per tier, the allowed destinations:

| Tier | Allowed AI destinations (example policy) |
|---|---|
| Public | Any approved provider/model |
| Internal | Approved providers with no-training + retention terms (DPA signed) |
| Confidential | Approved providers under enterprise agreement; region-pinned where required; logged |
| Restricted (regulated, M&A, HR cases, secrets) | Only explicitly approved per-use-case deployments (VPC/on-prem/zero-retention), or not at all |

Accompanying rules:
- **Provider terms are verified, not assumed:** no-training-on-inputs, retention window, sub-processors, region. Re-verify on contract renewal; log the verified terms in the vendor register.
- **Minimize before sending:** redact/tokenize PII that the use case doesn't need; secrets never enter prompts or corpora (DLP at ingestion AND at the prompt boundary).
- **Prompt/completion logs are themselves classified data:** they contain whatever users pasted. Retention, access, and region rules apply to the logs too.
- *Fail-state:* an employee pastes a customer contract into a consumer chatbot because no sanctioned alternative existed — classification policy without a sanctioned-tools path CREATES shadow AI.

## 3. Human-in-the-loop tiers (who may act on AI output)

Classify every AI capability on an action ladder BEFORE building it (this is the org-policy twin of the authority-boundary rule):

- **Tier 1 — deterministic hard gates the system enforces.** Legal/regulatory/safety invariants (consent, disclosure, spending caps, protected-class rules). Enforced in code, fail-closed on unknown inputs, honest audit state when disabled — the AI can never talk its way past them.
- **Tier 2 — AI recommends, human decides (the default for consequential actions).** Sending external communications, changing customer-visible state, money movement, hiring/HR decisions, publishing. Autonomy only by explicit opt-in, default OFF, and per-action approval UX that shows the evidence, not just the conclusion.
- **Tier 3 — AI acts autonomously.** Reversible, internal, low-blast-radius actions (draft, summarize, label, file, retrieve). Expand Tier 3 by moving individual actions DOWN from Tier 2 after a measured track record — never by default.

Policy rules:
- **Irreversibility is the trigger:** anything irreversible, external-facing, or money-moving starts at Tier 2 minimum.
- **Review must be real:** if approvers rubber-stamp 100% at 2 seconds per item, the control is theater — sample-audit approvals and track override rates.
- *Fail-state:* "the AI sent it" — an autonomous action on a Tier-2 concern nobody explicitly opted into, or an approval flow everyone clicks through blind.

## 4. Transparency & UX policy

- **Citations by default** for factual answers from a corpus; the citation opens the source (respecting the reader's ACLs).
- **Honest abstention over confident filler** — with a designed route (escalate to a human, log the gap). Fabrication in grounded mode is a Sev-2 incident, not a quirk.
- **Disclosure:** users know when they're talking to AI or reading AI-generated content, wherever a reasonable person would care (customer-facing always; internal per policy).
- **Freshness on the answer:** cited doc's version/date visible.
- *Fail-state:* customers discover the "expert" was a bot from a hallucinated policy quote in a complaint thread.

## 5. Audit & traceability policy

- **Per answer, retain the reproduction tuple:** query → transformed query → retrieved chunk IDs + corpus version → prompt version → model version → output → feedback/action taken. (Technical substrate in `rag-playbook.md` §2.6/§5.)
- **Retention matched to the domain** (regulated domains: per their record rules) and to the log's own classification (§2).
- **Access to logs is itself scoped** — logs contain user questions (often sensitive) and retrieved content.
- *Fail-state:* a regulator/customer asks "why did your system say this?" and the honest answer is "we can't reproduce it."

## 6. Quality governance — eval gates and the answer-incident process

- **Release gate:** no AI surface ships (or changes pipeline/prompt/model) without the golden-set regression passing (SKILL.md gate 1). Eval reports are retained like test reports.
- **Answer incidents:** a user-visible wrong/leaky/unsafe answer opens an incident with severity (leak/safety = P0; fabrication in grounded mode = P1–2; stale = P2–3). Triage runs the debugging ladder (`rag-playbook.md` §3) to name the failing stage; the fix lands at the source (doc owner fixes the doc; pipeline owner fixes retrieval); the golden set gains a regression case. Same-class-twice → a standing control changes, not a third patch (doctrine-loop).
- **Named owners:** every corpus has a content owner; every AI surface has a product owner; the feedback queue has an SLA. Unowned = unshipped.
- *Fail-state:* the same wrong answer resurfaces quarterly because each occurrence was "fixed" by prompt-tweaking while the source document stayed wrong.

## 7. Acceptable use & shadow-AI policy (for employees)

- A **sanctioned-tools list** (which assistants/models for which data tiers) — short, current, and easy to find; the policy's job is to make the sanctioned path the easiest path.
- What's banned everywhere: pasting Restricted data into unsanctioned tools; representing AI output as human work where disclosure is required; feeding another person's personal data without basis.
- **Verification duty:** AI output used in decisions/deliverables is verified by the human who ships it — "the AI said so" transfers no accountability.
- Train with real examples from your org, not generic slideware; re-attest annually like security training.
- *Fail-state:* policy says "don't use AI" while half the company quietly does — you get all the risk with none of the logging.

## 8. Compliance frames — what they practically demand

Map once, so client conversations aren't hand-waving:

| Frame | What it is | What it practically demands of an AI solution |
|---|---|---|
| **EU AI Act** | Risk-tiered regulation (in force; obligations phasing through 2025–2027) | Classify the use case: most internal assistants = minimal/limited risk (transparency duties — users know it's AI); HR/credit/essential-services use cases can be HIGH-risk (risk mgmt system, data governance, human oversight, logging, conformity). GPAI transparency flows from your provider — keep their documentation on file |
| **NIST AI RMF** | Voluntary US framework (Govern / Map / Measure / Manage) | An AI inventory, named accountability, documented risk assessment per use case, measured performance (your eval harness IS this), monitoring + incident response |
| **ISO/IEC 42001** | Certifiable AI management system | The org-level policy pack in this file, operating with records — if the client wants the cert, these policies + logs are the substance |
| **GDPR/CCPA etc.** | Existing data law — applies regardless of AI | Lawful basis for personal data in corpora/prompts; DSR handling must reach the corpus + logs (can you delete a person from the index?); DPIA for high-risk processing |
| **SOC 2 / ISO 27001** | Security attestations clients already have | AI surfaces inherit the same access-control, logging, vendor-mgmt, and change-mgmt controls — §§1, 2, 5 map directly |

The pattern across ALL frames: **inventory, ownership, risk assessment, human oversight, measurement, logging, incident response.** Build those once (they're this skill's gates) and every frame becomes paperwork over working machinery rather than a scramble.

## 9. The starter policy pack (what a client should have on paper)

Eight short documents — a page or two each, owned, dated, reviewed annually:

1. **AI Acceptable Use Policy** (§7) — sanctioned tools × data tiers; verification duty.
2. **Data Classification & AI Flow Policy** (§2) — tiers, destinations, minimization, log handling.
3. **AI Access Control Standard** (§1) — identity inheritance, sync SLA, least-privilege tools.
4. **Human Oversight Matrix** (§3) — the tier table for every live AI capability, reviewed quarterly.
5. **AI Logging & Retention Standard** (§5) — the reproduction tuple, retention, log access.
6. **AI Release & Evaluation Standard** (§6) — golden-set gate, change control, judge calibration.
7. **AI Incident Response Runbook** (§6) — severities, the debugging ladder, ownership, comms.
8. **Vendor & Model Approval Register** (§2, §8) — approved providers/models, verified terms, review dates.

Plus one living artifact: the **AI use-case inventory** (what's live, its tier, its owner, its eval status) — the index every frame in §8 asks for first.
