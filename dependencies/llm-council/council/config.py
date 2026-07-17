"""
config.py - the council roster, provider transports, and model IDs.

This is the SINGLE place model IDs and provider wiring live (relational, not
hardcoded at the leaf): bump a model here and every seat picks it up. Model IDs
are deliberately conservative / known-real - swap in newer ones as they ship.
"""

from __future__ import annotations

# Provider transports.
#   kind="openai"     -> OpenAI-compatible REST (DeepSeek / Fireworks / Gemini)
#   kind="claude_cli" -> `claude -p` on the Ultimate subscription
#   kind="codex_cli"  -> `codex exec` on the Codex Pro subscription
PROVIDERS = {
    "deepseek": {"kind": "openai", "base_url": "https://api.deepseek.com",
                 "key_env": "DEEPSEEK_API_KEY"},
    "fireworks": {"kind": "openai", "base_url": "https://api.fireworks.ai/inference/v1",
                  "key_env": "FIREWORKS_API_KEY"},
    "gemini": {"kind": "openai",
               "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
               "key_env": "GOOGLE_API_KEY"},
    "claude": {"kind": "claude_cli"},
    "codex": {"kind": "codex_cli"},
}

# The 5 council seats - one role per model family (decorrelation).
# Model IDs verified conservative/real; alternatives noted for easy bumping.
COUNCIL = [
    {"role_key": "champion", "provider": "claude", "model": "opus", "label": "Champion"},
    {"role_key": "skeptic", "provider": "codex", "model": None, "label": "Skeptic"},
    {"role_key": "red_teamer", "provider": "deepseek", "model": "deepseek-reasoner",
     "label": "Red-Teamer"},  # R1; "deepseek-chat" = V3 (faster, non-reasoning)
    {"role_key": "domain_expert", "provider": "gemini", "model": "gemini-2.5-pro",
     "label": "Domain-Expert"},  # "gemini-3-pro-preview" available if enabled
    # Fireworks is unavailable on this account (every model 404s, /models 500s), so the
    # End-User seat runs on DeepSeek V3 - fast, and distinct from the R1 Red-Teamer.
    # Restore a Fireworks seat here once the account's serverless access is enabled.
    {"role_key": "end_user", "provider": "deepseek", "model": "deepseek-chat", "label": "End-User"},
]

# The grounded-research seat needs real web access -> Claude with WebSearch/WebFetch.
RESEARCH_SEAT = {"provider": "claude", "model": "sonnet"}

# The synthesizer ROTATES (no fixed chairman) across strong, diverse providers.
SYNTHESIZER_ROTATION = [
    {"provider": "claude", "model": "opus"},
    {"provider": "codex", "model": None},
    {"provider": "gemini", "model": "gemini-2.5-pro"},
]

# Timeouts (seconds) and the bounded-repair budget. Generous, because a large
# --idea-file (e.g. a research report) makes both the web-research seat and the
# reasoning seats much slower; the first big-doc run timed out at the old values.
RESEARCH_TIMEOUT = 600   # web research is the slowest stage
SEAT_TIMEOUT = 360
SYNTH_TIMEOUT = 420
MAX_REPAIR_PASSES = 2
MAX_ASSUMPTIONS = 3      # load-bearing assumptions verified in ONE batched web call per run
