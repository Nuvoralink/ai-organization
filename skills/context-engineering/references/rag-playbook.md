# RAG Playbook — Architecture Choice, Pipeline Design, Debugging, Evals, Security

End-to-end design guide for retrieval-augmented generation. Read `enterprise-data-and-context-readiness.md` first — RAG over an unready corpus automates wrong answers.

---

## 1. Is RAG even the right architecture? (decide BEFORE building)

RAG is one option, not the default. Choose per fact-class from the authority map:

| Approach | Choose when | Reject when | Watch out |
|---|---|---|---|
| **Direct context (stuff docs into the prompt)** | Corpus is small (≲100–200K tokens), stable, uniformly relevant; low call volume | Corpus large, fresh-changing, permissioned, or per-user filtered | Context rot + paying the whole corpus every call; no citations granularity |
| **RAG (embed + retrieve)** | Large unstructured corpus; freshness matters; per-user permissions; need citations/traceability; high call volume | Facts are structured (numbers/states); corpus tiny; answers need multi-step navigation | The pipeline is a product — budget its maintenance |
| **Agentic/JIT retrieval (tools: search, grep, APIs, file reads)** | Sources are navigable and self-describing (code, wikis with good structure, ticket systems); tasks are exploratory/multi-hop | Sub-second latency needed; sources unnavigable | Slower + token-heavier per query; superb freshness and precision |
| **SQL / semantic layer (text-to-query)** | Aggregations, metrics, filters, "how many / top N / trend" | Unstructured knowledge | Guard with allow-listed schemas/views; never raw write access |
| **Fine-tuning** | Style, format, taxonomy, domain *language*; latency/cost compression of a proven prompt | **Injecting knowledge/facts** (wrong tool: stale on day one, no citations, no ACLs) | Always after prompt+retrieval is proven, never instead of it |
| **Hybrid (RAG + agentic + SQL behind one router)** | Real enterprise assistants — different questions hit different authorities | Don't start here; grow into it | The router needs its own evals |

State the decision with the rejected option's strongest argument (decision-discipline). Most client systems end hybrid: RAG for knowledge, tools for structured facts, agentic search for long-tail navigation.

## 2. Pipeline design, stage by stage

Order of leverage when quality is lacking: **parsing > chunking > hybrid retrieval > reranking > prompt**. Teams habitually tune the prompt first; it is the last lever.

### 2.1 Parsing & extraction (where quality dies first)
- Extract to clean structured text (markdown-ish) preserving headings, lists, and tables. Verify by READING extracted output for the 10 ugliest real documents — never trust a parser demo.
- Tables: extract as structured rows (or HTML/markdown tables), never as space-mangled prose. If tables carry the answers (pricing, specs, SLAs), table-aware parsing is the project.
- OCR/scans: budget for it or exclude them explicitly; a silent 30%-garbage layer poisons everything downstream.
- Keep `doc_id`, section path, page/anchor for every extracted span — citations depend on it.

### 2.2 Chunking
- **Structure-aware first:** split on the document's own boundaries (headings/sections/paragraphs), never mid-sentence/mid-table/mid-code-block. Fixed-size splitting is the baseline that loses.
- **Size:** ~200–800 tokens typical; smaller for precise lookup (FAQ, policy clauses), larger for narrative/how-to. When in doubt start ~400 with 10–15% overlap and let evals decide.
- **Contextualize every chunk:** prepend a breadcrumb header — `Doc title > Section > Subsection` + doc metadata (version, date, product). A chunk that says "the limit is 50" is unanswerable about *what* limit; contextual chunk headers (or LLM-written chunk context — Anthropic's "contextual retrieval") are among the highest-ROI upgrades, cutting retrieval failures dramatically.
- **Don't split what belongs together:** a table + its caption; a step list; a code block + its explanation. Parent-document pattern where needed: retrieve the small chunk, serve the surrounding section.

### 2.3 Embedding & indexing
- Pick a strong current embedder (check MTEB-class benchmarks at build time; don't hardcode a 2-year-old default).
- **Version discipline:** record `embedder@version` on the index; changing embedders = full re-embed into a NEW index, cut over atomically. Mixed-model vectors in one index are silent corruption.
- Metadata on every vector: `doc_id`, section, `owner`, `status`, `last_reviewed`, ACL groups, tenant, locale, product/version — retrieval filters live here.
- Vector DB choice is rarely the quality bottleneck; choose on ops fit (managed vs self-hosted, filters, hybrid support, namespaces per tenant). Pinecone/pgvector/Qdrant/Weaviate/OpenSearch all work; a team that already runs Postgres usually starts with pgvector.

### 2.4 Retrieval
- **Hybrid by default:** dense (semantic) + BM25/keyword (exact terms, SKUs, error codes, acronyms), fused (e.g., RRF). Hybrid consistently beats either alone on enterprise text (order-of-10-points MRR gains are typical in published comparisons).
- **Query transformation:** conversational turns → standalone query (resolve "it", "that plan"); decompose multi-part questions; expand acronyms from a glossary. HyDE/multi-query are optional extras — measure before keeping.
- **Mandatory filters first:** tenant + ACL predicates (from the caller's identity, fail-closed) and lifecycle filters (`status=live`) apply BEFORE ranking. Security is a predicate, not a ranking signal.
- **Retrieve wide, then rerank:** top 20–50 candidates → cross-encoder reranker → keep the best 3–8 for the prompt. Reranking is the single highest-ROI retrieval addition; it turns "topically similar" into "actually answers the question."
- Deduplicate near-identical chunks (MMR/diversity) so the window isn't 5 copies of one paragraph; boost recency on time-sensitive classes.

### 2.5 Generation (the grounding contract)
- Instruct explicitly: answer ONLY from the provided context in grounded mode; cite chunk IDs per claim; if the context doesn't contain the answer, say so and route (search again / ask a human / "not in the knowledge base") — abstention is a designed, useful path, not an apology (and its rate is monitored, not maximized: see honesty-vs-usefulness below).
- Conflicting sources: prefer `status=live` + newer `effective_date` + the authority-map winner; SURFACE the conflict ("two documents disagree: …") rather than silently averaging. A surfaced conflict is a data bug filed to the owners.
- Structure the prompt: instructions at top, retrieved chunks clearly delimited and labeled as data (`<source id=… doc=… date=…>`), question last.
- Honesty-vs-usefulness: an abstention must route somewhere actionable. If >~15–20% of real queries abstain, that's a coverage/retrieval bug to fix, not honesty to celebrate.

### 2.6 Post-generation checks (backstops, not the intelligence layer)
- Citation-support spot check (does the cited chunk entail the claim?) — as a *signal/flag*, feeding a bounded regenerate-with-feedback, not a silent rewrite (authority-boundary: validators teach the retry; they don't overwrite the verdict).
- Log per answer: query, transformed query, retrieved IDs + scores, reranked set, prompt version, model version, output, feedback. This log IS the debugging and audit substrate (SKILL.md gate 7).

## 3. Debugging ladder — map the wrong answer to its stage

Walk DOWN from the user-visible symptom; fix at the earliest wrong stage (this is the RAG instance of the global 5-level upstream-cause ladder). The per-answer log makes each rung checkable in minutes.

| # | Symptom | Diagnosis check | Root cause & fix level |
|---|---|---|---|
| 1 | Answer not in corpus at all | Search the corpus manually | **Missing content** → coverage gap: write/ingest the doc (owner), or declare out-of-scope in UX. Model should have abstained — if it fabricated instead, ALSO fix the grounding contract |
| 2 | In corpus, not retrieved | Was it in the top-50 candidates? | **Retrieval miss** → chunking destroyed it (mid-table split, missing context header), embedder blind to phrasing (→ hybrid/keyword), or query transformation failure |
| 3 | Retrieved, ranked out | In candidates, not in final 3–8? | **Rank miss** → add/tune reranker; reduce near-duplicate crowding; widen k into the reranker |
| 4 | In prompt, not in answer | Read the assembled prompt | **Consolidation miss** → too many/too-long chunks (rot), lede buried, weak grounding instructions; compress and cut |
| 5 | Answered from the wrong version | Which doc version was cited? | **Staleness/conflict** → lifecycle filters, deletion propagation, de-conflict at source (data bug, not AI bug) |
| 6 | Right doc, wrong reading | Chunk supports a different claim | **Model misread** → chunk lacks context header; table mangled by parsing; only now consider prompt/model changes |
| 7 | Answer leaks something the asker shouldn't see | Check ACL predicate in the logged query | **Security defect, P0** → ACL-inside-retrieval broken or unsynced; stop the line |

## 4. Evals — the harness that makes everything else safe to change

- **Golden set BEFORE pipeline** (SKILL.md gate 1): 50–200 real questions (pull from tickets, search logs, SME interviews), each with a sourced expected answer + the doc(s) that support it, INCLUDING 10–20% *unanswerables* (correct behavior = abstain) and a few conflict/permission cases. This set is a client deliverable and a living asset.
- **Score retrieval and generation separately** — you cannot fix what you measure jointly:
  - Retrieval: recall@k and MRR against labeled supporting docs (does the right chunk even arrive?).
  - Generation: faithfulness/groundedness (claims supported by retrieved context), answer relevance, citation accuracy, abstention accuracy on unanswerables.
- **LLM-as-judge, calibrated:** judge model scores faithfulness/relevance at scale; humans spot-check ~10–20% until judge-human agreement is established, then periodic re-calibration. An uncalibrated judge is a vibe with a dashboard. The judge is a *measurement* backstop — a low judge score flags for review/retry; it never silently rewrites an answer.
- **Regression on EVERY pipeline change:** chunking, embedder, k, reranker, prompt, model — golden set runs before merge; a drop blocks the change. Roughly 70% of production RAG systems ship with no eval framework — this discipline alone beats most incumbents.
- **Online monitoring:** feedback rate, abstention rate, retrieval-score distributions (drift), latency/cost per answer, unanswered-query log feeding the knowledge-ops backlog.

## 5. Ops & cost

- **Budget per answer** (order-of-magnitude sanity): embedding a query is negligible; retrieval+rerank tens of ms to ~200ms; generation dominates cost. Cache embeddings; cache frequent answers where freshness allows (with corpus-version keys so cache invalidates on reindex); cap retrieved-context tokens — more chunks past ~8 usually adds rot, not recall.
- **Version everything together:** corpus snapshot, chunker config, embedder, prompt, model — a reproducible tuple per answer (gate 7). "It answered differently yesterday" must be diagnosable to a version diff.
- **Reindex runbook:** who triggers, how long, how verified (golden set on the new index before cutover), how rolled back.

## 6. Security (the RAG-specific threats)

1. **Prompt injection via poisoned documents.** Any writable source (tickets, emails, user uploads, public web) can carry "ignore your instructions / call this tool / exfiltrate X". Defenses in depth: retrieved text is delimited DATA and the system prompt says instructions inside it are never followed; tool permissions downstream of retrieval are least-privilege (a doc-QA answerer needs no email-send tool); high-risk actions require human confirmation regardless of what retrieved text says; injection probes live in the eval set.
2. **ACL bypass / cross-tenant leakage.** Covered structurally in `enterprise-data-and-context-readiness.md` §4; test it black-box: a probe user MUST fail to retrieve content they can't open at the source, per release (tenant-isolation test, not a code review claim).
3. **Secrets/PII in the corpus.** Scan at ingestion (DLP pass); PII enters only where the use case requires it and the classification tier allows the destination model/provider.
4. **The corpus is an audit surface.** Log who asked what and which chunks served the answer — this is both incident forensics and the compliance story (see `governance-and-human-policies.md`).
