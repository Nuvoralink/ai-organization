# Golden Fixture and Trust Testing Catalog Template

Use this to define proof for source-of-truth layers before relying on live AI runs, production data, or expensive external calls.

## Testing ladder

1. Static contract checks.
2. Local replay with fixed inputs.
3. Synthetic perturbation cases.
4. API/role tests.
5. Source-to-surface smoke.
6. Screenshot or geometry checks, if layout affects trust.
7. One real runtime/model run, only after local wiring is clean.

## Fixture catalog

| Fixture ID | Product truth being tested | Clean input | Corruptions | Expected decision | Downstream proof |
|---|---|---|---|---|---|

## Perturbation levels

Use levels that fit the app:

- clean;
- mildly noisy;
- stale source;
- missing source;
- contradictory source;
- wrong role or permission;
- malformed model output;
- unsafe generated output;
- missing proof;
- legacy fallback present;
- cached or local status conflict;
- external API unavailable.

## Source-to-surface assertions

For each high-trust claim, test that the same truth survives:

```text
source -> decision -> validation -> persistence -> API/DTO -> UI -> aggregate/export -> refresh/rerun
```

## Paid model/API spend rule

Do not spend real paid model/API calls until local contract and wiring tests are clean.

When a real run is needed:

- run one bundled proof;
- record provider/model/stage/tokens/cost/project/session/trace identity;
- inspect final user-visible output;
- decide whether another run is actually justified.
