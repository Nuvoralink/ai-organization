# MCP Recommendations and Detection

VisualForge produces dramatically better output when certain MCP (Model Context Protocol) servers are available to the host (Claude Code / Codex / Cursor). Some are required for specific subskills to work fully; others are quality-lifts that move output from "good" to "great."

This protocol runs **first**, in Step 0 of the orchestrator. It detects what's available, recommends what's missing, and lets the user install before the run continues.

## When this runs

- **Orchestrator Step 0a** — immediately after mode detection, before any subskill executes.
- **On any single-subskill invocation** that depends on a specific MCP — that subskill performs its own detection and surfaces the recommendation if missing.

## MCP catalog — by tier

### Tier R (Required for specific subskills)

| MCP | Required by | Without it |
|---|---|---|
| **Figma MCP** (`mcp__Figma__*` / `mcp__figma__*` / host-specific prefixes) | `visualforge-figma-build` | Falls back to importable bundle (`figma-import-bundle/`). User must hand-import via Figma plugins. Loss: time, no live sync. |
| **Database / Schema MCP** — Neon (`mcp__Neon__*`), Prisma, or generic SQL MCP | `visualforge-ux-flows` data inventory (retrofit) | Falls back to reading schema files via Glob/Grep. Loss: cannot sample actual values; coverage of generated columns / computed fields weaker. |
| **WebFetch / Browser MCP** | `visualforge-competitive-audit`, `visualforge-design-trends-research` | Falls back to baked-in source map. Loss: no current research, no fresh competitor screenshots. |

### Tier S (Strongly recommended)

| MCP | Lifts | Without it |
|---|---|---|
| **Browser automation MCP** — Claude in Chrome (`mcp__Claude_in_Chrome__*`), Puppeteer, Playwright MCP | Competitive screenshots, retrofit Lighthouse audit, headless axe a11y audit, visual regression on generated Storybook | Competitive audit limited to URL/date metadata; retrofit perf state not measurable; a11y check is hand-audit only |
| **GitHub MCP** | Read existing `AGENTS.md` / `CLAUDE.md` / `.cursorrules`, write rules-update commits as PRs, track design-system issues, sync drift findings to issues | Rules update writes files directly without PR review path; no issue tracker integration |
| **Image generation MCP** — local or API (per host capability) | Mood-board generation, illustration concept exploration, App Store screenshot mockups, OG card prototypes | All imagery direction is text-only; user provides their own visual references |
| **Lighthouse / web-vitals MCP** | Retrofit performance state measurement; verifies design choices against perf budget on the actual deployed product | Performance budget is theoretical; can't measure actual LCP/INP/CLS |

### Tier N (Nice-to-have)

| MCP | Lifts | Without it |
|---|---|---|
| **Color science MCP** | OKLCH operations, perceptual contrast (APCA + WCAG), color-blind simulation across the palette, perceptually uniform ramp generation | Color generation uses formulas baked into design-tokens subskill; contrast verified per pair manually |
| **Claude Preview / preview MCP** (`mcp__Claude_Preview__*`) | Live preview of generated Storybook stories, design QA at draft stage | Preview happens only after Storybook is built locally |
| **MCP registry MCP** | Auto-discovery of additional MCPs that might help | User must know what MCPs exist |
| **Filesystem MCP** | Cleaner retrofit inventory cross-skill | Built-in Read/Glob/Grep work fine |
| **CronCreate / scheduled task MCP** | Schedule design-system regeneration on a cadence | Manual reinvocation only |

## Detection protocol

At Step 0a of the orchestrator:

1. **Scan the deferred tool list** (Claude Code) or active toolset (Codex) for tool names matching each MCP's known prefixes / patterns.
2. **Classify findings** into Tier R / S / N present, missing.
3. **Write detection result** to `docs/design-system/auditability/mcp-detection-report.md`:

```markdown
# MCP Detection Report

- **Date:** YYYY-MM-DD
- **Host:** Claude Code | Codex | Cursor | other

## Required (Tier R)
- Figma MCP: AVAILABLE (`mcp__Figma__use_figma`) | MISSING — fallback to import-bundle
- Database MCP: AVAILABLE (`mcp__Neon__run_sql`) | MISSING — fallback to schema-file reading
- WebFetch: AVAILABLE | MISSING — fallback to baked-in source map

## Strongly recommended (Tier S)
- Browser MCP: AVAILABLE | MISSING
- GitHub MCP: AVAILABLE | MISSING
- Image generation MCP: AVAILABLE | MISSING
- Lighthouse MCP: AVAILABLE | MISSING

## Nice-to-have (Tier N)
- Color science MCP: AVAILABLE | MISSING
- Preview MCP: AVAILABLE | MISSING
- MCP registry: AVAILABLE | MISSING

## Quality impact
- Output quality estimate without recommended installs: [Good / Limited / Compromised]
```

4. **Surface to the user** if any Tier R or Tier S is missing:

```
VisualForge can produce better results with additional MCPs installed.

Required for full functionality:
- Figma MCP — to build the design system directly in Figma (vs exporting an import bundle)
- [other missing Tier R with what they enable]

Strongly recommended for quality:
- Browser MCP — for competitive screenshots, Lighthouse audits, headless a11y checks
- [other missing Tier S with what they enable]

You can:
(a) Install one or more MCPs now and re-run (recommended for production design work)
(b) Continue with fallback behavior (faster; output is still complete but less rich)
(c) Tell me which specific MCPs you'd like to install — I'll provide install instructions

Choose:
```

5. **Wait for user response** unless Auto mode is active. In Auto mode: proceed with fallback, log which MCPs would have helped where.

6. **If installing:** point user to current install instructions. Common paths:
   - Claude Code: `claude mcp add` or via the MCP settings UI.
   - Codex: depends on host configuration.
   - Cursor: configured in settings.json under `mcpServers`.

7. **After install:** re-run Step 0a to verify, then proceed.

## Per-subskill MCP usage

Each subskill that benefits from an MCP must:

- Detect availability at its own start (in case MCPs change mid-run).
- Use the MCP when available.
- Fall back gracefully with a log entry in the subskill's section of `mcp-detection-report.md`:

```markdown
### visualforge-competitive-audit
- Browser MCP: NOT USED (unavailable)
- Fallback path: gathered competitor info from baked-in references only
- Quality impact: cannot verify current state of competitor products as of run date
```

## Re-detection on re-runs

When VisualForge re-runs:
- Re-detect MCPs at Step 0a.
- If newly available MCPs are detected, the orchestrator offers to re-run the subskills that would benefit (e.g., "Figma MCP now available — re-run `visualforge-figma-build` to sync the design system to Figma?").

## Anti-slop MCP rules

- Never silently use a built-in tool when an MCP would produce better results — log the substitution.
- Never claim a feature was completed when its MCP-required pathway fell back silently — note the fallback.
- Never recommend installing an MCP without saying what it specifically enables for this user's project.
- Never block the run waiting on an MCP install in Auto mode — fall back and log.

## User-facing question template

When asking the user about MCP installation, use this shape:

```
> [missing-mcp] would enable [specific capability] for [your project].
> Without it, VisualForge will [specific fallback behavior].
>
> Install? (yes / skip / tell-me-how)
```

Never ask without naming the specific capability and the specific fallback.
