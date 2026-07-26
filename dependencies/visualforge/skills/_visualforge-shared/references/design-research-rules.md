# Design Research Rules

Rules for the research pass that every VisualForge subskill performs. Research is what separates an opinionated design system from a generic one.

## When to research

Research is mandatory before:

- Choosing a visual trend to adopt or reject.
- Selecting a component library, icon library, or motion library.
- Defining a color system that needs to feel current.
- Defining typography for a brand with specific audience expectations.
- Designing for an unfamiliar platform (vision, automotive, TV, watch).
- Designing for a regulated domain (medical, financial, accessibility-critical).
- Designing against direct competitors whose patterns shape user expectations.

Research is optional but recommended when:

- Confirming current Core Web Vitals or accessibility thresholds.
- Looking up a specific framework or library's current API.
- Validating a personal taste call against industry signal.

Research is forbidden when:

- It would replace a user-confirmed answer.
- It would override a repo-locked constraint.
- It would substitute for actual design judgment (research informs, it does not decide).

## What counts as a valid source

Tier 1 — primary, authoritative:

- Official platform documentation (Apple HIG, Material 3, Fluent 2, GNOME HIG).
- W3C specifications.
- WCAG normative documents.
- Library official documentation (current version).
- First-party design system docs from companies whose products are the reference (Linear, Vercel, Stripe, Arc, Notion, Figma, GitHub, Apple, Google, Adobe, Atlassian, Shopify, IBM Carbon, Salesforce Lightning).
- Peer-reviewed academic publications (HCI, perception, color science, cognitive load research) — for foundational claims that should outlast trend cycles.
- Government / NGO accessibility data (WHO, CDC, ONS, Section 508 reports).

Tier 2 — secondary, useful with attribution:

- Engineering blog posts from product teams describing their design decisions (recent, ≤ 18 months for UX trend, ≤ 5 years for technique).
- Conference talks from named designers (Config, An Event Apart, Schema, etc.).
- Open-source repos with active maintenance — read the source.
- Reputable design publications (Smashing Magazine, A List Apart, web.dev, css-tricks for active areas).
- **Non-Western design references** — Chinese (Tencent Tech Design, Ant Design articles), Japanese (Goodpatch, Cookpad design blog), Korean (Toss design blog, Naver UX). For global products, balance Western-default sources with at least one non-Western perspective per major design decision.
- Quantitative research orgs (Baymard Institute, Nielsen Norman Group, Pew, Statista) — used carefully, cited with date.

Tier 3 — informational only, never load-bearing:

- Roundup blog posts.
- AI-generated summaries.
- Personal portfolios without team-product context.
- Dribbble / Behance shots — visual inspiration only, not behavior reference.

## Date-freshness rules

Source age tolerance varies by topic. Bias toward newer for fast-moving topics, accept older for stable topics.

| Topic | Acceptable age |
|---|---|
| AI / generative UI patterns | ≤ 12 months |
| Current design trends (Liquid Glass, bento, etc.) | ≤ 18 months |
| Component library state of the art | ≤ 18 months |
| Browser support / Web Platform features | ≤ 12 months |
| Mobile platform conventions (iOS, Android) | ≤ 18 months (or current major OS version) |
| Performance budgets / Core Web Vitals | ≤ 12 months |
| CSS / web standards (specs themselves) | latest version of the spec, regardless of age |
| WCAG / accessibility standards | current normative version |
| Color science / typography fundamentals | up to 10+ years acceptable if foundational |
| Cognitive psychology / perception research | up to 20+ years acceptable for established findings |
| Cultural / regional design norms | ≤ 5 years (cultures shift) |

If the best available source is older than the threshold, mark the resulting decision as `Confidence: Medium` and flag for verification.

## Primary research methodology

The skill cannot run real user interviews itself, but the team can. Surface opportunities for primary research in `auditability/research-ledger.md`:

- **When secondary research is thin** — surface a "primary research recommended" note with the specific question to investigate.
- **When personas are unvalidated** — recommend at least 5 user interviews per primary persona.
- **When competitive audit reveals divergent conventions** — recommend a usability study to confirm user expectation.
- **When the design pressure-test surfaces walkthrough friction** — recommend a usability test on the specific flow.

Primary research types to recommend:

- **User interviews** — 30–60 minutes, semi-structured, 5–8 participants per persona.
- **Usability testing** — task-based, think-aloud, 5–7 participants surfaces ~85% of issues.
- **Diary studies** — for understanding context of use over time.
- **Concept testing** — show prototypes and capture reactions.
- **A/B testing** — when shipped, validates specific decisions; recommend the variants.
- **Analytics review** — surface what real users do vs what we designed for.

Record each primary-research recommendation in `research-ledger.md` with: question, method, target participants, expected output, downstream decisions affected.

## "No good source" protocol

When research genuinely fails — no authoritative source addresses the specific question — do not paper over with an educated guess.

The protocol:

1. Mark the gap explicitly in `research-ledger.md`:

```markdown
## RES-NNN — UNRESOLVED — [topic]

- **Question:** [specific question]
- **Sources attempted:** [list, with why each was insufficient]
- **Best available evidence:** [the next-best thing, if any]
- **Why this is unresolved:** [the genuine gap — too new, no consensus, niche product class, etc.]
- **Affects decisions:** [DEC-IDs]
- **Resolution path:** [primary research recommendation OR explicit acceptance of uncertainty]
```

2. Decisions that depend on this research are marked `Confidence: Low` and `Source basis: Assumption`.

3. The pre-launch verification list gets an entry: "Verify [X] against current sources before launch."

4. The reversal trigger is calibrated for fast revision if the assumption proves wrong.

## Quantitative source guidance

For decisions where numbers matter (perf budgets, target sizes, motion durations, contrast ratios):

- Prefer **measured benchmarks** over general guidance — what does Linear's homepage actually score? What is Stripe's LCP?
- Web Vitals: use Chrome User Experience Report (CrUX) percentiles, not just "Good / Needs Improvement / Poor" labels.
- Touch target: use platform standard (44 iOS / 48 Android / 24×24 WCAG 2.2 minimum).
- Animation timing: use platform motion specs (Material 3, iOS HIG) over personal preference.

## Adversarial source check

For high-stakes decisions, deliberately seek out the *counter*-source: who has written about why this is wrong?

- If adopting Liquid Glass, find a critique of glass-everywhere.
- If choosing a JS animation library, find someone explaining its performance costs.
- If picking a component library, find someone who switched away from it.

Adversarial sources reveal what the marketing pages hide.

## How to research

For each research need:

1. Phrase the question specifically. "What is the current state of glass-material UI on iOS as of 2026 and what are its accessibility and performance constraints?" — not "is glass UI good?"
2. Use the source map first. Default to Tier 1 sources for the topic.
3. Capture the actual source: title, owner, version or date, URL, the exact section or quote that answered the question.
4. Note what was *not* answered by the source — that becomes an assumption or open question.
5. Record the research result in `docs/design-system/auditability/research-ledger.md` immediately.

## Research ledger entry format

```markdown
## RES-NNN — [topic]

- **Date checked:** YYYY-MM-DD
- **Subskill:** visualforge-[name]
- **Question:** [exact question]
- **Sources consulted:**
  - [Source 1 title] — [URL] — [version/date]
  - [Source 2 title] — [URL] — [version/date]
- **Key findings:** [specific extracted facts, not summary]
- **Quotes / values:** [exact quotes or numeric values when relevant]
- **Affects decisions:** [DEC-IDs]
- **Not answered:** [what the source did not cover — becomes open question or assumption]
- **Online research available:** Yes | No (used baked-in source map)
```

## Anti-citation-slop

Do not cite:

- A source that you did not actually read or load.
- A source whose date you cannot identify.
- A source that does not address the specific question.
- A blog post when an official spec answers the same question.
- More than five sources when three would suffice.

If you cannot find a Tier 1 or Tier 2 source for a decision, say so in the ledger and label the resulting decision as `Assumption` with confidence `Low`.

## Online research unavailable

When the agent cannot reach external sources:

1. State this explicitly in `research-ledger.md` at the top.
2. Use the baked-in source map (`current-design-source-map.md`) as the basis for every decision that would otherwise require research.
3. Mark every decision that *would have* benefited from current research as `Assumption — verify against current sources before launch` with the specific source to check.
4. Continue producing the design system — do not block on missing research, but make the gap visible.

## Trend research has special rules

When researching whether to adopt a current design trend (Liquid Glass, bento, etc.):

- Find at least three shipping products using it (named, not abstract).
- Identify the audience overlap with the target product.
- Find at least one critique or limitation of the trend.
- Identify the platform support and fallback story.
- Identify the performance cost on low-end target devices.

Then run the trend-fit test in `anti-slop-design-rubric.md`. Adopt only if all five fit checks pass. Record both adoption and rejection decisions — rejected trends teach future contributors what was considered and why it lost.
