# Changelog — Hormozi Engine

All notable changes to the Hormozi engine skill system.

## [0.1.0] — 2026-07-09

Initial build. Standalone engine that turns *$100M Offers* + *$100M Leads* into an AI applied to a product.

### Added
- Repo scaffold: 24 sub-skill directories + `_hormozi-shared/{references,templates}` + `docs/`.
- `docs/BUILD_PLAN.md` — living slice-by-slice build plan and progress tracker.
- `README.md`, `CHANGELOG.md`.

### Decisions
- Standalone skill named `Hormozi` (not a MarketForge pack) — avoids MarketForge's gated
  self-test / DEC-range / "leverage"-ban constraints and keeps Hormozi's method un-force-fit.
- MarketForge left fully separate and unmodified.
- Build order: Offers chain first, then Leads.

### Added (complete)
- **12 book frameworks** encoded faithfully into `_hormozi-shared/references/` (line-referenced, spot-verified).
- **24 sub-skills**: master `hormozi` + `hormozi-offers`/`hormozi-leads` orchestrators; 8 `hormozi-offer-*`;
  11 `hormozi-lead-*`; `hormozi-self-test` + `hormozi-fidelity-audit`. All names match dirs (self-test clean).
- **3 deliverable templates** (offer, lead-magnet, lead-gen plan).
- **Golden examples**: `examples/auxara-ai-system-architect-offer.md` (done-for-you service) and
  `examples/coachai-offer.md` (SaaS product) — full Grand Slam Offer + lead-gen plans generated for two
  real Auxara products, demonstrating the engine on both a service and a product.

### Fixed
- Stale sub-skill name in `references/more-better-new.md` (`hormozi-scale-more-better-new` →
  `hormozi-lead-more-better-new`).
