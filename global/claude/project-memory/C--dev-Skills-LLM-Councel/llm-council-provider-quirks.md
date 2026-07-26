---
name: llm-council-provider-quirks
description: "Live-verified CLI/REST integration gotchas for the Idea Council's provider adapters"
metadata: 
  node_type: memory
  type: reference
  originSessionId: a0470bf2-eae0-43a4-909c-bb0ca9886586
---

Provider-adapter gotchas found on the Idea Council's first live run ([[llm-council-project]], `council/providers.py`):

- **Standalone `claude` CLI needs its own `claude /login`** — it does NOT inherit the Claude desktop app's credentials (`~/.claude/.credentials.json` is the app's). Without login, `claude -p` returns `{"is_error":true,"result":"Not logged in · Please run /login"}`. Blocks the Champion + web-research seats until logged into the Ultimate sub. The adapter strips `ANTHROPIC_API_KEY` from the subprocess env to force subscription billing.
- **Codex: embed the schema in the PROMPT + read the `-o` (`--output-last-message`) file; do NOT use `--output-schema`.** Native `--output-schema` crashes on complex schemas (no output, exit 1) though a trivial one works. Codex loads MCP servers from `~/.codex/config.toml` (e.g. Neon) whose auth failure prints `rmcp::transport: worker quit ... AuthRequired` and can flip exit code nonzero AFTER writing a valid answer — so read the `-o` file first and accept a parseable result regardless of exit code. `--ignore-user-config` is NOT a fix (drops subscription provider/auth routing → fast-fail at ~3s).
- **Windows: npm CLIs resolve to `.CMD`** via `shutil.which`; run them through `cmd /c`, and pass the prompt on STDIN (not argv) to avoid quoting hell.
- **Fireworks** unavailable on this account (all models 404, `/models` 500) → End-User seat moved to DeepSeek V3 (`deepseek-chat`).
- The honest degraded-state design proved itself: the first run had 3 seats fail and still produced a useful memo, naming every failure and marking all claims `inferred` (no fabricated sources).

Robustness lessons (2026-06-26 session, council + [[studio-tool]] — fixes now in code):
- **Synthesizer non-JSON kills the whole run.** A council run once failed at the LAST step (`Synthesizer unavailable (no parseable JSON in reply)`) after ~15 min of good work, because the final synth call hard-raised on one bad reply. FIX: both engines now ROTATE through `SYNTHESIZER_ROTATION` (claude→gemini→codex) on a no-usable-output reply before hard-failing. Don't let one final-seat hiccup waste a run.
- **The web-research seat fails transiently** (returned `unavailable` with `err=None` once, dropping a whole run to inference-only) — the studio now retries the research/compliance web call ONCE (`_research_seat_call`) before degrading.
- **Long background runs get stranded by session teardowns.** ~15-20 min `run_council.py` / `run_studio.py` jobs launched via Bash `run_in_background` were repeatedly killed mid-flight when the Claude Code session cycled (4× in one session; verify via empty output file + no saved run + no python process). Background completion is ~50/50. For a SHORT critical grounded step, run it in the FOREGROUND instead (tied to the turn, immune to teardown) — e.g. `scripts/ground_compliance.py` re-verifies just the compliance section of a saved run's copy in one foreground web call. For the full pipeline, relaunch on strand (it eventually lands) or accept a faster `--fast` pass.
