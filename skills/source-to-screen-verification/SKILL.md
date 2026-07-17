---
name: source-to-screen-verification
description: Use when verifying that authoritative source data, decisions, permissions, generated output, approvals, scores, states, or fixes actually reach the final UI, API response, report, export, notification, dashboard, or other user-visible surface. Trigger when the user asks whether a fix is visible, whether the final output consumes the right source of truth, or when local code changes need source-to-surface proof.
---

# Source To Screen Verification

Use this skill when "done" depends on final output, not internal implementation.

## The Standing Gauntlet — verification is not done until each relevant gate holds (non-negotiable)

These ten gates mirror the user's global engineering doctrine. They are **always implied** and never need to be asked for.

1. **Verify, never assume.** Prove the source reaches the screen by reading the actual surface, not by inferring it from the code path; a status line is a *lead*, not proof.
2. **Outputs over statuses.** Read the rendered DOM / API body / export artifact / persisted row yourself; distrust a green smoke or a grep returning 0 and re-check a different way.
3. **Tests must bite.** The source-to-screen proof must FAIL if the surface falls back to the wrong authority — not a render-only or shape-only assertion.
4. **Whole blast radius.** Every surface that displays, exports, notifies, or aggregates the value is verified, not just the one screen in front of you.
5. **Replace, don't layer.** Confirm stale compatibility paths are quarantined or visibly limited, not silently racing the authoritative value.
6. **No parallel system.** The surface consumes the one authoritative field, not a second reconstructed copy of it.
7. **Best, most durable way.** Final-output proof beats helper/persistence-only proof when the user cares what is displayed.
8. **Pressure-test the thing itself.** Should this surface display this at all, or does it belong elsewhere for better UX? Is the field it consumes the right authority?
9. **Stop before you quick-fix.** A gap found while verifying is traced and flagged, not patched at the display layer to make the screen look right over a wrong source.
10. **Clean up after yourself — repoint or remove every trace of the old.** After any delete/replace/rename/change, grep the old name repo-wide: switch every dependent to the new thing (or migrate/remove it on delete), delete every now-orphaned dead path, and leave no dangling reference — in *all* files; nothing still points at the old thing (the reverse of Gate 4).

## Verification Goal

Prove that the intended source of truth drives the final user-visible or system-visible surface. Do not accept helper-level, prompt-level, or persistence-only proof when the user cares about what is displayed, exported, notified, or acted on.

## Trace

Follow the source through:

1. source row, artifact, event, material, or provider evidence,
2. decision logic or AI generation,
3. validation and repair,
4. persistence and read model,
5. API/DTO/contract,
6. mapper/adapter/selector,
7. UI/report/export/notification,
8. downstream consumer such as dashboard, aggregate, job, or reprocess path,
9. test/smoke/doc proof.

## Proof Ladder

Use the cheapest proof that can answer the question:

- direct source/artifact inspection,
- unit test for decision logic,
- integration test for persistence/API/DTO,
- local replay or reprocess against persisted artifacts,
- component/render test,
- browser smoke with screenshot or DOM assertion,
- export/report/notification artifact check,
- deployed smoke only when local proof cannot cover runtime behavior.

## What To Check

- Does the final surface consume the authoritative field/artifact, not a fallback?
- If the source came through an external adapter, did realistic messy input and malformed structure resolve to the same final truth or honest rejection as the contract says?
- Are stale compatibility paths quarantined or visibly limited?
- Are permissions and role-specific visibility preserved?
- Are unavailable, missing, stale, revoked, or forbidden states honest?
- Are generated, suggested, approved, persisted, and manager/user-edited values labeled correctly?
- Are dashboards, aggregates, exports, reports, and jobs consuming the same truth?
- If a route, export, feed, job, callback, or public URL changed, do docs and implementation artifacts name the actual live path?
- Would the old bug fail the new proof?

## Output

Report the source inspected, path traced, final surface verified, proof command or artifact, screenshots/links when available, and any remaining unverified consumer.
