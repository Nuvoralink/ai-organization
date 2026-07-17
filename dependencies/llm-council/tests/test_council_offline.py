"""
Proves: the council's deterministic guardrails hold without any LLM call -
  - GROUNDING: a 'grounded' claim citing a source id that does not exist is downgraded
    to 'inferred' (never passed through, never dropped, never fabricated);
  - SCHEMA: a complete memo (incl. the OC-EMR section) validates against MEMO_SCHEMA;
  - RENDER: the OC-EMR decision section reaches the rendered memo;
  - DEGRADED: a seat with no API key returns 'unavailable' and never raises;
  - EXTRACT: model replies wrapped in prose/fences still yield their JSON.
Test type: unit
Surface: council/validators.py grounding+schema guards, council/schema.py renderer, providers degraded state
Authority: council/validators.py, council/schema.py
Run: `uv run python tests/test_council_offline.py`  (also pytest-discoverable)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from council import config, providers, validators  # noqa: E402
from council.schema import MEMO_SCHEMA, render_memo  # noqa: E402


def _full_memo() -> dict:
    return {
        "idea": "x", "meta": {"mode": "grounded", "stakes": "two-way", "rigor": "std"},
        "in_a_nutshell": {"what_it_is": "a plain explanation", "jargon": [{"term": "X", "plain": "means x"}]},
        "bottom_line": {"verdict": "park", "confidence": 0.5, "summary": "s"},
        "the_call": {"verdict_plain": "do x", "why_plain": "because", "do_next": ["step 1", "step 2"],
                     "walk_away_if": "y"},
        "opportunity_cost": {"vs_alternatives": "a"},
        "oc_emr": {
            "outcomes": [{"outcome": "o", "priority": 1}],
            "options": [{"name": "n", "description": "d"}],
            "consequences": [{"option": "n", "upsides": ["u"], "downsides": ["d"]}],
            "evaluate": [{"option": "n", "consequence": "c", "likelihood": "low"}],
            "mitigate": [{"downside": "d", "mitigation": "m"}],
            "resolve": {"chosen_option": "n", "first_action": "f"},
        },
        "user_wants": [
            {"claim": "real", "type": "grounded", "sources": [1]},
            {"claim": "fake", "type": "grounded", "sources": [99]},
        ],
        "security_risks": [{"risk": "r", "severity": "high", "fix": "f"}],
        "other_blockers": [], "pivots": [{"change": "c"}],
        "action_plan": {"validate_now": ["v"], "decision_checkpoint": "c", "if_proceed": ["p"]},
        "scorecard": {"dimensions": [{"name": "d", "score": 5, "confidence": 0.5}], "weighted_total": 5},
        "what_would_change": {"cheapest_test": "t"},
        "load_bearing_assumptions": [
            {"claim": "we can read the data via API", "verdict": "verified",
             "finding": "yes, OAuth REST API exists", "sources": [{"url": "http://x"}]},
            {"claim": "customers will pay AED 200/mo", "verdict": "judgment"},
        ],
        "sources": [{"id": 1, "url": "http://x"}],
    }


def test_extract_json_tolerates_prose_and_fences():
    # Mutation that breaks this: _extract_json stops stripping fences / scanning braces.
    assert providers._extract_json('pre ```json\n{"a":1}\n``` post') == {"a": 1}
    assert providers._extract_json('codex preamble... {"x": {"y": 2}} trailing') == {"x": {"y": 2}}
    assert providers._extract_json("no json here") is None


def test_memo_schema_validates():
    # Mutation: a required memo field (e.g. oc_emr) is dropped -> this fails.
    res = validators.validate_against(_full_memo(), MEMO_SCHEMA)
    assert res.ok, res.errors


def test_grounding_downgrades_fabricated_source():
    # Authority = the research brief's ids ({1}); the claim citing source 99 must downgrade.
    # Mutation: enforce_grounding stops checking source ids -> the fake claim stays 'grounded'.
    memo, warns = validators.enforce_grounding(_full_memo(), {1})
    assert [c["type"] for c in memo["user_wants"]] == ["grounded", "inferred"]
    assert warns, "a downgrade must be recorded, not silent"


def test_grounding_empty_authority_downgrades_all():
    # In inference-only / --fast mode there is NO trusted research, so NOTHING is grounded.
    # Mutation: a grounded claim survives with no trusted sources -> this fails.
    memo, warns = validators.enforce_grounding(_full_memo(), set())
    assert all(c["type"] == "inferred" for c in memo["user_wants"])


def test_grounding_rejects_synthesizer_minted_source():
    # The headline anti-fabrication guarantee: a model that puts a fake id in BOTH
    # memo.sources AND a grounded claim must NOT pass - authority is the brief, not the memo.
    memo = _full_memo()
    memo["sources"] = [{"id": 1, "url": "http://x"}, {"id": 99, "url": "http://fake-minted"}]
    memo, _ = validators.enforce_grounding(memo, {1})  # brief only knows source 1
    assert [c["type"] for c in memo["user_wants"]] == ["grounded", "inferred"]


def test_render_includes_oc_emr_and_key_sections():
    # Mutation: the OC-EMR render block is removed -> this fails.
    out = render_memo(_full_memo())
    assert "Decision process - Tony Robbins OC-EMR" in out
    assert "Bottom line" in out and "What would change the verdict" in out
    assert "In plain English" in out  # the plain-language decision block must render
    assert "What this idea actually is" in out  # the plain explainer must render
    assert "Load-bearing assumptions" in out  # surfaced assumptions must render
    assert "verified" in out  # an assumption verdict must render


def test_assumption_verdict_schema_validates():
    # Proves the verification-result contract holds.
    # Mutation: a verification missing its verdict/finding slips through -> this fails.
    from council.schema import ASSUMPTION_VERDICT_SCHEMA
    good = {"claim": "x", "verdict": "refuted", "finding": "no API exists",
            "sources": [{"url": "http://s"}]}
    assert validators.validate_against(good, ASSUMPTION_VERDICT_SCHEMA).ok
    bad = {"claim": "x", "verdict": "maybe"}  # invalid enum + missing finding
    assert not validators.validate_against(bad, ASSUMPTION_VERDICT_SCHEMA).ok


def test_unbacked_assumption_verdict_is_downgraded():
    # The headline guarantee: a 'verified' badge with NO matching verification is downgraded.
    # Mutation: enforce_assumption_verdicts stops guarding -> a fabricated 'verified' survives.
    memo = _full_memo()
    memo["load_bearing_assumptions"] = [
        {"claim": "the moon is made of cheese", "verdict": "verified",
         "finding": "definitely checked", "sources": [{"url": "http://fake"}]},
    ]
    memo2, warns, refuted = validators.enforce_assumption_verdicts(memo, verifications=[])
    a = memo2["load_bearing_assumptions"][0]
    assert a["verdict"] == "unchecked" and "finding" not in a and warns


def test_assumption_verdict_bound_to_real_verification():
    # A matched verification is authoritative and overrides the synthesizer's self-report.
    # Mutation: the guard trusts the memo's verdict -> a refuted assumption shows 'verified'.
    memo = _full_memo()
    memo["load_bearing_assumptions"] = [
        {"claim": "we can connect directly to the company bank account", "verdict": "verified",
         "finding": "synth said fine"},
    ]
    verifs = [{"claim": "we can connect directly to the company bank account",
               "verdict": "refuted", "finding": "banks are gated in UAE",
               "sources": [{"url": "http://cbuae"}]}]
    memo2, warns, refuted = validators.enforce_assumption_verdicts(memo, verifs)
    a = memo2["load_bearing_assumptions"][0]
    assert a["verdict"] == "refuted" and refuted


def test_keyless_seat_is_unavailable_not_raised():
    # Mutation: a missing key raises instead of degrading -> this fails.
    os.environ.pop("DEEPSEEK_API_KEY", None)
    r = providers.run_seat("deepseek", "deepseek-reasoner", "hi", json_schema={"type": "object"})
    assert r.status == validators.UNAVAILABLE and "DEEPSEEK_API_KEY" in (r.error or "")


def test_roster_is_five_seats_min_four_families():
    # Mutation: the roster shrinks below 5 seats or collapses onto <4 model families.
    providers_used = [s["provider"] for s in config.COUNCIL]
    assert len(config.COUNCIL) == 5
    assert len(set(providers_used)) >= 4  # >=4 distinct families for decorrelation


def test_normalize_memo_folds_flattened_and_drops_stray():
    # Synthesizers sometimes flatten what_would_change to root + add stray keys.
    # Mutation: normalize_memo stops folding/dropping -> the memo stays schema-invalid.
    m = _full_memo()
    m.pop("what_would_change", None)
    m["toward_pursue"] = "tp"
    m["cheapest_test"] = "ct"
    m["bogus_key"] = 1
    m2, warns = validators.normalize_memo(m, MEMO_SCHEMA)
    assert m2["what_would_change"]["cheapest_test"] == "ct"
    assert m2["what_would_change"]["toward_pursue"] == "tp"
    assert "bogus_key" not in m2
    assert validators.validate_against(m2, MEMO_SCHEMA).ok, "normalized memo must validate"


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"PASS  {fn.__name__}")
    print(f"\nALL {len(fns)} OFFLINE TESTS PASSED")
