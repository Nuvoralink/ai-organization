---
name: visualforge-frontend-contract
description: Implementation-ready frontend contract — CSS architecture, asset delivery, font loading, image strategy, performance budgets, theming, dark mode strategy, framework specifics, build pipeline for design tokens.
---

# Frontend Implementation Contract

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `token-artifact-export-spec.md`.
- Use `opinionated-decision-template.md`.
- Every implementation decision: technology + version + reason + alternatives rejected + bound artifact + verification.
- This subskill turns design into developer-actionable engineering.
- Maintain `decision-log.md`.

## Purpose

Convert design decisions into implementation. This is the bridge between design system and codebase — without it, the design ships only as PDFs.

## Mode-aware behavior

- **Greenfield:** Specify ideal stack and contract for the chosen frontend framework.
- **Specforge-enhanced:** Specforge may have specified some implementation (architecture / stack). Read those decisions and produce design-implementation contract compatible.
- **Retrofit:** Inventory existing CSS architecture, build pipeline; produce ideal; drift entry. Migration plan handles transition.

## Required research pass

```text
Research current frontend implementation best practices as of 2026 for [chosen framework]: CSS architecture options (Tailwind 4, CSS Modules, vanilla-extract, Pigment CSS, Panda CSS, Styled Components, Stitches, plain CSS with @scope), variable font loading, image CDN integration, design token pipeline (Style Dictionary, Tokens Studio Sync, Specify), theming patterns (data-theme attribute, CSS custom properties, color-mix), Container Queries adoption, View Transitions API support. Capture sources.
```

## Inputs

- Design tokens (`06-design-tokens.md` + `tokens.json`).
- Surface treatments, motion, components, accessibility — all references.
- Design brief — chosen framework, performance budget.
- Specforge architecture decisions if exists.

## Output files

- `docs/design-system/07-quality/frontend-implementation-contract.md`
- `docs/design-system/tokens/tailwind.config.example.js` (or framework equivalent) — stub config consuming `tokens.json`.
- Decision-log entries (DEC-905 to DEC-929, overflow DEC-930 to DEC-934) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Framework stack lock

- **JS framework:** React / Vue / Svelte / Solid / Angular / Astro / Next / Nuxt / Remix / Qwik / vanilla / etc.
- **Version:** lock major.
- **Routing:** if applicable.
- **State:** local-first / TanStack Query / Redux Toolkit / Zustand / Jotai / etc.
- **TS / JS:** TS strongly recommended for typed token consumption.

### 2. CSS architecture decision

Decide:

- **Tailwind 4:** atomic utilities, JIT, design-token import via CSS variables.
- **CSS Modules:** scoped CSS files, good for tight component packaging.
- **Vanilla Extract / Pigment CSS / Panda CSS:** type-safe CSS-in-JS at build time.
- **Styled Components / Emotion:** runtime CSS-in-JS (avoid for perf-critical apps).
- **Plain CSS + @scope + container queries:** modern CSS, no preprocessor.
- **Mixed approach:** Tailwind for utilities + CSS Modules for component-specific complex CSS.

For each, explain why this product needs it. Reject the rest with one line.

### 3. Design token pipeline

- **Source:** `tokens.json` as canonical.
- **Generator:** Style Dictionary / Tokens Studio Sync / custom script — pick.
- **Outputs:**
  - `tokens.css` — CSS custom properties, loaded once globally.
  - `tokens.ts` — typed TS, importable by component code.
  - `tailwind.config.js` (if Tailwind) — generated extension consuming tokens.
  - `tokens.figma.json` — for Figma Variables sync.
- **Watch / rebuild:** during dev, `tokens.json` change rebuilds derivatives.
- **CI verification:** validate that all derivatives are up to date in PR check.

### 4. Theming strategy

- **Mode switching:** `data-theme="light|dark|auto"` attribute on `<html>`.
- **Auto mode:** uses `prefers-color-scheme`.
- **User override:** persisted in localStorage; respect system on first visit.
- **No-flash strategy:** inline theme detection script in `<head>` before stylesheet loads.
- **High-contrast adjunct:** `data-contrast="high"` or `prefers-contrast: more` query.
- **White-label / multi-tenant theming (if applicable):** runtime token override via CSS variables; per-tenant data attribute.

### 5. Dark mode implementation

- **Algorithm:** semantic tokens have light + dark values defined in `tokens.json`; CSS variables swap based on `data-theme` or media query.
- **Image / illustration variants:** marked with `data-theme-image="dark"` etc.
- **Shadow adjustments:** dark mode shadows usually less dramatic; sometimes replaced with subtle inner border for elevation.
- **System UI elements:** `color-scheme: light dark` on `<html>` so native form controls adopt.

### 6. Font loading strategy

- **Variable fonts:** preferred. Single file per family.
- **Loading method:** `<link rel="preload" as="font" crossorigin>` for primary font; `font-display: swap` to avoid FOIT.
- **Fallback stack:** carefully matched to primary font's metrics to minimize CLS on swap.
- **Self-host:** required for production (no Google Fonts CDN reliance).
- **Subsetting:** unicode-range for Latin + extended.
- **Performance budget:** primary font + bold ≤ 60KB compressed.

### 7. Image strategy

Reference `visualforge-imagery-illustration`. Implementation specifics:

- **Image CDN:** Vercel Image, Cloudflare Images, ImageKit, Cloudinary — pick.
- **Formats:** AVIF + WebP + JPEG fallback.
- **Responsive:** srcset + sizes for every product image.
- **LCP image:** preloaded with `fetchpriority="high"`.
- **Below-fold:** `loading="lazy"` `decoding="async"`.
- **BlurHash / ThumbHash:** for placeholder fade-in.
- **CLS prevention:** explicit width/height on every img.

### 8. Performance budgets (concrete numbers)

From design brief target tier. Examples:

| Metric | Target | Hard ceiling |
|---|---|---|
| LCP | < 2.0s | 2.5s |
| INP | < 100ms | 200ms |
| CLS | < 0.05 | 0.1 |
| TTFB | < 600ms | 800ms |
| JS bundle (initial) | < 150KB gzip | 200KB |
| CSS (initial) | < 30KB gzip | 50KB |
| Fonts initial | < 60KB | 100KB |
| Image LCP | < 200KB | 400KB |
| Total transferred (initial) | < 800KB | 1.5MB |
| Time to Interactive (low-end mobile) | < 4s | 6s |

Budget enforcement: Lighthouse CI on every PR; bundlephobia / size-limit checks.

### 9. Animation implementation

- **Library:** confirms motion-design subskill choice.
- **CSS animations:** prefer for stateless animations (hover, focus).
- **Web Animations API:** for orchestrated motion.
- **GPU compositing:** `transform` and `opacity` only; `will-change` hint judicious.
- **Reduced motion media query honored in CSS:** `@media (prefers-reduced-motion: reduce) { ... }`.

### 10. Component implementation rules

- **Single source of truth:** components reference Tier 3 tokens; Tier 3 references Tier 2; Tier 2 references Tier 1.
- **No inline styles** for design values; everything via tokens or classes.
- **Composition:** components compose via slots, not deep prop passing.
- **Accessibility:** every component imports a tested a11y primitive (Radix / React Aria / Reach UI / etc.) when available.

### 11. State management for theming and density

- **Theme store:** module-level signal / atom / context, persisted to localStorage.
- **Density store:** same pattern if density modes adopted.
- **SSR consideration:** server reads cookie or default; cookie set client-side on change to avoid hydration flicker.

### 12. Storybook / component documentation

- **Storybook 8+:** required for component visual / interaction documentation.
- **One story per variant × state combination.**
- **a11y addon:** active.
- **Interactions addon:** for testing.
- **Visual regression:** Chromatic / Percy / Playwright snapshot — pick one.

### 13. Testing strategy

- **Unit:** Vitest / Jest.
- **Component:** Storybook interactions + React Testing Library.
- **Visual regression:** Chromatic or Playwright snapshots.
- **a11y:** axe-core in Storybook + CI.
- **E2E:** Playwright for primary flows.

### 14. Build pipeline

- **Bundler:** Vite / Turbopack / Next built-in.
- **CSS pipeline:** PostCSS / Lightning CSS for autoprefix and modern-CSS down-leveling.
- **Token pipeline:** Style Dictionary build runs before app build.
- **Type generation:** TS types from tokens, ARIA contract types.

### 15. SSR / hydration

- **Server rendering target:** SSR / SSG / ISR — pick per route.
- **Hydration strategy:** progressive / island / full — per framework.
- **No-flash theme:** server inlines current theme variables.

### 16. Browser support

- **Target list:** lock explicitly. Example: "last 2 major versions of Chrome, Firefox, Safari, Edge; iOS Safari 16+; Chrome on Android 12+".
- **Polyfill policy:** automatic via core-js for syntax; explicit polyfills only for critical APIs.
- **Progressive enhancement:** modern CSS features (`@container`, `:has()`, `color-mix()`, `oklch()`) used freely; fallbacks for older targets when meaningful.

### 17. React / framework quality discipline (added per VF-FIND-036)

A token pipeline, performance budget, and Storybook setup are necessary but not sufficient — they don't prevent a useEffect tangle, a server / client boundary mistake, or an unstable render loop. This section adds the React-quality lens distilled from `frontend-ui-engineering` so the contract isn't only infrastructure.

#### 17a. Product-first UI workflow

Every UI work item follows this order:

1. Identify the **user job** and **primary action** before choosing layout.
2. Map the needed states: `loading`, `empty`, `success`, `error`, `disabled`, `long content`, `missing data`, `permission limited`. Do not call UI done until each named state has either an implementation or an explicit deferral with reason.
3. Design **responsive behavior as different experiences per breakpoint**, not a scaled copy. Hide core functionality on mobile fails review.
4. Use existing tokens, components, icons, and typography patterns first; new primitives need a decision card explaining why the existing ones don't fit.
5. Verify with browser screenshots for meaningful UI work — the type-check passing is not sufficient.

#### 17b. React boundaries discipline

For React / Next.js codebases:

- **Server vs client components:** every component declares its boundary explicitly. Default to server; mark `"use client"` only when the component genuinely needs browser state, effects, or event handlers.
- **Minimal client state:** state lives at the lowest common ancestor of the consumers — not lifted to the root by default. Global state (Zustand / Jotai / Context) is for cross-tree concerns, not convenience.
- **Stable effects:** `useEffect` runs only when its dependencies semantically change. Object / array dependencies that are recreated each render cause loops; memoize them or move them out.
- **No effects for derived state:** if a value can be computed in render from existing state/props, do not write it to state via `useEffect`. Use a `useMemo` or compute inline.
- **No effects for event handling:** user actions go through event handlers, not effects.
- **Server-data fetching:** server components fetch directly; client components use TanStack Query / SWR / framework data hooks — not raw `useEffect` + `fetch`.
- **Forms:** use a real form library (React Hook Form / Conform / framework primitive). Roll-your-own form state with `useState` is allowed only for trivial single-field cases.

#### 17c. Hard rules (failure if violated)

- No core functionality hidden on mobile.
- No essential action gated by hover (hover does not exist on touch).
- No `useEffect` for derived state.
- No effect dependency arrays that lie (missing deps or stale closures).
- No `any` in component-prop interfaces; component contracts must be typed.
- No inline anonymous handlers that allocate new objects passed to memoized children.

#### 17d. Component-spec → React-implementation contract

For each component shipped to `src/components/` (or framework equivalent), the spec produced by `visualforge-component-system` must additionally name:

- Server vs client boundary.
- Whether the component owns state, and which state.
- Data dependencies (server fetch / hook / context).
- Suspense / streaming boundary if applicable.
- Error boundary placement.

This is consumed by the mutation log (per VF-FIND-024) — without the boundary declaration, a wrapper-encapsulated semantic drift (VF-FIND-025) can still slip through.

#### 17e. Decision cards

- DEC-925 React boundaries policy (server-first vs client-first per route). *(In allocated range DEC-905–929 per `decision-id-allocation.md`.)*
- DEC-926 State management strategy (local-first / TanStack Query / Redux Toolkit / Zustand / context-only).
- DEC-927 Form library decision.
- DEC-928 Data-fetching pattern (RSC / hooks / endpoints).

### 18. Decision cards

- DEC-906 Framework + version lock.
- DEC-907 CSS architecture.
- DEC-908 Token pipeline.
- DEC-909 Theming attribute strategy.
- DEC-910 Dark mode algorithm.
- DEC-911 Font loading + self-host policy.
- DEC-913 Image CDN + format strategy.
- DEC-914 Performance budgets.
- DEC-915 Motion library implementation lock.
- DEC-916 Storybook + testing strategy.
- DEC-917 Browser support target.

## Anti-slop contract rules

- "Use Tailwind" without version, plugin list, custom config strategy fails.
- "Performant" without budget numbers fails.
- "Responsive" without breakpoint enforcement in CSS arch fails.
- Token pipeline missing means tokens drift; lock the generator.
- Font self-hosting omitted is a perf and privacy failure.

## Quality gate

- Framework, CSS arch, token pipeline, theming, dark mode, fonts, images, motion, testing, build, browser support — all locked.
- Performance budgets are numeric, not adjectives.
- Build pipeline is specified end-to-end.
- **React-quality discipline** (§17) decisions locked: DEC-925 server / client boundary policy, DEC-926 state-management strategy, DEC-927 form library, DEC-928 data-fetching pattern (per VF-FIND-036).

## Implementation mutation log (REQUIRED when implementation ships)

Per `_visualforge-shared/references/test-discipline-and-mutation-protocol.md` and plugin finding **VF-FIND-023**, any frontend-contract that has produced live components in `src/components/**` must also produce `docs/design-system/auditability/implementation-mutation-log.md` containing:

- One section per component shipped.
- Per component: at least one mutation table — columns: **Mutation applied**, **Tests expected to fail**, **Tests actually failed**.
- A "Suite summary" block listing typecheck / lint / vitest / e2e verdicts.

The validator emits a WARN (FAIL under `--strict`) when:
- `src/components/ui/` exists but `auditability/implementation-mutation-log.md` is missing, OR
- A component spec at `docs/design-system/05-components/**/*.md` has no corresponding entry in the mutation log.

The DEC-912 "testing strategy" decision must explicitly cite the mutation discipline. "Unit + integration + e2e" without mutation testing fails the quality gate — positive-control tests can vacuously pass, so the verification of the tests themselves matters.

## Sources and basis

Per-decision tied to design tokens, brand, personas target device tier, and current frontend research.
Test discipline tied to `_visualforge-shared/references/test-discipline-and-mutation-protocol.md` and plugin finding VF-FIND-023.
