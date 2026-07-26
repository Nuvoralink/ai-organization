# Design Decision Quality Protocol

Apply this protocol for every material design decision in every VisualForge subskill. Material decisions include: brand color choice, typography selection, spacing scale, shadow philosophy, surface treatment, motion language, icon library, component library, layout grid, breakpoint set, accessibility level, dark-mode strategy, animation framework, asset delivery strategy, and any trend adoption.

## Step 1 — Frame the decision

State the decision in one sentence. State what *kind* of decision it is (visual, structural, behavioral, technical, content). State the surfaces it affects.

## Step 2 — Generate at least three realistic options

Never present a single option. Generate at least three options that a senior designer would actually consider. For each option capture:

- Name and one-line summary.
- Specific values (not "a warm palette" — actual hex/HSL/OKLCH).
- What it would feel like for the target user.
- What products currently use this approach (real examples, named).
- Cost: implementation effort, performance, accessibility, future maintenance.
- Risk: what breaks if user audience or brand shifts.

If you cannot name three realistic options, you do not yet understand the design problem. Go research more before deciding.

## Step 3 — Score against weighted decision criteria

Score each option against the eight criteria below. **Criteria are not equally weighted** — every product has a dominant criterion that should win ties. Determine the weighting profile at the start of the run from the design brief, then carry it across every decision.

### The eight criteria

1. **Brand fit** — expresses the agreed brand personality.
2. **Audience fit** — readable by the target user without training.
3. **Platform fit** — native, fast, supported on target devices.
4. **Accessibility** — meets WCAG 2.2 target without compromise.
5. **Performance** — fits within the perf budget for paint, composite, memory.
6. **Implementation cost** — can be built and maintained by the team.
7. **Reversibility** — can be changed later without touching every screen.
8. **Distinctiveness** — differentiates without being unreadable.

### Weighting profiles (pick one from the design brief)

| Profile | Dominant (3×) | Strong (2×) | Standard (1×) |
|---|---|---|---|
| Premium consumer brand | Brand fit, Distinctiveness | Audience fit, Accessibility | Platform, Performance, Implementation, Reversibility |
| Performance-critical / emerging-market | Performance, Audience fit | Platform fit, Implementation | Brand, Distinctiveness, Accessibility, Reversibility |
| Accessibility-critical (public sector, healthcare) | Accessibility, Audience fit | Brand fit, Implementation | Platform, Performance, Distinctiveness, Reversibility |
| Enterprise / B2B utility | Implementation cost, Reversibility | Audience fit, Performance | Brand, Platform, Accessibility, Distinctiveness |
| Developer tool | Audience fit, Performance | Implementation, Distinctiveness | Brand, Platform, Accessibility, Reversibility |
| Regulated / compliance-driven | Accessibility, Audience fit, Implementation | Performance, Brand | Platform, Distinctiveness, Reversibility |
| Time-pressured launch | Implementation, Audience fit | Platform, Performance | Brand, Accessibility (still must meet target), Distinctiveness, Reversibility |
| Small team / capability-constrained | Implementation, Reversibility | Audience fit, Accessibility | Brand, Platform, Performance, Distinctiveness |
| Large team / capability-rich | Brand, Distinctiveness, Accessibility | Audience fit, Performance | Implementation, Platform, Reversibility |

If none of these profiles fit, derive a custom profile from the design brief and record it in the decision log.

### Team-capability check

Decision quality is bounded by team capability. Before locking the weighting profile, ask:

- **Has the team shipped a design system before?** If no, bias toward fewer custom components and more library adoption.
- **Is there a dedicated motion designer?** If no, motion stays restrained — `ease.standard` / `duration.base` defaults, no spring physics adoption.
- **Is there an accessibility specialist on the team?** If no, the team needs WCAG-mature library primitives (Radix / React Aria) — do not build custom interactive components from scratch.
- **Is there a brand designer?** If no, brand identity stays close to one of the named aesthetic profiles rather than custom; iconography uses a library, not custom set.
- **Is there visual-regression infrastructure?** If no, components must be implemented from library primitives where snapshot drift is well-managed.
- **What's the runway?** A 3-month runway cannot ship the same design surface as a 24-month one. Scope down or simplify per surface.

Capability shifts the weighting:

- Add `Implementation cost` weight if the team is small or thin.
- Reduce `Distinctiveness` weight if the team can't sustain a custom design.
- Add `Accessibility` weight if the team can't easily fix accessibility bugs post-launch.

Record the team-capability profile in `auditability/run-log.md` so all later decisions inherit consistent weighting.

### Scoring

For each option score each criterion High / Medium / Low. Multiply by weight. Sum.

**Disqualification rule:** any option scoring Low on a 3× criterion is disqualified regardless of total. Any option scoring Low on Accessibility is disqualified unless the design brief explicitly allows compromise (rare, e.g., temporary internal admin tool).

**Tied scores:** the dominant-criterion winner takes the tie.

### Cross-decision impact check

Before finalizing, check the option's impact on already-made decisions and on decisions that will follow:

- **Performance budget cascade:** does this choice consume budget another decision will need?
- **Accessibility cascade:** does this choice make accessibility harder elsewhere (e.g., glass surface raises contrast burden on text)?
- **Token cascade:** does this require new tokens? Does it conflict with existing tokens?
- **Component cascade:** does this require new components? Modify existing?
- **Library cascade:** does this require a library not yet chosen? Cost?
- **Brand cascade:** does this contradict a brand attribute from DEC-001 to DEC-007?

If any cascade is negative, either revise the option or escalate the conflict to a higher-level decision.

## Step 4 — Anti-pattern recall

Before committing, check the chosen option against the known design anti-pattern catalog. Common anti-patterns:

**Visual / surface:**
- Glass-everywhere (every surface translucent) — fashion-following, hurts perf, hurts contrast.
- Single drop-shadow legacy Material — dated.
- Color-only state encoding — fails 1.4.1.
- Pure-black shadows — reads cheap.
- Dark mode = simple invert — usually too high contrast on dark.

**Type:**
- Light weight body type — reads thin on hi-DPI, fails low-vision.
- Three or more typefaces — usually loss of identity.
- All-caps body — fails screen readers, fails low-vision.

**Interaction:**
- Hover-only affordances (no focus / no touch path).
- Hidden navigation behind hamburger on desktop without justification.
- Infinite scroll without keyboard or end-state.
- Auto-playing motion without pause control.
- Magnetic hover at low-end device tier.
- Scroll-jacking.

**Content:**
- "Oops" error messages.
- Cute brand voice on destructive actions.
- "Click here" link text.
- Empty states without next action.
- Dark patterns (confirmshaming, fake urgency, hidden costs, opt-out subscriptions).

**Layout:**
- Hamburger on desktop.
- Modal-everywhere when in-page interaction would do.
- Three-column dense forms on mobile.
- Centered narrow content for prose-light interfaces.

**Component:**
- Buttons doing different things in different variants (primary destructive vs primary save styled identically).
- Mixed icon weights / styles across the product.
- Two "primary" buttons on one screen.

**Accessibility anti-patterns:**
- Focus indicator removed (`outline: none` without replacement).
- Aria-label everywhere instead of programmatic association.
- Paste-blocking on password.
- Click-area smaller than visual (or vice versa).

**Performance:**
- LCP image without preload.
- Web font without fallback metric matching.
- Animation on layout properties.

If the chosen option matches any anti-pattern, either revise or document the explicit exemption rationale.

## Step 5 — "What would change my mind" probe

Before committing, explicitly identify what evidence would shift the decision *now* (not just post-launch — that's the reversal trigger). Examples:

- "If user testing shows persona X gets stuck at the empty state, the empty-state-with-illustration approach loses to typography-only."
- "If perf testing on a 2-year-old Android shows 4-layer shadow on dense cards drops below 50fps, the multi-layer approach loses to single shadow."
- "If brand stakeholder review rejects Inter as too utilitarian, the typography choice flips to a Söhne / Söhne Mono pairing."

If you cannot articulate what would change your mind, the decision is either overdetermined (no genuine alternative) or under-examined (you haven't really considered the alternatives). Re-do step 2.

## Step 5a — Pre-mortem

Different from reversal trigger. **Imagine it is six months after launch and the chosen option failed badly. Write the failure obituary.**

- What went wrong specifically?
- Who was harmed (users, business, team)?
- What signals did we ignore at decision time?
- What constraint did we underestimate?
- What did the team's biases hide?

Pre-mortem catches failure scenarios that the optimistic "weighing options" frame misses. If the pre-mortem produces a plausible obituary, revise the option or accept it with mitigations.

## Step 5b — Inversion

Ask the inverse question: **what design choice would make this product terrible at solving this problem?**

- The worst color palette.
- The worst layout pattern.
- The worst component for the job.
- The worst motion language.

Then check: is the chosen option meaningfully far from these worst-case answers, or only marginally better than the bad version?

Inversion exposes choices that pass the criteria check but are only narrowly better than the obvious bad answer — usually a sign the option set was too narrow.

## Step 5c — Second-order thinking

For the chosen option, ask:

- **If we do this, then what happens next?** (First order.)
- **If that happens, then what happens after that?** (Second order.)
- **If that happens, then what happens after that?** (Third order.)

Example — Decision: "Use Liquid Glass on top navigation."
- 1st order: navigation looks premium.
- 2nd order: content visible through the glass affects perceived contrast; perf budget consumed.
- 3rd order: dense card grids under glass become illegible; design needs glass-aware contrast rules across components touching nav.

Second-order surfaces cascading impacts that the cross-decision impact check (which only looks at *one* hop) misses.

## Step 5d — Devil's advocate

Now that you've chosen, make the **strongest case against the winner**. Not the rejected alternatives' case — the case that the winning option itself is wrong.

- Most damning critique.
- Strongest evidence that this is the wrong call.
- The voice that would say "you'll regret this."

If you cannot make a strong case against the winner, you have not stress-tested it. Re-examine.

## Step 5e — Status-quo bias check

Ask honestly:

- Am I picking this because it is familiar (default, comfortable, "the way it's done")?
- If I were starting fresh with no priors, would I still pick this?
- Is there a better option I dismissed because it would be more work?
- Is there a better option I dismissed because it would be harder to maintain?
- Is there a better option I dismissed because the team isn't familiar with it?

If yes to any, separate "best decision" from "easiest decision" and re-evaluate.

## Step 5f — Cost-benefit explicit

State the cost of the chosen option in three lenses:

- **Cost to the user:** anything that's harder, slower, more confusing, or less private than the alternative.
- **Cost to the business:** revenue impact, retention impact, support cost, competitive cost.
- **Cost to engineering:** implementation time, maintenance burden, performance cost, dependency added, scaling implication.

Then the benefits in the same three lenses. If costs outweigh benefits in any lens by an unjustified amount, revise.

## Step 6 — Multi-expert perspective sweep

Imagine four reviewers and check whether each would accept the choice:

- **Senior product designer:** does this serve the persona? Is the IA / flow optimal? Is there friction?
- **Senior frontend engineer:** can I build this? Will it perform? Will it be maintainable?
- **Accessibility expert:** does this work with AT? Cognitive? Motor? Vestibular?
- **Brand designer:** does this strengthen identity or weaken it?
- **Target user (the primary persona):** would they actually like this? Trust it?

For each, name a concrete objection they would raise. If you cannot name any objections, you have not actually simulated their lens.

If a reviewer's objection is strong, revise the recommendation. If you proceed anyway, document why their objection is overridden.

## Step 7 — Make the recommendation

Choose one option. State it plainly. The recommendation must:

- Name the chosen option.
- State the top two reasons it won against the alternatives (not generic praise).
- State what was rejected and the one-line reason for each rejection.
- State the confidence level (High / Medium / Low) and what evidence would change it.
- State the reversal trigger — the observable signal that would cause this decision to be revisited *after launch*.
- Note any anti-patterns it intentionally engages and why the exemption is acceptable.
- Note any multi-expert objections that were overridden and why.

## Step 8 — Bind to artifacts

Every decision must connect to:

- A token name (when the decision produces a value).
- A document section where the rationale lives.
- A component, screen, or flow that consumes the decision.
- An export target (`tokens.json`, `tokens.css`, `tokens.ts`, Figma variable, Tailwind config).
- A verification method (visual regression, a11y audit, perf test, user test).

If a decision cannot bind to all five, it is too abstract — push it down to a more concrete sub-decision.

## Step 9 — Record in decision log

Append the decision to `docs/design-system/auditability/decision-log.md` with this structure:

```markdown
## DEC-NNN — [short title]

- **Date:** YYYY-MM-DD
- **Subskill:** visualforge-[name]
- **Category:** color | typography | spacing | shadow | motion | component | layout | trend | technical | content
- **Decision:** [one sentence]
- **Options considered:**
  - Option A: [name] — [one line]
  - Option B: [name] — [one line]
  - Option C: [name] — [one line]
- **Recommendation:** Option [X]
- **Why won:** [two reasons specific to this product]
- **Why others lost:** [one line per rejected option]
- **Weighting profile applied:** [profile name from criteria table]
- **Score summary:** Option X: weighted-total / Option Y: weighted-total / Option Z: weighted-total
- **Cross-decision impact noted:** [downstream / upstream decisions affected]
- **Anti-patterns engaged (if any):** [pattern + exemption rationale]
- **Multi-expert objections (overridden if any):**
  - PD: [accepted | overridden because…]
  - FE: [accepted | overridden because…]
  - A11y: [accepted | overridden because…]
  - Brand: [accepted | overridden because…]
  - User: [accepted | overridden because…]
- **What would change my mind (before launch):** [evidence that flips the decision now]
- **Pre-mortem obituary:** [the most plausible 6-month failure scenario, or "no plausible failure identified"]
- **Inversion check:** [the bad-design contrast — what would make this terrible, and how far we are from that]
- **Second-order consequences:** [2–3 hops downstream — what cascades from this choice]
- **Devil's advocate critique:** [the strongest case against the winner]
- **Status-quo bias check:** [acknowledgement of any familiarity-based bias, or confirmation it was checked and the choice still stands]
- **Cost-benefit:** user / business / engineering — costs vs benefits stated
- **Confidence:** High | Medium | Low
- **Source basis:** [User-confirmed | Research-backed | Standard-backed | Repo-derived | Specforge-derived | Assumption]
- **Evidence:** [link or quote]
- **Bound artifacts:**
  - Token: [name]
  - Document: [path]
  - Components: [list]
  - Export: [target file]
  - Verification: [method]
- **Reversal trigger (after launch):** [observable signal]
```

## Anti-shortcut check

Before finalizing, ask:

- Did I pick the easiest option for the AI to implement, rather than the best option for the product? If yes, redo.
- Did I default to a current trend without checking trend-fit? If yes, redo.
- Did I copy a competitor's choice without checking why they made it? If yes, redo.
- Did I avoid a hard choice by saying "support both"? If yes, pick one as default and the other as variant with rules.
- Did I leave a value as "TBD" or "team to decide"? If yes, decide with research-backed default and mark confidence Low so it surfaces for review.

A material design decision that fails any of these checks is design slop dressed up as a decision card.

## Inheritance rule

Later subskills must read the decision log and treat earlier decisions as binding constraints. If a later subskill needs to revisit a prior decision (e.g., motion-design discovers the typography choice prevents a needed animation), it must:

1. Document the conflict in the decision log.
2. Re-run this protocol for the affected decision.
3. Update all downstream artifacts.
4. Notify `agent-rules-update` so future contributors see the new constraint.

No silent overrides.
