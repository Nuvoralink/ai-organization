# Visualforge ↔ Specforge bridge

Specforge produces product specs. VisualForge consumes them to build the design system. This document defines the contract between them so cross-system references don't drift.

## DEC-ID allocation by skill

| Range / shape | Owner | Examples |
|---|---|---|
| `DEC-SCOPE-NNN` | Specforge product-scope | DEC-SCOPE-001 = canonical scope |
| `DEC-NONGOAL-NNN` | Specforge product-scope | DEC-NONGOAL-001 = explicit non-goals |
| `DEC-PERSONA-NNN` | Specforge user-research | DEC-PERSONA-001 = primary persona |
| `DEC-ANTI-PERSONA-NNN` | Specforge user-research | DEC-ANTI-PERSONA-001 = rejected user type |
| `DEC-SMS-NNN`, `DEC-STORAGE-NNN`, etc. | Specforge subskills | Topic-scoped product decisions |
| `DEC-NNN` (3-4 digit) | VisualForge | Design-system decisions per allocation table |
| `DEC-NNN.M` | VisualForge sub-decisions | DEC-228.1 sub-decision of DEC-228 |

**Rule:** Each shape belongs to its skill. Cross-references between skills must be **contextualized** so the consuming validator recognizes them.

## How to cross-reference

### From Specforge to VisualForge

Specforge artifacts forward-citing a design-system decision should annotate:

```markdown
See VisualForge `DEC-440` (Button primitive) for the visual contract.
```

Specforge reviewer treats VisualForge DEC-NNN cites as forward references; design-system decisions are downstream of product scope.

### From VisualForge to Specforge

Annotate with `(Specforge)` or `(Specforge — short context)`:

```markdown
**Cross-cites consumed:** DEC-001 (Specforge), DEC-009 (Specforge — CASL/PIPEDA).
```

The VisualForge validator's `check_strict_dec_shape` recognizes `DEC-CATEGORY-NNN` IDs as legitimate when the word "Specforge" or "app-plan" appears within 60 chars. Bare uppercase-suffix DECs without that context FAIL the strict shape check.

## Persona-DEC binding (lock)

Specforge **owns** persona identity. VisualForge **consumes** it. The mapping:

| Specforge file | Specforge DEC | VisualForge persona file | VisualForge DEC |
|---|---|---|---|
| `app-plan/users/persona-*.md` | `DEC-PERSONA-NNN` | `01-foundations/personas/persona-*.md` | `DEC-NNN` (per VF allocation) |
| `app-plan/users/anti-persona-*.md` | `DEC-ANTI-PERSONA-NNN` | `01-foundations/personas/anti-persona-*.md` | `DEC-NNN` |

VisualForge `check_persona_dec_consistency` (VF-FIND-015 + VF-FIND-017) enforces that VF cites of VF persona DECs name the correct persona. Specforge's analog enforcement is in `document-quality-acceptance-tests.md` § "Persona-DEC binding lock".

**Both skills must agree on persona names.** When Specforge renames a persona, VisualForge must update the corresponding persona file AND every persona-DEC cite. The bridge contract: persona file slugs are stable identifiers — rename = breaking change.

## Boundary value contract

Both skills require boundary-value tests for numeric thresholds. The handoff:

1. Specforge spec defines a threshold (e.g., "5-min reminder reauth window").
2. Specforge `document-quality-acceptance-tests.md` asserts boundary tests exist (4-min, 5-min, 6-min, 0-min).
3. VisualForge consumes the threshold and implements it (e.g., in auth-flows DEC-736).
4. VisualForge component / e2e tests probe the same boundaries.

If a Specforge threshold has no VisualForge implementation-side test, that's a handoff gap — flag in `WHATS-MISSING.md`.

## Workflow-SoT handoff (multi-consumer domain operations)

For domain operations with multiple entry points (the typical pair is an HTTP route + a browser-driven action, but the pattern covers scheduled jobs + APIs, CLIs + actions, webhooks + admin forms, etc.), the contract spans both skills:

1. **Specforge** spec names the shared workflow surface, enumerates its outcome contract, and splits critical (workflow) vs degraded (adapter) responsibilities. Enforced by Specforge `document-quality-acceptance-tests.md` § "Multi-consumer domain operations: server-workflow SoT".
2. **VisualForge** implementation registers the workflow in whatever SoT-tracking artifact the consuming project uses (content map / module register / architecture graph) and enforces it via that project's audit gate. Enforced by VisualForge `shared-contracts-and-blast-radius.md`.

Handoff gap: a Specforge workflow spec that does not result in an SoT-registry entry in the consuming project is a broken handoff — flag in `WHATS-MISSING.md` and in the VisualForge repo-audit.

The notification / degraded-side-effect split (notifications, observability emits, downstream events live in the ADAPTER, never inside the workflow) is BOTH skills' responsibility: Specforge specs the split per project context, VisualForge enforces it during implementation review by checking that the workflow surface contains no notification calls.

## Mutation log handoff

When VisualForge ships implementation (`src/components/**`), it produces `auditability/implementation-mutation-log.md`. This artifact also satisfies Specforge `document-quality-acceptance-tests.md` § "Implementation mutation-log handoff" — the same file serves both reviewers.

## Forbidden cross-references

- A Specforge spec referencing a VisualForge DEC that does not yet exist (forward-reference) must be annotated `(forward-ref Phase N)` or treated as a follow-up.
- A VisualForge artifact embedding a raw Specforge `DEC-CATEGORY-NNN` without the `(Specforge)` annotation FAILs the validator.
- Cross-references must use the DEC-ID, not paraphrased subject names ("the persona decision" is not a citation; `DEC-PERSONA-001 (Amara)` is).

## When this contract changes

A bridge change (renaming a persona, shifting allocation ranges) requires:
- Update this file in BOTH skills (kept byte-identical except for the title).
- Re-run validators on every consuming project.
- Add a release-note entry in both skills' CHANGELOG.
