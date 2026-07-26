# Visual Default Breakers

Anti-slop rules for the **visual** layer. The base anti-slop rubric (`anti-slop-design-rubric.md`) catches taste-words in prose. This file catches **visual defaults** — the layout, composition, gradient, and hero-architecture patterns that LLM-driven design produces by reflex and that a prose check will not see.

Use this reference from `visualforge-brand-identity`, `visualforge-layout-system`, `visualforge-surface-treatments`, `visualforge-imagery-illustration`, and `visualforge-system-pages` (marketing surfaces).

## Why this exists

A subskill can pass every existing slop check (no taste-words, all tokens bound, every state defined) and still describe a design that is the AI default: centered hero, text-left / image-right body, purple-blue gradient backgrounds, 6-line wrapped H1, three identical KPI columns, glassmorphism on everything. That output is *technically compliant* and *visually generic*.

This file enumerates the most common defaults, names the rule that breaks each one, and (where applicable) names the mutation a fixture should apply to prove the validator catches violations.

## Hard failures — visual defaults that fail review

### 1. Hero composition bias

- **Default:** text-left / image-right hero.
- **Rule:** This composition is **allowed** but must not be the first instinct. A page that opens with it must justify why over the alternatives. Designs that use it for ≥ 2 consecutive heroes across a multi-page or multi-section product fail.
- **Approved alternatives:** centered statement over background, bottom-left over image, bottom-right CTA cluster, top-left lead, stacked center, image-as-canvas, off-grid editorial offset, mini minimalist (small logo + short statement + thin CTA), right-text / left-image inverted.
- **Mutation the validator should catch:** a brand-identity or screen spec that locks `hero.composition = "text-left-image-right"` for the primary hero **and** repeats the same anchor for the next hero without a rationale block.

### 2. Hero scale must be a decisive choice

- **Default:** medium-large hero with medium-large image and medium-large copy (the "split the difference" hero).
- **Rule:** Every product picks **one** primary Hero Scale and executes it cleanly:
  - **Giant Statement** — massive type, dominant first viewport.
  - **Mid Editorial** — balanced type/image, cinematic but not screen-filling.
  - **Mini Minimalist** — tiny logo + short statement + thin CTA, mostly negative space; restraint, not weakness.
- **Anti-pattern:** "we'll see what feels right" with no commitment, or every page has a different scale.
- **Mutation:** `brand-identity.md` with no Hero Scale decision card; pressure-test must flag.

### 3. Headline width / wrap discipline (the "6-line H1" failure)

- **Default:** LLM produces a 6-line wrapped headline by accepting whatever container width it lands in.
- **Rule:** Primary H1 must read in **2–3 lines maximum**. The container must be wide enough to allow horizontal flow — `max-w-5xl`, `max-w-6xl`, or a fluid-clamped width that prevents narrow wraps. 4+ lines is a catastrophic failure for marketing surfaces.
- **Mechanism:** specify the H1's `max-w` token or fluid clamp in `layout-system` and have screen specs cite it.
- **Mutation:** a screen spec containing an H1 longer than ~80 characters with no `max-w` annotation. Validator should warn.

### 4. Composition anchor variety (across sections)

- **Default:** every section of a marketing or landing page repeats the same composition anchor (typically left-text / right-image).
- **Rule:** A multi-section page must use **at least 3 distinct composition anchors** across its sections. The same anchor must not appear in 3+ consecutive sections.
- **Mechanism:** `layout-system.md` enumerates a fixed anchor inventory; screen specs cite the anchor per section; the run-level `visual-direction-lock.md` enforces variety.

### 5. Background mode variety

- **Default:** every section is solid white (or solid dark) with an inline asset. The page never uses a full-bleed image background, never uses a duotone, never uses a color-blocked diptych.
- **Rule (non-minimalist briefs):** at least **one section** must use a full-bleed image, duotone, or atmospheric background. At least **one section** must be a mini minimalist (mostly negative space). The same background mode must not repeat in 4+ consecutive sections.
- **Rule (minimalist / Swiss / typography-only briefs):** the variety rule is suspended; restraint is the design. The brief must explicitly opt in.
- **Approved background modes:** solid + inline asset, subtle texture, full-bleed image + tonal overlay, editorial side-image (50/50, 60/40, 40/60), image-as-canvas, flat color block + small detail crop, cinematic tonal gradient (palette-matched, low chroma), atmospheric photo with single-tone color grade, duotone, soft radial vignette + product crop, micro-noise gradient over solid, color-blocked diptych.

### 6. Gradient discipline (allowed vs banned)

- **Allowed (use confidently):**
  - Low-chroma palette-matched tonal gradients (ink → graphite, cream → sand, ivory → warm grey).
  - Single-hue atmospheric grades behind hero photography.
  - Soft vignettes and radial depth that direct the eye.
  - Noise-textured gradients adding tactile depth without color noise.
  - Editorial color washes matching brand mood.
- **Banned (AI gradient slop):**
  - Rainbow / mesh blob gradients.
  - Purple-to-blue "AI" defaults.
  - Pink-to-orange "creator" defaults.
  - Neon edges and glow halos with no purpose.
  - Gradient text as a shortcut for "premium."
  - Gradients competing with imagery instead of supporting it.
- **Mechanism:** `surface-treatments.md` gradient usage section must enumerate the banned patterns by name and the allowed patterns by recipe.

### 7. Bento and grid void rules

- **Default:** card grids leave empty dead cells, mismatched col-spans, or visible gaps that read as bugs.
- **Rule:** Any bento or modular grid must be **gapless** — column and row spans must interlock so no cell is unintentionally empty. Use `grid-flow-dense` (CSS Grid) or the framework equivalent. 3–5 highly intentional cards is better than 8 messy ones.
- **Mutation:** a `layout-system` pattern with a Mermaid grid that has more cells than slot definitions.

### 8. Meta-label slop ban

- **Banned forever:** chrome labels like `SECTION 01`, `SECTION 04`, `QUESTION 05`, `ABOUT US`, `OUR SERVICES` used as decorative section headers. They look cheap. Remove entirely, or use a real label (`What's included`, `Why it matters`) that describes the section.
- **Exception:** documentation systems and admin product UIs where numbered references aid scanning (`Step 3 of 5`) are allowed.

### 9. Decoration without purpose

- **Banned without purpose:** floating orbs, AI blobs, glassmorphism stacked without reason, glowing edges, oversized outline numerals as wallpaper, cheap SVG-looking filler, random futuristic details.
- **Rule:** Decoration must serve scan order, brand recall, or hierarchy. Every decorative element must answer: *what would break if I removed it?* If the answer is "nothing visible," remove it.

### 10. Data / KPI slop

- **Default:** three identical stat columns (99% satisfaction / $1M saved / ∞ scale) appearing on pages that don't otherwise show data.
- **Rule:** Stats appear when the product **logically needs** quantified proof (analytics, infra, observability, pricing). On a brand or marketing page that isn't about numbers, lean on human proof (quotes, receipts, timelines, real workflow screenshots).

### 11. Marquee / logo-strip slop

- **Banned by default:** infinity logo strips repeating 6 unrecognizable blobs, "trusted by" tickers of mosquito-sized logos, auto-play hero dots with no semantic purpose.
- **Allowed:** a real customer-logo wall **with recognized logos**, or a real type-led marquee that expresses brand voice (e.g., values rolling).

### 12. Section spacing discipline

- **Default:** every section has the same vertical padding, regardless of weight. Or sections are too close together with no breathing room.
- **Rule:** Major sections breathe (use a generous vertical-padding token, e.g., `py-32` / `py-48` equivalent). Dense sections alternate with calmer ones. Section-to-section spacing is **even and controlled**, with rhythm variation by content density — not random.

### 13. Second-read moment (≤ 1 per page)

- **Rule:** A premium page earns **exactly one** unobvious-but-legible motif that rewards the second read — an asymmetric bleed that still respects hierarchy, one oversized punctuation or numeral serving structure, a single unexpected material switch (paper vs gloss), a narrow vertical side-rail editorial note, a macro crop carrying brand color. More than one becomes gimmick clutter; zero feels safe.

### 14. Narrative / concept spine

- **Rule:** Each page or product has **one** running concept that threads visuals and short copy:
  - **Artifact / collectible** — proof, specimen, treasured object framing.
  - **Journey / pilgrimage** — directional flow, waypoint sections.
  - **Tool / precision instrument** — machined detail, calibrated UI.
  - **Living system / garden** — organic growth, branching.
  - **Stage / spotlight** — theatrical contrast, performer + audience.
  - **Archive / dossier** — indexed rows, captions, understated authority.

The chosen spine appears in `brand-identity.md` and gets cited by `imagery-illustration`, `motion-design`, and key screen specs.

### 15. Button-contrast sanity

- **Banned:** invisible button text (dark text on dark background, light text on light background, gradient text that fails AA).
- **Rule:** Every CTA passes WCAG 1.4.3 contrast at all states. Dark background → light text; light background → dark text. The primary action is unmistakable in every viewport tier.

## Brief-to-direction mapping (cited by orchestrator Step 0g)

Used by the visual-direction-lock when no explicit user signal is available. Read the brief; bias the picks toward the matching profile. **The user brief always overrides this mapping** — these are auto-mode defaults, not commandments.

### If the brief signals "minimalist" / "clean" / "typography-only" / "swiss" / "ultra simple"
- Hero Scale: **Mini Minimalist**.
- Background mode default: solid surfaces, subtle texture, optional ONE color-blocked diptych.
- Gradients: skip or use only the softest tonal gradient.
- Composition: stacked center, generous negative space.
- Cross-section variety rules (§4, §5): variety budget reduced — restraint is the design.
- Banned-by-default list: keep, plus add "no full-bleed image required."

### If the brief signals "editorial" / "magazine" / "art-directed" / "fashion"
- Hero Scale: **Mid Editorial** or **Giant Statement**.
- Background mode default: editorial side-image, duotone-treated image, atmospheric photo grade.
- Gradients: subtle tonal grades only.
- Composition: off-grid editorial offset, asymmetric pulls.
- Typography: strong contrast (editorial serif + sans, or compressed display).

### If the brief signals "cinematic" / "atmospheric" / "premium" / "luxury" / "bold"
- Hero Scale: **Giant Statement**.
- Background mode default: full-bleed image with tonal overlay, soft radial vignette + product, micro-noise gradient.
- Gradients: cinematic palette-matched welcomed.
- Composition: bottom-left over background image, centered low, image-as-canvas.

### If the brief signals "SaaS" / "product" / "dashboard" / "fintech" / "infra" / "developer-tool"
- Hero Scale: **Mid Editorial**.
- Background mode default: solid + inline asset, flat block + detail crop, occasional editorial side-image.
- Gradients: very subtle, palette-matched only.
- Composition: clear product framing, trust-driven anchors.
- Image-led posture: `image-balanced` or `typography-first` (per `imagery-illustration.md` §0c).

### If the brief signals "agency" / "creative studio" / "portfolio"
- Hero Scale: **Giant Statement** OR **Mini Minimalist** (decisive — do not split the difference).
- Background mode default: vary boldly (full-bleed image, color-blocked diptych, duotone).
- Gradients: editorial color washes acceptable.
- Composition: off-grid, poster-like.

### If the brief signals "e-commerce" / "shop" / "store" / "product page"
- Hero Scale: **Mid Editorial** with strong product focus.
- Background mode default: full-bleed product photo, soft radial vignette + crop, flat block + detail.
- Gradients: subtle, never competing with product.
- Composition: product-led; CTAs unmistakable.
- Image-led posture: `image-led`.

### If the brief signals "wellness" / "health" / "lifestyle"
- Hero Scale: **Mid Editorial**.
- Background mode default: soft texture, atmospheric graded photo, calm gradient.
- Gradients: low-chroma wellness palette.
- Composition: stacked center, breathing room, image-as-canvas.
- Image-led posture: `image-led` or `image-balanced`.

### If the brief signals "consumer social" / "creator" / "community"
- Hero Scale: **Mid Editorial** or **Mini Minimalist** (depending on whether the product is about content or about identity).
- Background mode default: image-as-canvas, color-blocked diptych, full-bleed image.
- Gradients: bolder color allowed but kept on the allowed list (no purple-blue AI, no pink-orange creator).
- Composition: vary boldly across sections.

### If the brief is silent on style
- Use the global defaults in this file.
- Pick **one** Hero Scale decisively; do not split the difference.
- Surface the auto-pick to the user in `run-log.md`.

## Cross-section continuity rules

For a multi-page or multi-section product, the following must stay **consistent** across all surfaces:

- one palette (1 primary + 1 secondary + 1 accent + neutral scale)
- one type system (display family + body family + scale)
- one CTA family (style variations are fine; identity is not)
- one corner radius language
- one image treatment (color grade, materials, framing)
- one tonal voice in short copy

What is **allowed to vary** across sections / pages:

- composition anchor (and must vary, per Rule 4)
- background mode (and must vary, per Rule 5)
- section density (and should vary, per Rule 12)
- which second-read moment appears (and only one, per Rule 13)

## Pre-output checklist

Before signing off any surface (screen spec, marketing page, dashboard, system page), confirm:

1. Hero is not a reflex left-text / image-right.
2. Hero Scale (Giant / Mid / Mini) is chosen and executed cleanly.
3. H1 wraps to ≤ 3 lines with a stated `max-w`.
4. Page uses ≥ 3 distinct composition anchors across sections (non-minimalist briefs).
5. At least one section uses a full-bleed, duotone, or atmospheric background (non-minimalist briefs).
6. Gradients used are on the allowed list and not on the banned list.
7. Any grid is gapless and uses `grid-flow-dense` or equivalent.
8. No `SECTION 01` / `QUESTION 05` chrome labels.
9. Decoration earns its place; nothing floats without purpose.
10. KPI strips appear only where the product is about numbers.
11. Logo marquees show real recognizable logos, or are skipped.
12. Section spacing is even and breathable; alternating density.
13. Exactly one second-read moment.
14. Narrative / concept spine declared in `brand-identity.md` and visible in execution.
15. Every CTA passes contrast in every state.

## How violations escalate

`visualforge-design-pressure-test` Pass L (multi-expert review) gains two reviewers — **Visual-direction critic** and **React-product-fit critic** — that explicitly apply these rules. A finding traced to a default break in this file maps to the producing subskill via the orchestrator's finding-ownership matrix:

| Default broken | Primary owner | Secondary cascade |
|---|---|---|
| Hero composition / scale / H1 wrap | `brand-identity` or `layout-system` | `imagery-illustration` |
| Composition anchor variety | `layout-system` | per-screen specs |
| Background mode variety | `imagery-illustration` | `surface-treatments` |
| Gradient slop | `surface-treatments` | `brand-identity` |
| Grid voids | `layout-system` | `component-system` |
| Meta-label slop | `content-design` | `information-architecture` |
| KPI slop | `data-visualization` | `content-design` |
| Decoration without purpose | `imagery-illustration` | `surface-treatments` |
| Section spacing | `layout-system` | `design-tokens` |
| Narrative spine missing | `brand-identity` | `imagery-illustration` |
| Button contrast | `component-system` | `accessibility` |

## Validator enforcement (proposed — see VF-FIND-032)

A new validator check `check_visual_default_breakers` should flag:

- Brand-identity or layout-system docs missing Hero Scale decision card.
- Screen specs with H1 strings > 80 characters and no `max-w` / fluid-clamp annotation.
- Layout-system docs without a composition-anchor inventory.
- Surface-treatments docs that don't enumerate the gradient ban list by name.
- Any doc using the literal strings `SECTION 0` followed by a digit (case-insensitive) as a header.
- Marketing-page screen specs with no narrative-spine cite.

Each check ships with **paired-condition fixtures** (per `test-discipline-and-mutation-protocol.md`): one fixture violates the rule and asserts the check fires (positive signal); one fixture complies and asserts it does not fire (resistant signal). Sabotage-testing the check by no-op'ing it must fail exactly the violating fixture.

## Sources and basis

- Distilled from `imagegen-frontend-web` (composition variety, background modes, hero scales, narrative spine, second-read moment, gradient discipline, anti-AI-slop rules).
- Distilled from `gpt-tasteskill` (Python-driven randomization commitment, 6-line headline rule, gapless bento with `grid-flow-dense`, meta-label ban, AIDA spacing).
- Distilled from `imagegen-frontend-mobile` §16 (creative image direction), §21 (mobile anti-AI tells).
- Wired into VisualForge per [VF-FIND-032](../../../PLUGIN-FINDINGS.md).
