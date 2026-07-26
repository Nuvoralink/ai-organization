# Decision-ID Allocation Master Table

**Authoritative.** Every subskill writes decision entries to `auditability/decision-log.md` using IDs from its assigned range. Ranges do not overlap. When a subskill exhausts its range, it requests an extension via decision-log entry; the orchestrator allocates from the reserved overflow pool.

## Allocation table

### Phase 1 — Foundation

| Subskill | Range | Reserved overflow |
|---|---|---|
| `visualforge-discovery` | DEC-001 to DEC-020 | DEC-021 to DEC-024 |
| `visualforge-user-research` | DEC-025 to DEC-044 | DEC-045 to DEC-049 |
| `visualforge-competitive-audit` | DEC-050 to DEC-064 | DEC-065 to DEC-069 |
| `visualforge-design-trends-research` | DEC-070 to DEC-084 | DEC-085 to DEC-089 |

### Phase 2 — Visual language

| Subskill | Range | Reserved overflow |
|---|---|---|
| `visualforge-brand-identity` | DEC-090 to DEC-104 | DEC-105 to DEC-109 |
| `visualforge-design-tokens` | DEC-110 to DEC-159 | DEC-160 to DEC-169 |
| `visualforge-surface-treatments` | DEC-170 to DEC-199 | (none — bordered by iconography) |
| `visualforge-iconography` | DEC-200 to DEC-219 | DEC-220 to DEC-224 |

### Phase 3 — Structure

| Subskill | Range | Reserved overflow |
|---|---|---|
| `visualforge-information-architecture` | DEC-225 to DEC-249 | DEC-250 to DEC-254 |
| `visualforge-layout-system` | DEC-255 to DEC-274 | DEC-275 to DEC-279 |
| `visualforge-mobile-and-responsive` | DEC-280 to DEC-304 | DEC-305 to DEC-309 |
| `visualforge-i18n-rtl` | DEC-310 to DEC-334 | DEC-335 to DEC-339 |

### Phase 4 — Interaction and content

| Subskill | Range | Reserved overflow |
|---|---|---|
| `visualforge-ux-flows` | DEC-340 to DEC-399 | DEC-400 to DEC-409 |
| `visualforge-component-system` | DEC-410 to DEC-549 | DEC-550 to DEC-569 |
| `visualforge-content-design` | DEC-570 to DEC-594 | DEC-595 to DEC-599 |
| `visualforge-micro-interactions` | DEC-600 to DEC-634 | DEC-635 to DEC-639 |
| `visualforge-scroll-and-gesture` | DEC-640 to DEC-664 | DEC-665 to DEC-669 |
| `visualforge-imagery-illustration` | DEC-670 to DEC-694 | DEC-695 to DEC-699 |
| `visualforge-data-visualization` | DEC-700 to DEC-724 | DEC-725 to DEC-729 |
| `visualforge-auth-flows` | DEC-730 to DEC-759 | DEC-760 to DEC-764 |
| `visualforge-system-pages` | DEC-765 to DEC-784 | DEC-785 to DEC-789 |
| `visualforge-notifications-and-lifecycle` | DEC-790 to DEC-824 | DEC-825 to DEC-829 |

### Phase 5 — Quality and constraints

| Subskill | Range | Reserved overflow |
|---|---|---|
| `visualforge-accessibility` | DEC-830 to DEC-864 | DEC-865 to DEC-869 |
| `visualforge-motion-design` | DEC-870 to DEC-899 | DEC-900 to DEC-904 |

### Phase 6 — Implementation handoff

| Subskill | Range | Reserved overflow |
|---|---|---|
| `visualforge-frontend-contract` | DEC-905 to DEC-929 | DEC-930 to DEC-934 |
| `visualforge-design-ops` | DEC-935 to DEC-959 | DEC-960 to DEC-964 |
| `visualforge-figma-build` | DEC-965 to DEC-979 | DEC-980 to DEC-984 |
| `visualforge-design-qa` | DEC-985 to DEC-999 | (use Retrofit / Pressure-test ranges if more needed) |
| `visualforge-design-pressure-test` | DEC-1100 to DEC-1199 | DEC-1200 to DEC-1219 |
| `visualforge-agent-rules-update` | DEC-1220 to DEC-1239 | DEC-1240 to DEC-1244 |

### Retrofit-derived decisions

| Source | Range | Notes |
|---|---|---|
| Retrofit drift entries | DEC-9000 to DEC-9499 | One per drift item; `9000-series` makes retrofit origin obvious |
| Retrofit IA restructuring (accepted findings) | DEC-9500 to DEC-9799 | Splits, merges, missing pages, etc. |
| Retrofit data inventory backend gaps | DEC-9800 to DEC-9899 | One per BackendGap that became a design decision |
| Retrofit missing surfaces | DEC-9900 to DEC-9999 | One per MissingSurface that became a design decision |

### Pressure-test revision decisions

When pressure-test BLOCK findings drive design changes, the revision decisions use the *upstream subskill's* range (the subskill that owns the fix), incrementing the next available ID. The pressure-test report cites the new decision ID.

### Specforge interop

When Specforge has produced its own `auditability/decision-log.md` at `docs/app-plan/`, VisualForge's decisions are written to the **separate** log at `docs/design-system/auditability/decision-log.md` to avoid ID collisions with Specforge's range. Cross-references use full path notation: `app-plan/DEC-NNN` vs `design-system/DEC-NNN`.

## Allocation rules

1. **Never use an ID outside your subskill's range.** Even for related decisions — use your range and cross-reference.
2. **Never reuse an ID** even after a decision is superseded — mark the original `superseded` and create a new entry with the next free ID.
3. **Exhaustion protocol** — if a subskill exhausts its range, write a decision noting the need, then continue into the reserved overflow. If overflow is exhausted, escalate to the orchestrator; the orchestrator allocates from the next unused range with the user's confirmation.
4. **Reserved overflow is for that subskill only** — it does not belong to neighbors even though numerically adjacent.
5. **Master log entry order** — `auditability/decision-log.md` may sort by ID or by subskill phase; either is acceptable but the chosen order must be consistent within the file.

## When to extend the table

If VisualForge adds a new subskill, allocate a new range from unused space (e.g., DEC-1245+). Update this table. Never silently squeeze a new subskill into a neighbor's range.

## Verification

`scripts/validate_design_docs.py` parses `decision-log.md` and flags:
- Duplicate DEC-NNN entries.
- DEC-NNN entries outside the issuing subskill's range (must be detected from the entry's `Subskill` field).
- Entries with ID gaps that exceed the reserved overflow (a sign of allocation drift).
