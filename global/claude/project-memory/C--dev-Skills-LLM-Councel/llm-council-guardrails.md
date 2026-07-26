---
name: llm-council-guardrails
description: "Anti-hallucination/anti-drift guardrails for the Idea Council, adapted from the Nuvo Dialer setup"
metadata: 
  node_type: memory
  type: reference
  originSessionId: a0470bf2-eae0-43a4-909c-bb0ca9886586
---

Guardrails adopted into the Idea Council ([[llm-council-project]]) from `${PROJECT:auxara-dialer|backslash}` (Amin's proven anti-fabrication setup; key source files there: `scripts/check-test-intent.mjs`, `scripts/claude-posttooluse-gate.mjs`, `docs/.../adr/ADR-ARC-003-ai-deterministic-boundary.md`):

- **Grounding-ID validator (P0)** — `council/validators.py` `enforce_grounding(memo, valid_source_ids)`: a `grounded` claim must reference ids in the TRUSTED RESEARCH-BRIEF id set — **NOT** the synthesizer's own `memo.sources` (a model can mint a fake source to self-certify). Authority = the web-research pass only; in `--fast`/inference-only mode the trusted set is empty so everything downgrades. Else DOWNGRADE grounded→inferred (record reason) — never drop, never fabricate. **Lesson:** the naive version (trusting `memo.sources`) was a blocking authority-boundary flaw caught by the `council-integrity-auditor` — validate provenance against the trusted source, never the model's own output.
- **Schema-validate every stage + bounded repair (P0)** — `validators.bounded_repair`: jsonschema-validate each stage; on failure run ONE repair pass (name failed field + why, return only that field, merge); if still failing mark `rejected` with empty output, never fabricate. Trace `passed|repaired|rejected` per seat (Nuvo bounded-repair trace truth).
- **Honest degraded state (P0)** — a seat that errors/times out is recorded `unavailable` with reason; council proceeds with survivors; memo NAMES absent seats. Never silently shrink the roster (Nuvo `*_pass=null + reason`, never a fabricated pass).
- **Generate vs judge (P1)** — synthesizer is the only seat that renders the decision; Python owns anonymization, grounding check, schema validation, dedup, memo assembly.
- **council-integrity-auditor (P1)** — read-only `.claude/agents/council-integrity-auditor.md` enforcing the above before output is final; verdict = findings table + invariants-checked-clean list (Nuvo auditor skeleton).
- **PostToolUse hook (P1)** — `.claude/settings.json` Edit|Write -> `scripts/council_posttooluse_gate.py` (syntax check + prompt-contract tokens + Python test-intent `Proves:` header). exit 0 on no-match, exit 2 with actionable stderr on failure. "Wire the gate, not the rule."

Calibrated DOWN from Nuvo's full apparatus (no ADR/source-of-truth-map/journey/multi-auditor fleet) — personal tool, not a multi-tenant compliance product.
