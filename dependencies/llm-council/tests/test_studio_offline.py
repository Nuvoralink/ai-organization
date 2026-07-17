"""
Proves: the Marketing Studio's deterministic guardrails + contract hold with no LLM call -
  - SCHEMA: a complete creative package validates against PACKAGE_SCHEMA;
  - RENDER: the strategy, ad variants, landing page, compliance table, and sources all
    reach the rendered package;
  - GROUNDING: a compliance_flag tagged 'grounded' citing a source id the brief never
    produced is downgraded to 'inferred' (reusing council's guard via claims_key) -
    never left falsely grounded, never dropped;
  - REUSE: the studio roster spreads copywriters across distinct model families.
Test type: unit
Surface: studio/schema.py (contract + renderer), council/validators.enforce_grounding (claims_key), studio/config.py roster
Authority: studio/schema.py, council/validators.py
Run: `uv run python tests/test_studio_offline.py`  (also pytest-discoverable)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from council import validators  # noqa: E402
from studio import config, prompts  # noqa: E402
from studio.schema import PACKAGE_SCHEMA, render_package  # noqa: E402


def _full_package() -> dict:
    return {
        "offer": "qualified insurance leads",
        "meta": {"channel": "Meta", "market": "Canada", "mode": "grounded", "source_count": 1,
                 "asset_types": ["ad copy", "landing page"]},
        "strategy": {
            "audience": "working families 30-60", "awareness_stage": "problem_aware",
            "sophistication": "stage 3", "big_idea": "the bill lands on the people you love",
            "primary_angle": "final-expense pain", "offer_framing": "small policy, fixed price",
            "primary_cta": "Get my quote", "rationale": "lead with loss aversion",
        },
        "ad_variants": [
            {"angle": "final expense", "framework": "PAS", "hook": "Who pays the $9,000 funeral?",
             "primary_text": "Most families don't have it saved...", "headline": "Cover what you leave behind",
             "description": "See your options", "visual_direction": "warm family photo"},
            {"angle": "income replacement", "framework": "AIDA", "hook": "Your paycheck keeps them home.",
             "primary_text": "If it stopped tomorrow...", "headline": "Replace your income"},
        ],
        "landing_page": {
            "headline": "Find out what you qualify for", "subhead": "About 10 minutes",
            "sections": [{"heading": "The problem", "body": "..."}],
            "form_questions": ["Who is this for?", "What are you looking to cover?"],
            "cta": "Get my quote", "consent_block": "By checking this box, I agree a licensed agent may contact me...",
            "trust_elements": ["No medical exam for many"],
        },
        "other_assets": [{"type": "email_subject", "label": "Follow-up", "content": "Quick question"}],
        "compliance_flags": [
            {"risk": "guarantee language", "severity": "high", "fix": "remove 'guaranteed'",
             "type": "grounded", "sources": [1]},
            {"risk": "fabricated stat", "severity": "blocker", "fix": "cite a real source",
             "type": "grounded", "sources": [99]},
        ],
        "ab_test_plan": [{"element": "hook", "hypothesis": "pain beats aspiration", "how": "2 ad sets"}],
        "next_steps": ["attorney review of consent block", "launch one state"],
        "sources": [{"id": 1, "url": "http://policy"}],
    }


def test_package_schema_validates():
    # Mutation: a required field (e.g. strategy or ad_variants) is dropped -> this fails.
    res = validators.validate_against(_full_package(), PACKAGE_SCHEMA)
    assert res.ok, res.errors


def test_render_includes_all_sections():
    # Mutation: a render block (strategy / ad variants / landing / compliance) is removed -> fails.
    out = render_package(_full_package())
    assert "Creative Package" in out
    assert "Strategy" in out and "Big idea" in out
    assert "Ad variants" in out and "Primary text" in out
    assert "Landing page copy" in out and "Consent / disclosure block" in out
    assert "Compliance & policy flags" in out
    assert "Next steps" in out and "Sources" in out


def test_compliance_grounding_downgrades_fabricated_source():
    # Authority = the brief's ids ({1}); the flag citing source 99 must downgrade to inferred.
    # Mutation: enforce_grounding stops guarding compliance_flags -> the fake-sourced flag stays grounded.
    pkg, warns = validators.enforce_grounding(_full_package(), {1}, claims_key="compliance_flags")
    assert [f["type"] for f in pkg["compliance_flags"]] == ["grounded", "inferred"]
    assert warns, "a downgrade must be recorded, not silent"


def test_compliance_grounding_empty_authority_downgrades_all():
    # In --fast / inference-only mode there is NO trusted brief, so NOTHING is grounded.
    # Mutation: a grounded flag survives with no trusted sources -> this fails.
    pkg, _ = validators.enforce_grounding(_full_package(), set(), claims_key="compliance_flags")
    assert all(f["type"] == "inferred" for f in pkg["compliance_flags"])


def test_council_grounding_default_key_unaffected():
    # The generalization must NOT break the council's existing call (default claims_key).
    # Mutation: the default param changes -> council user_wants grounding breaks.
    memo = {"user_wants": [{"claim": "x", "type": "grounded", "sources": [99]}]}
    memo2, warns = validators.enforce_grounding(memo, {1})
    assert memo2["user_wants"][0]["type"] == "inferred" and warns


def test_playbook_knowledge_is_wired_into_prompts():
    # The distilled marketing-skill knowledge must actually REACH the seats (it is the
    # only mechanism - the seats can't load skills as tools). Mutation: a builder stops
    # injecting its playbook block -> the expert knowledge silently vanishes from the prompt.
    cw = prompts.build_copywriter_prompt("PAS", "x", "Meta", ["ad copy", "landing page"],
                                         None, None, None, "United States", None)
    assert "pattern-interrupt" in cw, "AD_COPY craft rules missing from copywriter prompt"
    assert "LANDING / CRO" in cw, "landing block must appear when a landing page is requested"
    cw_no_lp = prompts.build_copywriter_prompt("PAS", "x", "Meta", ["ad copy"],
                                               None, None, None, "United States", None)
    assert "LANDING / CRO" not in cw_no_lp, "landing block must be absent when not requested"
    comp = prompts.build_compliance_prompt("x", "Meta", "copy", "United States")
    assert "personal-attribute" in comp, "compliance checklist missing from compliance prompt"


def test_market_threads_into_prompts_and_drives_compliance_law():
    # Market must reach the copy AND switch which consent/privacy regime the compliance
    # seat researches. Mutation: market stops threading -> Canada copy + CASL check vanish.
    brief = prompts.build_brief_prompt("x", "Meta", ["ad copy"], None, "Canada")
    assert "Canada" in brief, "market must reach the brief prompt"
    comp = prompts.build_compliance_prompt("x", "Meta", "copy", "Canada")
    assert "Canada" in comp and "CASL" in comp, "compliance must research the market's own law"


def test_personas_are_derived_not_hardcoded():
    # The strategist must be ASKED to derive personas from THIS offer (adaptive), and the
    # reader must react as the orchestrator-supplied personas. Mutation: personas get
    # hardcoded or the reader ignores the supplied set -> these fail.
    strat = prompts.build_strategy_prompt("a pet-grooming app", "Meta", ["ad copy"],
                                          None, None, "United States", None)
    assert "DERIVE" in strat and "PERSONAS" in strat, "strategist must derive personas from the offer"
    supplied = "- Busy dog owner, 30s | objection: too expensive"
    rdr = prompts.build_reader_prompt("a pet-grooming app", "Meta", "United States", None,
                                      None, supplied, "Draft A: ...")
    assert "Busy dog owner" in rdr, "reader must react as the orchestrator-supplied personas"
    rdr_none = prompts.build_reader_prompt("x", "Meta", "United States", None, None, None, "Draft A")
    assert "INFER" in rdr_none, "with no personas supplied, the reader derives its own (not hardcoded)"


def test_reader_schema_and_strategy_personas_validate():
    # Mutation: the reader/persona contracts drift -> these fail.
    from studio.schema import READER_SCHEMA, STRATEGY_SCHEMA
    reader = {"personas": [{"persona": "tradesman, distrustful", "trust_score": 4,
                            "stops_scroll": True, "what_makes_me_bounce": ["smells like a sales trap"]}],
              "overall": "trust is the barrier"}
    assert validators.validate_against(reader, READER_SCHEMA).ok
    strat = {"big_idea": "x", "primary_angle": "y", "angles": [{"name": "a", "hook": "h"}],
             "primary_cta": "go", "personas": [{"persona": "p", "objection": "o"}]}
    assert validators.validate_against(strat, STRATEGY_SCHEMA).ok


def test_copywriters_are_premium_models_only():
    # Directive: BEST models write the copy, never the cheapest. Mutation: a cheap
    # DeepSeek seat creeps back into the copywriter pool, or the lead Opus seat is dropped.
    providers_used = [c["provider"] for c in config.COPYWRITERS]
    assert len(config.COPYWRITERS) >= 3, "need at least 3 copywriters"
    assert len(set(providers_used)) >= 3, "copywriters must span >=3 model families"
    assert "deepseek" not in providers_used, "no cheap DeepSeek seats may write copy"
    assert any(c["provider"] == "claude" and c["model"] == "opus" for c in config.COPYWRITERS), \
        "at least one copywriter must be Claude Opus (the strongest copy model)"
    # the high-leverage creative + editing roles also run on the best model
    assert config.STRATEGIST_SEAT["provider"] == "claude", "strategist should be Claude (Opus)"
    assert config.SYNTHESIZER_ROTATION[0] == {"provider": "claude", "model": "opus"}, \
        "the final editor must prefer Opus first"
    assert config.READER_SEAT.get("provider"), "the persona-panel reader seat must exist"


def test_swipe_file_research_is_wired():
    # Directive: copy must be researched from REAL proven ads and made better, not generic.
    # Mutation: the brief stops gathering a swipe file, or copywriters stop being told to
    # study + beat it / avoid generic copy -> output regresses to slop.
    from studio.schema import BRIEF_SCHEMA
    assert "example_ads" in BRIEF_SCHEMA["properties"], "brief must capture a swipe file of real ads"
    brief = prompts.build_brief_prompt("x", "Meta", ["ad copy"], None, "United States")
    assert "SWIPE FILE" in brief, "brief prompt must instruct gathering real example ads"
    cw = prompts.build_copywriter_prompt("PAS", "x", "Meta", ["ad copy"],
                                         None, None, None, "United States", None)
    assert "SWIPE FILE" in cw and "BETTER" in cw, "copywriter must be told to study + beat real ads"
    assert "GENERIC" in cw, "copywriter must be told not to write generic copy"


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"PASS  {fn.__name__}")
    print(f"\nALL {len(fns)} OFFLINE TESTS PASSED")
