# Current Design Source Map

Baked-in source registry for VisualForge research. Use online research when available to find the newest versions; when offline, use this map as the authoritative baseline. Always record the actual source used in `auditability/research-ledger.md` with the date checked.

## Platform & system design guidance

- **Apple Human Interface Guidelines** — definitive for iOS, iPadOS, macOS, watchOS, visionOS, tvOS. Search for the current OS version. Liquid Glass material guidance lives here as of iOS 26 / macOS 26.
  - `https://developer.apple.com/design/human-interface-guidelines/`
- **Material Design 3 (Material You / Material 3 Expressive)** — definitive for Android, also widely used on web.
  - `https://m3.material.io/`
- **Microsoft Fluent 2** — definitive for Windows, Office, and Microsoft web products.
  - `https://fluent2.microsoft.design/`
- **GNOME Human Interface Guidelines** — Linux desktop.
  - `https://developer.gnome.org/hig/`
- **W3C Web Platform Design System patterns** — accessibility-first reference patterns.
  - `https://www.w3.org/WAI/ARIA/apg/patterns/`

## Accessibility standards

- **WCAG 2.2** — current baseline for web accessibility, conformance levels A / AA / AAA.
  - `https://www.w3.org/TR/WCAG22/`
- **WAI-ARIA 1.2** — for assistive technology semantics.
  - `https://www.w3.org/TR/wai-aria-1.2/`
- **APCA (Advanced Perceptual Contrast Algorithm)** — perceptual contrast model used for WCAG 3 preview and Apple platforms.
  - `https://github.com/Myndex/SAPC-APCA`
- **EN 301 549** — European accessibility standard, mirrors WCAG with additions for hardware and assistive tech.
- **Section 508 (US)** — federal accessibility requirement, mirrors WCAG 2.0 AA.

## Component & design system references

- **Shadcn UI** — Radix + Tailwind, the most copied open-source component pattern set as of 2026.
  - `https://ui.shadcn.com/`
- **Radix UI Primitives** — unstyled accessible primitives.
  - `https://www.radix-ui.com/primitives`
- **Headless UI** — Tailwind Labs' unstyled accessible components.
  - `https://headlessui.com/`
- **Ark UI** — framework-agnostic state machines for components.
  - `https://ark-ui.com/`
- **React Aria** — accessibility-first hooks from Adobe.
  - `https://react-spectrum.adobe.com/react-aria/`
- **Material UI (MUI)** — Material 3 React implementation.
  - `https://mui.com/`
- **Fluent UI React** — Microsoft's Fluent 2 components.
  - `https://react.fluentui.dev/`
- **Ant Design 5** — enterprise-focused, China-market default.
  - `https://ant.design/`
- **Chakra UI** — composable React components.
  - `https://chakra-ui.com/`
- **Mantine** — full-feature React UI library.
  - `https://mantine.dev/`

## Icon libraries

- **Lucide** — fork of Feather, most active community as of 2026, 1500+ icons.
  - `https://lucide.dev/`
- **Phosphor Icons** — six weights (thin/light/regular/bold/fill/duotone), 9000+ icons.
  - `https://phosphoricons.com/`
- **Heroicons** — Tailwind Labs', outline + solid + mini.
  - `https://heroicons.com/`
- **Tabler Icons** — 5000+ free outline + filled.
  - `https://tabler.io/icons`
- **Radix Icons** — minimalist, paired with Radix UI.
  - `https://www.radix-ui.com/icons`
- **Material Symbols** — Google's variable icon font (fill, weight, grade, optical size).
  - `https://fonts.google.com/icons`
- **SF Symbols** — Apple platform native, only for Apple platforms per license.
  - `https://developer.apple.com/sf-symbols/`
- **Iconoir** — 1600+ MIT icons.
  - `https://iconoir.com/`

## Typography sources

- **Google Fonts** — Free, self-hostable, variable font support.
  - `https://fonts.google.com/`
- **Fontshare** — Free for commercial use.
  - `https://www.fontshare.com/`
- **GitHub: system-ui font stack** — Native fonts per platform.
- **Adobe Fonts / Typekit** — Subscription, premium foundries.
- **Variable font specs** — for type that adapts across weight, width, optical size.
  - `https://fonts.google.com/knowledge/introducing_type/introducing_variable_fonts`

## Color & contrast tools

- **OKLCH color space** — perceptually uniform, preferred for design tokens as of 2024+.
  - `https://oklch.com/`
- **APCA contrast tool** — `https://www.myndex.com/APCA/`
- **WCAG 2.2 contrast** — calculation in WCAG spec section 1.4.3 / 1.4.11.
- **Tailwind color palette** — `https://tailwindcss.com/docs/customizing-colors`
- **Radix Colors** — perceptually-balanced color scales for UI.
  - `https://www.radix-ui.com/colors`

## Motion design references

- **Material 3 motion** — `https://m3.material.io/styles/motion/overview`
- **Apple HIG motion** — under "Motion" per platform.
- **CSS easing functions Level 2** — `https://www.w3.org/TR/css-easing-2/`
- **Framer Motion docs** — most-used React animation library.
  - `https://www.framer.com/motion/`
- **React Spring** — spring physics for React.
  - `https://www.react-spring.dev/`
- **Motion One** — performant web animations API wrapper.
  - `https://motion.dev/`
- **GSAP** — industry standard for complex web animation.
  - `https://gsap.com/`
- **`prefers-reduced-motion`** — MDN for reduced motion handling.

## Layout & responsive references

- **CSS Grid Level 2** — subgrid support.
- **Container queries** — `@container` for component-level responsiveness.
- **CSS cascade layers** — `@layer` for managed specificity.
- **`prefers-color-scheme`** — dark mode media query.
- **`prefers-contrast`** — high-contrast mode.
- **`color-gamut`** — wide-gamut display detection.

## Performance budgets

- **Core Web Vitals (2026)** — LCP < 2.5s, INP < 200ms, CLS < 0.1 for "Good".
  - `https://web.dev/vitals/`
- **Lighthouse performance scoring** — `https://developer.chrome.com/docs/lighthouse/performance/performance-scoring`
- **CSS containment** — `contain` property for paint isolation.
- **`will-change` and `transform`** — GPU compositing rules.

## Scholarly / foundational sources

For decisions that should outlast trend cycles, ground in primary research:

- **Cognitive load theory:** Sweller, Mayer — multimedia learning principles, applies to dense interfaces and onboarding.
- **Perception and color science:** Stone, Hardin — color appearance, perceptual uniformity rationale for OKLCH.
- **Reading and typography:** Bringhurst (*Elements of Typographic Style*), Schwartz — modular scale rationale, measure (line length), x-height.
- **HCI fundamentals:** Norman (*The Design of Everyday Things*) — affordances, signifiers, feedback, error-tolerant design.
- **Heuristics:** Nielsen 10 (1994, refined since), Schneiderman 8 — heuristic evaluation basis for design pressure-test.
- **Fitts's Law:** target size × distance — basis for touch targets, hover targets, magnetic hover.
- **Hick's Law:** decision time × option count — basis for navigation simplicity, command palette design.
- **Gestalt principles:** proximity, similarity, closure, continuity, common fate — basis for grouping, alignment, hierarchy.
- **Accessibility research:** WebAIM Million annual report, GAAD, A11y Project — current state of web accessibility.
- **Cross-cultural HCI:** Marcus, Plocher, Hofstede dimensions — cultural variance in design preference.

Cite these for foundational claims where trends would mislead.

## Non-Western design references

For global products, balance Western-default sources with regional perspectives. Look at the actual products dominant in each market:

- **China / East Asia:**
  - WeChat (Tencent design system)
  - Ant Design (Alibaba) — Western-known but Chinese-origin
  - Tencent Cloud Design (CloudBase)
  - Bytedance Arco Design — TikTok / Lark
  - Tao Design (Taobao) — e-commerce conventions
  - Baidu MUI — search and tools
- **Japan:**
  - Cookpad design — pragmatic productivity
  - Yahoo Japan design system — text-density tolerance
  - Toss-equivalent: Mercari — marketplace
  - Goodpatch articles
- **Korea:**
  - Toss design blog — financial / consumer
  - Naver UX — search and platforms
  - Kakao design — messaging-platform conventions
- **India / South Asia:**
  - Razorpay — fintech
  - Swiggy / Zomato — local commerce; low-bandwidth-aware design
  - Khatabook — small-business tools, multi-language
- **Latin America:**
  - Nubank — fintech
  - Mercado Libre — marketplace
  - Rappi — local services
- **Middle East / Africa:**
  - Careem (acquired by Uber, but design legacy)
  - Talabat
  - M-Pesa — feature-phone-era design lessons still relevant

Specific regional design conventions:

- **CJK typography** — denser text tolerance, different line-height rules, vertical text support (Japanese specifically).
- **Right-to-left** — Arabic, Hebrew, Persian, Urdu — Apple HIG and Material 3 both have RTL guidance but actual examples come from native-language products.
- **Low-bandwidth design** — emerging-market apps optimize for 2G/3G; lite versions of products (Facebook Lite, YouTube Go pattern though discontinued).
- **Feature-phone heritage** — products that still need to work on KaiOS or basic phones in some markets.
- **Color associations** — red is luck (China) vs danger (Western); white is mourning (East Asia, parts of Africa) vs purity (Western).
- **Name format** — given-first vs family-first; particles; honorifics.

## Current design movements & trends (as of 2026)

Record these as candidates only — they must pass the trend-fit test in the anti-slop rubric before adoption.

- **Liquid Glass (Apple, iOS 26 / macOS 26)** — multi-layer translucent material with environmental light refraction. Use cases: navigation, modals, controls overlaying content.
- **Material 3 Expressive** — emphasis on motion, color, shape variation; less rigid than Material 3 base.
- **Bento layouts** — modular tile grids with varied tile sizes, used by Apple, Vercel, Linear.
- **Soft brutalism** — readable brutalism with rounded corners and warm palettes; common in consumer SaaS 2024+.
- **AI-native chrome** — generative-content surfaces, streaming-text UI, prompt-first input patterns (Claude, ChatGPT, Notion AI).
- **Spatial UI** — depth, layered Z, parallax used as wayfinding (Apple Vision, Arc browser).
- **Variable-font driven type systems** — single file, programmatic weight/width/optical-size.
- **OKLCH-based color systems** — perceptually uniform, P3-aware.
- **Dynamic island / contextual surfaces** — adaptive system chrome.
- **Subgrid layouts** — alignment across nested grid items.
- **Scroll-driven animations (CSS spec)** — `animation-timeline: scroll()`.
- **View Transitions API** — cross-document and same-document transitions.
- **Container queries everywhere** — replacing media-query-heavy responsive.
- **Anchor positioning (CSS)** — declarative tooltip / popover placement.

## Research pass template

Use this prompt to find the current state of any of the above:

```text
Research the newest official guidance for [topic]. Capture: official source URL, version/date, the specific section that affects [decision-being-made], and current best practice as of 2026. Note any deprecations. If multiple competing approaches exist, list them with adoption signals (which major products use which).
```

Record every research result in `docs/design-system/auditability/research-ledger.md` with: query, source, date checked, key findings, decisions affected.

When online research is not available, say so explicitly in the research ledger and proceed with the baked-in source map above.
