# Repo hygiene + verification traps (install at bootstrap, not after the first incident)

Every item here was a *measured* failure in a live repo, not a precaution. Each names the anchor so a
future agent can weigh it instead of obeying it. Install these while the repo is small — retrofitting
a line-ending policy or a test registry after 1600 files and 60 branches is what makes them "too big
to do now."

---

## 1. `.gitattributes` — normalize line endings on day one

**Anchor (Nuvora CoachAI, 2026-07-29).** No `.gitattributes` with `core.autocrlf=true`. Every commit
emitted `LF will be replaced by CRLF`, and a byte-comparing gate (`gate:filemap`) had to normalize
endings *defensively* rather than compare what it meant to — otherwise it was red on every Windows
clone regardless of staleness. **A permanently red gate is worse than no gate: it teaches people to
ignore it.**

```
* text=auto eol=lf
*.png binary
*.jpg binary
*.woff2 binary
# …and any other binary the repo carries
```

**MEASURE BEFORE YOU FEAR IT.** The instinct is "this renormalizes the whole tree, it's dangerous."
Check instead — one command:

```bash
git ls-files --eol | awk '$1 ~ /crlf/ {c++} END {print c+0}'   # files stored CRLF in the index
```

In CoachAI that returned **0 of 1632**: the committed content was already pure LF and the CRLF existed
only in working trees, manufactured on checkout. `git add --renormalize .` changed **0 files**. The
change was tiny; the fear was not measured. If the count is genuinely large, that is a real
renormalization and belongs in its own reviewed commit.

**Generated artifacts:** add `<ARTIFACT> merge=ours` — and document that it is **INERT** until
`git config merge.ours.driver true` is run once per clone. A repo cannot set a clone's merge drivers.
A line that looks like protection but isn't is worse than no line.

---

## 2. Branch reconciliation — "is this merged?" has four wrong answers

**Anchor (CoachAI, 2026-07-29).** Four signals each lied about the same branches in one session:

| Signal | What it actually measures | Defeated by |
|---|---|---|
| `git log base..branch` | commit reachability by **SHA** | rebase / squash rewrites SHAs |
| `git cherry` | **patch-id** (diff + context) | rebase onto a new base, squash, conflict resolution |
| commit subjects | titles | squash-merge replaces them with the PR title |
| file presence | "not in base" | conflates *branch added it* with **base deleted it** |

None is broken; each answers a narrower question. A repo with a **mixed** merge strategy defeats all
four at once. Worse, a squash-only repo (GitHub setting) guarantees patch-id never matches.

**The answerable question**, per file the branch's *own* commits touched: is the content already in
base, was it retired from base after the fork, or did this exact blob ever exist in base history for
that path? Anything else is a real difference a human reads. Install `sweep-merged-branches.mjs`
(dry-run default; `--apply` deletes only `SAFE`).

**Two bugs that tool hit — expect them in any port:**
- `git branch -r` lists the **bare remote** (`origin`) alongside real refs. Classified `SAFE`, `--apply`
  would have run `git push origin --delete origin`. It hid at line 1 of a 63-line output; a 2-branch
  repo put it alone on screen. *Small fixtures earn their keep.*
- One `ls-tree` per commit per path is O(commits × files) — a 62-branch sweep ran past 10 minutes.
  `git log --find-object` is the fast form. Diff verdicts before/after to prove the optimization
  changed only speed.

**Known limit:** a *revert-only* branch reads as landed, because its blob exists in base history.
Deleting it loses no content base hasn't seen, but loses the intent. Merge or escalate before sweeping.

**Why this matters at bootstrap:** branch litter compounds. Measured in CoachAI — **65% of the 20 most
recent merged PRs left their branch on the remote** (vs 52.5% of the older 40). Every stale ref is a
thing that looks like unmerged work, and every look costs a wrong answer from the table above.

---

## 3. Two silent false negatives that make a broken command look like a finding

Both measured 2026-07-29. Both produce output **byte-identical to a true negative**, which is what
makes them dangerous.

**(a) MSYS mangles `<ref>:<dot/path>` on Git Bash / Windows.**

```
git show "origin/main:.claude/agents/x.md"
fatal: ambiguous argument 'origin\main;.claude\agents\x.md'
```

`/`→`\` and `:`→`;` when the path after the colon is **dot-prefixed**. `origin/main:AGENTS.md` is fine;
`origin/main:.claude/…` is not. Then it stacks: `2>/dev/null` hides the error → a trailing pipe eats
the exit code → `grep -c` prints `0` → **reads as "the content is absent."** This nearly produced a
false report that a colleague's work had been destroyed.

It aims squarely at control planes: `.ai-organization/`, `.claude/`, `.cursor/`, `.codex/` are all
dot-prefixed — **the files agents inspect most**.

```bash
git ls-tree <ref> -- <path>          # safe form
MSYS_NO_PATHCONV=1 git show <ref>:<path>   # or disable conversion for that call
```

**(b) A trailing `| head` / `| tail` / `echo` replaces the exit code you care about.**
Measured: `bash -c 'false; echo "EXIT: $?"'` prints `EXIT: 1` and **exits 0**. A background-task
notification then reports success for a failed gate. Required form:

```bash
cmd > out.log 2>&1; rc=$?; echo "EXIT: $rc"; exit $rc
```

**The rule both collapse into — put it in the project's always-on rules:**
> **An empty, zero, or capped result is a claim about your tool until the command is proven to have run.**

Also covers `-N` caps read as totals (`git log --oneline -40 --merges | wc -l` returning 40 means "at
least 40", not "40").

---

## 4. Test registries: discovery-driven, so forgetting makes it RUN

**Anchor (CoachAI, 2026-07-29).** 274 regression scripts on disk; a hand-maintained chain ran 12.
**262 ran nowhere** — including one a decision register cited as its proof, which had been RED on main
for an unknown period with no job able to see it.

A hand-kept list drifts silently because the failure is invisible: nothing reports "you forgot me."

**Invert the default.** Discover every test; a registry records only *deviations* (needs-a-database,
quarantined). Adding a test requires no registry edit; **forgetting the registry makes a script RUN,
never silently skip.** Quarantine entries carry reason, disposition, owner, date — and are named on
every run, so a skip is never silent.

## 5. The static lane must be hermetic by construction

Same anchor. Pre-set an **unreachable database URL and fake provider credentials** before the lane
runs, and rely on `dotenv` not overriding already-set vars. Then routine CI **structurally cannot**
bill a provider call or touch a real database — it is not a matter of every test remembering to mock.

This caught a regression making **real, metered OpenAI calls** on every run.

## 6. Source-text sentinels: scope them, or prefer behaviour

Same anchor. **79 of 274** CoachAI regressions asserted *source text* rather than behaviour. Two broke
in one week against **correct** refactors — including one that went red because a prompt fragment was
centralized into a shared constant, i.e. the refactor made the guarantee *stronger*.

- Prefer asserting the **rendered artifact** (the prompt the model receives, the response the client
  gets), reached through the real builder.
- If a scan is genuinely the only option, scope it to the **exact predicate it can certify** — the
  defining line, not a character window across a 65KB file.
- Name the level honestly: a prompt-assembly test proves *plumbing*, never *behaviour*.

---

## 7. Managed files: know before you edit, and never hash raw bytes to compare them

Two failures from the same 2026-08-05 promotion, both cheap to prevent and both expensive to debug.

**(a) The fork trap fires on EDIT, not on review — so the warning has to reach the editor.** A control-plane MANAGED file lives in a project like any other file. Editing it there forks the digest-pinned source: the parity gate fails, and the next install silently reverts the work. It bit twice in one session — once when a merged change added a step to a delivered `orchestration-playbook.md`, once when an agent added a step to a delivered `AGENTS.md`. Both were *correct content in the wrong place*; the fix each time was to move the edit to the overlay source and re-deliver.

The project already knows the answer — make agents ask it before editing anything control-plane-adjacent (`AGENTS.md`, `CLAUDE.md`, `.claude/**`, `scripts/check-*.mjs`, `.ai-organization/**`, `docs/agent-prompts/**`):

```bash
# Is this file managed? Non-empty output = edit the OVERLAY SOURCE, not this copy.
node -e "const o=require('./.ai-organization/ownership.json');console.log((o.managedFiles||[]).map(r=>r.path).filter(p=>p===process.argv[1]).join('\n'))" <path>
```

Put that question in the project's agent router next to the worktree step, so it is asked at edit time rather than discovered at gate time.

**(b) Content-identity hashing must be line-ending insensitive — and decide that by CONTENT, never by an extension allowlist.** Git may materialize the same committed text as LF or CRLF depending on the checkout (`core.autocrlf`, or a worktree created under different settings). A hasher that sees raw bytes then reports "parity mismatch" in one checkout and passes in another with `git status` clean in both — unexplainable, and it sends the reader hunting for a change nobody made.

The subtle version is worse than the obvious one. A hasher that normalizes *only extensions on an allowlist* looks correct and is silently broken for everything the list forgot — an allowlist here is a **denylist-by-omission**, and the next text extension anyone adds inherits the bug. Live instance (2026-08-05): the control plane's `normalizedBytes` normalized `.md`/`.json`/`.mjs`/… but not `.mdc`, so a project's Cursor rules reported permanent overlay drift while being byte-identical after normalization. Detect binary by scanning for a **NUL byte** and normalize everything else:

```js
function normalizedBytes(buffer) {
  if (buffer.includes(0)) return buffer;            // binary: normalizing corrupts the digest
  return Buffer.from(buffer.toString('utf8').replace(/\r\n/g, '\n'));
}
```

**Do not route RAW hashes through it.** Two hash purposes coexist and must not be merged: *content identity* ("is this the same content?" — drift, install comparison) is normalized; *exact-bytes integrity* ("were these bytes touched at all?" — rollback snapshots, tamper detection, evidence bundles) stays raw, because there a CRLF rewrite **is** a real change. When auditing, classify each hasher by purpose before changing it.

Fix the working-tree cause too: give every text extension an explicit `eol=lf` in `.gitattributes` (§1) — `* text=auto` alone still checks out CRLF on Windows. And note that changing a hash function **invalidates stored digests**: recompute or refresh every lock/manifest it feeds in the same change.

## 8. Killing a gate run orphans its strict-port server, and the NEXT run reads as a code defect

If any gate in the chain starts a server on a fixed port (a Playwright/e2e lane is the usual one — `vite --port 4173 --strictPort`), **killing that run does not kill the server.** Stopping a background task reaps the parent shell; the detached child survives. The next run then dies at that gate with

```
Error: http://127.0.0.1:4173 is already used, make sure that nothing is running on the port/url
```

which looks like a broken gate and sends the reader into the diff. It is the same descendant-survival class the orchestration playbook documents for bounded agent dispatches, arriving through the gate chain instead.

**Before re-running a gate chain you killed, sweep for the orphan** — and identify it before killing, so you never kill an unrelated dev server:

```powershell
Get-NetTCPConnection -LocalPort <port> -State Listen | ForEach-Object {
  (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)").CommandLine
}   # confirm it names YOUR worktree path, then Stop-Process -Id <pid> -Force
```

Two durable reductions, in preference order: have the e2e lane bind an **ephemeral** port (or `reuseExistingServer` in CI-local mode) so a stale child cannot block it at all; and if the port must stay fixed, list it in the reservation config's `RESERVED_PORTS` so no agent is ever handed it (see "Shared-namespace reservation" in `gates-all-wiring.md`). Prefer killing the run's whole descendant tree in the first place — that is what the bounded-runner helper exists for.

## Install checklist

- [ ] `.gitattributes` with `* text=auto eol=lf` + binaries; `git ls-files --eol` measured, not assumed
- [ ] `<ARTIFACT> merge=ours` for each generated file, documented as inert without per-clone config
- [ ] `sweep-merged-branches.mjs` + `sweep:branches` script (dry-run default)
- [ ] The two false-negative traps + the empty-result rule in the always-on rules
- [ ] Test discovery inverted; registry holds deviations only
- [ ] Static lane pre-sets unreachable DB + fake credentials
- [ ] Every generated artifact has a **checker**, not just a generator (see `gates-all-wiring.md`)
