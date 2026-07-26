# VisualForge Bridge

VisualForge (when present at `${DEPENDENCY:visualforge}` or installed as a skill) produces the brand visual system: color tokens, typography, surface treatments, iconography, layout system, components, motion language.

MarketForge consumes VisualForge outputs so brand visual decisions stay consistent across product and marketing.

## When VisualForge docs exist

Check for `docs/design-system/` in the target repo. If present:

### Read on every relevant subskill

- `docs/design-system/02-visual-language/brand-identity.md` — brand attributes, color philosophy, type philosophy, voice direction.
- `docs/design-system/02-visual-language/design-tokens.md` (and `tokens/tokens.json`) — color values, type scales, spacing scale.
- `docs/design-system/02-visual-language/surface-treatments.md` — material, shadows, glass, gradients.
- `docs/design-system/02-visual-language/iconography.md` — icon library and style.
- `docs/design-system/04-interaction/motion-design.md` — motion personality.
- `docs/design-system/04-interaction/content-design.md` — voice and tone.

### Consumed by

| MarketForge subskill | Consumes from VisualForge |
|---|---|
| `marketforge-brand-strategy` | brand identity attributes |
| `marketforge-distinctive-assets` | color, mark, type as distinctive brand assets |
| `marketforge-messaging-architecture` | voice direction from content-design.md |
| `marketforge-visual-direction` | full visual language |
| `marketforge-ad-creative-production` | tokens + visual language |
| `marketforge-social-imagery` | tokens + visual language |
| `marketforge-website-imagery` | tokens + visual language |
| `marketforge-email-lifecycle` | type + color tokens for email templates |
| `marketforge-naming-and-tagline` | type personality for tagline lockup |
| `marketforge-website-copy` | tone-of-voice from content-design.md |

## When VisualForge does NOT exist

MarketForge produces a minimal brand visual layer in `marketforge-distinctive-assets`:

- One primary color (with hex, OKLCH, and HSL).
- One accent color.
- A neutral system (3-5 grays).
- Type system (1-2 families, with weight range).
- Logo/mark direction (brief; banana generates if requested).

This is enough to ship ads, social, and email. For deeper visual work (design tokens, components, motion), the user can run VisualForge separately and re-run MarketForge to consume the richer outputs.

## Visual consistency contract

When VisualForge exists, every MarketForge asset (ad creative, social image, email banner, website imagery) must use:

- VisualForge color tokens (no off-palette hex values in generated images).
- VisualForge typography when type appears in the asset.
- VisualForge distinctive assets (logo, mark, mascot if any).

The orchestrator's QA pass (`marketforge-marketing-qa`) checks asset briefs for VisualForge-token references when VisualForge is present.

## Override

If the user explicitly wants marketing to diverge from product visual identity (uncommon, but happens — e.g., a campaign with intentional visual contrast), log the divergence in the decision card with rationale.

## Coordination handoff

If the user runs VisualForge AFTER starting MarketForge:

1. The orchestrator detects new VisualForge outputs at the next run.
2. Flags any MarketForge decisions that were made before VisualForge was available.
3. Suggests revision-mode passes on affected subskills (visual direction, ad creative, social imagery, etc.).

If the user runs MarketForge AFTER starting VisualForge:

1. MarketForge reads VisualForge as authoritative for visual decisions.
2. Brand strategy decisions defer to VisualForge brand identity unless overridden.

If the user runs them in parallel:

1. The first one to write a decision wins for that decision space.
2. The second one logs a cross-reference rather than overwriting.
3. End-state QA verifies consistency.

## What VisualForge does NOT cover (MarketForge owns)

- Marketing messaging architecture (value pillars, propositions, message-stage matrix).
- Marketing copy (homepage hero, ad copy, email subject lines).
- Marketing visual context (what does an ad look like vs. what does the product UI look like).
- Campaign-specific creative (which is brand-aligned but unique per campaign).

The line: **VisualForge defines the visual language; MarketForge applies it to marketing surfaces.**
