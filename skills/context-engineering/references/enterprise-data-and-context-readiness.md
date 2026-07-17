# Enterprise Data & Context Readiness

How an organization sets up its data and knowledge so an AI solution can be built on it — and the readiness gate that decides whether to build retrieval at all. **An AI assistant is capped by the corpus it reads: garbage in, confident garbage out, at scale, with citations.** Most failed enterprise AI projects failed here, before a single model call.

---

## 1. The mindset shift the client must make

- **The AI is now a reader of your documentation.** Every stale wiki page, duplicated policy, and abandoned SharePoint folder used to waste one employee's afternoon; now it becomes a confidently wrong answer served to everyone. Knowledge management stops being housekeeping and becomes a production dependency.
- **Answer quality is a data supply chain, not a model feature.** Model upgrades won't fix a corpus that contradicts itself.
- **Curation beats coverage.** A small, owned, fresh corpus outperforms "we indexed everything." Indexing everything means indexing every draft, every superseded version, every contradiction — and retrieval will find them.

## 2. The authority map (build this FIRST, before any pipeline)

For each **class of fact** the AI will be asked about, name the single system that owns it and the correct access path. Facts have owners; the AI must read each fact from its owner, not from prose copies.

| Fact class | Authority (system of record) | Correct access path | NOT from |
|---|---|---|---|
| Prices, entitlements, balances, inventory | Database / billing system | Tool/API call at answer time | PDFs, slide decks, memory |
| Policies, procedures, how-tos | The canonical policy repository | RAG over the *canonical* versions | Email copies, personal drives |
| Customer/account state | CRM | Scoped API call as the caller | Exported spreadsheets |
| Metrics, aggregations, "how many / top X" | Warehouse / semantic layer | Text-to-SQL or a metrics API | Documents describing old numbers |
| Org/people/permissions | IdP / HR system | Directory API | Org-chart slides |
| Product docs, contracts, tickets | Their respective systems | RAG or JIT retrieval, ACL-synced | Ad-hoc copies |

Rules that follow from the map:
- **Structured facts never travel as prose.** If the answer is a number or a state, the AI calls the owning system at answer time. RAG is for *unstructured knowledge*, not a cache of the database.
- **A fact found outside its authority is a defect** — either delete the copy or mark it non-authoritative. Copies are future contradictions.
- The map is a living doc with an owner; every new AI use case starts by extending it.

## 3. Corpus curation — from data swamp to servable corpus

Scope: pick the ONE corpus the lighthouse use case needs (see `client-engagement-playbook.md`), and make it servable. Steps:

1. **Inventory & triage.** List candidate sources (wiki spaces, drives, ticket systems). For each: owner? last review? duplication? sensitivity? Kill list first: drafts, superseded versions, personal copies, archives that were never meant as truth.
2. **Canonicalize.** One canonical version per document; everything else deleted, archived out of scope, or marked `superseded-by: <canonical>`. The AI corpus contains canonical versions ONLY.
3. **Assign ownership.** Every document (or folder/class) has a named owner and a review cadence. Unowned content does not enter the corpus — no owner, no serving. The owner is who fixes it when the AI cites it wrongly.
4. **Stamp lifecycle metadata.** Per document: `owner`, `status` (live / draft / deprecated), `last_reviewed`, `effective_date`, `audience/sensitivity`, `locale`, `product/version it applies to`. This metadata is what retrieval filters on and what freshness policy enforces.
5. **Fix format quality.** Parseable beats pretty: exportable text, real headings, tables that survive extraction, alt text on load-bearing images. Scanned PDFs and screenshots-of-tables are where answer quality goes to die — budget OCR/re-authoring for high-value ones.
6. **De-conflict.** Where two live documents disagree, that is a business bug surfaced by the AI project — route to the owners to resolve BEFORE launch; do not let retrieval arbitrate silently.
7. **Write the freshness contract.** Per document class: review cadence (e.g., policies quarterly), auto-expiry behavior (a doc past its review date gets flagged or drops from the corpus), and who gets the expiry alert.

## 4. Permissions & identity (the part clients always want to skip)

- **Mirror source ACLs into the corpus.** Each chunk carries the permissions of its source document (groups/roles/tenants), synced from the source system — an identity-sync pipeline, not a one-time export. When someone loses access in the source, the corpus must reflect it promptly (SLA it: minutes-to-hours, not weekly).
- **Filter at query time as the caller.** Retrieval runs with the requesting user's identity and filters candidates by their entitlements *inside the retrieval engine*, before anything reaches the model. Index-time-only filtering rots; front-end-only filtering is theater. Research on ungated multi-tenant retrieval shows cross-boundary leakage on essentially every probe (~98–100%) — relevance ranking gives zero isolation by itself.
- **No super-user serving path.** The pipeline's service account may read broadly to index; the *serving* path must never answer from that view. The model must never see a chunk the asking user couldn't open themselves.
- **Tenant isolation is structural.** Per-tenant namespaces/collections + a mandatory tenant predicate on every query — not a filter someone must remember (relational, never hardcoded: the predicate derives from the caller's session, and a missing predicate fails closed).
- **Classification gates ingestion.** Restricted-tier content (M&A, HR cases, credentials, regulated data) stays out of shared corpora entirely unless the use case demands it AND the ACL fidelity is proven. Secrets never enter a corpus.

## 5. Freshness pipeline

- **Sync incrementally, event-driven where possible** (webhooks/change feeds from the source systems), scheduled re-crawl as the fallback. A corpus without a sync path is a snapshot that starts lying on day two.
- **Reindex triggers:** document changed → re-parse/re-chunk/re-embed that document; taxonomy or chunking strategy changed → versioned full rebuild; embedding model changed → full re-embed (embeddings from different models are not comparable — never mix in one index).
- **Deletion propagates.** A doc deleted/deprecated at the source leaves the index promptly (and its chunks stop being citable). Test this path; it is the one nobody tests.
- **Surface freshness to users.** Answers carry the cited doc's `last_reviewed`/version. "Current as of <date>" converts a silent staleness bug into a visible, tolerable limitation.

## 6. The readiness scorecard (the GATE)

Score the target corpus 1–5 on each dimension. **Build retrieval only over a corpus scoring ≥3 everywhere, or scope the corpus down until it does.** Below that, the correct project is a data-fixing project — say so honestly; it is cheaper than a failed AI project.

| Dimension | 1 (red) | 3 (buildable) | 5 (green) |
|---|---|---|---|
| **Ownership** | Nobody owns content | Owners named for the target corpus | Owners + review cadence enforced |
| **Canonicality** | Duplicates/versions everywhere | Canonical set identified for scope | One canonical version, supersession tracked |
| **Freshness** | No review dates; known-stale content | Target corpus reviewed at kickoff | Sync pipeline + expiry alerts live |
| **Permissions fidelity** | ACLs unknown or "everyone can read" | Source ACLs mapped for scope | Identity-synced, query-time-filtered, tested |
| **Format quality** | Scans, screenshots, broken tables | Mostly parseable; worst offenders fixed | Structured, heading-clean, extraction-verified |
| **Coverage** | Target questions unanswerable from corpus | Lighthouse questions covered | Gap-tracking loop from unanswered queries |
| **Eval set** | None | Golden Q/A drafted from real questions | Golden set + unanswerables, refreshed from prod |

Two uses: (a) the go/no-go gate before Phase 1; (b) a before/after artifact for the client — readiness improving IS deliverable progress.

## 7. Knowledge ops — the standing loop after launch

- **Unanswered/abstained queries are the backlog.** Review them weekly; each is either a coverage gap (write/fix the doc — routed to its owner), a retrieval bug, or out-of-scope (say so in the UX).
- **Wrong answers get root-caused, not patched** (full ladder in `rag-playbook.md` §Debugging): corpus wrong → owner fixes doc; retrieval missed → pipeline fix; model misread → prompt/eval fix. The fix lands at the source, and the golden set gains a regression question. Never "prompt around" a wrong document.
- **The feedback loop has an SLA and an owner.** Thumbs-down without triage is decoration.
- **Corpus changes are releases.** Adding a source, changing chunking, swapping embedders — each runs the golden set before shipping (see gate 1 of SKILL.md).

*Fail-state for this whole reference:* a technically excellent pipeline built over an unowned, stale, permission-blind corpus — the client got a fast, well-engineered way to serve wrong answers.
