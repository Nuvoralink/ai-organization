"""
council.py - the 3-stage Idea Council engine.

Deterministic orchestration lives here: the flow, anonymization, grounding
checks, schema validation and memo assembly are all owned by code. The LLM seats
(via providers.run_seat) do ONLY semantic judgment. A single seat failing never
aborts the run - it is recorded 'unavailable' and the council proceeds with the
survivors (honest degraded state).
"""

from __future__ import annotations

import random
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

from . import config, prompts, providers, validators
from . import schema as S


def _parallel(fn, items):
    """Map fn over items concurrently (seats are IO-bound: subprocess + HTTP),
    preserving input order."""
    items = list(items)
    if not items:
        return []
    with ThreadPoolExecutor(max_workers=min(8, len(items))) as ex:
        return list(ex.map(fn, items))


# --------------------------------------------------------------------------- #
# Formatting helpers (deterministic - no model involved)                       #
# --------------------------------------------------------------------------- #

def _format_research_brief(brief: dict) -> str:
    lines: list[str] = []
    for c in brief.get("competitors", []):
        praise = "; ".join(c.get("users_praise", [])) or "-"
        complain = "; ".join(c.get("users_complain", [])) or "-"
        lines.append(f"- COMPETITOR {c.get('name','')} ({c.get('url','')}): praise=[{praise}] complaints=[{complain}]")
    for u in brief.get("user_wants", []):
        src = f" (source: {u.get('source_url')})" if u.get("source_url") else ""
        lines.append(f"- USER WANT: {u.get('want','')} - evidence: {u.get('evidence','')}{src}")
    for s in brief.get("security_notes", []):
        src = f" (source: {s.get('source_url')})" if s.get("source_url") else ""
        lines.append(f"- SECURITY: {s.get('issue','')}{src}")
    if brief.get("market_signal"):
        lines.append(f"- MARKET SIGNAL: {brief['market_signal']}")
    if brief.get("sources"):
        lines.append("SOURCES:")
        for s in brief["sources"]:
            lines.append(f"  [{s.get('id')}] {s.get('title') or s.get('url')} - {s.get('url','')}")
    return "\n".join(lines)


def _opinion_summary(op: dict) -> str:
    pts = "; ".join(op.get("key_points", []))
    risks = "; ".join(op.get("risks", []))
    body = f"{op.get('analysis','')}\nKey points: {pts}"
    if risks:
        body += f"\nRisks: {risks}"
    return body


def _format_opinions(opinions: list[dict]) -> str:
    blocks = []
    for op in opinions:
        blocks.append(
            f"### {op.get('_label','?')} - role: {op.get('_role_key','?')} "
            f"(verdict: {op.get('recommendation','?')}, confidence: {op.get('confidence','?')})\n"
            + _opinion_summary(op)
        )
    return "\n\n".join(blocks)


def _anonymize(opinions: list[dict]) -> tuple[str, dict]:
    """Relabel opinions as Response A/B/C... in RANDOM order so a critiquing seat
    cannot tell which is its own (anti self-preference / anti position bias)."""
    shuffled = list(opinions)
    random.shuffle(shuffled)
    block_parts = []
    label_map: dict[str, str] = {}
    for i, op in enumerate(shuffled):
        label = f"Response {chr(65 + i)}"
        label_map[label] = op.get("_role_key", "?")
        block_parts.append(f"{label}:\n{_opinion_summary(op)}")
    return "\n\n".join(block_parts), label_map


def _format_critiques(critiques: list[dict]) -> str:
    out = []
    for i, c in enumerate(critiques, 1):
        ranking = " > ".join(c.get("ranking", []))
        scores = "; ".join(
            f"{e.get('label')}={e.get('rigor_score')}" for e in c.get("evaluations", [])
        )
        out.append(f"Critique {i}: ranking [{ranking}] | rigor scores [{scores}]")
    return "\n".join(out)


def _format_verifications(verifications: list[dict]) -> str:
    lines = []
    for v in verifications:
        srcs = "; ".join(s.get("url", "") for s in (v.get("sources") or [])[:4])
        lines.append(
            f"- CLAIM: {v.get('claim', '')}\n"
            f"  VERDICT: {v.get('verdict', '')}\n"
            f"  FINDING: {v.get('finding', '')}\n"
            f"  SOURCES: {srcs}"
        )
    return "\n".join(lines)


def _pick_synthesizer(survivors: set[str]) -> dict:
    """Rotate the synthesizer (no fixed chairman). Prefer a provider that has a
    surviving seat, else any in the rotation."""
    pool = [s for s in config.SYNTHESIZER_ROTATION if s["provider"] in survivors] \
        or list(config.SYNTHESIZER_ROTATION)
    return random.choice(pool)


def _vote_summary(opinions: list[dict]) -> dict:
    """Deterministic tally of the seats' OWN verdicts + mean confidence - the
    grounded distribution the synthesizer's headline must reconcile with, and
    that the memo surfaces so a single collapsed verdict can't hide the spread."""
    recs = [o.get("recommendation") for o in opinions if o.get("recommendation")]
    confs = [o.get("confidence") for o in opinions if isinstance(o.get("confidence"), (int, float))]
    return {
        "distribution": dict(Counter(recs)),
        "mean_confidence": round(sum(confs) / len(confs), 2) if confs else None,
        "n": len(opinions),
    }


# --------------------------------------------------------------------------- #
# The engine                                                                   #
# --------------------------------------------------------------------------- #

def run_council(idea: str, outcome: str | None = None, stakes: str = "two-way",
                grounded: bool = True) -> dict:
    rigor = "heavy (one-way door)" if stakes == "one-way" else "standard (two-way door)"
    warnings: list[str] = []
    raw: dict = {}

    # --- Stage 0: grounded research ---------------------------------------- #
    brief = None
    brief_text = None
    sources: list[dict] = []
    research_failed = False
    if grounded:
        r = config.RESEARCH_SEAT
        res = providers.run_seat(
            r["provider"], r["model"], prompts.build_research_prompt(idea),
            json_schema=S.RESEARCH_BRIEF_SCHEMA, allow_web=True, timeout=config.RESEARCH_TIMEOUT,
        )
        if res.status == validators.OK and res.data:
            brief = res.data
            sources = brief.get("sources", [])
            brief_text = _format_research_brief(brief)
            raw["research"] = brief
        else:
            research_failed = True
            warnings.append(f"research seat unavailable ({res.error}); proceeding inference-only")
    mode = "grounded" if brief else "inference-only"

    # --- Stage 1: independent opinions (parallel) -------------------------- #
    def _opinion_job(seat: dict):
        return seat, providers.run_seat(
            seat["provider"], seat["model"],
            prompts.build_seat_prompt(seat["role_key"], idea, brief_text, outcome),
            json_schema=S.SEAT_OPINION_SCHEMA, allow_web=False, timeout=config.SEAT_TIMEOUT,
        )

    opinions: list[dict] = []
    unavailable: list[dict] = []
    for seat, res in _parallel(_opinion_job, config.COUNCIL):
        if res.status == validators.OK and res.data:
            op = dict(res.data)
            op["_role_key"] = seat["role_key"]
            op["_label"] = seat["label"]
            opinions.append(op)
        else:
            unavailable.append({"seat": seat["label"], "reason": res.error or "no output"})
            warnings.append(f"seat '{seat['label']}' unavailable: {res.error or 'no output'}")
    raw["opinions"] = opinions
    raw["unavailable"] = unavailable

    if not opinions:
        raise RuntimeError("Every council seat was unavailable - cannot produce a memo.")

    survivors = {op_seat["provider"] for op_seat in config.COUNCIL
                 if any(o["_label"] == op_seat["label"] for o in opinions)}

    # --- Stage 2: anonymized peer critique --------------------------------- #
    critiques: list[dict] = []
    if len(opinions) >= 2:
        anon_block, _label_map = _anonymize(opinions)
        surviving_seats = [s for s in config.COUNCIL
                           if any(o["_label"] == s["label"] for o in opinions)]

        def _critique_job(seat: dict):
            return providers.run_seat(
                seat["provider"], seat["model"], prompts.build_critique_prompt(anon_block),
                json_schema=S.PEER_CRITIQUE_SCHEMA, allow_web=False, timeout=config.SEAT_TIMEOUT,
            )

        for res in _parallel(_critique_job, surviving_seats):
            if res.status == validators.OK and res.data:
                critiques.append(res.data)
        raw["critiques"] = critiques

    # --- Stage 3: synthesis (rotating synthesizer) ------------------------- #
    votes = _vote_summary(opinions)
    vote_text = (", ".join(f"{n}x {r}" for r, n in votes["distribution"].items())
                 + f"; mean seat confidence {votes['mean_confidence']} across {votes['n']} seats")
    opinions_block = _format_opinions(opinions)
    critiques_block = _format_critiques(critiques)
    syn = _pick_synthesizer(survivors)

    # --- Stage 3.5a: surface the load-bearing assumptions the recommendation rests on ---- #
    assumptions: list[dict] = []
    extract = providers.run_seat(
        syn["provider"], syn["model"],
        prompts.build_assumption_extract_prompt(idea, opinions_block, critiques_block, brief_text),
        json_schema=S.ASSUMPTIONS_SCHEMA, allow_web=False, timeout=config.SEAT_TIMEOUT,
    )
    if extract.status == validators.OK and extract.data:
        assumptions = extract.data.get("load_bearing_assumptions", [])
    raw["assumptions"] = assumptions

    # --- Stage 3.5b: independently VERIFY the checkable assumptions (ONE grounded web call) - #
    # A single batched web session, NOT one per assumption - concurrent Claude web sessions
    # overwhelmed the subscription and orphaned processes.
    verifications: list[dict] = []
    to_check: list[dict] = []
    if grounded and assumptions:
        to_check = [a for a in assumptions
                    if a.get("checkable") and a.get("claim")][:config.MAX_ASSUMPTIONS]
        if to_check:
            rseat = config.RESEARCH_SEAT
            vres = providers.run_seat(
                rseat["provider"], rseat["model"],
                prompts.build_assumptions_verify_prompt(to_check, idea),
                json_schema=S.VERIFICATIONS_SCHEMA, allow_web=True, timeout=config.RESEARCH_TIMEOUT,
            )
            if vres.status == validators.OK and vres.data:
                verifications = vres.data.get("verifications", [])
            raw["verifications"] = verifications
            if not verifications:
                warnings.append("load-bearing assumption verification was unavailable this run")
    verifications_block = _format_verifications(verifications) if verifications else None

    # --- Stage 3.5c: final, assumption-aware synthesis ----------------------------------- #
    synth_prompt = prompts.build_synthesis_prompt(
        idea, opinions_block, critiques_block, brief_text, rigor, outcome, vote_text,
        verifications_block,
    )

    # Try the chosen synthesizer, then ROTATE to the other providers if it returns no
    # usable memo. A single non-JSON / timeout / empty reply from the LAST seat must not
    # throw away the whole (expensive) run - rotate before hard-failing.
    candidates = [syn] + [c for c in config.SYNTHESIZER_ROTATION
                          if c["provider"] != syn["provider"]]
    res = None
    for cand in candidates:
        r = providers.run_seat(
            cand["provider"], cand["model"], synth_prompt,
            json_schema=S.MEMO_SCHEMA, allow_web=False, timeout=config.SYNTH_TIMEOUT,
        )
        if r.status == validators.OK and r.data:
            res, syn = r, cand
            break
        warnings.append(f"synthesizer '{cand['provider']}' returned no usable memo "
                        f"({r.error}); rotating to the next")
    if res is None or not res.data:
        raise RuntimeError("All synthesizers unavailable - cannot produce a memo.")

    def regenerate(errors: list[str], reason: str) -> dict:
        fix = providers.run_seat(
            syn["provider"], syn["model"],
            synth_prompt + "\n\nYOUR PREVIOUS OUTPUT FAILED VALIDATION:\n" + reason
            + "\nReturn the corrected, complete memo - fix only the failed fields.",
            json_schema=S.MEMO_SCHEMA, allow_web=False, timeout=config.SYNTH_TIMEOUT,
        )
        return fix.data if (fix.status == validators.OK and fix.data) else {}

    normalized, norm_warnings = validators.normalize_memo(res.data, S.MEMO_SCHEMA)
    warnings += norm_warnings
    memo, synth_status, errs = validators.bounded_repair(
        normalized, S.MEMO_SCHEMA, regenerate, config.MAX_REPAIR_PASSES,
    )
    if synth_status == "rejected":
        warnings.append(f"synthesizer memo failed schema validation after repair: {errs}")

    # --- Post-processing: grounding + sources + meta + honest degraded state - #
    # The research brief is the ONLY grounding authority. Never trust the
    # synthesizer's own 'sources' array (a model could mint a fake source to
    # launder an inferred claim into 'grounded'). In --fast / inference-only mode
    # the trusted set is empty, so every grounded claim correctly downgrades.
    trusted_ids = {s.get("id") for s in sources if isinstance(s, dict) and "id" in s}
    memo["sources"] = sources  # show the real, grounded sources (empty in --fast)
    memo, ground_warnings = validators.enforce_grounding(memo, trusted_ids)
    warnings += ground_warnings
    warnings += [f"source issue: {p}" for p in validators.check_sources(memo)]
    # the verifications are the SOLE authority for assumption verdicts - never the
    # synthesizer's self-report (symmetric to the grounding guard above).
    memo, assumption_warnings, refuted_claims = validators.enforce_assumption_verdicts(
        memo, verifications)
    warnings += assumption_warnings

    memo.setdefault("meta", {})
    memo["meta"].update({
        "mode": mode, "stakes": stakes, "rigor": rigor,
        "source_count": len(memo.get("sources", [])),
    })
    memo["seat_votes"] = votes  # deterministic seat-vote distribution (anti-collapse signal)

    gaps = memo.get("evidence_gaps", [])
    if research_failed:
        gaps.append(
            "Grounded research pass was unavailable - 'what users want' and security facts are "
            "model inference, not sourced. Re-run when research is available."
        )
    if refuted_claims:
        gaps.append(
            "A load-bearing assumption was REFUTED by independent verification - the "
            "recommendation must account for: " + "; ".join(refuted_claims)
        )
    if not grounded:
        gaps.append(
            "Inference-only run: load-bearing assumptions are model judgment, NOT independently "
            "verified - re-run grounded to verify them."
        )
    elif to_check and not verifications:
        gaps.append(
            "Load-bearing assumptions could not be independently verified this run - treat them "
            "as unchecked."
        )
    if unavailable:
        gaps.append(
            "Council seats unavailable this run (verdict rests on fewer perspectives): "
            + ", ".join(f"{u['seat']} ({u['reason']})" for u in unavailable)
        )
    if gaps:
        memo["evidence_gaps"] = gaps

    raw["warnings"] = warnings
    raw["synth_status"] = synth_status
    return {"memo": memo, "raw": raw, "warnings": warnings, "synth_status": synth_status}
