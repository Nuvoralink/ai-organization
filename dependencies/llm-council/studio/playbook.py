"""
playbook.py - distilled expert knowledge injected into the studio's seat prompts.

WHY THIS EXISTS: the studio's seats are raw model calls (claude -p / codex exec /
Gemini / DeepSeek) with tools disabled for deterministic, schema-valid output, so
they cannot load Claude Code "skills" as live tools. Instead, the durable KNOWLEDGE
from vetted marketing skills is distilled here and injected per stage - the only
mechanism that reaches every seat regardless of provider.

PROVENANCE: distilled (and rewritten in our own words - so any third-party text is
knowledge, never executable instruction) from the vetted ``marketingskills`` plugin
suite: copywriting, ad-creative, ads, marketing-psychology, cro, ab-testing,
customer-research, signup, emails, copy-editing. Each block is kept tight because it
is pasted into token-limited prompts. Update the block, every seat inherits it.

The compliance block is a CHECKLIST of what to look for; the studio's actual
compliance authority remains the grounded web check against the live ad policy.
"""

from __future__ import annotations

TOP_10 = """TOP COPY RULES (cross-cutting):
1. Clarity over cleverness. 2. Specific beats vague - real numbers/timeframes/named outcomes ("$9,217", "in 14 days") not "thousands"/"fast". 3. Benefits over features - what it MEANS for them. 4. Use the audience's exact words from research, not jargon. 5. One idea per asset, one primary CTA. 6. Active voice; cut "very/really/just/almost". 7. CTA = action verb + what they get ("Get my quote"), never "Submit"/"Learn More". 8. Never fabricate stats, testimonials, scarcity, or unbacked claims (trust + legal risk). 9. Message match: the ad's promise = the landing-page headline. 10. Read it aloud; cut every adverb, hedge, and buzzword (utilize, leverage, seamless, robust, innovative, unlock, elevate)."""

RESEARCH_BRIEF = """BRIEF CRAFT:
- Mine VOICE-OF-CUSTOMER verbatim (reviews, forums, communities) - capture the exact phrases people use for their pain; those words become the copy. Don't paraphrase into jargon.
- Per insight capture: the job-to-be-done (functional/emotional/social), the pains (favor unprompted + emotional ones), the trigger event (what changed), the desired outcome in their words, and the alternatives they weigh (incl. "do nothing").
- Pin the AWARENESS STAGE (unaware -> problem-aware -> solution-aware -> product-aware -> most-aware) and MARKET SOPHISTICATION (how many similar claims they've already heard) - both dictate every downstream angle.
- Tear down 2-3 competitor angles: their headline promise, their proof, and the objection they ignore - that gap is the wedge.
- Prefer recent sources; flag thin/low-confidence claims rather than inflating them."""

STRATEGY = """STRATEGY CRAFT:
- One big idea / through-line. Frame around the JOB, not features ("they want the hole, not the drill").
- Define 3-5 angles, each a DIFFERENT motivation - don't reword one angle 5 ways: pain ("stop wasting X"), outcome ("achieve Y in Z"), social proof, curiosity, comparison ("unlike X"), identity ("built for [role]"), contrarian ("why [common practice] fails"), loss-aversion.
- Match angle to awareness: unaware/problem-aware -> agitate the problem; solution-aware -> mechanism + differentiation; product/most-aware -> offer, proof, urgency.
- Ethical persuasion levers, used ONLY when genuine: social proof (real counts/logos), authority (real credentials), scarcity/urgency (real deadlines only), loss aversion (a loss stings ~2x a gain), anchoring, favorable framing ("$3/day" > "$90/mo"). Never manufacture scarcity or proof."""

AD_COPY = """AD COPY CRAFT:
- Choose framework by awareness: PAS (Problem-Agitate-Solve) for problem-aware; BAB (Before-After-Bridge) for solution-aware; AIDA for cold->warm; 4Ps (Promise-Picture-Proof-Push) for skeptical/proof-heavy; social-proof-lead (stat -> what you do -> CTA) for crowded markets.
- HOOK = first 3-8 words, a pattern-interrupt (rhetorical question, bold/contrarian claim, or a specific number). Front-load it: Meta shows ~125 chars before "more".
- Specificity wins: "$9,217" > "thousands"; "in 14 days" > "fast". One idea per ad. Benefits, active voice.
- Meta: primary-text hook in first 125 chars; headline ~40 chars; one CTA. Google RSA: headlines <=30 chars, descriptions <=90; each headline stands alone.
- KILL AI-slop tells: banned words (utilize, leverage, seamless, robust, cutting-edge, innovative, streamline, unlock, elevate, "in today's world"), generic claims ("best/leading/world-class"), all-caps, exclamation spam, every variation sounding identical, clickbait the page can't deliver. Human copy = the customer's real words + varied sentence length + a concrete detail."""

LANDING_CRO = """LANDING / CRO CRAFT:
- Above the fold passes the 5-second test: what it is + why care + primary benefit, in the customer's language, no scroll. Hero = headline + 1-2 sentence subhead + ONE primary CTA + supporting visual + optional social-proof bar.
- MESSAGE MATCH: the page headline mirrors the ad that sent them; mismatch = bounce. On an ad landing page, strip nav, keep one CTA / one argument.
- Narrative, not a feature list: hero -> social proof -> problem/pain -> how-it-works (3-4 numbered steps) -> 3-5 benefits -> testimonial -> objection-handling/FAQ -> final CTA + risk reversal.
- Forms: every field cuts completion - ask only what's needed now (intent over friction), defer the rest. Visible labels (not placeholder-only), single column, 44px+ mobile targets, inline validation.
- Trust near every CTA: specific attributed testimonials, recognizable logos/affiliations, guarantees. CTA copy = action verb + outcome."""

COMPLIANCE = """AD-POLICY CHECKLIST (what to flag - verify against the live platform policy you are searching):
- No unrealistic/unsubstantiated claims or guarantees of results ("guaranteed approval", specific income/savings/outcomes). Every claim needs evidence; if proof doesn't exist, cut the claim.
- No personal-attribute targeting/affirmation (Meta): copy must not assert/imply you know the reader's health/medical condition, finances, race, religion, age, or sexual orientation. Avoid "you" + sensitive attribute framed as known fact ("Are you in debt?", "Struggling with [condition]?").
- Restricted/heightened verticals - INSURANCE, finance/credit, health, weight-loss, crypto: no sensational money/health claims, no before/after, often require disclosures/licensing/certified accounts. Treat as flag-for-human-review by default.
- No deceptive/sensational hooks: clickbait, fake official notices, fake urgency/countdowns, nonfunctional buttons.
- Required disclosures where relevant (results-not-typical, paid-partnership, accurate pricing/renewal). When unsure, FLAG with the specific rule + a compliant rewrite - never silently pass."""

AB_TEST_EDIT = """TEST + EDIT:
- Test order by impact: angle/concept -> hook/headline -> image -> CTA -> body. ONE variable per test or you can't attribute the result.
- Real hypothesis: "Because [observation], we believe [change] causes [outcome] for [audience], measured by [metric]." Prioritize by Impact x Confidence x Ease; run highest first.
- Edit pass before shipping: delete adverbs/hedges (very, really, just, actually, basically), "in order to"->"to", filler "that"; replace utilize->use, leverage->use, robust->strong, seamless->smooth. Active voice; <=25 words/sentence; front-load the point. Read-aloud test - if it doesn't sound human, rewrite. Run "So what?" (claim->benefit) and "Prove it" (claim->evidence) sweeps."""
