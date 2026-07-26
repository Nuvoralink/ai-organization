---
name: gh-pr-checks-watch-gotchas
description: "gh pr checks --watch exits early two ways (pre-registration \"no checks reported\" + wsarecv network resets) — poll for registration first, and treat a dead watch as unknown-status, not failure"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dacc601b-7d2d-4bb9-8e59-1c3225651b36
---

`gh pr checks <n> --watch` is not a reliable fire-and-forget CI gate on this box. Two failure modes (all hit 2026-07-03, one session):

1. **Registration lag** — polled in the first ~seconds after a push, it prints `no checks reported on the '<branch>' branch` and EXITS (2× in one session). The push→checks-registered window can exceed 30s.
2. **Network reset** — long watches die mid-pending with `wsarecv: An existing connection was forcibly closed` (GraphQL poll dropped). The exit code 1 means *the watch died*, not that CI failed.

**Why:** the watch trusts its first poll; a fresh push has no check-runs yet, and Windows/GH GraphQL long-polls get RST periodically.

**How to apply:** wrap every watch with a registration-tolerant preamble, and on ANY nonzero exit re-derive status with a plain `gh pr checks <n>` before concluding anything (loop-discipline "verify the critic" — the watch's exit is the piped-status class of lie):

```bash
for i in 1 2 3 4 5; do sleep 20; out=$(gh pr checks <N> 2>&1); [ "${out#no checks}" = "$out" ] && break; done
gh pr checks <N> --watch --interval 30
```

Related: [[ci-not-gated-on-main]] (the merge gate is local verification, so a lying watch matters), [[periodic-branch-sync]].
