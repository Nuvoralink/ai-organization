"""
validators.py - deterministic guardrails for the Idea Council.

These are the anti-fabrication / anti-drift backstops, adapted from the Nuvo
Dialer gate setup. They NEVER compute meaning - the LLM seats own semantic
judgment. Deterministic code here only validates grounding, schema, and
provenance, and records honest degraded states. A guard may DOWNGRADE or FLAG a
claim; it must never fabricate one (authority-boundary doctrine).
"""

from __future__ import annotations

import re
from typing import Callable

import jsonschema

# --- seat run states (honest degraded states) ----------------------------- #
OK = "ok"
UNAVAILABLE = "unavailable"   # seat errored / timed out / returned nothing
REJECTED = "rejected"         # produced output that failed validation + repair

# --- claim provenance ----------------------------------------------------- #
GROUNDED = "grounded"
INFERRED = "inferred"


class ValidationResult:
    def __init__(self, ok: bool, errors: list[str] | None = None):
        self.ok = ok
        self.errors = errors or []


def validate_against(data: dict, schema: dict) -> ValidationResult:
    """Structural validation of one stage's output against its JSON Schema."""
    validator = jsonschema.Draft202012Validator(schema)
    errors = [
        f"{'/'.join(str(p) for p in e.path) or '<root>'}: {e.message}"
        for e in validator.iter_errors(data)
    ]
    return ValidationResult(not errors, errors)


def bounded_repair(
    data: dict,
    schema: dict,
    regenerate: Callable[[list[str], str], dict],
    max_passes: int = 1,
) -> tuple[dict, str, list[str]]:
    """Validate ``data``; on failure run up to ``max_passes`` bounded repairs.

    ``regenerate(errors, reason)`` returns a (possibly partial) dict that is
    MERGED over the previous payload - i.e. only the failed fields are asked for
    and merged into the previously-valid data. If it still fails after the
    passes, the status is ``rejected`` and the data is returned as-is. This
    never fabricates a value to force a pass - it reports the failure honestly.

    Returns ``(data, status, errors)`` where status is passed|repaired|rejected.
    """
    res = validate_against(data, schema)
    if res.ok:
        return data, "passed", []
    cur = data
    for _ in range(max_passes):
        patch = regenerate(res.errors, "Schema validation failed: " + "; ".join(res.errors))
        if isinstance(patch, dict):
            cur = {**cur, **patch}
        res = validate_against(cur, schema)
        if res.ok:
            return cur, "repaired", []
    return cur, "rejected", res.errors


def normalize_memo(memo: dict, schema: dict) -> tuple[dict, list[str]]:
    """Repair the common synthesizer slip of emitting nested fields at the root.

    Models sometimes flatten ``what_would_change`` to the top level; fold those
    back (preserving content), then drop any remaining top-level keys outside the
    schema. ``render_memo`` only reads schema keys, so nothing rendered is lost,
    and the memo validates instead of being marked 'rejected'.
    """
    warnings: list[str] = []
    wwc_keys = ("toward_pursue", "toward_kill", "cheapest_test")
    if any(k in memo for k in wwc_keys):
        wwc = dict(memo.get("what_would_change") or {})
        for k in wwc_keys:
            if k in memo:
                wwc.setdefault(k, memo.pop(k))
        memo["what_would_change"] = wwc
    allowed = set(schema.get("properties", {}))
    stray = [k for k in list(memo) if k not in allowed]
    for k in stray:
        memo.pop(k, None)
    if stray:
        warnings.append(f"normalized away stray top-level memo keys: {stray}")
    return memo, warnings


def enforce_grounding(memo: dict, valid_source_ids: set,
                      claims_key: str = "user_wants") -> tuple[dict, list[str]]:
    """The grounding-ID guard (ported from Nuvo's 'every claimed ID must resolve').

    ``valid_source_ids`` is the AUTHORITATIVE set of real source ids - the ids
    from the web-research brief, the only grounded provenance. It is deliberately
    NOT derived from ``memo['sources']``: that array is authored by the
    synthesizer LLM, and a model could mint a fake source to launder an inferred
    claim into 'grounded'. Every claim in ``memo[claims_key]`` tagged ``grounded``
    whose ids are not all in this set is DOWNGRADED to ``inferred`` and recorded in
    the warnings - never dropped, never left falsely grounded, never back-filled.
    In inference-only / --fast mode the set is empty, so every 'grounded' claim
    correctly downgrades.

    ``claims_key`` is the array of source-bearing claims to guard. It defaults to
    the council's ``user_wants``; the Marketing Studio reuses this same guard for
    its ``compliance_flags`` - both carry the {type: grounded|inferred, sources:[id]}
    shape, so one guard serves both (no parallel grounding logic).

    Returns ``(memo, warnings)``; ``memo`` is mutated in place.
    """
    warnings: list[str] = []
    valid_ids = set(valid_source_ids)
    for claim in memo.get(claims_key, []):
        if claim.get("type") != GROUNDED:
            continue
        ids = claim.get("sources") or []
        missing = [i for i in ids if i not in valid_ids]
        if not ids or missing:
            claim["type"] = INFERRED
            reason = "no source ids" if not ids else f"unresolved source ids {missing}"
            warnings.append(
                f"downgraded grounded->inferred ({reason}): {str(claim.get('claim', ''))[:70]}"
            )
    return memo, warnings


def check_sources(memo: dict) -> list[str]:
    """Source-list integrity: ids unique and present, every source has a URL."""
    problems: list[str] = []
    seen: set = set()
    for s in memo.get("sources", []):
        sid = s.get("id")
        if sid in seen:
            problems.append(f"duplicate source id {sid}")
        seen.add(sid)
        if not s.get("url"):
            problems.append(f"source {sid} has no url")
    return problems


# claims that assert an external fact was checked; honest non-checked states are kept as-is
_CHECKED_VERDICTS = {"verified", "partly_verified", "refuted", "uncertain"}


def _claim_tokens(text: str) -> set:
    return set(re.findall(r"[a-z0-9]+", (text or "").lower()))


def enforce_assumption_verdicts(
    memo: dict, verifications: list[dict],
) -> tuple[dict, list[str], list[str]]:
    """Deterministic guard (symmetric to ``enforce_grounding``): a load-bearing
    assumption may carry a checked verdict (verified / refuted / partly_verified /
    uncertain) ONLY if it matches an actual Stage-3.5b verification result - the
    SOLE authority. The synthesizer's self-reported verdict is never trusted: a
    matched assumption is overwritten with the real verification's verdict /
    finding / sources; an UNMATCHED 'checked' verdict is forced to ``unchecked``
    (finding/sources cleared). Honest ``judgment``/``unchecked`` states are left
    alone. Returns ``(memo, warnings, refuted_claims)``; ``memo`` mutated in place.
    """
    warnings: list[str] = []
    refuted: list[str] = []
    vindex = [(_claim_tokens(v.get("claim")), v) for v in (verifications or [])]

    for a in memo.get("load_bearing_assumptions", []):
        if a.get("verdict") not in _CHECKED_VERDICTS:
            continue  # 'judgment' / 'unchecked' are already honest
        atok = _claim_tokens(a.get("claim"))
        best, best_score = None, 0.0
        for vtok, v in vindex:
            if not atok or not vtok:
                continue
            score = len(atok & vtok) / len(atok | vtok)  # Jaccard overlap
            if score > best_score:
                best_score, best = score, v
        if best is not None and best_score >= 0.5:
            # bind to the real verification - authority overrides any self-report
            a["verdict"] = best.get("verdict", "uncertain")
            if best.get("finding"):
                a["finding"] = best["finding"]
            if best.get("sources"):
                a["sources"] = best["sources"]
            if a["verdict"] == "refuted":
                refuted.append(str(a.get("claim", "")))
        else:
            warnings.append(
                "assumption verdict forced to 'unchecked' (no verification backed it): "
                + str(a.get("claim", ""))[:70]
            )
            a["verdict"] = "unchecked"
            a.pop("finding", None)
            a.pop("sources", None)
    return memo, warnings, refuted
