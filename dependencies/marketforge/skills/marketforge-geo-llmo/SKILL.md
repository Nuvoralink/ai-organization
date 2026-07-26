---
name: marketforge-geo-llmo
description: Generative Engine Optimization (GEO/LLMO/AEO) — making your content the source AI engines cite. Structure for extraction, statistics addition, authoritative quoting, entity recognition. Coordinates with SEO strategy. Use as Phase 4 step 4.
---

# MarketForge GEO/LLMO

Read shared references. Apply V3 §3.2 (Generative Engine Optimization). Cite Aggarwal et al. KDD 2024 paper (academic, evidence grade A) — the only peer-reviewed source for the discipline.

## Global quality rules

- The discipline is <18 months old. Most data is vendor-promoted. Triangulate.
- The peer-reviewed paper (Aggarwal et al., KDD 2024) identified: statistics addition, authoritative quoting, clear claim chunking, fluent unique phrasing — these have measurable lift. Keyword stuffing did NOT help.
- Vendor "GEO ROI" claims (Profound, Otterly, Peec AI) are D-grade; the underlying disciplines work; the magnitude claims are aspirational.
- Allow the right crawlers (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended).

## Purpose

Produce:
1. Crawler allow-list config (robots.txt + llms.txt).
2. Content-structure playbook for AI-engine extraction.
3. Citation strategy (be the source AI engines cite).
4. Entity recognition plan (LLMs trust third-party consensus).
5. Measurement plan (citation share via Profound/Otterly if T2+).

## Inputs

- `seo-strategy.md` (coordinates).
- `content-strategy.md`.
- `competitive-intel.md` (who's citing what).
- `voice-of-customer.md`.

## Outputs

- `docs/marketing-plan/04-website-content/geo-llmo.md`
- DEC-290 to DEC-299

## Structure

```markdown
# GEO / LLMO Strategy

## Why GEO matters now
Cite numbers per `evidence-grading-rubric.md`:
- 1% of users click cited sources in AI Overviews (Pew March 2025, evidence A).
- Brands cited in AIO get 35% higher organic CTR + 91% higher paid CTR (Seer, evidence B).
- Aggarwal et al. KDD 2024: stats addition, authoritative quoting, claim chunking, fluent phrasing → measurable extraction lift (evidence A).
- Ryan Law / Ahrefs internal: AI search visitors converted 23x better (0.5% traffic → 12.1% signups). Evidence D — single-vendor data, post deleted. Treat as ceiling-under-best-conditions, not generalizable benchmark.

## Crawler allow-list

### robots.txt entries
```
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /
```

### llms.txt (optional)
[A file at /llms.txt providing AI engines with curated content priority. Use for product overview pages, key documentation, brand canonical content.]

## Content structure for AI extraction

### TL;DR blocks
Every long-form piece begins with a 2-3 sentence TL;DR block. AI engines preferentially extract from these.

### FAQ schema with marked-up questions
Use FAQPage schema. Each Q is one concise paragraph answer.

### Numbered lists
Bulleted/numbered lists with one claim per item — AI engines extract these cleanly.

### One claim per paragraph
Each paragraph makes one verifiable claim with a source. Multi-claim paragraphs get extracted partially or wrongly.

### Specific named entities
Use named experts, named companies, named tools, specific dates. AI engines build entity graphs.

## Citation strategy: be the source

### Be the citable
- Original data (surveys, benchmarks, proprietary analysis).
- Named author with credentials.
- Specific statistics with source + date.
- Direct quotes from experts (Q&A style or interview reproduction).

### Make it extractable
- Numbered/bulleted facts.
- Tables.
- Schema markup.
- Internal anchor links to specific claims.

## Entity recognition (third-party consensus bias)

LLMs weight third-party consensus over self-claims. Build entity recognition via:

- **Wikipedia / Wikidata** — when the entity (founder, company) clears notability bar, ensure clean entries.
- **Crunchbase / Linkedin** — accurate, consistent NAP (name, address, position).
- **Authoritative third-party mentions** — get cited in publications, podcasts, industry analyst reports.
- **Consistent name + position usage** across the web.

## Measurement

### Tools (T2+ budget)
- Profound ($499+/mo)
- Otterly.ai
- Peec AI
- Goodie

These track brand visibility across ChatGPT, Claude, Perplexity, Google AI Overviews.

### KPIs
- Citation share in target AI engines (% of prompts where brand cited).
- Branded search lift (Google Trends, GSC) — GEO + SEO correlated.
- Direct traffic lift (often the proxy for AI-citation-driven visits since 1% click rate).
- Self-report survey: "Did you hear about us via AI search / ChatGPT / Perplexity?"

NOT a primary KPI:
- Position 1 organic ranking on top-funnel queries (post-AIO, near-zero traffic value).

## Tactics that work (per KDD 2024)
- Statistics addition.
- Quoting authoritative sources.
- Clear claim chunking.
- Fluent unique phrasing.

## Tactics that did NOT help (per KDD 2024)
- Keyword stuffing.

## Coordination with SEO

GEO and SEO overlap heavily in 2026:
- Bottom-funnel commercial queries still SEO-primary; AIO penetrates less here (Semrush: real estate / shopping <3% AIO).
- Brand + local: SEO-primary, GEO-supporting.
- Top-funnel informational: GEO-primary, SEO essentially broken.
- Comparison: both — comparison pages with clean structured data feed both.

## Decision cards
[DEC-290 to DEC-299]

## Kill criteria
GEO citation share flat at 0 in tracked engines after 6 months of structured content + entity-recognition work → reassess approach (likely content quality issue, not GEO tactic issue).

## What we are intentionally NOT doing
- Treating GEO as a silver bullet — most vendor narratives run ahead of evidence.
- Keyword-stuffing for AI engines (already proven not to help).
- Paying for vendor "GEO services" without independent baseline measurement.
- Replacing SEO with GEO — both run in parallel.

## Sources and basis
V3 §3.2 (GEO/LLMO).
Aggarwal et al., KDD 2024 (evidence A).
Pew Research March 2025 (evidence A).
Seer Interactive Sept 2025 (evidence B).
Profound / Otterly / Peec AI (evidence D — triangulate).
```

## When to delegate
- `marketing-skills:ai-seo` for AIO-friendly content optimization.
- `marketing-skills:schema` for schema markup.

## Sources and basis
V3 §3.2.
