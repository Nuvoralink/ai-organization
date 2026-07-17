"""
studio - a multi-LLM Marketing Studio that turns an offer into a usable creative
package (ad variants, landing-page copy, consent block, compliance flags).

Sibling to the ``council`` package: it REUSES council's proven engine layer
(``council.providers`` uniform multi-LLM call + honest degraded state,
``council.validators`` bounded-repair/grounding guards, ``council.config.PROVIDERS``
transport map, ``council.store`` run persistence) and adds only what is new here -
the marketing roster, prompts, data contracts, the studio engine, and the
creative-package renderer. No transport or guardrail code is duplicated.
"""
