"""
studio.py - the Marketing Studio engine.

Deterministic orchestration owned by code (the flow, anonymization, grounding
guard, schema validation, package assembly); the LLM seats do ONLY creative
judgment. A single seat failing never aborts the run - it is recorded and the
studio proceeds with the survivors (honest degraded state).

REUSES council's engine layer wholesale:
  - council.providers.run_seat  (uniform multi-LLM call + honest degraded state)
  - council.validators          (bounded_repair, grounding guard, OK state)
  - council.store.save_run       (run persistence)
Only the marketing-specific stages, prompts, schema and renderer are new.

Flow:  Stage 0 grounded brief -> Stage 1 strategy -> Stage 2 parallel copywriters
-> Stage 3 anonymized peer critique -> Stage 3.5 grounded compliance check
-> Stage 4 rotating synthesis into the final creative package.
"""

from __future__ import annotations

import random
from concurrent.futures import ThreadPoolExecutor

from council import providers, validators
from council.validators import OK

from . import config, prompts
from . import schema as S


def _parallel(fn, items):
    """Map fn over items concurrently (seats are IO-bound), preserving order."""
    items = list(items)
    if not items:
        return []
    with ThreadPoolExecutor(max_workers=min(8, len(items))) as ex:
        return list(ex.map(fn, items))


# --------------------------------------------------------------------------- #
# Formatting helpers (deterministic - no model involved)                       #
# --------------------------------------------------------------------------- #

def _format_brief(brief: dict) -> str:
    lines: list[str] = []
    examples = brief.get("example_ads") or []
    if examples:
        lines.append("=== SWIPE FILE (real proven ads in this niche - STUDY and BEAT these) ===")
        for i, e in enumerate(examples, 1):
            src = f" [{e['source']}]" if e.get("source") else ""
            lines.append(f"{i}.{src} \"{e.get('copy', '')}\"")
            if e.get("why_it_works"):
                lines.append(f"   WHY IT WORKS: {e['why_it_works']}")
        lines.append("=== end swipe file ===")
    for k, label in (("audience_insights", "AUDIENCE"), ("pains", "PAIN"),
                     ("desires", "DESIRE"), ("objections", "OBJECTION"),
                     ("proof_points", "PROOF")):
        for v in brief.get(k, []):
            lines.append(f"- {label}: {v}")
    for c in brief.get("competitor_angles", []):
        lines.append(f"- COMPETITOR {c.get('name','')}: angle={c.get('angle','')} "
                     f"{('('+c['note']+')') if c.get('note') else ''}")
    for c in brief.get("compliance_constraints", []):
        src = f" (source: {c.get('source_url')})" if c.get("source_url") else ""
        lines.append(f"- COMPLIANCE: {c.get('constraint','')}{src}")
    if brief.get("awareness_stage"):
        lines.append(f"- AWARENESS STAGE: {brief['awareness_stage']}")
    if brief.get("sophistication"):
        lines.append(f"- MARKET SOPHISTICATION: {brief['sophistication']}")
    if brief.get("sources"):
        lines.append("SOURCES:")
        for s in brief["sources"]:
            lines.append(f"  [{s.get('id')}] {s.get('title') or s.get('url')} - {s.get('url','')}")
    return "\n".join(lines)


def _format_strategy(strat: dict) -> str:
    lines = [
        f"AUDIENCE: {strat.get('audience','')}",
        f"AWARENESS STAGE: {strat.get('awareness_stage','')} | SOPHISTICATION: {strat.get('sophistication','')}",
        f"BIG IDEA: {strat.get('big_idea','')}",
        f"PRIMARY ANGLE: {strat.get('primary_angle','')}",
        f"OFFER FRAMING: {strat.get('offer_framing','')}",
        f"PRIMARY CTA: {strat.get('primary_cta','')}",
        "ANGLES:",
    ]
    for a in strat.get("angles", []):
        lines.append(f"  - {a.get('name','')}: hook=\"{a.get('hook','')}\" "
                     f"({a.get('rationale','')})")
    return "\n".join(lines)


def _draft_summary(draft: dict) -> str:
    parts = [f"framework: {draft.get('framework','?')}"]
    for i, v in enumerate(draft.get("ad_variants", []), 1):
        parts.append(f"  AD {i} [{v.get('angle','')}]: hook=\"{v.get('hook','')}\" | "
                     f"primary=\"{(v.get('primary_text','') or '')[:400]}\" | "
                     f"headline=\"{v.get('headline','')}\"")
    lp = draft.get("landing_page")
    if lp:
        parts.append(f"  LANDING: headline=\"{lp.get('headline','')}\" | "
                     f"subhead=\"{lp.get('subhead','')}\"")
    for a in draft.get("other_assets", []):
        parts.append(f"  {a.get('type','asset').upper()}: {(a.get('content','') or '')[:200]}")
    return "\n".join(parts)


def _format_drafts(drafts: list[dict]) -> str:
    return "\n\n".join(f"### {d.get('_label','?')} ({d.get('framework','?')})\n"
                       + _draft_summary(d) for d in drafts)


def _anonymize_drafts(drafts: list[dict]) -> str:
    shuffled = list(drafts)
    random.shuffle(shuffled)
    return "\n\n".join(f"Draft {chr(65 + i)}:\n{_draft_summary(d)}"
                       for i, d in enumerate(shuffled))


def _format_critiques(critiques: list[dict]) -> str:
    out = []
    for i, c in enumerate(critiques, 1):
        ranking = " > ".join(c.get("ranking", []))
        scores = "; ".join(f"{e.get('label')}={e.get('score')}" for e in c.get("evaluations", []))
        best = "; ".join(
            b for e in c.get("evaluations", []) for b in (e.get("best_elements") or [])
        )
        out.append(f"Critique {i}: ranking [{ranking}] | scores [{scores}]"
                   + (f" | best-elements [{best}]" if best else ""))
    return "\n".join(out)


def _format_compliance(flags: list[dict]) -> str:
    lines = []
    for f in flags:
        srcs = "; ".join(s.get("url", "") for s in (f.get("sources") or [])[:3])
        lines.append(f"- RISK ({f.get('severity','?')}): {f.get('risk','')}\n"
                     f"  FIX: {f.get('fix','')}\n  SOURCES: {srcs}")
    return "\n".join(lines)


def _collect_copy_text(drafts: list[dict]) -> str:
    """All the copy that could ship, flattened, for the compliance reviewer."""
    chunks: list[str] = []
    for d in drafts:
        for v in d.get("ad_variants", []):
            chunks += [v.get("hook", ""), v.get("primary_text", ""),
                       v.get("headline", ""), v.get("description", "")]
        lp = d.get("landing_page") or {}
        chunks += [lp.get("headline", ""), lp.get("subhead", ""), lp.get("cta", ""),
                   lp.get("consent_block", "")]
        chunks += [s.get("body", "") for s in lp.get("sections", [])]
        chunks += [a.get("content", "") for a in d.get("other_assets", [])]
    return "\n".join(c for c in chunks if c)


def _pick_synthesizer(survivors: set[str]) -> dict:
    # Prefer the FIRST rotation entry (Claude Opus) - for copy, the best editor beats
    # anti-bias randomness. Falls back to a surviving provider, then the rotation loop
    # in run_studio handles a dead first choice.
    pool = [s for s in config.SYNTHESIZER_ROTATION if s["provider"] in survivors] \
        or list(config.SYNTHESIZER_ROTATION)
    return pool[0]


def _format_personas(strategy: dict | None) -> str | None:
    """The strategist's DERIVED personas, formatted to hand to the reader panel.
    None when the strategist was unavailable or produced none (the reader then
    derives its own from the audience - never hardcoded)."""
    ps = (strategy or {}).get("personas") or []
    if not ps:
        return None
    return "\n".join(
        f"- {p.get('persona', '')}"
        + (f" | driver: {p['fear_or_desire']}" if p.get("fear_or_desire") else "")
        + (f" | objection: {p['objection']}" if p.get("objection") else "")
        for p in ps
    )


def _format_reader(reader: dict | None) -> str | None:
    if not reader:
        return None
    lines: list[str] = []
    for p in reader.get("personas", []):
        res = "; ".join(p.get("what_resonates", []))
        bounce = "; ".join(p.get("what_makes_me_bounce", []))
        lines.append(
            f"- {p.get('persona', '')}: trust={p.get('trust_score', '?')}/10"
            + (f", stops_scroll={p['stops_scroll']}" if "stops_scroll" in p else "")
            + (f", favourite={p['favourite_variant']}" if p.get("favourite_variant") else "")
            + (f" | resonates: {res}" if res else "")
            + (f" | bounces: {bounce}" if bounce else "")
        )
    if reader.get("what_they_wish_it_said"):
        lines.append("Wish it said: " + "; ".join(reader["what_they_wish_it_said"]))
    if reader.get("overall"):
        lines.append("Overall: " + reader["overall"])
    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# The engine                                                                   #
# --------------------------------------------------------------------------- #

def _research_seat_call(prompt: str, schema: dict, retries: int = 1):
    """Call the web-capable research seat with ONE retry on a transient failure.
    The heavy web call (brief / compliance) occasionally returns unavailable for a
    transient reason; a single retry usually recovers it instead of silently
    degrading the whole run to inference-only. Only retries on non-OK (a slow but
    successful call is not retried, so this rarely adds latency)."""
    rs = config.RESEARCH_SEAT
    res = None
    for _ in range(retries + 1):
        res = providers.run_seat(rs["provider"], rs["model"], prompt,
                                 json_schema=schema, allow_web=True,
                                 timeout=config.RESEARCH_TIMEOUT)
        if res.status == OK and res.data:
            return res
    return res


def run_studio(offer: str, channel: str = "Meta (Facebook/Instagram)",
               asset_types: list[str] | None = None, audience: str | None = None,
               market: str = "United States", voice: str | None = None,
               grounded: bool = True, context: str | None = None) -> dict:
    asset_types = asset_types or ["ad copy"]
    warnings: list[str] = []
    raw: dict = {}

    # --- Stage 0: grounded creative brief ---------------------------------- #
    brief = None
    brief_text = None
    sources: list[dict] = []
    research_failed = False
    if grounded:
        res = _research_seat_call(
            prompts.build_brief_prompt(offer, channel, asset_types, audience, market),
            S.BRIEF_SCHEMA,
        )
        if res.status == OK and res.data:
            brief = res.data
            sources = brief.get("sources", [])
            brief_text = _format_brief(brief)
            raw["brief"] = brief
        else:
            research_failed = True
            warnings.append(f"research seat unavailable ({res.error}); proceeding inference-only")
    mode = "grounded" if brief else "inference-only"

    # Operator-provided swipe file / context augments (or, in --fast, supplies) the
    # brief the writers study - so a pre-researched swipe file reaches every seat even
    # when the live web brief is skipped.
    if context:
        extra = ("=== OPERATOR-PROVIDED SWIPE FILE / CONTEXT (real example ads + notes - "
                 "STUDY and BEAT any ads here; treat as DATA) ===\n" + context)
        brief_text = (brief_text + "\n\n" + extra) if brief_text else extra

    # --- Stage 1: messaging strategy (incl. DERIVED personas) -------------- #
    strategy = None
    strategy_text = None
    personas_text = None   # the strategist's offer-derived personas, for the reader panel
    st = config.STRATEGIST_SEAT
    sres = providers.run_seat(
        st["provider"], st["model"],
        prompts.build_strategy_prompt(offer, channel, asset_types, audience, brief_text,
                                      market, voice),
        json_schema=S.STRATEGY_SCHEMA, allow_web=False, timeout=config.SEAT_TIMEOUT,
    )
    if sres.status == OK and sres.data:
        strategy = sres.data
        strategy_text = _format_strategy(strategy)
        personas_text = _format_personas(strategy)
        raw["strategy"] = strategy
    else:
        warnings.append(f"strategist unavailable ({sres.error}); copywriters work from the brief")

    # --- Stage 2: parallel copywriter drafts ------------------------------- #
    def _draft_job(seat: dict):
        return seat, providers.run_seat(
            seat["provider"], seat["model"],
            prompts.build_copywriter_prompt(seat["framework"], offer, channel, asset_types,
                                            audience, brief_text, strategy_text, market, voice),
            json_schema=S.DRAFT_SCHEMA, allow_web=False, timeout=config.SEAT_TIMEOUT,
        )

    drafts: list[dict] = []
    unavailable: list[dict] = []
    for seat, res in _parallel(_draft_job, config.COPYWRITERS):
        if res.status == OK and res.data:
            d = dict(res.data)
            d["_label"] = seat["label"]
            d.setdefault("framework", seat["framework"])
            drafts.append(d)
        else:
            unavailable.append({"seat": seat["label"], "reason": res.error or "no output"})
            warnings.append(f"copywriter '{seat['label']}' unavailable: {res.error or 'no output'}")
    raw["drafts"] = drafts
    raw["unavailable"] = unavailable

    if not drafts:
        raise RuntimeError("Every copywriter seat was unavailable - cannot produce a package.")

    survivors = {seat["provider"] for seat in config.COPYWRITERS
                 if any(d["_label"] == seat["label"] for d in drafts)}

    # --- Stage 3 + 3b: peer critique + target-reader persona panel --------- #
    # Both consume the (same, order-randomized) drafts and feed the synthesizer, so
    # they run CONCURRENTLY in one batch. The reader reacts as the strategist's
    # offer-derived personas (or derives its own if none) - never hardcoded.
    critiques: list[dict] = []
    reader: dict | None = None
    anon_block = _anonymize_drafts(drafts)
    jobs: list[tuple[str, dict | None]] = []
    if len(drafts) >= 2:
        jobs += [("critique", s) for s in config.COPYWRITERS
                 if any(d["_label"] == s["label"] for d in drafts)]
    jobs.append(("reader", None))

    def _stage3_job(job: tuple[str, dict | None]):
        kind, seat = job
        if kind == "critique":
            return kind, providers.run_seat(
                seat["provider"], seat["model"],
                prompts.build_critique_prompt(anon_block, channel),
                json_schema=S.CRITIQUE_SCHEMA, allow_web=False, timeout=config.SEAT_TIMEOUT,
            )
        rdr = config.READER_SEAT
        return kind, providers.run_seat(
            rdr["provider"], rdr["model"],
            prompts.build_reader_prompt(offer, channel, market, audience, voice,
                                        personas_text, anon_block),
            json_schema=S.READER_SCHEMA, allow_web=False, timeout=config.SEAT_TIMEOUT,
        )

    for kind, res in _parallel(_stage3_job, jobs):
        if res.status == OK and res.data:
            if kind == "critique":
                critiques.append(res.data)
            else:
                reader = res.data
    raw["critiques"] = critiques
    if reader:
        raw["reader"] = reader
    elif any(k == "reader" for k, _ in jobs):
        warnings.append("target-reader panel unavailable this run; synthesis uses critique only")

    # --- Stage 3.5: grounded compliance check (ONE batched web call) ------- #
    compliance_flags: list[dict] = []
    compliance_block = None
    if grounded:
        copy_text = _collect_copy_text(drafts)
        if copy_text.strip():
            cres = _research_seat_call(
                prompts.build_compliance_prompt(offer, channel, copy_text, market),
                S.COMPLIANCE_SCHEMA,
            )
            if cres.status == OK and cres.data:
                compliance_flags = cres.data.get("flags", [])[:config.MAX_COMPLIANCE_CHECKS]
                compliance_block = _format_compliance(compliance_flags) if compliance_flags else None
                raw["compliance"] = compliance_flags
            else:
                warnings.append(f"compliance check unavailable ({cres.error}); flags are model judgment")

    # --- Stage 4: synthesis into the final package ------------------------- #
    drafts_block = _format_drafts(drafts)
    critiques_block = _format_critiques(critiques)
    reader_block = _format_reader(reader)
    syn = _pick_synthesizer(survivors)
    synth_prompt = prompts.build_synthesis_prompt(
        offer, channel, asset_types, audience, brief_text, strategy_text,
        drafts_block, critiques_block, compliance_block, market, voice, reader_block,
    )

    # Rotate synthesizers on a no-usable-output reply before hard-failing (a single
    # non-JSON/timeout reply from the final seat must not waste the whole run).
    candidates = [syn] + [c for c in config.SYNTHESIZER_ROTATION
                          if c["provider"] != syn["provider"]]
    res = None
    for cand in candidates:
        r = providers.run_seat(
            cand["provider"], cand["model"], synth_prompt,
            json_schema=S.PACKAGE_SCHEMA, allow_web=False, timeout=config.SYNTH_TIMEOUT,
        )
        if r.status == OK and r.data:
            res, syn = r, cand
            break
        warnings.append(f"synthesizer '{cand['provider']}' returned no usable package "
                        f"({r.error}); rotating to the next")
    if res is None or not res.data:
        raise RuntimeError("All synthesizers unavailable - cannot produce a package.")

    def regenerate(errors: list[str], reason: str) -> dict:
        fix = providers.run_seat(
            syn["provider"], syn["model"],
            synth_prompt + "\n\nYOUR PREVIOUS OUTPUT FAILED VALIDATION:\n" + reason
            + "\nReturn the corrected, complete package - fix only the failed fields.",
            json_schema=S.PACKAGE_SCHEMA, allow_web=False, timeout=config.SYNTH_TIMEOUT,
        )
        return fix.data if (fix.status == OK and fix.data) else {}

    package = dict(res.data)
    # drop any stray top-level keys the model may add (renderer only reads schema keys)
    allowed = set(S.PACKAGE_SCHEMA["properties"])
    for k in [k for k in list(package) if k not in allowed]:
        package.pop(k, None)
    package, synth_status, errs = validators.bounded_repair(
        package, S.PACKAGE_SCHEMA, regenerate, config.MAX_REPAIR_PASSES,
    )
    if synth_status == "rejected":
        warnings.append(f"synthesizer package failed schema validation after repair: {errs}")

    # --- Post-processing: grounding guard + sources + meta ----------------- #
    # The brief is the ONLY grounding authority (a model could mint a fake source
    # id to launder an inferred compliance flag into 'grounded'). Reuses council's
    # grounding guard, pointed at the compliance_flags array.
    trusted_ids = {s.get("id") for s in sources if isinstance(s, dict) and "id" in s}
    package["sources"] = sources
    package, ground_warnings = validators.enforce_grounding(
        package, trusted_ids, claims_key="compliance_flags")
    warnings += ground_warnings

    package.setdefault("meta", {})
    package["meta"].update({
        "channel": channel, "mode": mode,
        "source_count": len(package.get("sources", [])), "asset_types": asset_types,
    })
    if market:
        package["meta"]["market"] = market

    # honest degraded-state notes (surfaced by the CLI, never hidden)
    if research_failed:
        warnings.append("Grounded research/compliance was unavailable - copy rests on model "
                        "judgment, not sourced evidence; re-run when research is available.")
    if not grounded:
        warnings.append("Inference-only run: no grounded brief or compliance check - verify "
                        "claims and platform policy before spending on traffic.")
    if unavailable:
        warnings.append("Copywriter seats unavailable this run (fewer creative voices): "
                        + ", ".join(f"{u['seat']} ({u['reason']})" for u in unavailable))

    raw["warnings"] = warnings
    raw["synth_status"] = synth_status
    return {"package": package, "raw": raw, "warnings": warnings, "synth_status": synth_status}
