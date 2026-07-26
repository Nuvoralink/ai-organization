# Visual Direction Lock

Run-level lock for the visual decisions that downstream subskills must honor. Written once at Step 0g of the orchestrator (or refreshed when `brand-identity` / `layout-system` is re-invoked in revision mode). Every screen spec, marketing page, and component variant cites this file.

This is the artifact that prevents the "every section drifts to the LLM default" failure described in [`visual-default-breakers.md`](../../skills/_visualforge-shared/references/visual-default-breakers.md) and [VF-FIND-035](../../PLUGIN-FINDINGS.md).

---

## Run metadata

- **Run ID:** [from `run-state.json`]
- **Mode:** greenfield | specforge-enhanced | retrofit
- **Brief signal:** [one-line product-class descriptor — e.g., "premium consumer wellness", "fintech utility", "developer-tool dark"]

## Visual-direction commitments

These commitments are made once and enforced across every downstream subskill. Changing one requires a supersession decision in the responsible upstream subskill (per the orchestrator's persona-revision and override protocols).

### Theme paradigm (commit one)

- [ ] Pristine light mode
- [ ] Deep dark mode
- [ ] Bold studio solid (oxblood / royal / forest / vermilion / emerald with crisp contrast UI)
- [ ] Quiet premium neutral (bone / sand / taupe / stone / smoke)

**Chosen:** [name + 1-sentence rationale tied to brand attribute]
**Rejected with reason:** [the others in one line each]

### Typography character (commit one)

- [ ] Satoshi-like clean grotesk
- [ ] Neue-Montreal-like refined grotesk
- [ ] Cabinet / Clash-like expressive display
- [ ] Monument-like compressed statement
- [ ] Editorial serif + sans pairing
- [ ] Swiss rational sans with very strong hierarchy

**Chosen:** [name + DEC-003 cite]

### Hero scale (commit one — per `brand-identity` DEC-098)

- [ ] Giant statement hero
- [ ] Mid editorial hero
- [ ] Mini minimalist hero

**Chosen:** [name + rationale]

### Default hero composition anchor (commit one — per `brand-identity` DEC-099)

- [ ] anchor.centered-statement
- [ ] anchor.bottom-left-over-image
- [ ] anchor.bottom-right-cta
- [ ] anchor.top-left-lead
- [ ] anchor.stacked-center
- [ ] anchor.image-as-canvas
- [ ] anchor.off-grid-editorial
- [ ] anchor.right-text-left-image
- [ ] anchor.left-text-right-image *(banned by default; explicit justification required)*

**Chosen:** [name + rationale]

### Narrative / concept spine (commit one — per `brand-identity` DEC-100)

- [ ] Artifact / collectible
- [ ] Journey / pilgrimage
- [ ] Tool / precision instrument
- [ ] Living system / garden
- [ ] Stage / spotlight
- [ ] Archive / dossier

**Chosen:** [name + how it appears in imagery, motion, copy]

### Background mode mix (per `layout-system` §12 + `imagery-illustration` §0a)

For multi-section pages (marketing / landing / brand surfaces), commit to the mix:

- **Default per section:** [mode name]
- **Required full-bleed / atmospheric appearance:** at least 1 section
- **Required mini minimalist appearance:** at least 1 section
- **Banned across the run:** [list any that are explicitly off the table — e.g., for a Swiss brief, "no cinematic gradients, no full-bleed image hero"]

### Signature components (commit exactly 4 — per `imagegen-frontend-web` §2)

The four signature visual components this product uses across surfaces. Choose from:

- Diagonal staggered square masonry
- 3D cascading card deck
- Hover-accordion slice layout
- Pristine gapless bento grid (must use `grid-flow-dense`)
- Infinite brand marquee strip (only with real recognizable logos / type)
- Turning polaroid arc
- Vertical rhythm lines
- Off-grid editorial layout
- Product UI panel stack
- Split testimonial quote wall
- Oversized metrics strip *(only when the product is about numbers)*
- Layered image crop frames

**Chosen 4:** [...]

### Motion-implied language (commit exactly 2 — per `motion-design` DEC-871 in allocated range DEC-870–899)

- [ ] Scrubbing text reveal energy
- [ ] Pinned narrative section energy
- [ ] Staggered float-up energy
- [ ] Parallax image drift energy
- [ ] Smooth accordion expansion energy
- [ ] Cinematic fade-through energy
- [ ] Springy card lift energy
- [ ] Sheet rise energy

**Chosen 2:** [...]

### Second-read moment (exactly 1 across the product)

Per `visual-default-breakers.md` §13.

- [ ] Asymmetric bleed that still respects hierarchy
- [ ] One oversized punctuation or numeral serving structure
- [ ] One unexpected material switch (paper vs gloss vs metal)
- [ ] Narrow vertical side-rail editorial note
- [ ] Macro crop carrying brand color
- [ ] Other (named): [...]

**Owner subskill:** [imagery-illustration | layout-system | surface-treatments | content-design]

### Banned-by-default visual patterns

Re-cite the bans this run is committing to (from `visual-default-breakers.md`):

- [ ] No purple-to-blue AI gradient.
- [ ] No pink-to-orange creator gradient.
- [ ] No rainbow / mesh blob gradients.
- [ ] No neon edges / glow halos without purpose.
- [ ] No gradient text as a shortcut for "premium".
- [ ] No `SECTION 01` / `QUESTION 05` chrome labels.
- [ ] No three-identical-stat-columns (unless the product is about numbers).
- [ ] No marquee logo strip of unrecognizable blobs.
- [ ] No 6-line wrapped H1; H1 wraps to ≤ 3 lines with stated `max-w`.
- [ ] No `anchor.left-text-right-image` as the primary hero by default.

---

## Downstream binding

Subskills that must cite this lock:

| Subskill | What it cites |
|---|---|
| `visualforge-brand-identity` | Confirms theme + Hero Scale + composition anchor + narrative spine match its decision cards (DEC-098 / 099 / 100) |
| `visualforge-design-tokens` | Implements the theme paradigm and typography character |
| `visualforge-surface-treatments` | Honors the gradient ban list and background-mode allowed list |
| `visualforge-layout-system` | Owns the composition-anchor inventory + cross-section variety rule |
| `visualforge-imagery-illustration` | Owns the background-mode inventory + image-led posture + narrative-spine expression |
| `visualforge-motion-design` | Implements the chosen motion-implied language |
| `visualforge-component-system` | Implements the signature components |
| `visualforge-design-pressure-test` Pass L | Verifies the run honored every commitment in this lock |

## Revision rule

This lock is **append-only with supersession**. To change a commitment:

1. The change goes through the responsible upstream subskill (e.g., a theme-paradigm change goes through `brand-identity`).
2. The original commitment is marked `Superseded by [new commit]`.
3. Downstream subskills that depended on the changed commitment are re-invoked or marked stale in `00-index.md`.
4. The supersession reason is logged in `auditability/overrides-log.md`.
