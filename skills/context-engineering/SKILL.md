---
name: context-engineering
description: Use when designing, reviewing, or fixing the CONTEXT LAYER of any AI solution — what the model sees at inference time and the data/governance system that feeds it. Trigger for context engineering, RAG design or debugging, enterprise knowledge-base / corpus setup, data readiness for AI, permission-aware retrieval, grounding and citations, memory/compaction for agents, AI governance policies (access, HITL, audit, classification), and client discovery/scoping for a new AI solution. Not for authoring the semantic decision itself (ai-decision-contract-builder) and not for auditing an already-shipped wrong output end-to-end (ai-output-source-truth-audit).
---

# Context Engineering — the context layer of AI solutions

Prompt engineering asks "what words do I say to the model?" **Context engineering asks "what is the smallest set of high-signal tokens the model needs in its window, at this step, to make the right decision — and what system keeps that supply correct, fresh, permissioned, and auditable?"** The model is rarely the bottleneck in an enterprise AI solution; the context system is. This skill owns that system end-to-end: the window itself, the corpus behind it, the retrieval between them, and the human policies around all three.

## The one law

Context is a **finite attention budget with diminishing returns**, not free storage. Every token competes with every other token; irrelevant tokens actively degrade decisions (context rot), and instructions buried mid-window under-perform the same instructions at the edges. Therefore: **find the smallest set of high-signal tokens that maximizes the probability of the desired outcome.** Everything in this skill is a technique for obeying that law at a different layer.

## The four operations (every context technique is one of these)

1. **WRITE** — persist state outside the window (notes files, memory, scratchpads, decision logs) so it survives without occupying tokens.
2. **SELECT** — pull in only what this step needs (retrieval, JIT file reads, metadata-filtered search) instead of pre-loading everything.
3. **COMPRESS** — summarize/compact what must stay (history compaction, tool-result pruning, chunk contextualization) to keep signal per token high.
4. **ISOLATE** — give sub-tasks their own clean windows (sub-agents that return conclusions, not dumps; per-tool schemas; instruction/data separation).

## Workflow — which reference, when

Work top-down; each phase gates the next. All references live in `references/`.

| Phase | Question it answers | Reference |
|---|---|---|
| **0. Fundamentals** | How context actually works; the window, agents, memory, anti-patterns | `context-engineering-fundamentals.md` |
| **1. Data readiness** | Is the client's data even ready to feed an AI? Authority map, corpus curation, readiness scorecard — the GATE before building | `enterprise-data-and-context-readiness.md` |
| **2. Architecture + RAG** | Is RAG even right? Then: the full pipeline (parse → chunk → embed → retrieve → rerank → generate), failure-mode ladder, evals, security | `rag-playbook.md` |
| **3. Governance** | The human policies: access/identity, classification, HITL tiers, audit, incidents, compliance frames | `governance-and-human-policies.md` |
| **4. Client engagement** | Discovery question bank, use-case triage, phased delivery, engagement anti-patterns, deliverables per phase | `client-engagement-playbook.md` |

Routing by request shape:
- "Explain context engineering / set up an agent's context / my agent degrades over long runs" → Phase 0.
- "Client wants a chatbot over their docs / knowledge assistant / RAG" → Phases 1 → 2 → 3, driven by Phase 4 if it's a client engagement.
- "Our RAG answers are wrong/stale/leaky" → Phase 2 failure-mode ladder (§Debugging), then Phase 1 if the root cause is the corpus.
- "What policies do we need around AI?" → Phase 3.
- "I'm meeting a client about an AI solution" → Phase 4 first; it pulls the others as needed.

## Non-negotiable gates (each names its fail-state)

1. **Eval set before pipeline.** A golden question set (with sourced answers AND unanswerables) exists before retrieval is built; every pipeline change re-runs it. *Fail-state:* quality is judged by demo vibes, and a chunking change silently regresses half the corpus.
2. **Data readiness before retrieval.** The corpus passes the readiness scorecard (owner, freshness, canonical versions, permissions fidelity) or the corpus is scoped down until it does. *Fail-state:* the system confidently serves the SharePoint graveyard — stale, duplicated, contradictory answers at scale.
3. **ACLs enforced inside retrieval, per caller.** Permission filtering happens at query time with the caller's identity, on top of source-synced ACL metadata — never only at index time, never a shared super-user view. *Fail-state:* any employee can ask the bot for the M&A folder and get it (ungated retrieval leaks in ~98–100% of cross-boundary probes).
4. **Grounded or honest.** Answers cite retrieved sources; when the context doesn't contain the answer, the system abstains and routes (to search, a human, or "not in the knowledge base") — it never fills the gap from parametric memory in grounded mode. *Fail-state:* confident fabricated answers wearing the UI of a grounded system.
5. **Retrieved content is untrusted input.** Corpus text is data, never instructions; injection defenses and tool-permission limits sit downstream of retrieval. *Fail-state:* a poisoned document in the corpus exfiltrates data or drives tool calls.
6. **The window stays curated.** Always-on context is minimal and deduplicated; everything else is selected just-in-time via an index; long histories compact; sub-agents return summaries. *Fail-state:* the kitchen-sink prompt — every past bug appended as a rule forever — until the model can't find the instruction that matters.
7. **Every answer is reproducible.** Log query, retrieved chunk IDs + corpus/prompt/model versions per answer. *Fail-state:* a bad answer arrives and nobody can say whether the corpus, retrieval, prompt, or model caused it.
8. **Startup context has one import path per authority and a measured ceiling.** For repository agents, inventory every always-on entry point, recursively resolve imports, and fail on duplicate reachability even when a token counter would deduplicate the bytes. Set a hard project ceiling (default 10,000 approximate tokens, target about 4,000) and move task-specific detail behind path-scoped rules, skills, or just-in-time routers. *Fail-state:* `CLAUDE.md` imports a large router that is also loaded by the rules engine, the counter reports only one copy, and the model still receives doubled or competing instructions at runtime.

## Output contract

Work produced under this skill states: the **use case + success metric**, the **authority map** (which system owns which fact class), the **architecture decision** (long-context vs RAG vs agentic vs SQL vs fine-tune — with the rejected option's strongest argument), the **pipeline spec** with per-stage choices and why, the **eval plan** (golden set size, metrics, regression cadence), the **governance pack** (ACL model, HITL tier table, logging/retention), and **phase DoDs**. A recommendation without the eval plan and governance pack is not done.

For repository-agent context work, the output additionally includes the measured startup files/tokens, duplicate-import graph, hard ceiling, target, and the exact gate command. Killer mutation: add a second import path to an already reachable authority; the gate must fail even if total unique bytes do not change. Counterexample: two path-scoped rules may reference the same authority for different file patterns when neither is always-on.

## Lane boundaries (route, don't duplicate)

- Designing the semantic decision/prompt contract itself (classifier outputs, validators, bounded repair) → `ai-decision-contract-builder`.
- Auditing an already-live wrong AI output back to its source → `ai-output-source-truth-audit` (this skill's failure ladder feeds it).
- Tenancy/RBAC architecture at the app level → `architecture-saas-design`; security audit of the whole surface → `security-review-hardening`.
- Standing up a repo's agent operating model (rules, fleet, gates) → `bootstrap-orchestrator` (its Step 2.5 applies this skill to the repo's own context layer).
