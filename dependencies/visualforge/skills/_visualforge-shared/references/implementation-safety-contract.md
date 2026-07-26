# Implementation Safety Contract

For the engineers (human or AI agent) who consume VisualForge output to build the product. Inspired by Specforge's implementation safety contract.

This protocol applies to every subskill: each must produce output that meets the implementation safety contract for its layer.

## The risk

A complete-looking design doc still allows wrong implementation. An engineer reading "Use Lucide icons at 16px" can still:

- Import the wrong Lucide package version.
- Use Lucide's SVG export instead of the React component.
- Apply the wrong stroke weight.
- Place icons outside the touch-target padding rule.

Each is technically "following" the doc. The implementation safety contract removes that ambiguity.

## Required clarity per material decision

Every material design decision must specify:

- **Exact identifier** — package name, component import path, token name, file path, route name.
- **Exact version or range** — `lucide-react@^0.460.0`, not "the latest Lucide."
- **Allowed dependencies** — what's allowed to import what.
- **Forbidden dependencies** — what must never be imported (e.g., "do not import directly from `@radix-ui/react-*` — only via the wrapped components in `src/components/ui/`").
- **Allowed provider calls** — for components that touch external services, exact provider methods.
- **Forbidden provider calls** — common mistakes to prevent.
- **Forbidden mutations** — components that must not directly mutate global state, app store, theme.
- **Required props / API** — component signature is locked; downstream cannot add props ad-hoc.
- **Forbidden props** — props that exist in the library but must not be used (e.g., "do not use `Button as={Link}` polymorphic — use `LinkButton` instead").

## Required clarity per component

Per `05-components/[Category]/[Name].md`, the engineer needs:

- **Import path:** `import { Button } from '@/components/ui/button'`.
- **File location:** `src/components/ui/button.tsx`.
- **Storybook story location:** `src/components/ui/button.stories.tsx`.
- **Test file location:** `src/components/ui/button.test.tsx`.
- **Library source if wrapping:** `import { Slot } from '@radix-ui/react-slot'`.
- **Allowed internal dependencies:** other UI components by their import paths.
- **Forbidden internal dependencies:** business-logic modules, data fetching, global state directly.
- **Token bindings (exact):** `--vf-button-primary-bg-rest` → `tokens.css`, `tokens.button.primary.bg.rest` → `tokens.ts`.
- **Slot composition rules:** how children are rendered.
- **Ref forwarding rule:** does the component forward ref? Required for libraries.

## Required clarity per screen

Per `06-screens/SCR-NNN-*.md`:

- **Route:** `/[exact-path-pattern]` in the framework's syntax.
- **File location:** `app/[route]/page.tsx` (Next) / `src/routes/[route].tsx` (Remix) / per framework.
- **Auth boundary:** middleware / loader / guard that enforces; exact reference.
- **Data loaders:** server / client; exact function signatures; cache behavior.
- **Forbidden:** direct database calls from client; direct provider calls; tokens / colors / spacing not from design system.
- **Required components:** exact import paths from the component system.
- **State management:** local vs global, exact store / context if applicable.

## Required clarity per token

Per `tokens/tokens.json` and its derivations:

- **Tier:** primitive / semantic / component.
- **Allowed consumers:**
  - Tier 1: only Tier 2 / 3 token definitions.
  - Tier 2: app code (components, styles).
  - Tier 3: only inside the named component.
- **Forbidden consumers:** anything outside the allowed consumer set (e.g., a layout file should not reference `button.primary.bg.rest`).
- **Build pipeline output:** which generated file consumes this (`tokens.css`, `tokens.ts`, `tokens.figma.json`).
- **Deprecation status:** active / deprecated-in-v[N] / removed-in-v[M].

## Required clarity per route / API / job

Per any contract surface:

- **Path:** exact, e.g., `POST /api/projects`.
- **Auth:** required role / scope / session check.
- **Validation:** schema reference (Zod / Valibot / Yup file path).
- **Response shape:** TypeScript type or schema reference.
- **Error codes:** stable list with meaning.
- **Idempotency:** if applicable, the durable guard (unique key, lock, claim).

## "What should NOT be done" list per subskill

Every subskill must include this section at the end of its narrative doc:

```markdown
## What we are intentionally NOT doing in this layer

- [specific behavior] — because [reason] — instead do [alternative].
- [specific behavior] — because [reason] — instead do [alternative].
- ...
```

Examples:

- **In `surface-treatments`:** "Not adopting glass on dense card grids — performance + readability cost — use multi-layer shadow instead."
- **In `iconography`:** "Not allowing mixed-library icons (Lucide + Material) — brand cohesion failure — Lucide only across the product, custom SVG when needed."
- **In `motion-design`:** "Not adopting magnetic hover on data table rows — perf cost at scale — magnetic hover reserved for hero CTAs."
- **In `auth-flows`:** "Not using paste-blocking on password fields — WCAG 3.3.8 fail — password managers must work."
- **In `component-system`:** "Not building a custom DataTable — TanStack Table is the chosen primitive — wrap and theme, don't replace."

This list converts decisions-by-rejection into explicit prohibitions the implementation agent can scan for before commit.

## Forbidden ambiguous phrases

The implementation safety contract forbids these phrases in any generated doc:

- "Use appropriate spacing" — name the exact spacing token.
- "Consider using…" — decide.
- "Handle edge cases" — list the edge cases.
- "Add proper validation" — name the validation library and the schema location.
- "Use a modern library" — name the library and version.
- "Make it responsive" — list the breakpoints and what changes at each.
- "Add tests" — list the test files / scenarios.
- "Add documentation" — list the exact docs.
- "Improve performance" — name the budget and the technique.
- "Make it accessible" — name the WCAG criteria and the verification method.
- "As needed" / "if applicable" / "where appropriate" — make explicit.

The validation script scans generated docs for these phrases and flags them.

## Decision implication chain

For every material decision, the implementation must be able to trace:

```
DEC-NNN
  → token name(s) added/modified
  → derived file change (tokens.css / tokens.ts / tokens.figma.json line)
  → component(s) affected (by import path)
  → screen(s) affected (by SCR-NNN)
  → test(s) that must pass
  → docs to update (paths)
```

If any link in the chain is broken, the decision is not implementation-ready.

## Pre-implementation gate

Before VisualForge declares completion, the orchestrator verifies for each material decision:

- Could a different competent engineer build the wrong thing while still technically following this decision?
- If yes, the decision needs tightening — usually by adding to the "What we are NOT doing" list, or by adding an exact identifier.

## Anti-slop implementation contract rules

- A component spec without exact import path fails.
- A decision without "What we are NOT doing" peer fails.
- A token without explicit allowed-consumer rules fails.
- A screen without route + file location + auth guard reference fails.
- "Implementation flexibility" claimed without specifying which axis — what's locked, what's the engineer's call — fails.
- Forbidden phrases (above) present in generated docs fail validation.
- An implementation slice that adds a new public surface (component, server action, view-model, screen spec) without a corresponding entry in `docs/design-system/auditability/content-map.md` fails. See `shared-contracts-and-blast-radius.md` for the categories that trigger this rule and the cases it does not apply to (internal refactors, page-specific casual copy, single-consumer UI that has not stabilized into a pattern). The rule prevents the "documented later" failure mode where shared-contract reasoning is lost while the implementation is fresh.
- A multi-step action that awaits a non-critical-path side effect (notification email, audit-log write, analytics dispatch, layout decoration) inline without isolation fails. The critical path's success MUST NOT be cancelled by a degraded path's failure. See `failure-isolation-by-layer.md` for the classification protocol — both the "wrap degraded paths in try/catch" half and the "match HTTP method to work class" half (GET = read-only / idempotent; single-use side effects require POST so email-client prefetchers and CDN warmers cannot burn the user's link).
