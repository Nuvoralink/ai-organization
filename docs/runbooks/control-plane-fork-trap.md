# Control-plane fork trap — delivered-vs-canonical divergence

**Status:** live · **Last verified:** 2026-08-16

## The failure class

A managed file has two copies: the **canonical source** in this control-plane repo
(`core/**`, `global/**`, `skills/**`, `overlays/<project>/**`) and the **delivered copy** installed
into a project (`.claude/**`, `.ai-organization/**`, `scripts/**`, …). The project-side gates
(`gate:organization-overlay`, `gate:fleet-parity`) only compare a delivered file to **its own digest**
recorded in that project's `ownership.json`. So if someone:

1. edits a **delivered** copy (e.g. fixes a bug in `.ai-organization/runtime/core/coordination/coverage.mjs`), **and**
2. updates that file's digest in the project `ownership.json` to match the edit,

the project's own parity gate passes — but the delivered copy has now **diverged from canonical, invisibly**.
The next `project-overlay install` overwrites it with the (unfixed) canonical, **silently reverting the fix**.

This is what happened to `coverage.mjs`: #386 fixed the delivered copy + its digest but never the canonical
source; #393's routine re-delivery reverted it, red-gating `gate:coordination-wiring` on every branch.

## The reconcile-target hazard (how a fix gets discarded)

`project-overlay install` **refuses** when a delivered copy differs from canonical
(`Locally evolved managed target refused`). That refusal is the safety net. Overriding it with
`--reconcile-target <mapping>:<delivered-sha>` tells the tool *"I've reviewed this divergence, canonical
wins"* — which **discards the delivered edit**. That is correct only when the delivered copy is stale
drift. When the delivered copy is a **fix not yet backported to canonical**, reconcile-target reverts it.

**Rule:** before using `--reconcile-target` to accept canonical over a divergent delivered copy, diff the
two. If the delivered copy contains a change canonical lacks, **backport it to the canonical source first**,
then deliver. Never reconcile away a delivered change you have not accounted for in canonical.

## The alarm (detection)

`node scripts/control-check-notify.mjs` (wired to `overlay:check:*` for every project, plus the global
`control:check`) compares canonical against every delivered copy and reports drift, tagged by project. It
runs on the weekday `universal-weekday-control-plane-drift-alarm` automation (read-only, recommend-only)
and can be run by hand any time. A non-zero result names the exact `project` + `mapping` + relative path
that diverged.

Note it compares against the installed working tree, so a stale/dirty local checkout shows as drift too;
sync the project checkout (or reconcile) and re-run. A genuine committed fork stays flagged until the
delivered copy and canonical are reconciled.

## Reconciling a flagged divergence

1. Run the alarm; note the `project` + `mapping` + `relative` path.
2. Diff canonical vs the delivered copy.
3. Decide which is authoritative:
   - **delivered is the fix** → backport it into the canonical source, then `project-overlay install` to
     re-deliver identically. (Do NOT reconcile-target it away.)
   - **delivered is stale drift** → `project-overlay install --mapping <m> --reconcile-target <m>:<sha>`
     to restore canonical.
4. Re-run the alarm; confirm the project is clean.

*Fail-state:* a delivered copy carried a fix that never reached canonical, and a re-delivery reverted it.
