# How to use bootstrap-orchestrator (plain-language guide)

This guide is for you, Amin — no dev knowledge assumed. It explains what this skill installs, how to trigger it, what it will ask you, what you approve, and how to check it worked.

## What this installs, in one breath
It sets up a project so that from then on, the AI works like a project manager over a team of specialist reviewers — with automatic guardrails that block mistakes, docs that stay current, and a habit of learning from every bug so the same mistake can't quietly come back. It's the same setup that's running on the Auxara Dialer and Nuvora CoachAI, packaged so any new project gets it in one go.

Think of it as hiring a team and writing their job descriptions on day one, instead of doing everything yourself and hoping nothing slips.

## The pieces it puts in place (plain terms)
- **A reviewer team** ("the fleet") — each reviewer is a specialist:
  - a *premise challenger* that asks whether the task should exist, whether something is merely miswired, and whether the proposed plan is a workaround (it advises; it is not another project manager);
  - a *kickoff auditor* that proves settled decisions and dependencies actually made it into the iteration before work starts;
  - a *builder* that implements one slice of work at a time, completely;
  - a *skeptic* that assumes the work is NOT done and tries to prove it broke something;
  - a *domain expert* tuned to your product's must-not-break rules (this is the one piece written specifically for your product);
  - a *security auditor*;
  - a *"does the code match our own written decisions?"* checker;
  - a *"does the screen actually look right at phone/tablet/desktop sizes?"* checker (only for products with a UI);
  - a *"will this fall over when there's a lot of data/traffic?"* checker;
  - a *"did the live site actually come up after we shipped?"* checker;
  - a *test runner* that runs the slow full test suite so it doesn't clog the main session.
- **Automatic guardrails** ("gates") — small checks that run the moment a file is edited and again before anything merges. They block things like: a made-up color instead of a design token, a test that secretly proves nothing, a broken link between the rules and the agents.
- **Living docs** — a decision log, a bug backlog, an architecture map, and a "lessons learned" journal that get updated as work happens, not at the end.
- **A lean "what the AI always reads" layer** — the always-loaded project instructions are kept deliberately small, and everything else sits behind an index the AI opens only when a task needs it. (Why: an AI's attention is a finite budget — stuffing its standing instructions measurably makes it worse at every task. The setup measures the always-on size at install and records it, so growth is a decision, not a drift.)
- **A learning loop** — every time a reviewer catches (or misses) a bug, it also reports *why nothing caught it earlier*, and the fix goes into a guardrail or a job description so it can't recur silently.
- **A live-site watcher** — a small scheduled check that pings your site and warns you if it goes down between deploys.
- **Two orchestration health checks created at project start** — a weekday read-only drift report and a weekly read-only doctrine/learning review. They report evidence and proposed fixes; they never edit the repo or publish anything.

## How to trigger it
In any project's chat, just say: **"bootstrap this project"** or **"install the orchestrator structure"**. The session will recognize the skill and run the setup. (Don't use it to change one small thing in a project that's already set up — for that, just ask directly.)

## What the session will figure out on its own vs ask you
It will *discover* from the code (never asks you): what language/framework, what test tool, what checks already exist, whether it's a monorepo, whether there's a UI, what CI provider you use.

It will *ask you* only the product-judgment things it can't read from code:
1. **What can this product absolutely not get wrong?** (Your "crown jewels" — the legal rules, the money path, the AI-decision boundary, the data guarantee.) This is what makes your *domain expert* reviewer. It'll give you two examples (the dialer's = telephony compliance; CoachAI's = the AI-owns-the-judgment boundary) so you can place yours.
2. **Where does it run?** (Site URLs, where the "is it healthy?" endpoint is, where errors are tracked.)
3. **What's billed / can't be undone?** (Paid AI calls, production database changes, anything that contacts a real customer.)
4. **Merge policy?** (Default: open a PR, let checks + a review pass, then self-merge.)

## What you approve
- **The crown jewels** — you confirm the list, because it defines what your domain reviewer guards. Get this right and the reviewer is sharp; get it vague and it's useless.
- **Any visible UI change** stays mockup-first as always — the setup doesn't change that rule, it enforces it.
- **Push and merge policy** — branch creation, commit, and PR creation/update proceed autonomously. Push proceeds only after live proof that it cannot trigger a preview/production deploy, publish or billed build, production write, or external contact; preview deploys count as deploys. A low-risk, additive/isolated merge can proceed only when every capability-matrix condition is proven and it has no deploy/production effect; otherwise you approve. Deploy, production mutation, deletion, billing, external contact, and unresolved product/design/architecture decisions remain yours.

## How to maintain it (mostly: you don't — it maintains itself)
- The **learning loop** keeps the reviewers' job descriptions growing: each caught bug can add a checklist row to the right reviewer, so it gets smarter over time.
- The **guardrails** bite automatically — you don't have to remember to run them.
- If a reviewer keeps citing an old file that got renamed, the wiring gate fails and flags it — that's the signal to update.
- New lessons land in the **journal** automatically after a fix, not when you remember to ask.

## How to check it worked
After the setup, the session runs the guardrails and shows you their results. The quick self-check is one command it will run and report:
- `npm run gate:rules-wiring` (or your project's equivalent) coming back **green** means the reviewers and rules are correctly wired together.
- `npm run gates:all` coming back **green** means the whole guardrail battery passes.
- It also does a "does the guardrail actually catch a planted mistake?" spot-check, so you know the guardrails aren't just decoration.

If anything needs a human step it can't do (like pasting a secret into your CI provider's settings), it gives you a numbered, click-by-click list — never "go configure X."

## The short version
Say "bootstrap this project," answer the 3-4 product questions, confirm your crown jewels, and you get a self-guarding, self-documenting, self-learning project run by an AI project manager instead of a lone coder. The reference for *why each piece exists* (each traces to a real past bug) is in `ARCHITECTURE.md`; the exact steps the session follows are in `SKILL.md`.
