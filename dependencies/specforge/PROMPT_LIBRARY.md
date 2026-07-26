# SpecForge Prompt Library

## New app, full package

```text
Use $specforge. I want to create an app that [idea]. Ask only the most important decision-blocking questions. For every choice, give options, pros, cons, and your final recommendation. For everything else, research and use best-fit defaults. Do not take shortcuts. Generate docs/app-plan with the canonical folder layout, put audit/research/decision meta-docs under auditability, run $specforge-reviewer, and run strict validation.
```

## Existing repo audit

```text
Use $specforge-repo-audit. Read this repo. Do not change product code. Audit existing documentation against code, tests, routes, database schema, config, package files, and public behavior. Fix stale or missing docs. Ask only decision-blocking questions. Use root-cause analysis for doc drift. Generate or update docs/app-plan with the canonical folder layout, put audit/research/decision meta-docs under auditability, run $specforge-reviewer, and run strict validation.
```

## Focused package

```text
Use $specforge. Create a focused package for [area]. Update only the docs needed for this outcome, keep real product/architecture/data/security/engineering/assurance docs in their canonical folders, put audit/research/decision artifacts under auditability, and update the docs index and quality review if material. Do not create unrelated not-applicable docs. Run strict validation with --profile focused.
```


## Discovery interview before docs

```text
Use $specforge-discovery-interview. I have a general app idea: [idea]. Think like a product manager and developer. Restate the product intent, ask only the questions that materially change product scope, architecture, risk, data handling, compliance, implementation order, or launch readiness, use the decision matrix to decide what to ask versus default, and recommend whether SpecForge should proceed with a full package, focused package, existing repo repair, or hybrid package.
```
## Security and threat model only

```text
Use $specforge-security-threat-model. Create the security design and threat model for this app. Research current official guidance where it affects material decisions. Record assumptions, assets, trust boundaries, threats, controls, verification methods, and open questions.
```

## Architecture only

```text
Use $specforge-architecture. Create the architecture doc, C4-style views, ADR candidates, runtime flows, deployment view, failure modes, tradeoffs, and blast-radius notes. Recommend the best architecture for this app instead of choosing the easiest path.
```

## Decision only

```text
Use $specforge-decision-advisor. Help choose [decision] for this app. Give options, pros, cons, risk, implementation impact, final recommendation, rejected shortcuts, verification method, and reversal trigger.
```

## Review existing generated docs

```text
Use $specforge-reviewer. Review docs/app-plan for generic filler, missing evidence, unsupported claims, weak traceability, contradictions, missing tests, weak security controls, and shortcut decisions. Revise weak docs before marking the package ready.
```

## Build implementation artifacts after docs

```text
Use $specforge-implementation-artifacts. Read docs/app-plan and the repo evidence. Build docs/app-plan/implementation with concrete implementation artifacts: roadmap, vertical slice specs, repo change map, API/UI contracts, migration and backfill plan, verification harness, rollout runbook, implementation risk register, and safe Codex prompts. Restate the product intent, trace source of truth to final output, research current official implementation best practices for this stack, reject workaround fixes that only patch symptoms, and run validate_implementation_artifacts.py before marking the pack ready. Do not write product code unless I explicitly ask.
```

## Generate docs without internet

```text
Use $specforge. Internet access is unavailable. Use the baked-in source map and clearly mark every place where live research could not be performed. Ask only blocking questions and mark best-fit defaults as assumptions or baked-in-reference-backed decisions.
```

## Assurance architecture package

```text
Use $specforge-assurance-architecture. Build the product assurance contract, source-of-truth map, decision ownership boundary, prompt decision matrices, surface authority map, golden fixture catalog, and documentation authority lifecycle for this app. Do not use product-specific examples from other apps. Extract only reusable patterns. Every high-risk user-visible claim must have an authority owner, validation rule, fail state, downstream consumer map, and test proof.
```

## When a generated app feature feels like it may create false confidence

```text
Use $specforge-assurance-architecture. This feature could mislead users if the app invents truth. Map source -> decision -> validation -> persistence -> API/DTO -> UI -> aggregate/export -> test. Define limited and unavailable states. Do not let a UI slot, fallback, cache, or deterministic helper become product truth without an explicit authority decision.
```

