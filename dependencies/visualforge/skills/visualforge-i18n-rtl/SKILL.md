---
name: visualforge-i18n-rtl
description: Internationalization depth — target locales, RTL mirroring contract per element class, text expansion budgets, locale-aware date/number/currency, bidirectional text handling, logical CSS, font fallback per script, translation memory, cultural sensitivity in imagery / color / gestures.
---

# Internationalization and RTL

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `color-theory-and-decision-matrix.md` (for cultural color associations).
- Use `opinionated-decision-template.md`.
- "Internationalization-ready" requires concrete contracts, not adjectives.
- Every layout, every component, every microcopy entry must work in every supported locale.
- Cultural color associations (white = mourning in East Asia, etc.) cross-check via `color-theory-and-decision-matrix.md` § "Color meaning" — products targeting non-Western audiences must verify brand color choices against the cultural meaning table.
- Maintain `decision-log.md`.

## Purpose

i18n is most often handled by stripping hardcoded strings and calling it done. That fails the moment Arabic users see broken right-aligned text, or German users see truncated buttons, or Japanese users see strange line breaks. This subskill specifies i18n at design time.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Lock target locales, contract i18n rules.
- **Retrofit:** Inventory existing locales and i18n posture; produce ideal; drift entries (often: add RTL, add new locales, fix expansion).

## Required research pass

```text
Research current i18n best practices as of 2026: CSS logical properties (margin-inline-start, padding-block, inset-inline), bidirectional text (Unicode bidi algorithm, dir attribute, isolate vs embed), Intl APIs (DateTimeFormat, NumberFormat, RelativeTimeFormat, ListFormat, PluralRules), ICU MessageFormat, variable font multi-script support, locale negotiation, font fallback per script (Noto family, system fallback). Capture sources.
```

## Inputs

- Design brief — target languages and scripts.
- Personas — locales served.
- Layout system — needs to support RTL flip.
- Component system — needs logical CSS throughout.
- Content design — microcopy library and i18n readiness lock.

## Output files

- `docs/design-system/03-structure/i18n-rtl.md` — full contract.
- Decision-log entries (DEC-310 to DEC-334, overflow DEC-335 to DEC-339) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Locale lock

- **Tier 1 locales** — fully supported, QA'd, design-reviewed.
- **Tier 2 locales** — translated, automatic layout, less rigorous QA.
- **Tier 3 locales** — fallback to nearest Tier 1 with locale tags.

Locked list with reasoning (where users actually are).

### 2. Script coverage

Identify scripts to support and font stack per script:

| Script | Languages | Primary font | Fallback chain |
|---|---|---|---|
| Latin | English, Spanish, French, German, Portuguese, … | Inter Variable | system-ui, -apple-system, sans-serif |
| Cyrillic | Russian, Ukrainian, Serbian, Bulgarian | Inter Variable (includes Cyrillic) | system fallback |
| Greek | Greek | Inter Variable | system fallback |
| Arabic | Arabic, Persian, Urdu | Noto Sans Arabic | system fallback |
| Hebrew | Hebrew | Noto Sans Hebrew | system fallback |
| CJK Han (Simplified) | Chinese (Simplified) | Noto Sans SC | system fallback |
| CJK Han (Traditional) | Chinese (Traditional) | Noto Sans TC | system fallback |
| Japanese | Japanese | Noto Sans JP | system fallback |
| Korean | Korean | Noto Sans KR | system fallback |
| Devanagari | Hindi, Marathi, Sanskrit | Noto Sans Devanagari | system fallback |
| Thai | Thai | Noto Sans Thai | system fallback |

Lock the actual list to supported scripts.

### 3. Text expansion budget

Different locales expand or contract:

| Locale | Expansion vs English |
|---|---|
| English (base) | 1.0x |
| German | +30% (worst case, common) |
| French / Spanish / Portuguese | +20% |
| Italian | +20% |
| Russian | +10% |
| Polish | +25% |
| Arabic / Hebrew | -10% to +5% (varies) |
| Chinese / Japanese / Korean | -30% (typically shorter) |

**Design contract:** every container that holds translated text must accommodate +30% expansion without truncating, wrapping awkwardly, or breaking layout.

**Verification:** dummy-translate to "Schtroumpfomatique" (long German-like) test strings or use a pseudo-locale (e.g., `en-PSEUDO` that expands and accents every string).

### 4. RTL mirroring contract

For locales using right-to-left scripts (Arabic, Hebrew, Persian, Urdu), the layout *mirrors*.

#### What mirrors

- Page reading direction.
- Component layouts (text alignment, label position).
- Directional icons: arrows, chevrons, back / forward, undo / redo, external-link, navigation indicators.
- Layout shells: side rail flips to right side.
- Toast / notification edge: top-left becomes top-right (or whatever the locale convention is).
- Breadcrumb separator direction.
- Progress bars (LTR fills left-to-right; RTL fills right-to-left).
- Drag affordances.
- Carousel navigation (next is leftward).

#### What does not mirror

- Numerals (Arabic-Indic vs Latin numerals — choice per locale).
- Logos, brand marks.
- Photos and illustrations (unless they contain directional information that should flip — flag manually).
- Code blocks (always LTR).
- Phone numbers, email addresses.
- Charts and data visualizations (axis direction is conventional; flip only when culturally expected).
- Time-series axes typically remain LTR for global consistency unless project demands.
- Some icons (heart, star, gear, search magnifier).
- Video / audio progress (flip only if locale convention demands; otherwise keep LTR for cross-locale users).

Document per icon class in iconography subskill semantic map.

### 5. Bidirectional text

When LTR and RTL text mix (e.g., English brand name in Arabic sentence, code reference in Hebrew prose):

- Use `dir="auto"` for user-generated content where direction can't be assumed.
- Wrap inline foreign-direction text with `<bdi>` (bidi isolation).
- For numerals + units in RTL: use `&lrm;` / `&rlm;` markers if rendering misbehaves.
- Test with mixed content in QA.

### 6. Logical CSS

Throughout the design system:

- `margin-inline-start` not `margin-left`.
- `padding-block` not `padding-top / bottom`.
- `inset-inline-start` not `left`.
- `text-align: start` / `end`, not `left` / `right`.
- `border-inline-start` not `border-left`.
- Container queries can use `inline-size` for direction-agnostic.

Lint or enforce in PR checks.

### 7. Locale-aware formatting

Use Intl APIs everywhere; never hardcode formats:

- **Dates:** `Intl.DateTimeFormat(locale, options)`. Pattern decisions: relative for < 7 days, absolute beyond. Date format style: medium for most UI, short for dense tables, long for prose.
- **Times:** include timezone abbreviation when ambiguous.
- **Numbers:** `Intl.NumberFormat`. Decimal separators, group separators (locale-aware).
- **Currency:** `Intl.NumberFormat(locale, { style: 'currency', currency })`. Symbol position varies by locale.
- **Plurals:** `Intl.PluralRules` or ICU MessageFormat — never `count + 's'`.
- **Lists:** `Intl.ListFormat` for "A, B, and C" / "A, B et C".
- **Relative time:** `Intl.RelativeTimeFormat`.

### 8. Translation memory and routing

- **Routing:** `/en/`, `/de/`, `/ja/` path-prefix OR `en.example.com` subdomain — pick one. Locale negotiation via `Accept-Language` for default redirect.
- **Translation memory:** store translations in `microcopy.json` keyed by stable IDs, then per-locale files (`en.json`, `de.json`, `ja.json`).
- **Translation platform:** Lokalise / Crowdin / Phrase / Smartling — pick if team uses one.
- **Locked terms:** brand names, product feature names that shouldn't translate — marked in microcopy library.
- **Source language:** lock the source (usually English) and never edit translations directly — edit source then re-translate.

### 9. Cultural sensitivity

- **Imagery:** representation of people, situations, environments respects target cultures. Review for: religious imagery, gestures with different meanings, food / clothing choices, gender / age representation.
- **Color associations:** colors mean different things across cultures (white = death in some Asian cultures; red = luck in Chinese, danger in Western). Review state colors per market.
- **Gestures:** hand gestures in illustrations / icons (thumbs-up, OK sign, peace) carry different meanings in different cultures.
- **Names:** support various name formats (single name, multi-part, given-first vs family-first, particles, suffixes). Avoid first-name / last-name labels when possible — prefer "given name / family name" or just "name".
- **Addresses:** structure varies; use generic "address" with locale-specific subfields when known, or single text field.
- **Currency display:** show currency symbol per locale; do not assume USD.
- **Number entry:** locale-aware numeric input.

### 10. Mobile keyboard hints

- `inputmode="numeric"` / `"decimal"` / `"email"` / `"tel"` to surface correct mobile keyboard.
- `autocomplete` attributes for personal data (1.3.5).
- `lang` attribute on elements when sub-content is in different language.
- `dir` attribute on inputs that may receive RTL content.

### 11. Testing

- Pseudo-localization (`en-PSEUDO`) build that auto-expands and accents every string.
- Per-locale screenshot smoke tests in Storybook.
- RTL preview toggle in Storybook (sets `dir="rtl"` on root).
- Manual QA per Tier 1 locale per release.

### 12. Decision cards

- DEC-311 Locale tier list.
- DEC-312 Script coverage + font fallback chains.
- DEC-313 Text expansion budget.
- DEC-314 RTL mirroring rules (what mirrors, what doesn't).
- DEC-315 Bidirectional text handling.
- DEC-316 Logical CSS adoption.
- DEC-317 Intl API usage policy.
- DEC-318 Locale routing strategy.
- DEC-319 Translation platform.
- DEC-320 Cultural sensitivity review process.

## Anti-slop i18n rules

- "Translation-ready" without locale list, expansion budget, RTL contract — fails.
- Hardcoded date / number / currency formats — fails.
- "We'll add Arabic later" without contracting RTL now — guarantees rewrite.
- `<label>First name</label>` instead of `<label>Given name</label>` for global products — usually slop.
- Color-only state for global markets without cultural review — risk.

## Quality gate

- Locale tier list locked.
- Font stack per script.
- Expansion budget honored in component spec.
- RTL mirroring contract specified.
- Bidi and logical CSS rules adopted.
- Intl API used for all formatting.
- Translation routing decided.
- Pseudo-localization testing in place.

## Sources and basis

Per-decision tied to W3C i18n WG guidance, Unicode bidi algorithm, MDN Intl APIs, persona locales, and current translation tooling.
