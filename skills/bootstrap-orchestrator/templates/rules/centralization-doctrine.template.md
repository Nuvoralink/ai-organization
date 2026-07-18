---
paths:
{{CENTRALIZATION_RULE_PATHS_YAML}}
---
<!-- TEMPLATE: the one-source-of-truth-per-domain rule + the project's REGISTRY TABLE. Save as {{RULES_DIR}}/centralization-doctrine.md (or .mdc).
     The registry table MUST be built from the repo's ACTUAL discovered source-of-truth files — never a fictional list. Fill/prune. -->

# Centralization Doctrine — One Source of Truth Per Domain

Purpose: prevent the most-expensive class of architecture drift — the same concept restated in many files, each slightly different, until prod data is inconsistent or a user sees mismatched copy. The rule: **no individual file holds domain truth.** Every domain has ONE central registry; every consumer reads from it. Changing the truth means changing one row, not N files.

## 1. Central registries by domain (BUILT FROM ACTUAL FILES — not invented)
<!-- FILL: one row per real source-of-truth in THIS repo. Discover them: enums/taxonomies, DTO/contract files, copy files, design-token files, config/threshold files, endpoint registries, provider-routing modules, redaction authority. Prune rows that don't apply. Every path must resolve (gate:doc-code-drift / gate:rules-wiring will check the claimed paths). -->

| Domain | Central registry | Consumers must source from |
|---|---|---|
| {{DOMAIN_1}} | {{REGISTRY_PATH_1}} | {{CONSUMERS_1}} |
| {{DOMAIN_2}} | {{REGISTRY_PATH_2}} | {{CONSUMERS_2}} |
| API contracts (DTOs) | {{CONTRACTS_DIR}} | backend producer + frontend consumer + any external consumer |
| API endpoint registry | {{ENDPOINTS_REGISTRY}} | the frontend API layer; never a raw endpoint string in a component |
| {{COPY_DOMAIN}} | {{COPY_DIR}} | every component; never an inline user-facing string |
| {{DESIGN_TOKEN_DOMAIN}} | {{DESIGN_TOKEN_SOURCE}} | every component/page; never a raw {{DESIGN_LITERAL_KINDS}} at a leaf |
| Thresholds / numerics | {{THRESHOLDS_FILE}} | every consumer; never a bare magic number inline |
<!-- (grow this table as new domains emerge; adding a registry = a row here + a row in the source-of-truth map) -->

## 2. Forbidden patterns (bugs even if they compile and tests pass)
- ❌ Inline user-facing copy in a component. Use the copy registry.
- ❌ Inline {{DESIGN_LITERAL_KINDS}} at a leaf. Use the token. If none fits, add it at the source first, then reference it.
- ❌ Magic numeric inline. Use the named threshold from its source.
- ❌ Hardcoded role/permission string comparison. Use the capability check.
- ❌ Hardcoded API URL / endpoint string. Route through the endpoint registry.
- ❌ Hardcoded event name / enum string retyped at a call site. Reference the taxonomy.
- ❌ A DTO shape redefined in two places. Use the single shared contract.
- ❌ A duplicated constant in two files. One source; consumers read it.
- ❌ Pre-normalizing raw input at a route/leaf before the domain's composite resolver sees it. A
  "defensive" outer normalizer can erase meaningful intent (short codes, commands, aliases, signed
  shapes) and make the central classifier unreachable. Hand raw input to the registered resolver;
  prove with a fixture where the outer normalizer and the full resolver deliberately diverge.
{{PROJECT_FORBIDDEN_PATTERNS}}
<!-- FILL: any project-specific forbidden pattern (e.g. a frontend product adds "a page that owns scroll/height" and "a transparent hand-rolled header"; a token product adds "any raw design literal outside the token source"). Delete if none. -->

## 3. Wire the gate, not just the rule
Where the project can, a CI gate FAILS THE BUILD on a raw literal of a registered kind outside its source. {{PROJECT_CENTRALIZATION_GATES}}
<!-- FILL: name the gates that enforce this (e.g. the UI-guardrails raw-value gate, the inline-copy source-of-truth gate, the test-intent gate). A discipline a human must remember erodes; wire it. -->

## 4. Adding / changing a registry
Adding a new registry = a row in §1 + a row in the source-of-truth map + updating existing consumers to read from it (no duplicate truth left behind). Changing a registry value is high-blast-radius: read every consumer via the blast-radius doc, update the value, update derived consumers, run `npm run gates:all`.

*Fail-state:* a value that encodes a relationship was inlined at the leaf where a registry owns it — and it drifts or silently disagrees the moment the source changes.
