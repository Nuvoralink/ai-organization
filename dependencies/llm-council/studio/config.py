"""
config.py - the Marketing Studio roster, reusing council's transport map.

The provider transports (how each model family is reached) and the timeouts are
the SAME infrastructure the council uses, so they are imported, never re-declared
(single source of truth - relational, not hardcoded at the leaf). What lives here
is only what is genuinely studio-specific: which model plays which CREATIVE role.

The copy is the product, so the copy-critical roles run on the BEST models only
(Claude Opus, GPT-5 via codex, Gemini Pro) - no cheap seats. Three different premium
copywriters with three different "voices" beat one model asked three times, and beat
a cheap model every time. DeepSeek was removed from the copywriting roster (it diluted
quality); it remains available as a transport for other uses.
"""

from __future__ import annotations

# Reuse council's provider transports + timeouts (the single source of truth).
from council.config import (  # noqa: F401  (re-exported for the engine)
    PROVIDERS,
    RESEARCH_TIMEOUT,
    SEAT_TIMEOUT,
    SYNTH_TIMEOUT,
    MAX_REPAIR_PASSES,
)

# The grounded research / compliance seat needs real web access -> Claude with
# WebSearch/WebFetch (the only web-capable transport, same as the council).
RESEARCH_SEAT = {"provider": "claude", "model": "sonnet"}

# The strategist sets positioning + angles before any copy is written. Claude Opus -
# creative strategy (the big idea, the angles, the personas) is the highest-leverage
# judgment in the whole run, so it gets the strongest model, not the cheapest.
STRATEGIST_SEAT = {"provider": "claude", "model": "opus"}

# The copywriter seats - BEST models only, one proven framework each, decorrelated
# across families. Quality of the words is the product, so there are NO cheap seats
# here: Claude Opus (the strongest copy model) leads, GPT-5 (codex) and Gemini Pro
# bring distinct premium voices. (DeepSeek seats were removed - they diluted quality.)
COPYWRITERS = [
    {"key": "direct_response", "provider": "claude", "model": "opus",
     "label": "Direct-Response (Opus)", "framework": "PAS (Problem-Agitate-Solve)"},
    {"key": "performance_hook", "provider": "codex", "model": None,
     "label": "Performance-Marketer (GPT-5)", "framework": "AIDA / hook-first direct response"},
    {"key": "brand_storyteller", "provider": "gemini", "model": "gemini-2.5-pro",
     "label": "Brand-Storyteller (Gemini Pro)", "framework": "Before-After-Bridge / story-led"},
]

# The target-reader seat reacts to the drafts AS the customer - a 2-3 persona panel
# (gut reaction / jobs-to-be-done), a lens distinct from the copywriters' craft
# critique. Claude sonnet, decorrelated from the writers, so it never just praises
# its own voice.
READER_SEAT = {"provider": "claude", "model": "sonnet"}

# The synthesizer is the final EDITOR - it picks the winning lines and fuses them.
# For copy quality the best editor matters more than anti-bias rotation, so Claude
# Opus is preferred first; the others are fallbacks if Opus returns no usable output.
SYNTHESIZER_ROTATION = [
    {"provider": "claude", "model": "opus"},
    {"provider": "gemini", "model": "gemini-2.5-pro"},
    {"provider": "codex", "model": None},
]

# How many copy claims the grounded compliance pass scrutinizes per run (one
# batched web session, mirroring the council's single-call assumption check).
MAX_COMPLIANCE_CHECKS = 6
