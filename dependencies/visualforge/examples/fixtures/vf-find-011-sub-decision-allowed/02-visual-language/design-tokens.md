# Design tokens — fixture

This fixture probes the cross-tree-dupe check two ways:
1. **DEC-300 (parent)** here + **DEC-300.1 (sub-decision)** in layout-system.md — should NOT trigger cross-tree dupe (sub-decision exemption per VF-FIND-011).
2. **DEC-400** here + **DEC-400** in layout-system.md — IS a genuine dupe, SHOULD trigger cross-tree dupe FAIL. Proves `check_decision_log` is alive.

### DEC-300 — Token recipe parent
**Cross-cites consumed:** none.
**Confidence:** High.
**Reversal trigger:** none.

### DEC-400 — Decision deliberately duplicated
**Cross-cites consumed:** none.
**Confidence:** High.
**Reversal trigger:** none.
