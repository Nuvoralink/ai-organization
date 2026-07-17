"""
schema.py - the single source of truth for the Marketing Studio's data contracts.

Every stage's structured output and the final creative package are defined here as
JSON Schemas, so the SAME definition both forces structured model output and
validates it. ``render_package`` is the ONLY place the on-screen format lives, so
generation and display can never drift.

Mirrors council/schema.py in spirit; the deliverable is a usable creative package,
not a decision memo.
"""

from __future__ import annotations

# --------------------------------------------------------------------------- #
# Shared enums                                                                 #
# --------------------------------------------------------------------------- #

SEVERITY = ["blocker", "high", "medium", "low"]
CLAIM_TYPES = ["grounded", "inferred"]   # 'grounded' compliance flags carry a source
AWARENESS = ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"]

# --------------------------------------------------------------------------- #
# Stage 0 - grounded creative brief                                            #
# --------------------------------------------------------------------------- #

BRIEF_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "audience_insights": {"type": "array", "items": {"type": "string"}},
        "pains": {"type": "array", "items": {"type": "string"}},
        "desires": {"type": "array", "items": {"type": "string"}},
        "objections": {"type": "array", "items": {"type": "string"}},
        "competitor_angles": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "name": {"type": "string"},
                    "angle": {"type": "string"},
                    "note": {"type": "string"},
                },
                "required": ["angle"],
            },
        },
        "proof_points": {"type": "array", "items": {"type": "string"}},
        "example_ads": {  # the SWIPE FILE - real, proven ads in this exact niche to study + beat
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "source": {"type": "string"},       # platform / who ran it
                    "copy": {"type": "string"},          # the actual ad text / hook / headline
                    "why_it_works": {"type": "string"},  # the specific mechanic that makes it land
                    "source_url": {"type": "string"},
                },
                "required": ["copy", "why_it_works"],
            },
        },
        "compliance_constraints": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "constraint": {"type": "string"},
                    "source_url": {"type": "string"},
                },
                "required": ["constraint"],
            },
        },
        "awareness_stage": {"type": "string", "enum": AWARENESS},
        "sophistication": {"type": "string"},
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
    "required": ["pains", "desires", "sources"],
}

# --------------------------------------------------------------------------- #
# Stage 1 - messaging strategy                                                  #
# --------------------------------------------------------------------------- #

STRATEGY_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "audience": {"type": "string"},
        "awareness_stage": {"type": "string", "enum": AWARENESS},
        "sophistication": {"type": "string"},
        "big_idea": {"type": "string"},
        "primary_angle": {"type": "string"},
        "angles": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "name": {"type": "string"},
                    "hook": {"type": "string"},
                    "rationale": {"type": "string"},
                },
                "required": ["name", "hook"],
            },
        },
        "offer_framing": {"type": "string"},
        "primary_cta": {"type": "string"},
        "personas": {  # DERIVED from this offer's audience - adapts to any product, never hardcoded
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "persona": {"type": "string"},        # one-line who-they-are
                    "fear_or_desire": {"type": "string"},  # dominant emotional driver
                    "objection": {"type": "string"},       # biggest reason they'd hesitate
                },
                "required": ["persona"],
            },
        },
    },
    "required": ["big_idea", "primary_angle", "angles", "primary_cta"],
}

# --------------------------------------------------------------------------- #
# Reusable asset shapes (shared by a copywriter draft and the final package)    #
# --------------------------------------------------------------------------- #

_AD_VARIANT = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "angle": {"type": "string"},
        "framework": {"type": "string"},
        "hook": {"type": "string"},
        "primary_text": {"type": "string"},
        "headline": {"type": "string"},
        "description": {"type": "string"},
        "visual_direction": {"type": "string"},
    },
    "required": ["primary_text", "headline"],
}

_LANDING_PAGE = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "headline": {"type": "string"},
        "subhead": {"type": "string"},
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "heading": {"type": "string"},
                    "body": {"type": "string"},
                },
                "required": ["body"],
            },
        },
        "form_questions": {"type": "array", "items": {"type": "string"}},
        "cta": {"type": "string"},
        "consent_block": {"type": "string"},
        "trust_elements": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["headline"],
}

_OTHER_ASSET = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "type": {"type": "string"},       # email_subject | email_body | sms | etc.
        "label": {"type": "string"},
        "content": {"type": "string"},
    },
    "required": ["type", "content"],
}

# --------------------------------------------------------------------------- #
# Stage 2 - one copywriter's draft                                             #
# --------------------------------------------------------------------------- #

DRAFT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "framework": {"type": "string"},
        "ad_variants": {"type": "array", "items": _AD_VARIANT},
        "landing_page": _LANDING_PAGE,
        "other_assets": {"type": "array", "items": _OTHER_ASSET},
        "notes": {"type": "string"},
    },
    "required": ["ad_variants"],
}

# --------------------------------------------------------------------------- #
# Stage 3 - anonymized peer critique of the drafts                             #
# --------------------------------------------------------------------------- #

CRITIQUE_SCHEMA = {
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
                    "score": {"type": "number", "minimum": 0, "maximum": 10},
                    "best_elements": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["label", "score"],
            },
        },
        "ranking": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["evaluations", "ranking"],
}

# --------------------------------------------------------------------------- #
# Stage 3b - target-reader persona panel reaction                              #
# --------------------------------------------------------------------------- #

READER_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "personas": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "persona": {"type": "string"},     # who they are, in one line
                    "stops_scroll": {"type": "boolean"},
                    "trust_score": {"type": "number", "minimum": 0, "maximum": 10},
                    "what_resonates": {"type": "array", "items": {"type": "string"}},
                    "what_makes_me_bounce": {"type": "array", "items": {"type": "string"}},
                    "favourite_variant": {"type": "string"},
                },
                "required": ["persona", "trust_score"],
            },
        },
        "what_they_wish_it_said": {"type": "array", "items": {"type": "string"}},
        "overall": {"type": "string"},
    },
    "required": ["personas"],
}

# --------------------------------------------------------------------------- #
# Stage 3.5 - grounded compliance / policy check                               #
# --------------------------------------------------------------------------- #

COMPLIANCE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "flags": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "risk": {"type": "string"},
                    "severity": {"type": "string", "enum": SEVERITY},
                    "fix": {"type": "string"},
                    "sources": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "title": {"type": "string"},
                                "url": {"type": "string"},
                            },
                            "required": ["url"],
                        },
                    },
                },
                "required": ["risk", "severity", "fix"],
            },
        },
    },
    "required": ["flags"],
}

# --------------------------------------------------------------------------- #
# Stage 4 - the final creative package (the deliverable)                        #
# --------------------------------------------------------------------------- #

PACKAGE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "offer": {"type": "string"},
        "meta": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "channel": {"type": "string"},
                "market": {"type": "string"},
                "mode": {"type": "string"},
                "source_count": {"type": "integer"},
                "asset_types": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["channel", "mode"],
        },
        "strategy": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "audience": {"type": "string"},
                "awareness_stage": {"type": "string"},
                "sophistication": {"type": "string"},
                "big_idea": {"type": "string"},
                "primary_angle": {"type": "string"},
                "offer_framing": {"type": "string"},
                "primary_cta": {"type": "string"},
                "rationale": {"type": "string"},
            },
            "required": ["big_idea", "primary_angle"],
        },
        "ad_variants": {"type": "array", "items": _AD_VARIANT},
        "landing_page": _LANDING_PAGE,
        "other_assets": {"type": "array", "items": _OTHER_ASSET},
        "compliance_flags": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "risk": {"type": "string"},
                    "severity": {"type": "string", "enum": SEVERITY},
                    "fix": {"type": "string"},
                    "type": {"type": "string", "enum": CLAIM_TYPES},
                    "sources": {"type": "array", "items": {"type": "integer"}},
                },
                "required": ["risk", "severity", "fix"],
            },
        },
        "ab_test_plan": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "element": {"type": "string"},
                    "hypothesis": {"type": "string"},
                    "how": {"type": "string"},
                },
                "required": ["element"],
            },
        },
        "next_steps": {"type": "array", "items": {"type": "string"}},
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
    "required": ["offer", "meta", "strategy", "ad_variants", "next_steps"],
}

# --------------------------------------------------------------------------- #
# Renderer - the ONLY definition of the package's on-screen format             #
# --------------------------------------------------------------------------- #

SEV_DISPLAY = {
    "blocker": "\U0001F534 Blocker",
    "high": "\U0001F7E0 High",
    "medium": "\U0001F7E1 Medium",
    "low": "\U0001F7E2 Low",
}

AWARENESS_DISPLAY = {
    "unaware": "Unaware",
    "problem_aware": "Problem-aware",
    "solution_aware": "Solution-aware",
    "product_aware": "Product-aware",
    "most_aware": "Most-aware",
}


def render_package(p: dict) -> str:
    """Render a PACKAGE_SCHEMA-shaped dict to the approved markdown creative
    package. Tolerant of missing optional fields so a partial package still
    renders."""
    out: list[str] = []
    meta = p.get("meta", {})
    strat = p.get("strategy", {})

    out.append("## \U0001F3AC Marketing Studio - Creative Package")
    out.append(f"**Offer:** *{(p.get('offer') or '').strip()}*")
    asset_types = ", ".join(meta.get("asset_types", [])) or "ad copy"
    market_bit = f"**Market:** {meta['market']} · " if meta.get("market") else ""
    out.append(
        f"**Channel:** {meta.get('channel', '?')} · "
        f"{market_bit}"
        f"**Mode:** {meta.get('mode', '?')} ({meta.get('source_count', 0)} sources) · "
        f"**Assets:** {asset_types}"
    )
    out.append("")

    # --- strategy ---------------------------------------------------------- #
    out.append("### \U0001F3AF Strategy")
    if strat.get("audience"):
        out.append(f"- **Audience:** {strat['audience']}")
    aw = strat.get("awareness_stage")
    if aw:
        out.append(f"- **Awareness stage:** {AWARENESS_DISPLAY.get(aw, aw)}"
                   + (f" · **Market sophistication:** {strat['sophistication']}"
                      if strat.get("sophistication") else ""))
    out.append(f"- **Big idea:** {strat.get('big_idea', '')}")
    out.append(f"- **Primary angle:** {strat.get('primary_angle', '')}")
    if strat.get("offer_framing"):
        out.append(f"- **Offer framing:** {strat['offer_framing']}")
    if strat.get("primary_cta"):
        out.append(f"- **Primary CTA:** {strat['primary_cta']}")
    if strat.get("rationale"):
        out.append("")
        out.append(strat["rationale"])
    out.append("")

    # --- ad variants ------------------------------------------------------- #
    variants = p.get("ad_variants", [])
    if variants:
        out.append(f"### \U0001F4E3 Ad variants ({meta.get('channel', 'paid')}-ready)")
        for i, v in enumerate(variants, 1):
            tag = v.get("angle") or v.get("framework") or f"Variant {i}"
            fw = f" · _{v['framework']}_" if v.get("framework") and v.get("angle") else ""
            out.append(f"**{i}. {tag}**{fw}")
            if v.get("hook"):
                out.append(f"- **Hook:** {v['hook']}")
            out.append(f"- **Primary text:**\n\n{v.get('primary_text', '')}\n")
            out.append(f"- **Headline:** {v.get('headline', '')}")
            if v.get("description"):
                out.append(f"- **Description:** {v['description']}")
            if v.get("visual_direction"):
                out.append(f"- **Visual direction:** {v['visual_direction']}")
            out.append("")

    # --- landing page ------------------------------------------------------ #
    lp = p.get("landing_page")
    if lp:
        out.append("### \U0001F5A5️ Landing page copy")
        out.append(f"**Headline:** {lp.get('headline', '')}")
        if lp.get("subhead"):
            out.append(f"**Subhead:** {lp['subhead']}")
        out.append("")
        for s in lp.get("sections", []):
            if s.get("heading"):
                out.append(f"**{s['heading']}**")
            out.append(s.get("body", ""))
            out.append("")
        if lp.get("form_questions"):
            out.append("**Form (intent questions only):**")
            out.extend(f"{i}. {q}" for i, q in enumerate(lp["form_questions"], 1))
            out.append("")
        if lp.get("cta"):
            out.append(f"**CTA button:** {lp['cta']}")
            out.append("")
        if lp.get("consent_block"):
            out.append("**Consent / disclosure block:**")
            out.append(f"> {lp['consent_block']}")
            out.append("")
        if lp.get("trust_elements"):
            out.append("**Trust elements:**")
            out.extend(f"- {t}" for t in lp["trust_elements"])
            out.append("")

    # --- other assets ------------------------------------------------------ #
    others = p.get("other_assets", [])
    if others:
        out.append("### ✉️ Other assets")
        for a in others:
            label = a.get("label") or a.get("type", "asset")
            out.append(f"**{label}**")
            out.append(a.get("content", ""))
            out.append("")

    # --- compliance flags -------------------------------------------------- #
    flags = p.get("compliance_flags", [])
    if flags:
        out.append("### \U0001F512 Compliance & policy flags → fix")
        out.append("| Risk | Severity | Fix |")
        out.append("|---|---|---|")
        for f in flags:
            src = "".join(f"`[{i}]`" for i in f.get("sources", []))
            tag = "" if f.get("type", "grounded") == "grounded" else " _(inferred)_"
            out.append(
                f"| {f.get('risk', '')}{src}{tag} | {SEV_DISPLAY.get(f.get('severity'), '')} "
                f"| {f.get('fix', '')} |"
            )
        out.append("")

    # --- A/B test plan ----------------------------------------------------- #
    ab = p.get("ab_test_plan", [])
    if ab:
        out.append("### \U0001F9EA What to test first")
        for t in ab:
            line = f"- **{t.get('element', '')}**"
            if t.get("hypothesis"):
                line += f" — {t['hypothesis']}"
            if t.get("how"):
                line += f" _({t['how']})_"
            out.append(line)
        out.append("")

    # --- next steps -------------------------------------------------------- #
    if p.get("next_steps"):
        out.append("### ✅ Next steps")
        out.extend(f"{i}. {s}" for i, s in enumerate(p["next_steps"], 1))
        out.append("")

    # --- sources ----------------------------------------------------------- #
    if p.get("sources"):
        out.append("### \U0001F4DA Sources")
        for s in p["sources"]:
            title = s.get("title") or s.get("url")
            out.append(f"[{s.get('id')}] {title} - {s.get('url', '')}")

    return "\n".join(out)
