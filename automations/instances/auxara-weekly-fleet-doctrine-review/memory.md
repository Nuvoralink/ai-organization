# Automation memory reset — 2026-08-01

The prior doctrine-review snapshot was retired after the canonical control-plane checkout moved and its recorded live-state findings became stale. Do not carry those findings forward. The next scheduled read-only run must resolve the registered canonical checkout, then re-query the current repositories, formal reviews, and gates before writing one fresh, date-stamped snapshot.
