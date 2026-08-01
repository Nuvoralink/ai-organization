# Automation memory reset — 2026-08-01

The prior propagation snapshot and its retired legacy checkout path were removed. The next scheduled read-only run must resolve the registered canonical checkout, derive propagation candidates from current repository blobs, and write one fresh, date-stamped snapshot rather than appending another status chronology.
