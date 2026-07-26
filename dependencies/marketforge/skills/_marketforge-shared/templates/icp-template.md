# ICP Template

Use this template for every Ideal Customer Profile. Output to `docs/marketing-plan/01-foundations/icp-and-personas/icp-[slug].md`.

## Template

```markdown
<!-- marketforge: v[version] run-id=[id] scope=[mode] generated=[ISO-8601] -->

# ICP: [Short ICP Name]

**ICP ID:** ICP-[NNN]
**Status:** Active | Inactive | Deprecated (superseded by ICP-MMM)
**Evidence grade:** [A | B | C | D | E based on supporting data]
**Source basis:** [Customer interviews + VOC mining + sales data | Assumed from founder hypothesis | Specforge-derived | etc.]

## Headline definition (one sentence)

[ICP in one sentence. NOT "small businesses" or "professionals." Specific: "VP of Engineering at Series A-C SaaS companies with 30-150 engineers, struggling with on-call rotation pain."]

## Firmographic / demographic frame

- Company stage / size: [explicit — number of employees, revenue band, funding stage]
- Industry / vertical: [specific verticals]
- Geography: [explicit — country, region, language]
- Technology stack (B2B): [tools / providers / cloud they use]
- Buying authority: [decision-maker / influencer / champion / end-user]

For B2C / DTC:
- Age band:
- Income band:
- Lifestyle / interest cluster:
- Purchase frequency in category:
- Brand loyalty in category:

## The job they hire your product for (JTBD)

> "When [situation], I want to [motivation], so I can [outcome]."

[Specific job-to-be-done in user's words from JTBD interviews. NOT a feature description.]

## The "switch" they're making

- **From:** [Specific tool / process / habit they were using before]
- **To:** [Your product]
- **Why now:** [Trigger event — funding, hire, failure of old solution, regulatory change, etc.]

## The 4 forces (Moesta)

- **Push (away from current):** [What about their current situation is forcing them to look for change]
- **Pull (toward new):** [What about your product attracts them]
- **Anxiety (about switching):** [Concerns / objections / fears about adopting]
- **Habit (inertia):** [What keeps them stuck in current setup]

## The 5 Rings of Buying Insight (Revella)

1. **Priority initiative:** [What's at the top of their mind that brings them to category]
2. **Success factors:** [What success looks like to them]
3. **Perceived barriers:** [What they think might prevent success]
4. **Decision criteria:** [What they evaluate options against]
5. **Buyer's journey:** [Stages they move through and timing]

## Customer language (from VOC)

Direct quotes from interviews / reviews / support tickets. These become the source for copy.

- "[Exact quote about the problem]" — [Source: interview / review platform / etc., date]
- "[Exact quote about the alternative they considered]"
- "[Exact quote about the outcome they need]"
- "[Exact quote that names a competing product or status quo]"

## What they read / watch / listen to

- Publications / newsletters:
- Podcasts:
- Communities / forums / Slack groups:
- Conferences / events:
- Influencers they follow:
- Social platforms they use:

This becomes the input to channel selection — the ICP's channel density determines the channel mix.

## Buying signals (used for outbound triggering)

Observable events that indicate this ICP is in market:

- [Specific event 1 — e.g., "Just raised a Series B"]
- [Specific event 2 — e.g., "Posted a hiring ad for VP of X"]
- [Specific event 3 — e.g., "Added [competing tool] to their tech stack 6 months ago"]
- [Specific event 4 — e.g., "Founder posted about a specific pain on LinkedIn"]

These feed the outbound subskills (cold email, cold LinkedIn, direct mail).

## Disqualifiers (when this is NOT the ICP)

- [Specific signal that means this is not your ICP, even if surface matches]
- [Another]

This prevents wasting outbound on look-alike-not-actual-ICP accounts.

## Acquisition economics for this ICP

- Estimated LTV (contribution margin): $[range]
- Acceptable CAC for 3:1 LTV:CAC: $[number]
- Typical sales cycle: [days/weeks/months]
- Typical contract value (B2B) / AOV (DTC): $[number]
- Renewal / repeat rate (if known):

## Estimated TAM for this ICP

- Number of accounts/customers matching this ICP globally / in launch region: [number with source]
- % currently in-market (if known per Dawes 95-5 or NetLine 35.2% / 12 months): [estimate with caveat]

## Channel signals (where to find them)

Based on the channels-they-read above, the highest-density acquisition channels:

- **Primary acquisition channels:** [from channel-scoring exercise]
- **Supporting channels:** [from scoring]
- **Skip channels:** [explicit list]

## Revision history

- YYYY-MM-DD: Created from [source].
- YYYY-MM-DD: Revised based on [new VOC / sales data]. Changed: [what].

## What we are intentionally NOT doing in this ICP definition

- Treating this ICP as monolithic across sub-segments — [reason] — instead splitting into ICP-NNN and ICP-MMM.
- Including [segment] — [reason this segment is not in-scope, e.g., "wrong economics", "wrong distribution channel match", "regulated domain we won't enter"].

## Sources and basis

- [Customer interview transcripts: location / date range / N=]
- [Review mining: sources + N analyzed]
- [Sales data: time range, sources]
- [Internal VOC document references]

## Evidence grade

[A | B | C | D | E] — [rationale for grade]
```

## Good vs bad ICP examples

### Bad (do not produce)

> "ICP: Marketing leaders at growing companies who want to streamline their workflows and drive results."

Fails on every axis: no firmographic specificity, taste-words, no JTBD, no language, no channels, not actionable.

### Good (target output)

> "ICP-002: Director of Demand Generation at Series B-C B2B SaaS companies (50-300 employees), responsible for $2-10M annual demand pipeline, currently using HubSpot or Marketo + a stack of point tools they manually integrate. Hires our product when their RevOps team adds a third 'integration engineer' to maintain the stack — that's the trigger.
>
> They read: Refine Labs newsletter, Demand Curve podcast, 'Off the Page' by Mark Ritson. They follow Chris Walker, Mark Walker, Tas Bober on LinkedIn. They go to B2B Summit, Inbound, Demand Curve events.
>
> Quote from interview (2026-04-12): 'I'm sick of paying $40K/year for 5 tools that don't talk to each other. I want one platform that gets 80% there. I don't need best-in-class everything; I need fewer vendor logos on my budget line.'
>
> Buying signals: hiring a 'Senior RevOps Engineer' role; mentioned 'consolidation' in recent earnings call; switched from HubSpot Marketing Hub to Marketo Engage in last 12 months.
>
> Estimated TAM: ~3,500 accounts globally meeting all criteria. LTV $35K (3-yr avg). Target CAC $5-10K (3-7:1 ratio).
>
> Channels: LinkedIn (TLA + organic founder content); cold email with specific signal triggers; podcast guesting (Demand Curve / Refine); newsletter sponsorship in target newsletters. Skip: Meta Ads, TikTok, programmatic display."

This is an ICP. It's specific, it's sourced, it's actionable.
