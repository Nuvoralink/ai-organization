# MarketForge Test Suite

Per `_marketforge-shared/references/testing-strategy-protocol.md` — adapted from `testing-strategy-and-tdd` skill (Anthropic).

## Layers

```
tests/
├── unit/             — Unit tests for individual functions
├── boundary/         — Boundary-value tests at every threshold
├── mutation/         — Mutation tests verifying detection
├── integration/      — End-to-end validator runs
└── fixtures/         — Canonical good + canonical slop fixtures
```

## Running

```bash
# All tests
py -3 -m pytest tests/

# Specific layer
py -3 -m pytest tests/unit/
py -3 -m pytest tests/boundary/
py -3 -m pytest tests/mutation/
py -3 -m pytest tests/integration/

# With output
py -3 -m pytest tests/ -v

# Specific test
py -3 -m pytest tests/boundary/test_readiness_check.py::test_boundary

# With coverage (requires pytest-cov)
py -3 -m pytest tests/ --cov=scripts --cov-report=term-missing
```

## Test discipline

Per `testing-strategy-protocol.md`:

### Mutation testing
Every detection rule has a corresponding mutation test that would fail if the rule were removed.

### Paired-condition rule
Every "X is detected" test is paired with a "clean content is not falsely flagged" test.

### Boundary-value testing
Every numeric threshold (readiness 0-7, channel-score 7-35) has tests at boundary-1, boundary, boundary+1.

### Property-based testing
For generative behaviors (channel scoring), random inputs verify invariants always hold.

### Adapter messy-fixture coverage
Validator tested against:
- Empty files (no crash).
- Non-UTF-8 bytes (no crash; graceful handling).
- 10,000-line files (no crash).
- Unicode em-dashes / en-dashes (correctly handled).

## Verification evidence

After each test pass, record in `tests/VERIFICATION_EVIDENCE.md`:
- Test count + pass count.
- Mutation log (what mutations were applied, which tests caught them).
- Boundary table (every threshold + tests covering each side).
- Probe suite results (if any migrations were tested).

## Coverage targets

- `validate_marketing_docs.py`: 90%+ line coverage, all banned phrases + stale refs covered.
- `channel_scorer.py`: 100% coverage of classification function.
- `readiness_check.py`: 100% coverage of evaluate function (every band).
- `evidence_grader.py`: 90%+ coverage.

## Adding tests

When a new banned phrase / stale ref / boundary is added to a script:

1. Add a positive test in `tests/unit/` (validator catches it).
2. Add a paired-condition test (no false positive on clean content).
3. Add a mutation test in `tests/mutation/` (if the rule were removed, test would fail).
4. If a numeric threshold, add boundary tests at ±1.

## What's NOT tested yet (planned)

- `evidence_grader.py` — unit tests pending.
- Marketforge-self-test subskill — integration test pending.
- Full orchestrator dry-run — end-to-end test pending.
- Concurrent orchestrator invocations — concurrency test pending.

## Sources

- `_marketforge-shared/references/testing-strategy-protocol.md`
- Anthropic `testing-strategy-and-tdd` skill.
