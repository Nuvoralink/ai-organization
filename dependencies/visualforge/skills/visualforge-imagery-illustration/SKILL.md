---
name: visualforge-imagery-illustration
description: Photography style and treatment, illustration system, AI-generated imagery rules, aspect ratio system, image masking, placeholder and skeleton design, empty-state imagery, decorative graphics.
---

# Imagery and Illustration

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `visual-default-breakers.md`.
- Use `opinionated-decision-template.md`.
- Every imagery decision: format, source rules, treatment recipe, aspect-ratio system, accessibility (alt text patterns), performance (size budget, lazy-load), and dark-mode handling.
- Never generic "use beautiful imagery."
- Maintain `decision-log.md`.

## Purpose

Imagery is the largest single contributor to page weight and a major brand-conveyer. Without an explicit imagery system, products drift toward Unsplash defaults and inconsistent style.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Define imagery system from brand modality decision.
- **Retrofit:** Inventory existing imagery (sources, formats, treatments); produce ideal; drift entry.

## Required research pass

```text
Research current imagery best practices as of 2026: variable image formats (AVIF, WebP, JPEG-XL), responsive image markup, blur-up placeholders, BlurHash / ThumbHash, lazy-loading, image CDN strategies (Cloudflare Images, Vercel Image, ImageKit), AI image generation policy (provenance, watermarks, C2PA), illustration system patterns (open-source like Open Peeps, Humaaans; custom illustration systems from Notion / Linear / Figma). Capture sources.
```

## Inputs

- Brand identity (`05-brand-identity.md`) — imagery direction.
- Design tokens — color palette for illustration alignment.
- UX flows — every empty state needs imagery decision.
- Personas — accessibility (alt text policy, motion sensitivity for animated imagery).
- Performance budget.

## Output files

- `docs/design-system/04-interaction/imagery-illustration.md`
- `docs/design-system/imagery/style-guide.md` (asset references)
- `docs/design-system/imagery/examples/` (do-and-don't reference treatments)
- Decision-log entries (DEC-670 to DEC-694, overflow DEC-695 to DEC-699) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 0. Image art-direction (anti-LLM-default — added per VF-FIND-033)

Before the modality decision, lock the **art-direction** of imagery — what an image should look like, where it sits on the page, and how it interacts with type and surface. Without this layer, modality decisions (photo / illustration) produce technically-correct outputs that still feel like the AI default: tiny inline thumbnails, no full-bleed presence, no atmospheric framing.

#### 0a. Background mode inventory

For every page or screen surface that uses imagery, the screen spec must cite a **background mode** from this inventory. The cross-section variety rule lives in `layout-system.md` §12; this section defines the modes themselves.

| Mode token | Description | When to use |
|---|---|---|
| `bg.solid-with-inline-asset` | Solid surface + small inline image / detail crop | Utility UI, data-dense surfaces |
| `bg.subtle-texture` | Paper, grain, dotted, or fine-grid texture behind content | Editorial, premium-neutral |
| `bg.full-bleed-image` | Edge-to-edge image with tonal overlay; text in safe area | Hero, brand surfaces |
| `bg.editorial-side-image` | 50/50, 60/40, or 40/60 image-and-content split | Feature sections, case studies |
| `bg.image-as-canvas` | Image is the canvas; text overlaid in clean safe area | Hero, fashion / travel / lifestyle |
| `bg.flat-color-with-detail-crop` | Bold flat color block + small product or detail crop accent | SaaS, fintech feature blocks |
| `bg.cinematic-tonal-gradient` | Palette-matched low-chroma gradient (NOT rainbow / purple-blue) | Hero, atmospheric framing |
| `bg.atmospheric-graded-photo` | Single-tone color-graded photo for brand mood | Premium consumer, editorial |
| `bg.duotone-treated-image` | Two-color photo treatment, palette-locked | Brand surfaces, marketing |
| `bg.soft-radial-vignette` | Soft radial vignette + product crop | Luxury, editorial |
| `bg.micro-noise-gradient` | Premium tactile depth, not flashy | Premium-neutral, dark-tech |
| `bg.color-blocked-diptych` | Two flat fields meeting; modernist | Editorial, agency, portfolio |

#### 0b. Hero composition anchors

Pin imagery to a hero composition anchor. See `layout-system.md` §11 for the full anchor inventory. The defaults that fail visual-default-breakers §1:

- **Banned by default:** `anchor.left-text-right-image` for the primary hero (the most overused AI pattern). Allowed only with explicit justification.
- **Approved for hero by default:** `anchor.centered-statement`, `anchor.bottom-left-over-image`, `anchor.stacked-center`, `anchor.image-as-canvas`, `anchor.off-grid-editorial`, `anchor.right-text-left-image`.

#### 0c. Image-led storytelling rule

For products in categories where imagery is core (consumer, lifestyle, travel, fashion, food, social, content / creator, editorial, premium B2B), multiple sections must include meaningful imagery. A product brief with strong imagery brand attributes that produces a layout with only one image and the rest text-heavy fails.

For products in categories where imagery is non-core (developer tools, infra, fintech-utility, internal SaaS), imagery is allowed to be sparse. Default to typography-first, with images appearing only where they earn their place.

The decision card must name the product's image-led posture: `image-led`, `image-balanced`, or `typography-first`.

#### 0d. Image-behind-text discipline

When images sit behind text (heroes, feature headers, atmospheric backgrounds), the text must remain readable. Approved treatments:

- Bottom-to-top tonal fade behind headline + CTA.
- Side fade masks so text sits over the clean image portion.
- Soft blur overlays behind text (constrained to avoid muddy looks).
- Color-tinted scrim (5–30% opacity) matched to brand neutral.

**Banned:** raw image under text with no readability support, opaque overlay so dense the image becomes background-color, gradient overlay that competes with the image rather than serving the text.

#### 0e. Narrative spine binding

Per `visual-default-breakers.md` §14 and `brand-identity.md` DEC-100, the product has one running narrative concept (Artifact / Journey / Tool / Living system / Stage / Archive). Imagery must visibly express it — a "Tool" brand reads as machined detail, precise crops, calibrated UI; a "Living system" reads as organic, branching, growing. Repeat in every major image moment.

#### 0f. Second-read moment ownership

Per `visual-default-breakers.md` §13, exactly **one** unobvious-but-legible second-read motif appears across the page or product. If imagery owns it (a macro crop carrying brand color, a single unexpected material switch), document where; if another subskill owns it, defer.

#### 0g. Decision cards for art direction

- DEC-690 Image-led posture (`image-led` / `image-balanced` / `typography-first`) — required per VF-FIND-033. *(In allocated range DEC-670–694 per `decision-id-allocation.md`.)*
- DEC-691 Background mode default + variety budget per page archetype — required.
- DEC-692 Image-behind-text treatment recipe — required when any surface uses background image with text overlay.
- DEC-693 Narrative-spine expression in imagery (cite brand-identity DEC-100) — required.

### 1. Modality decision

- **Primary modality:** photography / illustration / abstract / data-viz / typography-only / mixed.
- **Per-context modality** (often mixed):
  - Hero / marketing: photography or illustration?
  - Empty states: illustration or icon?
  - User-uploaded content: photography by default.
  - Onboarding: illustration usually.
  - Documentation: screenshots + illustration.

### 2. Photography system (if used)

- **Subject rules:** what subjects belong in the product, what don't.
- **Treatment:** color grade (warm / cool / desaturated / cinematic), contrast curve, vignette posture.
- **Lighting character:** soft / dramatic / available-light / studio.
- **Composition:** rule-of-thirds default / center-weighted / asymmetric.
- **Crop policy:** maintain integrity / aggressive crop for hero / aspect-ratio-driven.
- **Sources:** licensed stock (Unsplash, Pexels with extended use), commissioned, user-generated.
- **Forbidden:** generic stock-photo tropes (handshake business shots, generic laptop hands), images with watermarks or visible model-release issues.

### 3. Illustration system (if used)

- **Style direction:** flat color / line + flat / dimensional / hand-drawn / mixed-media / geometric.
- **Color palette:** locked to brand palette (no off-brand colors in illustration).
- **Character system:** if illustrations include people:
  - Diversity: skin tones, body types, age, ability representation.
  - Style: stylized faces / faceless / abstract figures.
  - Source: custom commission / Open Peeps / Humaaans / Blush / DIY.
- **Object library:** common objects with consistent treatment.
- **Source format:** SVG primary, with PNG export for raster needs.
- **Animation policy:** static / subtle (Lottie) / full motion.

### 4. AI-generated imagery rules

If AI imagery may be used:

- **Permitted use:** decorative / specific generation tasks / never.
- **Provenance:** C2PA metadata required on outputs.
- **Source disclosure:** "AI-generated" label policy.
- **Style alignment:** must pass brand-style review before public surfaces.
- **Forbidden:** photorealistic people without disclosure, photorealistic events that didn't happen, anything that could be mistaken for journalism.
- **User-uploaded AI content:** disclosure required, watermark preserved if present.

### 5. Aspect ratio system

Lock a small set:

| Token | Ratio | Use |
|---|---|---|
| `aspect.square` | 1:1 | avatars, thumbnails, square cards |
| `aspect.portrait` | 3:4 | product images, vertical cards |
| `aspect.landscape` | 4:3 | content cards |
| `aspect.video` | 16:9 | video, hero, screencast |
| `aspect.wide` | 21:9 | hero panoramas, cinematic |
| `aspect.golden` | 1.618:1 | editorial features |

Components reference aspect tokens, not raw ratios.

### 6. Image markup standard

For web:

```html
<img
  src="image-800.avif"
  srcset="image-400.avif 400w, image-800.avif 800w, image-1600.avif 1600w"
  sizes="(min-width: 768px) 50vw, 100vw"
  loading="lazy"
  decoding="async"
  alt="Specific descriptive alt text"
  width="800"
  height="600"
  style="aspect-ratio: 4/3; background: linear-gradient(...);"
/>
```

Rules:

- AVIF first, WebP fallback, JPEG/PNG last.
- `width` and `height` always set (prevents CLS).
- `loading="lazy"` on below-fold images; `loading="eager"` on LCP.
- `decoding="async"` always.
- BlurHash / ThumbHash placeholder via inline gradient or low-res data URI.
- `alt` must describe the image's role in context, not just describe the image.

For native:

- Platform image components with built-in lazy / async.
- Vector (SVG) preferred for illustrations.

### 7. Placeholder system

For every image type, a placeholder strategy:

- **Avatar with no image:** initials on accent-subtle background, deterministic color from hash.
- **Card thumbnail:** BlurHash / ThumbHash → image fade-in.
- **Hero image:** dominant-color fill → image fade-in.
- **Document preview:** generic file-type icon → preview render.
- **Loading skeleton:** placeholder shape with shimmer (per micro-interactions spec).

### 8. Empty-state imagery

Per empty-state philosophy in UX flows:

- **Illustration empty state:** 200–320px square illustration centered, brand-illustration-system styled.
- **Icon-only empty state:** large icon (48–64px) `text.tertiary` color centered.
- **Typography-only empty state:** headline + body + CTA, no graphic.

Pick one approach per surface category and apply consistently.

### 9. Dark mode imagery

- **Photography:** does not auto-invert. Test treatment in dark mode; if too bright, apply slight dimming overlay (10% black) or commission dark-mode variants.
- **Illustration:** SVG with theme-aware fills (use CSS variables for fills, swap on `[data-theme="dark"]`).
- **Background gradients in imagery:** consider dark variants.

### 10. Accessibility — alt text contract

- **Decorative images:** `alt=""` (empty, not omitted).
- **Functional images (icon-only buttons):** alt describes function not appearance ("Settings", not "Gear icon").
- **Content images:** describe what's important to understand without the image. Limit ~125 chars.
- **Charts / data viz:** long-form alt text or `<figcaption>` summarizing the data trend, plus accessible data view alternative.
- **Complex images (infographics):** short alt + link to long description.

### 11. Performance budgets

- **LCP image:** ≤ 200KB target, ≤ 400KB max, prefer < 100KB.
- **Above-fold imagery total:** ≤ 600KB.
- **Per-page total imagery:** ≤ 2MB (excluding lazy-loaded user content).
- **Format priorities:** AVIF > WebP > JPEG. SVG for illustration.
- **Responsive serving:** 4 widths minimum (400, 800, 1600, 2400).
- **CDN:** image CDN required for product imagery; user-uploaded images go through resize service.

### 11a. Embed and Open Graph imagery

Products show up in Slack, iMessage, Discord, Twitter / X, link previews — these previews are often the *first* thing a new user sees of the product. Design them deliberately.

- **Open Graph card image** — 1200×630, branded, includes product name + value prop in one line.
- **Twitter / X card image** — same image or dedicated 800×418.
- **Per-page customization rule** — landing pages have unique OG images; deep links may use a templated card with dynamic content (e.g., a shared dashboard uses the dashboard name).
- **Dynamic OG generation** — when shared content varies (user-shared dashboards, public posts), generate OG images server-side via image-rendering service (Vercel OG / Cloudflare Workers / custom).
- **Fallback image** — used when dynamic generation fails or for routes that don't customize.
- **Favicon and app icon system** — favicon (16, 32), Apple touch icon (180), maskable icon (Android, 512×512 with safe-zone), `og:image`, `twitter:image`. Generate as a set from a single high-resolution master.
- **Splash / launch screens** — for installed PWA and native apps. Per platform, per orientation.

### 11b. Native app distribution assets

When the product ships to App Store / Play Store, distribution assets are part of the design system:

- **App icon system** — 1024×1024 master, generates per-platform sizes. Iconography style consistent with product.
- **Screenshots** — 6.7" iPhone, 6.1" iPhone, 12.9" iPad, 10" tablet, 6.7" Android — required minimum sizes. Showcase primary tasks, not chrome screenshots.
- **Marketing video / app preview** — 15–30s loop.
- **App Store / Play Store listing copy** — first sentence, short description, full description. Reference content-design voice.
- **Splash screens** — per platform launch.
- **Background graphics / promo** — for promotional surfaces.

These assets carry brand outside the product. Treat them as primary design surfaces, not afterthoughts.

### 11c. Print / PDF / export design

When the product generates user-facing artifacts (receipts, invoices, reports, contracts, exports):

- **Print stylesheet rules:**
  - Hide nav, chrome, ads, sticky elements.
  - Reset colors for print (consider grayscale-friendly).
  - Use page-break rules (`break-inside: avoid` on key blocks).
  - Set page size and margins explicitly.
  - Show URLs after links (`a[href]::after`).
- **Generated PDF design:**
  - Branded header + footer, page number, generated-on date.
  - Typography hierarchy from product (or simplified for print).
  - Tables paginate cleanly across pages.
  - Legal / compliance text appears where required (footer, last page).
  - Watermarks for draft / unpaid / sample.
- **Export formats:**
  - CSV / JSON for raw data.
  - PDF for human-readable.
  - PNG / SVG for charts.
- **Accessible PDFs** — tagged PDF structure for screen reader support (mandatory for regulated / accessibility-critical products).

### 11d. A/B testing variant design

When the product runs experiments, design must accommodate:

- **Variant identification** — variants tracked in analytics with stable names (control / variant-a / variant-b).
- **Variant-friendly component design** — components that change can swap via feature-flag prop without layout shift.
- **Shared variant slots** — naming convention for variant slot points in the design system.
- **Visual regression aware** — variants are pinned in Storybook so visual regression doesn't flag variant differences as bugs.
- **Sunset plan** — every variant has a target end date and a "winner promote" plan.

### 12. User-generated content imagery

If product accepts user uploads:

- **Allowed formats:** JPEG, PNG, WebP, GIF, AVIF.
- **Max upload size:** decide per product.
- **Auto-resize at ingest:** server-side resize to standard widths.
- **Moderation policy:** reference Specforge trust-safety if exists.
- **EXIF stripping:** remove location data by default; preserve only orientation.
- **Color-profile normalization:** convert to sRGB.

### 13. Asset organization

```
docs/design-system/imagery/
├── style-guide.md          # references and examples
├── illustration/
│   ├── characters/
│   ├── objects/
│   └── empty-states/
├── photography/
│   ├── treatment-examples.md
│   └── do-and-dont.md
└── icons/                  # icon system lives in iconography subskill
```

### 14. Decision cards

- DEC-671 Modality decision (primary + per-context).
- DEC-672 Photography treatment.
- DEC-673 Illustration style direction.
- DEC-674 Character / human representation rules.
- DEC-675 AI imagery policy.
- DEC-676 Aspect ratio system.
- DEC-677 Image markup standard.
- DEC-678 Placeholder system.
- DEC-679 User-uploaded image handling.

## Anti-slop imagery rules

- "Beautiful imagery" fails.
- "Real photos of real people" without commissioning or stock policy fails.
- "Custom illustrations" without style direction and source plan fails.
- AI imagery without provenance and disclosure policy fails.
- Imagery without alt text policy fails accessibility.
- Imagery without performance budget contributes to slow products.
- Defaulting to `anchor.left-text-right-image` for the primary hero without explicit justification fails per `visual-default-breakers.md` §1.
- Product is image-led but produces a single inline image + text-heavy rest of page fails per Section 0c.
- Image used as background under text with no fade / mask / scrim treatment fails per Section 0d.

## Quality gate

- Modality decided overall and per context.
- Photography treatment OR illustration style (or both) specified.
- AI imagery policy explicit.
- Aspect-ratio system tokenized.
- Image markup standard locked.
- Placeholder strategy per image type.
- Alt-text contract documented.
- Performance budgets set.

## Sources and basis

Per-decision tied to brand modality, performance budget, and current image format / CDN research.
