# Context Engineering Fundamentals

What context engineering is, how the context window actually behaves, the techniques that work, and the anti-patterns that quietly ruin AI systems. This is the conceptual base for every other reference in this skill.

---

## 1. What context engineering is (and is not)

**Context** = everything the model sees at inference time: the system prompt, tool definitions, few-shot examples, retrieved documents, memory/notes, conversation history, and the current message. The model has no other knowledge of your business than (a) what it memorized in training — stale, generic, unverifiable — and (b) this window.

- **Prompt engineering** optimizes the *wording of instructions*. Useful, small.
- **Context engineering** designs the *entire information environment*: what enters the window, when, from where, in what form, at what cost, with what freshness and permissions — across every step of a task, not just the first message. It is a systems discipline (data pipelines, retrieval, memory, governance), not a writing trick.

The industry converged on this framing (Anthropic's "Effective Context Engineering for AI Agents", 2025) because model quality stopped being the bottleneck: **most bad AI answers in enterprise systems are context failures** — the right fact was missing, stale, buried, unpermissioned, or drowned in noise — not reasoning failures.

## 2. The physics of the window (why "just add more context" fails)

These are load-bearing facts; design against them:

- **Finite attention budget.** Advertised windows (200K–1M+ tokens) are storage limits, not attention limits. Attention is trained mostly on shorter sequences and every token attends to every other (n² pressure); as the window fills, the model's ability to pick out the relevant needle degrades. **Effective context < advertised context.**
- **Context rot.** Accuracy on the SAME question degrades as more irrelevant tokens surround the evidence. Irrelevant context is not neutral filler — it is active noise.
- **Position matters.** Models recall the beginning and end of the window better than the middle ("lost in the middle"). Put standing instructions at the top, the live task at the bottom, and never bury a critical constraint inside a 40K-token document dump.
- **Distraction and poisoning.** One wrong/stale/contradictory passage in context routinely beats the model's correct parametric knowledge — the model trusts what you gave it. Feeding context is an act of authority; curate accordingly.
- **Cost and latency scale linearly-or-worse with tokens.** Every always-on token is paid on every call, forever. A 6K-token system prompt on a 1M-call/month product is a standing invoice.

**The one law** (repeated from SKILL.md because everything derives from it): *find the smallest set of high-signal tokens that maximizes the probability of the desired outcome.*

## 3. The four operations

Every context technique is one of these four. When designing a system, walk the list and decide explicitly what you do for each.

### WRITE — persist outside the window
State that must survive but doesn't need to be re-read every step lives in files/stores, not tokens: structured note files (NOTES.md, task lists, decision logs), memory directories, scratchpads, databases. The agent writes as it works and re-reads on demand. This is how long-horizon agents survive: the window is working memory; files are long-term memory.

### SELECT — retrieve just-in-time, not just-in-case
Load what THIS step needs, when it needs it:
- **Agentic/JIT retrieval:** the agent navigates to data via tools (grep, file reads, API queries, SQL) using lightweight identifiers (paths, links, IDs) as pointers. Mirrors how humans work — we don't memorize the wiki, we know where to look. Slower per-step, but always-fresh and self-scoping.
- **Pre-retrieval (RAG):** embed-and-search a corpus, inject top passages. Faster, works over unstructured piles, but adds a pipeline to maintain (see `rag-playbook.md`).
- **Hybrid (the usual right answer):** a fast retrieval pass for candidates + agentic exploration to verify/expand. Claude Code works this way: CLAUDE.md is pre-loaded, everything else is grep/read on demand.
- **Progressive disclosure:** structure knowledge as index → summary → full doc → raw source, and let the agent descend only as deep as needed. An index line costs 20 tokens; the doc it points to costs 4,000. (This skill itself is built that way: SKILL.md routes, references load on demand.)

### COMPRESS — keep signal density high
- **Compaction:** when a long-running conversation nears the limit, summarize it (decisions made, current state, open items, constraints) and restart the window with the summary + recent turns. Compress last-resort and preserve *decisions and unresolved threads* over play-by-play narrative — a bad compaction that drops a constraint is a silent behavior change.
- **Tool-result hygiene:** tool outputs are the biggest uncontrolled token source in agent systems. Return the 5 fields the model needs, not the 200-field JSON; truncate with a pointer to the full artifact; clear stale results from history once superseded.
- **Summarize at boundaries:** a sub-task's 80K-token exploration enters the parent as a 500-token conclusion.

### ISOLATE — clean windows per concern
- **Sub-agents:** give each bounded sub-task its own fresh window; the orchestrator receives conclusions, not transcripts. This is the strongest tool against rot on complex work — context quarantine.
- **Instruction/data separation:** retrieved documents, user uploads, and web content are DATA and must be delimited/labeled as such; instructions come only from the system layer. This is also the injection defense (see §7 of `rag-playbook.md`).
- **One concern per surface:** don't make one mega-prompt serve chat, extraction, and routing; separate calls with separate minimal contexts beat one omnibus context.

## 4. Designing each context component

### System prompt — the "right altitude"
Two failure modes, one target:
- **Too low (hardcoded):** brittle if-else logic in prose, keyword lists, one rule per past incident. Breaks on the first input the rules didn't anticipate; grows forever.
- **Too high (vague):** "be helpful and accurate" — assumes shared taste the model doesn't have; underspecifies the actual job.
- **Right altitude:** state the role, the job, the non-negotiable constraints, the decision *principles* (teach intent, not keywords), and the output contract. Specific enough to steer, general enough to generalize. Organize into named sections; use the minimum wording that fully specifies the behavior. Test by deletion: if removing a sentence changes no behavior, it was noise — delete it.

### Tools
- Fewest tools that cover the job; **non-overlapping** (if a human can't say which of two tools fits a task, the model can't either).
- Self-contained descriptions written like docs for a new hire; explicit parameter contracts.
- **Token-efficient returns** (see COMPRESS). Errors return *what to do about it*, not stack traces.

### Examples (few-shot)
- 3–5 **canonical, diverse** examples beat 20 edge cases. Examples are pictures of the target behavior, not a rule dump.
- Every example must be *currently correct* — a stale example is an instruction to reproduce the old behavior.
- Include one honest hard case (ambiguity + how to resolve it) and, for grounded systems, one abstention example.

### Memory (cross-session)
- File-based memory (one fact per file + an index) or a memory store; recalled facts enter as *background with provenance*, not as fresh instructions.
- Memory needs an owner and a decay policy: verify-before-rely, update-on-contradiction, delete-when-wrong. Unmaintained memory becomes a stale-context injector.

### History
- Unbounded history is a slow leak: old tool results, dead ends, and superseded plans accumulate as noise. Compact on threshold; prune superseded tool results; never let raw dumps ride along "just in case."

## 5. Knowledge bases for coding/ops agents (CLAUDE.md / AGENTS.md discipline)

The always-loaded agent file is the most abused surface in agent setups. Rules:

- **Always-on = only what EVERY turn needs:** identity/doctrine, hard constraints, the map of where everything else lives. Everything else is JIT: an index doc routes to detail docs; the agent reads on demand.
- **Token budget it:** treat the always-on layer as a budget line (know its token count; review at threshold). Every addition evicts attention from the live task.
- **One source of truth per rule** — a rule duplicated across CLAUDE.md, a rules dir, and a README will drift into contradiction, and the model obeys the copy you forgot about. (Deliberate *visibility* redundancy is a valid exception — but then one copy is canonical and the others are generated/checked from it.)
- **Freshness signals on docs** (`Status: live/stub/historical`, `Last verified:`) so stale context is visible before it's trusted.
- **Progressive disclosure as architecture:** index → doc → source; short pointers (paths, IDs) over inlined content.

## 6. Long-horizon agents — picking the technique

| Situation | Technique |
|---|---|
| Task exceeds one window, continuous flow (long refactor, migration) | **Compaction** (summarize + reinit) |
| Task has discrete milestones/state (project work, research over days) | **Structured notes** (WRITE) + lean window |
| Task decomposes into bounded sub-explorations | **Sub-agents** (ISOLATE) returning summaries |
| Corpus too big to load, navigable via tools | **JIT retrieval** (SELECT) |
| Corpus too big, unstructured, needs semantic lookup | **RAG** (see `rag-playbook.md`) |

These compose; a serious agent system usually runs all five.

## 7. Anti-pattern catalog (each with its fail-state)

1. **Context stuffing / "just use the big window."** Dumping whole corpora because the window fits them. *Fail-state:* context rot — accuracy drops as tokens rise, cost 10×, and nobody can say which passage the answer came from.
2. **The kitchen-sink system prompt.** Every past incident appended as a new rule, forever; nothing ever removed. *Fail-state:* instructions contradict, the model obeys an old rule over a new one, and the one constraint that matters is buried at token 3,800.
3. **Duplicated/contradictory instructions.** The same rule restated differently in three places. *Fail-state:* the copies drift; behavior follows the stale copy; debugging blames the model.
4. **Stale pinned context.** Examples, docs, or memory injected every call and never re-verified. *Fail-state:* the system confidently reproduces last quarter's pricing.
5. **Unbounded history + raw tool dumps.** *Fail-state:* the agent's step-40 decisions are dominated by step-3 noise; latency and cost creep until someone notices the bill.
6. **Tool sprawl.** 40 overlapping tools "for flexibility." *Fail-state:* wrong-tool calls and dithering; the fix is deletion, not prompting.
7. **Burying the lede.** Critical constraint mid-window inside a document dump. *Fail-state:* "the model ignored the instruction" — no, the position discounted it.
8. **Treating retrieved text as trusted.** *Fail-state:* prompt injection from a poisoned doc; see gates.
9. **Prompt-fixing a context problem.** Rewriting instructions when the real failure is a missing/stale/unretrieved fact. *Fail-state:* weeks of prompt churn; the answer was never in the window.
10. **Context as a substitute for authority.** Facts that should come from a system of record (price, entitlement, balance) pasted into prompts as text. *Fail-state:* the number drifts from the database and the model states it confidently. Structured facts come from tools/APIs at call time.

## 8. Debugging heuristic — context first, model last

When an AI system answers wrong, walk this ladder before touching the prompt or blaming the model (it mirrors the 5-level upstream-cause ladder of the global doctrine):

1. **Was the needed fact in the window at all?** (Log the actual assembled context — read it, don't assume it.) If not → retrieval/data problem, go to `rag-playbook.md` §Debugging.
2. **Was it there but wrong/stale?** → corpus/data problem, go to `enterprise-data-and-context-readiness.md`.
3. **Was it there and right, but buried/drowned?** → curation problem: compress, reposition, cut noise.
4. **Was it there, right, and prominent — and the model still misused it?** → NOW it's an instruction/model problem: fix altitude, examples, or model choice.

Most failures die at rungs 1–3. Teams that skip to rung 4 burn weeks prompt-tuning a retrieval bug.
