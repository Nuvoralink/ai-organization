# Skill Detection Protocol

Before running, MarketForge detects which skills/tools/MCPs are available so it can delegate effectively and fall back gracefully when capabilities are missing.

## What to detect

### Required-for-best-quality

| Skill / Tool | Detection method | Used for |
|---|---|---|
| `banana-claude:banana` | Skill listed in available skills | All image generation |
| `marketing-skills:*` (the plugin) | Individual skills listed (copywriting, ads, emails, etc.) | Tactical execution (see marketing-skills-bridge.md) |
| WebFetch / WebSearch | Tool available | Live competitive intel, current research, AIO citation checks |

### Useful when present

| Skill / Tool | Detection method | Used for |
|---|---|---|
| VisualForge (`$visualforge` or `${DEPENDENCY:visualforge}`) | Skill/path | Brand visual identity inputs |
| SpecForge (`$specforge` or `docs/app-plan/`) | Skill/path | Product spec inputs |
| Browser MCP (Claude Preview / Chrome) | MCP listed | Site audits, screenshot captures, review mining |
| Scheduled tasks MCP | MCP listed | Agentic mode cron registration |
| `find-skills` skill | Skill listed | Discovering other marketing-relevant skills |

### Agentic-mode-specific MCPs

(See `agentic-operations-protocol.md` for full list.)

- Analytics MCPs (GA4, Plausible, Mixpanel, PostHog, Amplitude)
- Ad platform MCPs (Meta, Google Ads, LinkedIn, TikTok, ASA)
- ESP MCPs (Klaviyo, Customer.io, HubSpot, Loops)
- CRM MCPs (HubSpot, Salesforce, Apollo, Clay)
- Social MCPs (LinkedIn, X, Buffer)
- SEO MCPs (Ahrefs, Semrush, Search Console)
- GEO MCPs (Profound, Otterly, Peec AI)

## Detection sequence

1. Read the list of available skills from the system context.
2. Check for `banana-claude:banana` — flag if missing.
3. Check for each `marketing-skills:*` skill — note which are present.
4. Check for `visualforge` skill or `${DEPENDENCY:visualforge}` path on filesystem.
5. Check for `specforge` skill or `docs/app-plan/` in current repo.
6. Check for available MCPs via the tool list.
7. Check for live website URL if user provided one.
8. Write `docs/marketing-plan/auditability/skill-detection-report.md`.

## The report

```markdown
# Skill Detection Report

**Run:** [run-id]
**Generated:** YYYY-MM-DD HH:MM TZ

## Image generation
- banana-claude:banana: [yes/no]
  - If no: fallback to written briefs; user must generate externally

## Marketing tactical skills (marketing-skills plugin)
- copywriting: [yes/no]
- ads: [yes/no]
- emails: [yes/no]
- cold-email: [yes/no]
- cro: [yes/no]
- seo-audit: [yes/no]
- ai-seo: [yes/no]
- programmatic-seo: [yes/no]
- schema: [yes/no]
- pricing: [yes/no]
- onboarding: [yes/no]
- popups: [yes/no]
- signup: [yes/no]
- social: [yes/no]
- video: [yes/no]
- ab-testing: [yes/no]
- analytics: [yes/no]
- marketing-psychology: [yes/no]
- paywalls: [yes/no]
- referrals: [yes/no]
- community-marketing: [yes/no]
- co-marketing: [yes/no]
- directory-submissions: [yes/no]
- marketing-ideas: [yes/no]
- sales-enablement: [yes/no]
- content-strategy: [yes/no]
- customer-research: [yes/no]
- churn-prevention: [yes/no]
- competitor-profiling: [yes/no]
- competitors: [yes/no]
- product-marketing: [yes/no]
- image: [yes/no]
- ad-creative: [yes/no]
- free-tools: [yes/no]
- launch: [yes/no]
- lead-magnets: [yes/no]
- revops: [yes/no]
- aso: [yes/no]
- site-architecture: [yes/no]
- copy-editing: [yes/no]

## Brand visual system
- VisualForge skill/docs: [yes/no, path if yes]
  - If yes: read `docs/design-system/02-visual-language/` outputs

## Product spec
- SpecForge skill/docs: [yes/no, path if yes]
  - If yes: read `docs/app-plan/product/` outputs

## Research / browser
- WebFetch: [yes/no]
- WebSearch: [yes/no]
- Browser MCP: [yes/no, which]

## Agentic-mode MCPs (relevant only if agentic=on)
- Scheduled tasks MCP: [yes/no]
- Analytics MCP: [list which]
- Ad platform MCPs: [list which]
- ESP MCPs: [list which]
- CRM MCPs: [list which]
- Social MCPs: [list which]
- SEO MCPs: [list which]
- GEO MCPs: [list which]

## Other skills (informational)
- find-skills: [yes/no]
- design:* skills: [list which]
- impeccable / taste / soft / minimalist / brutalist / brandkit / redesign: [list which present]

## Quality assessment

**Quality with current skill stack:** [Good / Limited / Compromised]

**Capabilities lost without missing skills:**
- Without banana: image generation falls back to written briefs; user generates externally.
- Without marketing-skills:copywriting: MarketForge produces native copy; slightly less specialized.
- Without VisualForge: MarketForge produces minimal visual identity in marketforge-distinctive-assets.
- Without SpecForge: MarketForge runs guided discovery interview to capture what would have been there.
- Without browser MCP: competitive intel limited to user-provided URLs + AdLibrary / SimilarWeb manual checks.
- Without WebSearch: research limited to baked-in V3 guide; "Research status: online research unavailable" labels added.
- Without Agentic MCPs: agentic mode produces drafts only, no auto-execution.

## Recommendations

[Surface to user if quality is Limited or Compromised. If Auto mode, log and proceed.]

[E.g., "VisualForge would significantly improve visual asset quality. Run $visualforge first if visual quality matters for this project."]
```

## Acting on detection

### When all skills present

Proceed at full quality. Delegate per `marketing-skills-bridge.md` and `banana-bridge.md`.

### When marketing-skills plugin missing

Produce tactical output natively in MarketForge subskills. Quality is slightly lower (less specialized) but the strategic framework is intact. Note the fallback in every relevant subskill output.

### When banana missing

Produce visual briefs as written specifications. The execution calendar includes external-generation TODOs. Note in `skill-detection-report.md`.

### When VisualForge missing

`marketforge-distinctive-assets` produces a minimal brand visual layer (color, type, mark direction). Suggest VisualForge for deeper visual work. Note in `skill-detection-report.md`.

### When SpecForge missing

Run guided discovery interview to capture product spec essentials. Note that SpecForge would normalize this further. Suggest SpecForge if user wants product-side rigor.

### When browser / WebFetch missing

Cite baked-in V3 guide data where possible. Mark all competitive intel as "user-supplied only" or "baked-in baseline." Add "Research status: online research unavailable" label to decisions.

### When agentic-mode MCPs missing

Refuse to enable agentic mode without at least: scheduled-tasks MCP + 1 analytics MCP + banana. Surface the missing-MCP list to user with a recommendation to install before activating.

## Refreshing detection

Re-run detection at:

- Every new orchestrator invocation.
- When the user reports a new skill or MCP installed mid-session.
- At the start of every agentic loop.

## What this prevents

- Silent failures from invoking missing skills.
- Quality regressions when an expected skill is absent.
- User confusion about why output quality varies between runs.
- Premature agentic-mode activation without the infrastructure to support it.
