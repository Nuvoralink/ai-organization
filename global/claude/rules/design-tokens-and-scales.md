---
paths:
  - "**/*.css"
  - "**/*.scss"
  - "**/*.less"
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.vue"
  - "**/*.svelte"
  - "**/tailwind.config.*"
  - "**/theme/**/*"
  - "**/tokens/**/*"
  - "**/design-system/**/*"
  - "frontend/**/*"
---

# Tokens & Scales — Extend the Source, Never Inline a Raw Value at the Leaf

*(The **design-specific instance** of the "Relational, never hardcoded" doctrine in the global CLAUDE.md — the same principle applied to color / px / shadow / font / motion / z-index. Path-scoped: this loads whenever a styling or component surface is being read or edited, which is exactly when it bites.)*

When a project has a token / scale / registry layer for a kind of value — design tokens (color,
space, size, radius, shadow, motion, type, z-index, opacity), a config layer for thresholds, an
enum/taxonomy for states — that layer is the **only** place raw literals of that kind may be born.
Page / component / leaf code references a **named token**; it never inlines a raw value.

- **Use the existing token first.** Before writing any literal — `#hex`, `oklch(…)`, `16px`,
  `0 4px 14px …`, `200ms`, `cubic-bezier(…)`, a font name, a z-index number, a magic threshold —
  find the token that already means it and reference that. Search the source before inventing.
- **If none fits, create it at the source, then reference it.** Add the new primitive / semantic
  token (or scale step, or registry row) to the central source, *then* point the leaf at it. Never
  birth a one-off literal at the leaf "just this once" — that is exactly how a tokenized system rots
  back into scattered magic values, one innocent inline at a time.
- **Only the source files may hold raw values.** The token / primitive / registry definition files
  are where literals legitimately live — that is their job. *Everywhere else, a raw literal of a
  tokenized kind is a bug, even if it compiles and renders.*
- **Wire the gate, not just the rule.** A discipline a human or agent must *remember* is a discipline
  that erodes. When a project gains (or already has) a token layer, the same work adds or extends a
  CI gate that **fails the build** on a raw literal of a tokenized kind outside the source — so the
  rule bites automatically instead of relying on vigilance (the `check:ui-guardrails` raw-value gate
  is the design instance).

*Fail-state:* a page or component carries a raw color / px / shadow / duration / easing / font /
magic number where a token exists or should — or a new value was inlined at the leaf instead of
added to the token source and referenced from there.
