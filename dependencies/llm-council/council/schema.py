"""
schema.py - the single source of truth for the Idea Council's data contracts.

Every stage's structured output and the final decision memo are defined here as
JSON Schemas, so the SAME definition both (a) forces structured model output and
(b) validates it. ``render_memo`` is the ONLY place the output format lives, so
the format can never drift between generation and display.
"""

from __future__ import annotations

# --------------------------------------------------------------------------- #
# Shared enums (referenced by the schemas and the renderer)                    #
# --------------------------------------------------------------------------- #

VERDICTS = ["pursue", "pursue_with_changes", "park", "kill"]
SEVERITY = ["blocker", "high", "medium", "low"]
CLAIM_TYPES = ["grounded", "inferred"]  # 'grounded' must carry >= 1 source id

# --------------------------------------------------------------------------- #
# Stage 0 - grounded research / evidence brief                                 #
# --------------------------------------------------------------------------- #

RESEARCH_BRIEF_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "competitors": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "name": {"type": "string"},
                    "url": {"type": "string"},
                    "users_praise": {"type": "array", "items": {"type": "string"}},
                    "users_complain": {"type": "array", "items": {"type": "string"}},
                    "pricing": {"type": "string"},
                },
                "required": ["name", "users_praise", "users_complain"],
            },
        },
        "user_wants": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "want": {"type": "string"},
                    "evidence": {"type": "string"},
                    "source_url": {"type": "string"},
                },
                "required": ["want", "evidence"],
            },
        },
        "security_notes": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "issue": {"type": "string"},
                    "source_url": {"type": "string"},
                },
                "required": ["issue"],
            },
        },
        "market_signal": {"type": "string"},
        "sources": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "id": {"type": "integer"},
                    "title": {"type": "string"},
                    "url": {"type": "string"},
                },
                "required": ["id", "url"],
            },
        },
    },
    "required": ["competitors", "user_wants", "sources"],
}

# --------------------------------------------------------------------------- #
# Stage 1 - one council seat's independent analysis                            #
# --------------------------------------------------------------------------- #

SEAT_OPINION_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "role": {"type": "string"},
        "analysis": {"type": "string"},
        "key_points": {"type": "array", "items": {"type": "string"}},
        "risks": {"type": "array", "items": {"type": "string"}},
        "assumptions": {"type": "array", "items": {"type": "string"}},
        "recommendation": {"type": "string", "enum": VERDICTS},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
    },
    "required": ["role", "analysis", "key_points", "recommendation", "confidence"],
}

# --------------------------------------------------------------------------- #
# Stage 2 - anonymized peer critique of the other seats                        #
# --------------------------------------------------------------------------- #

PEER_CRITIQUE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "evaluations": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "label": {"type": "string"},
                    "strengths": {"type": "array", "items": {"type": "string"}},
                    "weaknesses": {"type": "array", "items": {"type": "string"}},
                    "rigor_score": {"type": "number", "minimum": 0, "maximum": 10},
                },
                "required": ["label", "rigor_score"],
            },
        },
        "ranking": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["evaluations", "ranking"],
}

# --------------------------------------------------------------------------- #
# Stage 3.5 - load-bearing assumption surfacing + independent verification     #
# --------------------------------------------------------------------------- #

ASSUMPTIONS_SCHEMA = {  # extraction: the claims the recommendation will rest on
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "load_bearing_assumptions": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "claim": {"type": "string"},
                    "why_it_matters": {"type": "string"},
                    "checkable": {"type": "boolean"},  # true = verifiable vs external sources
                },
                "required": ["claim", "checkable"],
            },
        },
    },
    "required": ["load_bearing_assumptions"],
}

ASSUMPTION_VERDICT_SCHEMA = {  # one independent verification result
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "claim": {"type": "string"},
        "verdict": {"type": "string",
                    "enum": ["verified", "partly_verified", "refuted", "uncertain"]},
        "finding": {"type": "string"},
        "sources": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {"title": {"type": "string"}, "url": {"type": "string"}},
                "required": ["url"],
            },
        },
    },
    "required": ["claim", "verdict", "finding"],
}

VERIFICATIONS_SCHEMA = {  # ALL assumptions verified in ONE web session (avoids concurrent overload)
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "verifications": {"type": "array", "items": ASSUMPTION_VERDICT_SCHEMA},
    },
    "required": ["verifications"],
}

# --------------------------------------------------------------------------- #
# Stage 3 - the final decision memo (the deliverable)                          #
# --------------------------------------------------------------------------- #

MEMO_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "idea": {"type": "string"},
        "meta": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "mode": {"type": "string"},      # grounded | inference-only
                "stakes": {"type": "string"},    # one-way door | two-way door
                "rigor": {"type": "string"},
                "source_count": {"type": "integer"},
            },
            "required": ["mode", "stakes", "rigor"],
        },
        "in_a_nutshell": {  # plain explainer so a non-expert understands the idea + its jargon
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "what_it_is": {"type": "string"},
                "jargon": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "term": {"type": "string"},
                            "plain": {"type": "string"},
                        },
                        "required": ["term", "plain"],
                    },
                },
            },
            "required": ["what_it_is"],
        },
        "bottom_line": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "verdict": {"type": "string", "enum": VERDICTS},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "summary": {"type": "string"},
            },
            "required": ["verdict", "confidence", "summary"],
        },
        "the_call": {  # plain-English consolidation - the part the reader acts on
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "verdict_plain": {"type": "string"},
                "why_plain": {"type": "string"},
                "do_next": {"type": "array", "items": {"type": "string"}},
                "walk_away_if": {"type": "string"},
            },
            "required": ["verdict_plain", "do_next"],
        },
        "opportunity_cost": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "solo_verdict": {"type": "string"},
                "scale_verdict": {"type": "string"},
                "vs_alternatives": {"type": "string"},
            },
            "required": ["vs_alternatives"],
        },
        "oc_emr": {
            # Tony Robbins' 6-step decision process (OC-EMR). This is the council's
            # explicit decision spine, owned by the synthesizer.
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "outcomes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "outcome": {"type": "string"},
                            "priority": {"type": "integer"},
                        },
                        "required": ["outcome"],
                    },
                },
                "outcomes_source": {"type": "string", "enum": ["stated", "inferred"]},
                "options": {  # >= 3 distinct paths, incl. a do-nothing / focus-elsewhere option
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"},
                        },
                        "required": ["name", "description"],
                    },
                },
                "consequences": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "option": {"type": "string"},
                            "upsides": {"type": "array", "items": {"type": "string"}},
                            "downsides": {"type": "array", "items": {"type": "string"}},
                        },
                        "required": ["option"],
                    },
                },
                "evaluate": {  # how LIKELY each major consequence actually is
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "option": {"type": "string"},
                            "consequence": {"type": "string"},
                            "likelihood": {"type": "string", "enum": ["high", "medium", "low"]},
                            "impact": {"type": "string", "enum": ["high", "medium", "low"]},
                        },
                        "required": ["option", "consequence", "likelihood"],
                    },
                },
                "mitigate": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "downside": {"type": "string"},
                            "mitigation": {"type": "string"},
                        },
                        "required": ["downside", "mitigation"],
                    },
                },
                "resolve": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "chosen_option": {"type": "string"},
                        "commitment": {"type": "string"},
                        "first_action": {"type": "string"},
                    },
                    "required": ["chosen_option", "first_action"],
                },
            },
            "required": [
                "outcomes", "options", "consequences", "evaluate", "mitigate", "resolve",
            ],
        },
        "user_wants": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "claim": {"type": "string"},
                    "type": {"type": "string", "enum": CLAIM_TYPES},
                    "sources": {"type": "array", "items": {"type": "integer"}},
                },
                "required": ["claim", "type"],
            },
        },
        "security_risks": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "risk": {"type": "string"},
                    "severity": {"type": "string", "enum": SEVERITY},
                    "fix": {"type": "string"},
                },
                "required": ["risk", "severity", "fix"],
            },
        },
        "other_blockers": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "blocker": {"type": "string"},
                    "severity": {"type": "string", "enum": SEVERITY},
                    "fix": {"type": "string"},
                },
                "required": ["blocker", "severity", "fix"],
            },
        },
        "pivots": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "change": {"type": "string"},
                    "rationale": {"type": "string"},
                },
                "required": ["change"],
            },
        },
        "action_plan": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "validate_now": {"type": "array", "items": {"type": "string"}},
                "decision_checkpoint": {"type": "string"},
                "if_proceed": {"type": "array", "items": {"type": "string"}},
                "do_not_yet": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["validate_now", "decision_checkpoint", "if_proceed"],
        },
        "scorecard": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "dimensions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "name": {"type": "string"},
                            "score": {"type": "number", "minimum": 0, "maximum": 10},
                            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                        },
                        "required": ["name", "score", "confidence"],
                    },
                },
                "weighted_total": {"type": "number"},
            },
            "required": ["dimensions", "weighted_total"],
        },
        "disagreement": {"type": "string"},
        "what_would_change": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "toward_pursue": {"type": "string"},
                "toward_kill": {"type": "string"},
                "cheapest_test": {"type": "string"},
            },
            "required": ["cheapest_test"],
        },
        "load_bearing_assumptions": {  # the claims the verdict rests on - verified, not guessed
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "claim": {"type": "string"},
                    "why_it_matters": {"type": "string"},
                    "verdict": {"type": "string", "enum": [
                        "verified", "partly_verified", "refuted", "uncertain",
                        "judgment", "unchecked"]},
                    "finding": {"type": "string"},
                    "sources": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {"title": {"type": "string"}, "url": {"type": "string"}},
                            "required": ["url"],
                        },
                    },
                },
                "required": ["claim", "verdict"],
            },
        },
        "evidence_gaps": {"type": "array", "items": {"type": "string"}},
        "seat_votes": {  # injected deterministically by the engine, not the synthesizer
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "distribution": {"type": "object", "additionalProperties": {"type": "integer"}},
                "mean_confidence": {"type": ["number", "null"]},
                "n": {"type": "integer"},
            },
        },
        "sources": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "id": {"type": "integer"},
                    "title": {"type": "string"},
                    "url": {"type": "string"},
                },
                "required": ["id", "url"],
            },
        },
    },
    "required": [
        "idea", "meta", "in_a_nutshell", "bottom_line", "the_call", "opportunity_cost", "user_wants",
        "security_risks", "other_blockers", "pivots", "action_plan",
        "scorecard", "what_would_change", "load_bearing_assumptions",
    ],
}

# --------------------------------------------------------------------------- #
# Renderer - the ONLY definition of the memo's on-screen format                #
# --------------------------------------------------------------------------- #

VERDICT_DISPLAY = {
    "pursue": "\U0001F7E2 Pursue",
    "pursue_with_changes": "\U0001F7E1 Pursue-with-changes",
    "park": "⏸️ Park",
    "kill": "\U0001F534 Kill",
}

SEV_DISPLAY = {
    "blocker": "\U0001F534 Blocker",
    "high": "\U0001F7E0 High",
    "medium": "\U0001F7E1 Medium",
    "low": "\U0001F7E2 Low",
}

ASSUMPTION_DISPLAY = {
    "verified": "✅ verified",
    "partly_verified": "\U0001F7E1 partly verified",
    "refuted": "\U0001F534 refuted",
    "uncertain": "❓ unverified",
    "judgment": "\U0001F9EA your judgment to test",
    "unchecked": "⚪ unchecked",
}


def _src_refs(ids) -> str:
    """Render a list of source ids as inline `[n]` references."""
    if not ids:
        return ""
    return " " + "".join(f"`[{i}]`" for i in ids)


def render_memo(m: dict) -> str:
    """Render a MEMO_SCHEMA-shaped dict to the approved markdown decision memo.

    Tolerant of missing optional fields so a partial memo still renders.
    """
    out: list[str] = []
    meta = m.get("meta", {})
    bl = m.get("bottom_line", {})

    out.append("## \U0001F3DB Idea Council - Decision Memo")
    out.append(f"**Idea:** *{(m.get('idea') or '').strip()}*")
    out.append(
        f"**Mode:** {meta.get('mode', '?')} "
        f"({meta.get('source_count', 0)} sources) · "
        f"**Stakes:** {meta.get('stakes', '?')} · "
        f"**Rigor:** {meta.get('rigor', '?')}"
    )
    out.append("")

    nut = m.get("in_a_nutshell", {})
    if nut.get("what_it_is"):
        out.append("### \U0001F4D6 What this idea actually is")
        out.append(nut["what_it_is"])
        out.append("")
        if nut.get("jargon"):
            out.append("**Key terms in plain English:**")
            out.extend(f"- **{j.get('term', '')}** — {j.get('plain', '')}" for j in nut["jargon"])
            out.append("")

    out.append("### ⚡ Bottom line")
    out.append(
        f"**VERDICT: {VERDICT_DISPLAY.get(bl.get('verdict'), '?')}** · "
        f"**Confidence {bl.get('confidence', '?')}**"
    )
    out.append("")
    out.append(bl.get("summary", ""))
    out.append("")

    call = m.get("the_call", {})
    if call:
        out.append("### \U0001F3AF In plain English - what to do")
        if call.get("verdict_plain"):
            out.append(f"**{call['verdict_plain']}**")
            out.append("")
        if call.get("why_plain"):
            out.append(call["why_plain"])
            out.append("")
        if call.get("do_next"):
            out.append("**Do this next:**")
            out.extend(f"{i}. {step}" for i, step in enumerate(call["do_next"], 1))
            out.append("")
        if call.get("walk_away_if"):
            out.append(f"**Walk away if:** {call['walk_away_if']}")
            out.append("")

    oc = m.get("opportunity_cost", {})
    out.append("### \U0001F3AF Is it worth it, realistically? (opportunity cost)")
    if oc.get("solo_verdict"):
        out.append(f"- **Solo / small effort:** {oc['solo_verdict']}")
    if oc.get("scale_verdict"):
        out.append(f"- **Venture scale:** {oc['scale_verdict']}")
    out.append(f"- **vs. focusing elsewhere:** {oc.get('vs_alternatives', '')}")
    out.append("")

    oce = m.get("oc_emr", {})
    if oce:
        out.append("### \U0001F9E0 Decision process - Tony Robbins OC-EMR")
        outs = oce.get("outcomes", [])
        if outs:
            tag = " (inferred)" if oce.get("outcomes_source") == "inferred" else ""
            out.append(f"**1. Outcomes{tag}** - what success must deliver, prioritized:")
            for o in sorted(outs, key=lambda x: x.get("priority", 99)):
                out.append(f"- {o.get('outcome', '')}")
        opts = oce.get("options", [])
        if opts:
            out.append("**2. Options** (>=3 - one option is no choice, two is a dilemma):")
            for o in opts:
                out.append(f"- **{o.get('name', '')}** - {o.get('description', '')}")
        cons = oce.get("consequences", [])
        if cons:
            out.append("**3. Consequences** per option:")
            for c in cons:
                ups = "; ".join(c.get("upsides", [])) or "-"
                downs = "; ".join(c.get("downsides", [])) or "-"
                out.append(f"- **{c.get('option', '')}** — ➕ {ups} ➖ {downs}")
        ev = oce.get("evaluate", [])
        if ev:
            out.append("**4. Evaluate** - how likely each key consequence really is:")
            for e in ev:
                impact = f", impact **{e['impact']}**" if e.get("impact") else ""
                out.append(
                    f"- **{e.get('option', '')}**: {e.get('consequence', '')} "
                    f"→ likelihood **{e.get('likelihood', '?')}**{impact}"
                )
        mit = oce.get("mitigate", [])
        if mit:
            out.append("**5. Mitigate** - shrink the real downsides:")
            for x in mit:
                out.append(f"- {x.get('downside', '')} → {x.get('mitigation', '')}")
        res = oce.get("resolve", {})
        if res:
            line = f"**6. Resolve: {res.get('chosen_option', '')}**"
            if res.get("commitment"):
                line += f" — {res['commitment']}"
            out.append(line)
            if res.get("first_action"):
                out.append(f"- First action: {res['first_action']}")
        out.append("")

    out.append("### \U0001F465 What users actually want")
    for u in m.get("user_wants", []):
        tag = "✅" if u.get("type") == "grounded" else "⚠️"
        out.append(f"- {tag} {u.get('claim', '')}{_src_refs(u.get('sources'))}")
    out.append("")

    if m.get("security_risks"):
        out.append("### \U0001F512 Security & compliance risks → fix")
        out.append("| Risk | Severity | Fix |")
        out.append("|---|---|---|")
        for s in m["security_risks"]:
            out.append(
                f"| {s.get('risk', '')} | {SEV_DISPLAY.get(s.get('severity'), '')} "
                f"| {s.get('fix', '')} |"
            )
        out.append("")

    if m.get("other_blockers"):
        out.append("### \U0001F6A7 Other blockers → how to clear them")
        for i, b in enumerate(m["other_blockers"], 1):
            out.append(
                f"{i}. **{b.get('blocker', '')}** "
                f"({SEV_DISPLAY.get(b.get('severity'), '')}) → {b.get('fix', '')}"
            )
        out.append("")

    if m.get("pivots"):
        out.append("### \U0001F527 What to do instead / how to change the idea")
        for i, p in enumerate(m["pivots"], 1):
            line = f"{i}. {p.get('change', '')}"
            if p.get("rationale"):
                line += f" — {p['rationale']}"
            out.append(line)
        out.append("")

    ap = m.get("action_plan", {})
    out.append("### ✅ Action plan - exactly what to do next")
    if ap.get("validate_now"):
        out.append("**Validate now:**")
        out.extend(f"- {x}" for x in ap["validate_now"])
    if ap.get("decision_checkpoint"):
        out.append(f"**Decision checkpoint:** {ap['decision_checkpoint']}")
    if ap.get("if_proceed"):
        out.append("**If proceeding:**")
        out.extend(f"- {x}" for x in ap["if_proceed"])
    if ap.get("do_not_yet"):
        out.append("**Don't build yet:**")
        out.extend(f"- {x}" for x in ap["do_not_yet"])
    out.append("")

    sc = m.get("scorecard", {})
    dims = sc.get("dimensions", [])
    if dims:
        out.append("### \U0001F4CA Scorecard")
        out.append(
            " · ".join(
                f"{d['name']} **{d['score']}** (conf {d['confidence']})" for d in dims
            )
        )
        out.append(f"→ **Weighted {sc.get('weighted_total', '?')}/10**")
        out.append("")

    sv = m.get("seat_votes")
    if sv and sv.get("distribution"):
        dist = " · ".join(
            f"{n}× {r.replace('_', '-')}" for r, n in sv["distribution"].items()
        )
        out.append("### \U0001F5F3️ Council vote (the seats' own verdicts)")
        out.append(
            f"{dist} · mean seat confidence {sv.get('mean_confidence')} (n={sv.get('n')}) "
            f"→ synthesizer: **{VERDICT_DISPLAY.get(bl.get('verdict'), '?')} "
            f"@ {bl.get('confidence')}**"
        )
        out.append("")

    if m.get("disagreement"):
        out.append("### \U0001F9ED Where the council disagreed")
        out.append(m["disagreement"])
        out.append("")

    wc = m.get("what_would_change", {})
    out.append("### \U0001F511 What would change the verdict")
    if wc.get("toward_pursue"):
        out.append(f"- → **Pursue:** {wc['toward_pursue']}")
    if wc.get("toward_kill"):
        out.append(f"- → **Kill:** {wc['toward_kill']}")
    out.append(f"**Cheapest next test:** {wc.get('cheapest_test', '')}")
    out.append("")

    lba = m.get("load_bearing_assumptions")
    if lba:
        any_checked = any(
            a.get("verdict") in ("verified", "partly_verified", "refuted", "uncertain")
            for a in lba
        )
        heading = ("Load-bearing assumptions - verified, not guessed" if any_checked
                   else "Load-bearing assumptions - to verify before you commit")
        out.append(f"### \U0001F52C {heading}")
        for a in lba:
            out.append(
                f"- **{ASSUMPTION_DISPLAY.get(a.get('verdict'), a.get('verdict', '?'))}** — "
                f"{a.get('claim', '')}"
            )
            if a.get("finding"):
                out.append(f"  - {a['finding']}")
            if a.get("sources"):
                links = " · ".join(
                    f"[{(s.get('title') or s.get('url'))[:40]}]({s.get('url')})"
                    for s in a["sources"][:4] if s.get("url")
                )
                if links:
                    out.append(f"  - {links}")
        out.append("")

    if m.get("evidence_gaps"):
        out.append("### ⚠️ Evidence gaps")
        out.extend(f"- {g}" for g in m["evidence_gaps"])
        out.append("")

    if m.get("sources"):
        out.append("### \U0001F4DA Sources")
        for s in m["sources"]:
            title = s.get("title") or s.get("url")
            out.append(f"[{s.get('id')}] {title} - {s.get('url', '')}")

    return "\n".join(out)
