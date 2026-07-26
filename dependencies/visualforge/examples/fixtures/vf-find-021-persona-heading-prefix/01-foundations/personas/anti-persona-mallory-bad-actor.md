# Anti-persona — Mallory

This fixture's persona file deliberately:
1. Uses parenthetical clarifications on Template-B headings (Identity, Context,
   Why she's the wrong fit, What we are intentionally not building, Anti-persona is binding).
   These should be ACCEPTED by VF-FIND-021's heading-prefix match.
2. Omits the `## Decision card` heading. This should trigger
   "missing required Template-B sections: ['## Decision card']" — proving
   `check_persona_files` is actually running.

## Identity (with clarifying parenthetical)
- **Name:** Mallory

## Context (her professional context)
- Hostile.

## Why she's the wrong fit (definition)
- We don't build for her.

## What we are intentionally not building (and Mallory would request)
- Stuff Mallory wants.

## Anti-persona is binding (always)
- Rejected.

(Note: `## Decision card` heading omitted on purpose — see file-level comment above.)

### DEC-210 — Anti-persona Mallory
**Cross-cites consumed:** none.
**Confidence:** High.
**Reversal trigger:** none.
