# Greenfield SaaS app — VisualForge prompt example

Use this as a template for running VisualForge against a fresh product idea (no Specforge docs, no existing repo).

## Example prompt

```
Use $visualforge for this product:

We're building a small-team CRM for service businesses (8–40 people).
It replaces messy spreadsheets and shared inboxes with a focused tool that
tracks customers, conversations across channels, and tasks tied to deals.

Primary platform: web (desktop-first, mobile-aware). Native apps later, not now.

Audience: operations leads and account managers at service companies
(consulting, agencies, professional services). Comfortable with software,
but tired of "Salesforce-grade" complexity. They want Linear-level craft
but for a sales/ops audience.

Brand: nothing locked. We have a placeholder name "Outpost" and want
VisualForge to design the visual identity from scratch.

Constraints:
- Must feel modern as of 2026 without chasing every trend.
- Dark mode required, with auto-follow system.
- Accessibility WCAG 2.2 AA at minimum; we want our marketing site to
  hit AA+ because some prospects are public-sector.
- Performance budget: target LCP < 2.0s on mid-range laptop, INP < 100ms.

We want all the artifacts: markdown design docs, tokens.json/css/ts,
and Figma if you can. We use Cursor and Claude Code; please update the
agent rules at the end.
```

## What VisualForge will do

1. Detect `MODE=greenfield`.
2. Detect Figma MCP availability and route to MCP build path or fallback bundle.
3. Run discovery interview (probably 2–3 questions since most is in the prompt):
   - Confirm aesthetic profile (likely "Linear-style minimal pro tool" given the prompt).
   - Confirm component library preference (likely Shadcn+Radix on Tailwind given audience and platform).
   - Confirm one ambiguous trend decision (e.g., do we adopt subtle glass on top nav, or stay flat?).
4. Run all 22 subskills in order, writing docs and tokens.
5. Build Figma file (or fallback bundle).
6. Run design QA.
7. Update agent rules in `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, and create `docs/design-system/RULES.md`.

## Outputs to expect

```
docs/design-system/
├── 01-design-brief.md
├── 02-user-personas.md           # Likely: ops lead, account manager, founder
├── 03-competitive-audit.md       # Likely: HubSpot, Pipedrive, Attio, Linear (reference)
├── 04-design-trends-research.md  # Decisions on glass, bento, OKLCH, etc.
├── 05-brand-identity.md          # Brand identity from scratch (since nothing locked)
├── 06-design-tokens.md
├── 07-surface-treatments.md
├── 08-iconography.md             # Likely: Lucide or Phosphor regular weight
├── 09-information-architecture.md
├── 10-layout-system.md           # Hybrid shell: top bar + collapsible side rail
├── 11-ux-flows.md
├── 12-component-system.md        # ~50–80 components, Shadcn adopt/extend
├── 13-content-design.md
├── 14-micro-interactions.md
├── 15-scroll-and-gesture.md
├── 16-imagery-illustration.md
├── 17-accessibility-contract.md  # AA app + AA+ marketing
├── 18-motion-design.md
├── 19-frontend-implementation-contract.md
├── 20-design-qa-report.md
├── auditability/
├── tokens/
└── RULES.md
```

Plus updates to `AGENTS.md`, `CLAUDE.md`, `.cursorrules` if present.

## How to extend afterward

- "Use $visualforge-component-system to add a Kanban-board component" → adds spec + tokens, updates Figma.
- "Use $visualforge-motion-design to revisit page transitions" → re-runs that subskill only.
- "Use $visualforge to extend the design system: we're adding native iOS" → orchestrator re-runs platform-affected subskills.
