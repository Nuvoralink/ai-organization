---
name: anti-ai-design-slop
description: Use when building, redesigning, reviewing, or auditing frontend UI, landing pages, dashboards, websites, components, visual systems, motion, copy, or design polish to avoid overused AI-generated design fingerprints. Apply silently as an internal quality bar; do not mention the checklist to the user unless explicitly asked.
---

# Anti-AI Design Slop

Use this as an internal kill list for frontend design work. Do not narrate the checklist to the user. Just produce sharper, more intentional design.

## Core Rule

Avoid patterns that make a UI feel generated, default, or cargo-culted. If a choice is common in AI builders, it needs a stronger reason to survive.

## Instant Tells To Kill

- Purple-to-blue or purple-to-indigo gradients unless purple is a deliberate brand choice.
- Default font stacks like Inter, Roboto, Arial, and increasingly generic Space Grotesk or DM Sans when they do not fit the aesthetic.
- Three equal cards with icon, title, and short description.
- Bouncy "scroll down" arrows.
- Decorative floating blobs, sparkles, stars, or random geometry with no information or brand purpose.

## Hero Rules

- Avoid centered headline, centered subtitle, centered CTA, centered image as the default composition.
- Break the center axis with asymmetric layouts, offset media, overlap, strong left alignment, or unusual proportions.
- Replace vague copy such as "Revolutionize your workflow" with specific product value, named pain, concrete outcome, or proof.
- Do not use gradient blob backgrounds as default hero treatment.
- Avoid abstract glossy 3D filler. If using 3D, make it specific to the product or message.
- Do not place a generic gray "Trusted by" logo bar immediately under every hero. Use real proof thoughtfully.

## Layout Rules

- Avoid uniform section rhythm where everything has identical padding, gap, card size, and weight.
- Avoid the default parade: hero, features, how it works, testimonials, pricing, CTA, footer.
- Break predictable three-column feature grids, two-column alternators, and identical card heights.
- Vary section weight with contrast, whitespace, media, editorial blocks, feature emphasis, quotes, or asymmetric grids.
- Keep section whitespace generous: use at least `clamp(4rem, 10vw, 8rem)` for major vertical breathing room unless the app is intentionally dense.
- Avoid nesting surfaces beyond two levels. Prefer whitespace, borders, dividers, and layout hierarchy over cards inside cards.
- Vary border radii according to the design language; do not apply `rounded-xl` or pill shapes everywhere.

## Color And Visual Rules

- Avoid timid pastel soup. Prefer one dominant accent, one optional secondary, and strong neutrals.
- Use gradient text once at most, and only when it earns attention.
- Avoid pure default white pages when a subtle temperature, texture, or section background would add character.
- Use glassmorphism sparingly. If everything is glass, nothing has hierarchy.
- Never use emojis as feature icons. Use a proper icon library or custom SVGs that match the system.
- Tint neutrals toward the palette temperature instead of default gray-only ramps.
- Check contrast. Interactive text on white needs WCAG AA contrast; do not use light accent colors for body/action text.

## Typography Rules

- Avoid one font and one weight everywhere.
- Build a type scale: display, h1, h2, h3, body, small, caption.
- Use real contrast: display/body pairing or clear weight variation.
- Use all-caps for one hierarchy level at most.
- Tune line height by size: display around 1.0 to 1.1, body around 1.5 to 1.7.
- Avoid positive letter spacing on large headings. Use default or slight negative tracking for display type when appropriate.
- Avoid light gray text on white. Muted text must still pass contrast.
- Use 16 to 18px body text for marketing/editorial pages unless the surface is intentionally dense.

## Motion And Interaction Rules

- Never use `transition: all 0.3s ease` as a blanket pattern. Specify properties and choose intentional easing.
- Avoid `scale(1.05)` on every card. Use border shifts, shadow lifts, background changes, underline reveals, glows, or movement based on aesthetic.
- Avoid fade-in-up on every element at the same speed. Stagger, vary, or let some elements appear instantly.
- Use at most one horizontal marquee unless the concept truly depends on it.
- Avoid bouncy spring easing in serious corporate, editorial, or luxury interfaces.
- Reserve ongoing continuous animation for one focal point maximum.
- Animate transform and opacity, not layout properties such as width, height, top, or left.
- Always include reduced-motion support:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Component Rules

- Avoid default testimonial carousels with three cards, circular avatars, stars, and quotes.
- Do not default to three-tier pricing tables unless pricing was actually requested.
- Include FAQ only when there are real questions; do not append generic accordions to every page.
- Replace generic "Get Started" and "Learn More" button pairs with specific verbs and varied CTA patterns.
- Do not add newsletter footers by default.
- Avoid every section having equal visual weight.

## Copy Rules

- Replace "Simple. Fast. Secure." with concrete claims.
- Avoid generic three-step "How it works" sections with circled numbers unless the workflow truly benefits from it.
- Avoid meaningless stats rows. Use real, specific proof near the relevant story.
- Replace "Join X happy customers" with named proof, a case study, or a concrete result.
- Never use lorem ipsum in finished demos. Use realistic product copy.
- Avoid generic stock photos of smiling people at laptops. Prefer product screenshots, real brand photography, purposeful illustration, or abstract visuals with a reason.

## Pre-Ship Self-Check

Before shipping frontend work, scan for:

- Inter, Roboto, Arial, or generic font choice with no rationale.
- Purple/blue gradient or indigo/violet accent by habit.
- Three-card grid with icon/title/body.
- Centered hero with subtitle and two buttons.
- Bouncy scroll arrow.
- Random blobs or decorative shapes.
- Default section order.
- Same hover effect everywhere.
- Uniform spacing and identical card heights.
- Emoji icon system.
- Text contrast below WCAG AA.
- `transition: all`, default `ease`, or animation of layout properties.

If three or more appear, revise the design before calling it done.
