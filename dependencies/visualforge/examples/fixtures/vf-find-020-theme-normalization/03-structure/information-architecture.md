# IA — fixture

Probes the disjoint-themes check (VF-FIND-020) two ways:

1. **DEC-300** cited with phrasing variations that the normalization should collapse —
   `(personas)`, `(persona binding)`, `(binding)`. These are generic-list markers + plural
   → singular. Should NOT warn.
2. **DEC-400** cited with genuinely disjoint themes — `(token recipe stuff)` and
   `(persona quote thing)`. No shared words. SHOULD warn. This proves
   `check_decision_id_singleton` is alive (catches sabotage of that function).

### DEC-300 — Sample decision
**Cross-cites consumed:** none.
**Confidence:** High.
**Reversal trigger:** none.

Used in DEC-300 (personas), DEC-300 (persona binding), and DEC-300 (binding). These are NOT disjoint themes — VF-FIND-020 normalization should pass.

### DEC-400 — Sample decision with truly disjoint cites
**Cross-cites consumed:** none.
**Confidence:** High.
**Reversal trigger:** none.

This DEC is cited with DEC-400 (token recipe stuff) and elsewhere as DEC-400 (persona quote thing) — disjoint themes. Should warn.
