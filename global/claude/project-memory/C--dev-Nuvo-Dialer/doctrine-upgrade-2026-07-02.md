---
name: doctrine-upgrade-2026-07-02
description: The 2026-07-02 cross-repo doctrine/agent-infrastructure upgrade — dialer PR
metadata: 
  node_type: memory
  type: project
  originSessionId: dacc601b-7d2d-4bb9-8e59-1c3225651b36
---

Amin's 2026-07-02 directive: upgrade the dialer's orchestrator/auditor/hooks/gates setup, port adapted
to CoachAI, consolidate the skills ecosystem, then build a universal bootstrap skill + docs. Locked
decisions: bootstrap = user-level skill; PRs + I self-merge after gates + adversarial review; full
skills consolidation (archive, never hard-delete); CoachAI full parity incl. gates/CI. NO Telegram for
CoachAI (rescinded — no notify-failure jobs there).

**DONE:**
- **Skills consolidation** — taste-skill absorbed gpt-tasteskill+soft-skill; docs-rules-guardrail-promotion
  absorbed ai-build-lessons-capture; 12 descriptions trigger-sharpened; 3 retired to
  `~/.codex/skills/_retired/`; ${DEPENDENCY:skills-root|backslash} is now a git repo (2 commits); council/studio installed
  user-level via junctions (`uv run --directory "${DEPENDENCY:council-studio|backslash}" ...` works from any cwd);
  user CLAUDE.md skills list updated; CONSOLIDATION_CHANGELOG.md is the ledger. VisualForge plugin
  refresh spawned as separate task (running in Amin's other session).
- **Global orchestrator prompts upgraded** (`~/.claude/rules/orchestrator-mode.md` + `~/.codex/AGENTS.md`
  twin, in parity): de-pinned model names ("never run the critic on a weaker model than the implementer");
  dispatch-brief 6-part contract section; direct-implement vs plan-first routing (destructive ops always
  plan-first; amend BOTH running agent + plan file on scope change); commit-before-tree-touching-reviewer
  (PR #152 class); "Agent files are standing briefs" maintenance bar; auditor cadence extended with the
  3 NEW LENSES: **ui-verifier** (rendered surface at breakpoints — 2026-06-28 invisible-toggle class),
  **performance-auditor** (N+1/index/re-render/bundle — never-audited class), **release-verifier**
  (post-deploy: deploy status + /api/ready + reachability + Sentry sweep — 2026-06-19 broken-prod class;
  merge NOT closed without its verdict); sprint-close sweeps re-triage every OPEN backlog row.
- **Dialer branch `chore/doctrine-setup-upgrade` → PR #160** (9 commits): .codex/rules mirror KILLED
  (single source `.claude/rules/`, ~28 docs repointed, historical snapshots keep dated paths);
  `gate:rules-wiring` (loader resolution + discoverability + mirror-absent) + `gate:tx-rollback`
  (WARN-only, closes TX-ROLLBACK-RETURN-001) both in gates:all; DOCUMENTATION_INDEX rebuilt live;
  pattern 7 (exhaustive dispatch briefs) in CLAUDE/AGENTS/handoff/sprint-template; journey L15; all 6
  agents hardened to the standing-brief bar; 3 new lens agents created + cadence in sprint-rigor §10.
  verify EXIT 0; adversarial review ACCEPT (findings remediated); MERGED (see ALL DONE below).

**IN FLIGHT:**
- **CoachAI branch `chore/doctrine-parity`** (worktree `.claude/worktrees/doctrine-parity`): implementer
  executing the approved plan (scratchpad `coachai-doctrine-parity-plan.md`): 3 new .mdc rules
  (centralization w/ real registry table, authority-boundary Part-B "CoachAI coaches; humans decide",
  slice-rigor), test-intent v2 + tx-rollback rule extensions, 3 new agents + hardening the 2 existing
  auditors (amendment sent), gate:tx-seam + gate:ephemeral-listen ports (4 listen(0) fixes), verify +
  gates:all aggregates, CI backend-build gap closed, check:ui-source alias deleted (12 refs). Amendments
  queued: NO notify-failure jobs. AFTER its report: verify claims → CoachAI's 3 lens agents (spec §E in
  scratchpad new-lens-agents-spec.md) → adversarial review → PR → merge.

**ALL DONE (2026-07-02, end of session):**
- Dialer: PR #160 (doctrine) + #162 (L16 + uptime monitor) + #163 (closed-loop learning) all MERGED;
  `uptime-monitor` Railway cron LIVE (first run verified healthy); prod outage (detached domain)
  found by release-verifier's first probe + fixed in 20s.
- CoachAI: PR #114 (parity) + #115 (closed-loop learning) MERGED; both stacks deploy-verified.
- Closed-loop learning: global rules (orchestrator-mode §Closed-loop learning + doctrine-loop
  fleet-as-control-surface) + all 17 agents (findings sections + learned-classes live logs).
- **`bootstrap-orchestrator` skill BUILT + REGISTERED** (real dir `~/.codex/skills/bootstrap-orchestrator`,
  junction in `~/.claude/skills`; 38 files: SKILL.md 6-step generator, HOWTO.md for Amin,
  ARCHITECTURE.md w/ origin incidents, templates/ — 9 agent roles, rules, gates, docs skeletons,
  6-part brief templates, CI + uptime patterns; 451 placeholders, zero product-fact leakage,
  gates proven to bite). The 3 user-level agents upgraded to the standing-brief bar + loop wiring.
  Invoke: "bootstrap this project" in any repo.
- **Responsive doctrine slice MERGED (PR #165, `ecdca5a`)**: responsive-design.md standard (modes/
  ban+ladder/intrinsic-first/process) + check:responsive WARN gate + 14-test meta-suite + frontend-rules
  blocking section + ui-verifier assertion battery + BUX-021 + RESPONSIVE-DEBT-001. Review remediation:
  calibration notes reworded to clean-0-baseline (backlog row = count authority, never restate), R5
  dead branch collapsed. Bootstrap templates synced ({{RESPONSIVE_DOC}} + battery in frontend-rules/
  ui-verifier templates + rules README); CoachAI echo PR #116 (rules .mdc + ui-verifier, adapted).
  See [[responsive-doctrine]]. CoachAI echo MERGED (#116, `f3551046`). Post-merge release-verifier:
  DEPLOY-VERIFIED (api SUCCESS, /api/ready all-healthy both hosts, frontend 200, worker clean); its 2
  doctrine-loop findings ROUTED same-turn into all 3 release-verifier standing briefs (dialer #167
  merged, CoachAI #117 merged, bootstrap template direct): (a) Sentry-MCP-unreachable → sweep is
  explicitly DEGRADED (log-grep substitute + mandatory honesty-clause disclosure, never "0 new issues"
  from logs); (b) merge↔deploy correlation from commit/deploy timestamps WITH offsets, never the
  prompt's wall-clock label. REMAINING from the responsive thread: the per-surface remediation phase
  only — task #10 (mockup-first, Amin approves each surface's contract; cockpit > comms > settings >
  admin; authenticated surfaces need a logged-in ui-verifier measurement pass first).
- New global orchestrator lessons routed this session: worktree-paths pre-check (wrong-tree edit),
  stale-base guard extended to READING (a builder read the 5-behind local main and "verified" a
  false absence; local mains can be detached-HEAD — pull needs explicit `origin main`), MSYS
  path-mangling corrupts `git show origin/main:path` colon-args in this Git Bash (use `git grep
  <ref> -- <path>` or MSYS_NO_PATHCONV=1).

Loopholes named-not-agent-fixed: dependency-update cadence (offer a cron), load testing (phase-gated to
~50 tenants w/ OPS-002), UAT (release-verifier reduces Amin-as-first-detector). Declined-with-reason:
an agents-structure gate asserting the two loop sections exist (class never actually bit — the one
"miss" was a stale-read false positive; revisit if it ever really bites).
