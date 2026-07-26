# Marketing Plan (Canonical SLOP Fixture)

**This file is intentionally bad.** It demonstrates what MarketForge output should NOT look like. The validator should produce multiple BLOCK findings against this file.

---

# Marketing Strategy for SaaS Product

Our revolutionary, best-in-class platform will leverage AI to unlock your potential and transform your business. We'll take it to the next level with our world-class, industry-leading approach.

## Strategy

We will streamline your workflow with our cutting-edge, next-generation solution. Our seamless, transformative platform empowers users to achieve more.

Bold. Beautiful. Built.

## PR strategy

Pitch journalists via HARO for maximum exposure.

## A/B testing

Set up Google Optimize for our experiments.

## Channels

Consider running ads on Facebook. You could try LinkedIn ads too. It might be worth exploring TikTok.

Best practice suggests we run an omnichannel approach. Conventional wisdom holds that more channels = more reach.

## DEC references

See DEC-12 for budget. See DEC-1234 for full strategy.

## Cadence

Not just fast — reliable. Where strategy meets execution. Beyond marketing, beyond growth.

---

## Expected validator output

When running `py -3 scripts/validate_marketing_docs.py --root examples/marketing-plan-bad-fixture/`:

Expected BLOCK findings:
- `leverage`
- `revolutionary`
- `best-in-class`
- `unlock your potential`
- `transformative` (twice)
- `take it to the next level`
- `world-class`
- `industry-leading`
- `streamline your workflow`
- `cutting-edge`
- `next-generation`
- `seamless`
- `empowers` (caught by `\bempower\b`)
- `Bold. Beautiful. Built.` (three-word triplet AI cadence)
- HARO
- Google Optimize
- `Consider running` (line-start hedge)
- `You could try`
- `It might be worth`
- `Best practice suggests`
- `Conventional wisdom holds`
- DEC-12 (malformed)
- DEC-1234 (malformed)
- `Not just fast — reliable.` (Not-just-X-Y AI cadence)
- `Where strategy meets execution.` (Where-X-meets-Y cliche)
- `Beyond marketing, beyond growth.` (Beyond-X-beyond-Y cadence)

That's 25+ BLOCK findings in a single file.
