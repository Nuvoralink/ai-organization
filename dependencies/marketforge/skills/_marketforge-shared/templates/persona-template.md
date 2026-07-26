# Persona Template

A persona is a synthesized representative of an ICP segment, used to anchor messaging, copy, ad creative, and product decisions. Personas are derived from JTBD interviews + VOC mining. They are NOT demographic cartoons.

Output: `docs/marketing-plan/01-foundations/icp-and-personas/persona-[slug].md`.

## Template

```markdown
<!-- marketforge: v[version] run-id=[id] scope=[mode] generated=[ISO-8601] -->

# Persona: [Short Persona Name — not "Marketing Mary"]

**Persona ID:** PER-[NNN]
**Parent ICP:** ICP-[NNN]
**Status:** Active | Inactive | Deprecated
**Evidence grade:** [A | B | C | D | E]
**Source basis:** [N interviews, N reviews mined, sales call recordings reviewed, etc.]

## One-sentence definition

[Persona in one sentence. Specific: "Senior backend engineer at a 50-person Series B SaaS who owns the on-call rotation pager and got woken up 7 times this month."]

## What they fire (and why)

> "I fired [previous tool / process / vendor / status quo] when [trigger event] because [underlying frustration]."

[Direct quote from JTBD interview or VOC if available.]

## What they hire (and why)

> "I'm hiring [your product] to [job-to-be-done] because [specific outcome they need]."

## When they buy

[Specific trigger conditions. Not "when they have a pain point" — specific behavioral or temporal triggers.]

## When they don't buy (anxiety)

[The specific reasons they hesitated when they were close to buying. From the 4 forces / Moesta interviews.]

- "I worried about [specific concern]"
- "I had to convince [stakeholder] that..."
- "I waited until [specific condition] was true"

## Their day / week / month at work

[Brief sketch of their actual work rhythm. Helps the team imagine the moment your product fits in.]

- They start the day with [specific activity, where your product might or might not fit].
- They check [tool / metric / surface] at [time].
- They communicate with [stakeholders] via [channel].
- They [specific weekly ritual].
- They get judged on [specific metric or outcome].

## Their language (not yours)

A glossary of the persona's vocabulary for the problem space.

| Topic | They say | We say (or used to say) |
|---|---|---|
| [Topic 1] | "[their phrase]" | "[our prior phrase]" |
| [Topic 2] | "[their phrase]" | "[our prior phrase]" |

Use the "they say" column in copy. Match their language. This is the difference between conversion and bounce.

## Their information diet

- Newsletters they read: [specific names]
- Podcasts they listen to: [specific names]
- Slack / Discord / forums they hang out in: [specific names]
- LinkedIn / X people they follow: [specific names]
- Conferences they attend: [specific names]
- Tools they evaluate / read about: [specific names]

## Stakeholders in their buying decision

For B2B:

- **Decision maker:** [role + concerns + objections]
- **Influencer:** [role + concerns]
- **Champion:** [role + concerns]
- **End user:** [role + concerns]
- **Procurement / finance:** [role + concerns]
- **Security / IT review:** [role + concerns]

Each gets surfaced in messaging architecture differently.

## Awareness stage at first touch

[Per Schwartz 5 stages: Unaware / Problem-aware / Solution-aware / Product-aware / Most aware]

[Which channel they're typically in at each stage.]

## Their preferred CTA per stage

- Unaware: [content type — typically POV piece, not "Get started"]
- Problem-aware: [content type — diagnostic, framework, original data]
- Solution-aware: [content type — comparison, alternatives page]
- Product-aware: [content type — pricing, demo, trial signup]
- Most aware: [CTA — "Start free trial", "Talk to sales"]

## Their friction points in your funnel

[Where they typically drop off or hesitate. Sources: signup flow analytics, support tickets, churn exit interviews.]

- [Friction point 1 + how it's currently surfaced + recommended fix]
- [Friction point 2]

## Their successful path (the aha moment)

[For SaaS / app: what specific action / state represents "they got value."]

[For DTC: what's the moment they become a repeat customer? First product use + feedback moment.]

## Quotes (verbatim from interviews / reviews)

> "[Direct quote about the problem, in their words]"
> — [Interview ID / Review source, date]

> "[Direct quote about the outcome they need]"
> — [Source]

> "[Direct quote about why they switched]"
> — [Source]

These quotes are the source for hero copy, ad headlines, email subjects.

## What they would never do / say

[Their anti-patterns — what behavior or attitude is incompatible with them.]

- They would never [specific thing] — because [reason].
- They would never describe themselves as [taste-word].

## How they would NOT respond to common AI-slop copy

[Test our planned copy against this persona. If a planned headline triggers a "would never engage with this" response from this persona, rewrite.]

## Revision history

- YYYY-MM-DD: Created from [interviews N=, dates, etc.]
- YYYY-MM-DD: Revised because [new evidence]. Changed: [what].

## What we are intentionally NOT including in this persona

- Demographic vanity attributes ("loves yoga", "drinks craft beer") — because [they don't predict buying behavior in this context].
- Aspirational version of the persona — [reason — we ship copy to the persona we have, not the persona we wish for].
- Multiple segments collapsed — [reason — we maintain separate personas per segment when sub-segments diverge].

## Sources and basis

- Interview list: [transcript IDs + dates]
- VOC mining sources: [reviews mined, N]
- Internal sales/CS interviews: [N]

## Evidence grade

[A | B | C | D | E] — [rationale]
```

## Good vs bad persona

### Bad (Marketing Mary pattern — do not produce)

> "Marketing Mary, 35, lives in Brooklyn, loves yoga and craft beer. She's a Marketing Director who values community and is passionate about her brand's mission. She wants to streamline her marketing efforts and drive growth."

Fails: demographic-vanity, generic taste-words, no source, no JTBD, no language, no buying behavior.

### Good (target output)

> "PER-003: Hardened Director of Demand Generation
>
> She's been in B2B SaaS demand gen for 8-12 years. She's been burned: by HubSpot's pricing surprises, by Marketo's complexity, by 6sense's promises. She fires vendors who go quiet after the signature.
>
> She buys after exactly three signals align: (1) her current stack added a 5th point tool she didn't approve, (2) her CFO asked her to cut $200K from the marketing budget in next quarter, (3) she heard about your product from someone she trusts at a B2B Summit dinner.
>
> She would never describe her product evaluation as 'looking for a partner.' She says: 'I need a tool that doesn't require me to hire a contractor to maintain.' She judges every vendor on whether their docs are actually current.
>
> She doesn't care that you're 'AI-powered.' She does care that you have a real customer at her stage who can take her call.
>
> She reads: Refine Labs newsletter, Demand Curve. She listens to: Off the Page (Ritson), Marketing Against the Grain (Dharmesh). She is on LinkedIn 3x daily; replies-first; ignores company-page posts.
>
> Quote: 'I want fewer vendor logos on my budget line and more outcomes attached to the few I keep.'"

This is a persona. It's specific, sourced, has language, has triggers, would change a creative brief.
