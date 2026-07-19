import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { test } from "node:test";
import path from "node:path";
import { PassThrough } from "node:stream";

import {
  auditObservedTools,
  appendHandoffSnapshot,
  buildBoundarySettings,
  buildClaudeArgv,
  captureGitWorktreeState,
  createDispatchPlan,
  DEFAULT_MAX_RUNTIME_MS,
  dispatchClaude,
  materializeGitHubHandoff,
  materializePullRequestDiff,
  normalizeGitHubHandoffResponse,
  parsePullRequestDiffScope,
  parsePositiveInteger,
  probeDispatchBoundaryCapability,
  resolveClaudeExecutable,
  resolveGhExecutable,
  resolveGitExecutable,
  summarizeHandoffSnapshot,
  summarizePullRequestDiff,
  terminateProcessTree,
  validateBypassPermissionsBrief,
  validateBoundarySettingsText,
  validateHandoffRef,
  validateMcpConfigText,
  validateNoPromptFileExpansion,
  verifyImplementationChanges,
} from "./dispatch-claude-cli.mjs";
import {
  BOUNDARY_SCHEMA_VERSION,
  createBoundaryManifest,
  evaluateBoundaryToolUse,
} from "./dispatch-boundary-hook.mjs";

const CONFIG_PATH = path.resolve("C:/Temp/claude-dispatch/mcp.json");
const SETTINGS_PATH = path.resolve("C:/Temp/claude-dispatch/settings.json");
const READ_ONLY_TOOLS = ["Read", "Glob", "Grep", "WebFetch", "WebSearch"];
const IDENTITY_REALPATH = (candidate) => path.resolve(candidate);
const BASE_OID = "a".repeat(40);
const HEAD_OID = "b".repeat(40);
const MERGE_BASE_OID = "c".repeat(40);

function graphResponse({ type = "PullRequest", commentBody = "latest instruction", headOid = HEAD_OID } = {}) {
  const common = {
    __typename: type,
    number: 249,
    url: `https://github.com/acme/dialer/${type === "Issue" ? "issues" : "pull"}/249`,
    state: "OPEN",
    title: "Bounded dispatcher change",
    body: "Use the durable artifact as authority.",
    updatedAt: "2026-07-19T12:00:00Z",
    comments: {
      pageInfo: { hasPreviousPage: false },
      nodes: [{
        author: { login: "reviewer" },
        body: commentBody,
        createdAt: "2026-07-19T12:01:00Z",
        updatedAt: "2026-07-19T12:02:00Z",
        url: "https://github.com/acme/dialer/pull/249#issuecomment-1",
      }],
    },
  };
  if (type === "Issue") return { data: { repository: { issueOrPullRequest: common } } };
  return {
    data: {
      repository: {
        issueOrPullRequest: {
          ...common,
          baseRefName: "main",
          baseRefOid: BASE_OID,
          headRefName: "codex/dispatcher",
          headRefOid: headOid,
          reviews: {
            pageInfo: { hasPreviousPage: false },
            nodes: [{
              author: { login: "maintainer" },
              state: "CHANGES_REQUESTED",
              body: "Read the newest comment.",
              submittedAt: "2026-07-19T12:03:00Z",
              url: "https://github.com/acme/dialer/pull/249#pullrequestreview-1",
            }],
          },
          commits: {
            pageInfo: { hasPreviousPage: false },
            nodes: [{
              commit: {
                oid: headOid,
                messageHeadline: "Implement dispatcher",
                committedDate: "2026-07-19T12:04:00Z",
                statusCheckRollup: {
                  state: "PENDING",
                  contexts: {
                    pageInfo: { hasNextPage: false },
                    nodes: [{
                      __typename: "CheckRun",
                      name: "verify",
                      conclusion: null,
                      status: "IN_PROGRESS",
                      detailsUrl: "https://github.com/acme/dialer/actions/runs/1",
                      completedAt: null,
                    }],
                  },
                },
              },
            }],
          },
        },
      },
    },
  };
}

function pullSnapshot(options = {}) {
  return normalizeGitHubHandoffResponse(graphResponse(options), "acme/dialer#249");
}

function pullDiffArtifact({
  patch = "diff --git a/src/dispatcher.mjs b/src/dispatcher.mjs\n",
  changedFiles = ["src/dispatcher.mjs"],
  fullChangedFiles = changedFiles,
  purpose = "full_pr_review",
  requestedPaths = purpose === "full_pr_review" ? [] : changedFiles,
  baseOid = MERGE_BASE_OID,
} = {}) {
  const inventory = (paths, { includeRaw = false } = {}) => ({
    changed_files: [...paths].sort(),
    changed_file_count: paths.length,
    changed_files_sha256: createHash("sha256").update([...paths].sort().join("\0"), "utf8").digest("hex"),
    ...(includeRaw ? {
      raw_diff: `:100644 100644 ${BASE_OID} ${HEAD_OID} M\0${paths.join("\0")}\0`,
      raw_diff_bytes: Buffer.byteLength(`:100644 100644 ${BASE_OID} ${HEAD_OID} M\0${paths.join("\0")}\0`),
      raw_diff_sha256: createHash("sha256").update(`:100644 100644 ${BASE_OID} ${HEAD_OID} M\0${paths.join("\0")}\0`, "utf8").digest("hex"),
    } : {}),
  });
  const fullInventory = inventory(fullChangedFiles, { includeRaw: true });
  const scopedInventory = inventory(changedFiles);
  const wholePrReview = purpose === "full_pr_review";
  const partialReviewScope = purpose === "partial_pr_review";
  return {
    schema_version: 2,
    source: "local_git_exact_oid_diff",
    repository: "acme/dialer",
    live_base_oid: BASE_OID,
    merge_base_oid: MERGE_BASE_OID,
    head_oid: HEAD_OID,
    full_pr_inventory: fullInventory,
    patch_scope: {
      purpose,
      base_oid: baseOid,
      requested_paths: requestedPaths,
      ...scopedInventory,
      patch,
      patch_bytes: Buffer.byteLength(patch),
      patch_sha256: createHash("sha256").update(patch, "utf8").digest("hex"),
      whole_pr_review: wholePrReview,
      partial_review_scope: partialReviewScope,
      outside_patch_scope_full_pr_file_count: fullChangedFiles.length - changedFiles.length,
      unreviewed_full_pr_file_count: purpose === "bounded_implementation" ? null : fullChangedFiles.length - changedFiles.length,
    },
  };
}

function diffArtifactForRequest(_snapshot, _cwd, request) {
  if (request.purpose === "implementation") {
    return pullDiffArtifact({ purpose: "bounded_implementation", requestedPaths: request.paths });
  }
  return pullDiffArtifact();
}

function implementationPrompt(overrides = {}) {
  const contract = {
    read_paths: ["."],
    edit_paths: ["src/dispatcher.mjs", "src/dispatcher.test.mjs"],
    skill_names: [],
    boundaries: ["No deploy, merge, external contact, or product-repository write."],
    capability_probe: { tool: "Edit", path: "src/dispatcher.mjs" },
    authority: { irreversible: false, billed: false, external_contact: false },
    ...overrides,
  };
  return `Context: bounded implementation.\nCLAUDE_DISPATCH_BOUNDARY_JSON:${JSON.stringify(contract)}\n1. Probe the narrowest required Edit before grounding.`;
}

const ACCEPTED_BOUNDARY_PROBE = () => ({
  claudeHookActivated: true,
  hookAllowProbe: true,
  hookDenyProbe: true,
  claudeSettingsAccepted: true,
});

function preToolEvent(root, toolName, toolInput) {
  return {
    session_id: "test-session",
    transcript_path: path.join(root, "transcript.jsonl"),
    cwd: root,
    permission_mode: "bypassPermissions",
    hook_event_name: "PreToolUse",
    tool_name: toolName,
    tool_input: toolInput,
    tool_use_id: "toolu_test",
  };
}

function toolEvent(name, input = {}, id = `toolu_test_${name.toLowerCase()}`) {
  return JSON.stringify({
    type: "assistant",
    message: { content: [{ type: "tool_use", id, name, input }] },
  });
}

function preToolHookStreamEvent(name, input = {}, id = `toolu_test_${name.toLowerCase()}`) {
  return JSON.stringify({
    type: "hook_event",
    hook_event: {
      hook_event_name: "PreToolUse",
      tool_name: name,
      tool_input: input,
      tool_use_id: id,
    },
  });
}

function boundedToolEvent(name, input = {}, id = `toolu_test_${name.toLowerCase()}`) {
  return `${preToolHookStreamEvent(name, input, id)}\n${toolEvent(name, input, id)}`;
}

async function controlledDispatch(t, { parentAlive = true } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-lifetime-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const promptFile = path.join(root, "prompt.md");
  const stdoutFile = path.join(root, "out", "result.jsonl");
  const stderrFile = path.join(root, "out", "error.log");
  await writeFile(promptFile, "bounded prompt", "utf8");

  const child = new EventEmitter();
  child.pid = 4242;
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  const timeouts = [];
  const intervals = [];
  const clearedTimeouts = [];
  const clearedIntervals = [];
  const terminationCalls = [];
  const signalEmitter = new EventEmitter();
  let releaseSpawn;
  const spawned = new Promise((resolve) => {
    releaseSpawn = resolve;
  });

  const dependencies = {
    platform: "win32",
    parentPid: 3131,
    spawnProcess: () => {
      releaseSpawn();
      return child;
    },
    isProcessAlive: () => parentAlive,
    terminateProcessTree: (pid, options) => {
      terminationCalls.push({ pid, options });
      setImmediate(() => child.emit("close", null, "SIGTERM"));
    },
    signalEmitter,
    setTimeoutFn: (callback, delay) => {
      const handle = { callback, delay, unref() {} };
      timeouts.push(handle);
      return handle;
    },
    clearTimeoutFn: (handle) => clearedTimeouts.push(handle),
    setIntervalFn: (callback, delay) => {
      const handle = { callback, delay, unref() {} };
      intervals.push(handle);
      return handle;
    },
    clearIntervalFn: (handle) => clearedIntervals.push(handle),
  };
  const promise = dispatchClaude(
    {
      cwd: root,
      promptFile,
      tools: READ_ONLY_TOOLS,
      mode: "dontAsk",
      stdoutFile,
      stderrFile,
      maxRuntimeMs: 4321,
    },
    dependencies,
  );
  await spawned;
  return {
    child,
    promise,
    timeouts,
    intervals,
    clearedTimeouts,
    clearedIntervals,
    terminationCalls,
    signalEmitter,
  };
}

test("Proves strict MCP rejects an empty object; mutation: replace the schema-valid config with {}", () => {
  assert.throws(() => validateMcpConfigText("{}"), /exactly the schema/u);
});

test("Proves MCP input must be valid JSON; mutation: strip quotes from the schema keys", () => {
  assert.throws(
    () => validateMcpConfigText("{mcpServers:{}}"),
    /not valid JSON/u,
  );
});

test("Proves a no-shell allowlist rejects both shell tool events; mutation: observe Bash or PowerShell", () => {
  const noShellTools = ["Read", "Glob", "Grep"];
  assert.throws(
    () => auditObservedTools(toolEvent("Bash"), noShellTools),
    /Bash/u,
  );
  assert.throws(
    () => auditObservedTools(toolEvent("PowerShell"), noShellTools),
    /PowerShell/u,
  );
});

test("Proves observed-tool audit accepts only an event listed by its already-validated profile", () => {
  assert.deepEqual(auditObservedTools(toolEvent("Read"), READ_ONLY_TOOLS), ["Read"]);
});

test("Proves argv carries --tools and the config path while the prompt stays on stdin", () => {
  const prompt = 'quoted "prompt" with C:\\path and spaces';
  const plan = createDispatchPlan({
    cwd: path.resolve("C:/work tree"),
    promptFile: path.resolve("C:/prompts/a prompt.md"),
    tools: READ_ONLY_TOOLS,
    mode: "dontAsk",
    stdoutFile: path.resolve("C:/out/result.jsonl"),
    stderrFile: path.resolve("C:/out/error.log"),
    mcpConfigPath: CONFIG_PATH,
  });
  assert.equal(plan.shell, false);
  assert.equal(plan.promptTransport, "stdin");
  assert.equal(plan.argv[plan.argv.indexOf("--tools") + 1], READ_ONLY_TOOLS.join(","));
  assert.equal(plan.argv[plan.argv.indexOf("--mcp-config") + 1], CONFIG_PATH);
  assert.equal(plan.argv.includes("--allowedTools"), false);
  assert.equal(plan.argv.includes(prompt), false);
  assert.equal(plan.maxRuntimeMs, DEFAULT_MAX_RUNTIME_MS);
});

test("Proves the dispatch plan exposes its validated internal lifetime bound; mutation: omit maxRuntimeMs from evidence", () => {
  const plan = createDispatchPlan({
    cwd: path.resolve("C:/work tree"),
    promptFile: path.resolve("C:/prompts/a prompt.md"),
    tools: READ_ONLY_TOOLS,
    mode: "dontAsk",
    stdoutFile: path.resolve("C:/out/result.jsonl"),
    stderrFile: path.resolve("C:/out/error.log"),
    mcpConfigPath: CONFIG_PATH,
    maxRuntimeMs: "12345",
    parentPid: 3131,
  });
  assert.equal(plan.maxRuntimeMs, 12345);
  assert.equal(plan.parentPid, 3131);
});

test("Proves GitHub issue, PR, and canonical shorthand handoffs normalize without network access", () => {
  assert.equal(
    validateHandoffRef("https://github.com/acme/dialer/issues/247/"),
    "https://github.com/acme/dialer/issues/247",
  );
  assert.equal(
    validateHandoffRef("https://github.com/acme/dialer/pull/248"),
    "https://github.com/acme/dialer/pull/248",
  );
  assert.equal(validateHandoffRef("acme/dialer#249"), "acme/dialer#249");
});

test("Proves local files and malformed references cannot impersonate durable handoff artifacts; mutation: accept any non-empty string", () => {
  for (const invalid of [
    "C:\\tmp\\local-brief.md",
    "https://example.com/acme/dialer/issues/247",
    "http://github.com/acme/dialer/issues/247",
    "https://github.com/acme/dialer/issues/247?token=secret",
    "https://github.com/acme/dialer/issues/0",
    "acme/dialer#0",
    "acme/dialer",
  ]) {
    assert.throws(() => validateHandoffRef(invalid), /--handoff-ref/u);
  }
});

test("Proves every capability outside the two exact profiles is rejected even when a handoff is present", () => {
  for (const tool of ["Edit", "Write", "Task", "Agent", "Bash", "PowerShell", "NotebookEdit"]) {
    assert.throws(
      () =>
        createDispatchPlan(
          {
            cwd: path.resolve("C:/work tree"),
            promptFile: path.resolve("C:/prompts/a prompt.md"),
            tools: ["Read", tool],
            mode: "dontAsk",
            stdoutFile: path.resolve("C:/out/result.jsonl"),
            stderrFile: path.resolve("C:/out/error.log"),
            mcpConfigPath: CONFIG_PATH,
            parentPid: 3131,
            handoffRef: "acme/dialer#249",
          },
          { platform: "linux" },
        ),
      /exact read-only tool profile/u,
    );
  }
  for (const mode of ["acceptEdits", "default", "delegate", "plan"]) {
    assert.throws(() => buildClaudeArgv({ tools: READ_ONLY_TOOLS, mode, mcpConfigPath: CONFIG_PATH }), /unsupported noninteractive permission mode/u);
  }
});

test("Proves a valid PR handoff is persisted in write-capable plan evidence; mutation: validate then omit the reference from the plan", () => {
  const plan = createDispatchPlan(
    {
      cwd: path.resolve("C:/work tree"),
      promptFile: path.resolve("C:/prompts/a prompt.md"),
      tools: ["Read", "Edit", "Write"],
      mode: "bypassPermissions",
      stdoutFile: path.resolve("C:/out/result.jsonl"),
      stderrFile: path.resolve("C:/out/error.log"),
      mcpConfigPath: CONFIG_PATH,
      settingsPath: SETTINGS_PATH,
      parentPid: 3131,
      handoffRef: "https://github.com/acme/dialer/pull/248/",
    },
    { platform: "linux" },
  );
  assert.equal(plan.dispatchClass, "durable_handoff_required");
  assert.equal(plan.handoffRequired, true);
  assert.deepEqual(plan.handoffTriggerTools, ["Edit", "Write"]);
  assert.equal(
    plan.handoffRef,
    "https://github.com/acme/dialer/pull/248",
  );
});

test("Preserves the explicit read-only diagnostic counterexample without a handoff", () => {
  const plan = createDispatchPlan(
    {
      cwd: path.resolve("C:/work tree"),
      promptFile: path.resolve("C:/prompts/a prompt.md"),
      tools: ["Read", "Glob", "Grep", "WebFetch", "WebSearch"],
      mode: "dontAsk",
      stdoutFile: path.resolve("C:/out/result.jsonl"),
      stderrFile: path.resolve("C:/out/error.log"),
      mcpConfigPath: CONFIG_PATH,
      parentPid: 3131,
    },
    { platform: "linux" },
  );
  assert.equal(plan.dispatchClass, "read_only_diagnostic");
  assert.equal(plan.handoffRequired, false);
  assert.deepEqual(plan.handoffTriggerTools, []);
  assert.equal(plan.handoffRef, null);
});

test("A provided PR handoff is materialized for the exact dontAsk audit profile even though it is optional", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-read-only-pr-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const promptFile = path.join(root, "prompt.md");
  await writeFile(promptFile, "Review only the dispatcher-supplied exact PR diff.", "utf8");
  let handoffCount = 0;
  let diffCount = 0;
  const result = await dispatchClaude({
    cwd: root,
    promptFile,
    tools: READ_ONLY_TOOLS,
    mode: "dontAsk",
    stdoutFile: path.join(root, "out", "stdout.jsonl"),
    stderrFile: path.join(root, "out", "stderr.log"),
    handoffRef: "acme/dialer#249",
    preflight: true,
  }, {
    platform: "linux",
    materializeHandoff: () => { handoffCount += 1; return pullSnapshot(); },
    materializePullRequestDiff: (...args) => { diffCount += 1; return diffArtifactForRequest(...args); },
  });
  assert.equal(result.plan.handoffRequired, false);
  assert.equal(handoffCount, 1);
  assert.equal(diffCount, 1);
  assert.equal(result.plan.pullRequestDiff.headOid, HEAD_OID);
});

test("Proves bounded implementation still requires a handoff while dontAsk dry-run exposes a provided one", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-handoff-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const promptFile = path.join(root, "prompt.md");
  await writeFile(promptFile, "cross-vendor brief", "utf8");
  const common = {
    cwd: root,
    promptFile,
    tools: READ_ONLY_TOOLS,
    mode: "dontAsk",
    stdoutFile: path.join(root, "out", "result.jsonl"),
    stderrFile: path.join(root, "out", "error.log"),
  };
  assert.throws(() => createDispatchPlan({ ...common, tools: ["Read", "Write"], mode: "bypassPermissions", mcpConfigPath: CONFIG_PATH, settingsPath: SETTINGS_PATH, parentPid: 3131 }, { platform: "linux" }), /--handoff-ref.*Write/u);
  const dryRun = await dispatchClaude(
    {
      ...common,
      dryRun: true,
      handoffRef: "acme/dialer#249",
    },
    { platform: "linux", materializeHandoff: () => pullSnapshot(), materializePullRequestDiff: diffArtifactForRequest },
  );
  assert.equal(dryRun.kind, "dry-run");
  assert.equal(dryRun.plan.handoffRequired, false);
  assert.equal(dryRun.plan.handoffRef, "acme/dialer#249");
  assert.match(dryRun.plan.handoffSnapshot.snapshotSha256, /^[a-f0-9]{64}$/u);
  assert.equal(dryRun.plan.pullRequestDiff.liveBaseOid, BASE_OID);
  assert.equal(dryRun.plan.pullRequestDiff.headOid, HEAD_OID);
});

test("Materializes PR URLs, issue URLs, and shorthand through exact shell-free gh argv", () => {
  const calls = [];
  const invoke = (response) => ({
    platform: "linux",
    spawnSyncProcess: (executable, argv, options) => {
      calls.push({ executable, argv, options });
      return { status: 0, stdout: JSON.stringify(response), stderr: "" };
    },
  });
  const pull = materializeGitHubHandoff(
    "https://github.com/acme/dialer/pull/249",
    invoke(graphResponse()),
  );
  const issue = materializeGitHubHandoff(
    "https://github.com/acme/dialer/issues/249",
    invoke(graphResponse({ type: "Issue" })),
  );
  const shorthand = materializeGitHubHandoff(
    "acme/dialer#249",
    invoke(graphResponse()),
  );
  assert.equal(pull.type, "pull_request");
  assert.equal(issue.type, "issue");
  assert.equal(shorthand.type, "pull_request");
  for (const call of calls) {
    assert.equal(call.executable, "gh");
    assert.equal(call.options.shell, false);
    assert.equal(Object.hasOwn(call.options, "encoding"), false);
    assert.equal(call.options.timeout, 20000);
    assert.deepEqual(
      call.argv.map((value) => value.startsWith("query=") ? "query=<graphql>" : value),
      ["api", "graphql", "--method", "POST", "-f", "query=<graphql>", "-f", "owner=acme", "-f", "name=dialer", "-F", "number=249"],
    );
  }
});

test("GitHub materialization rejects invalid UTF-8 bytes before JSON parsing or hashing", () => {
  assert.throws(
    () => materializeGitHubHandoff("acme/dialer#249", {
      platform: "linux",
      spawnSyncProcess: () => ({ status: 0, stdout: Buffer.from([0x7b, 0xff, 0x7d]), stderr: Buffer.alloc(0) }),
    }),
    /GitHub handoff materialization emitted bytes that are not exact UTF-8.*not hashed or dispatched/u,
  );
});

test("GitHub materialization fails closed with distinct bounded-timeout evidence", () => {
  assert.throws(
    () => materializeGitHubHandoff("acme/dialer#249", {
      platform: "linux",
      ghTimeoutMs: 3210,
      spawnSyncProcess: () => ({ error: Object.assign(new Error("spawn timed out"), { code: "ETIMEDOUT" }) }),
    }),
    /materialization timed out after 3210 ms/u,
  );
});

test("Rejects malformed or type-mismatched GitHub materialization responses", () => {
  const malformed = graphResponse();
  delete malformed.data.repository.issueOrPullRequest.title;
  assert.throws(
    () => normalizeGitHubHandoffResponse(malformed, "acme/dialer#249"),
    /handoff\.title must be a string/u,
  );
  assert.throws(
    () => normalizeGitHubHandoffResponse(graphResponse({ type: "Issue" }), "https://github.com/acme/dialer/pull/249"),
    /type does not match/u,
  );
  const oversized = graphResponse();
  oversized.data.repository.issueOrPullRequest.body = "x".repeat((128 * 1024) + 1);
  assert.throws(
    () => normalizeGitHubHandoffResponse(oversized, "acme/dialer#249"),
    /handoff\.body exceeds/u,
  );
});

test("Proves Windows handoff materialization resolves native gh.exe and rejects wrapper-only PATH entries", () => {
  const nativeExecutable = String.raw`C:\Program Files\GitHub CLI\gh.exe`;
  assert.equal(resolveGhExecutable({
    platform: "win32",
    env: { PATH: String.raw`C:\wrapper-only;C:\Program Files\GitHub CLI` },
    fileExists: (candidate) => candidate === nativeExecutable,
  }), nativeExecutable);
  assert.throws(
    () => resolveGhExecutable({
      platform: "win32",
      env: { PATH: String.raw`C:\wrapper-only` },
      fileExists: () => false,
    }),
    /no native gh\.exe was found/u,
  );
  const nativeGit = String.raw`C:\Program Files\Git\cmd\git.exe`;
  assert.equal(resolveGitExecutable({
    platform: "win32",
    env: { PATH: String.raw`C:\wrapper-only;C:\Program Files\Git\cmd` },
    fileExists: (candidate) => candidate === nativeGit,
  }), nativeGit);
});

test("Materializes an exact repository-bound merge-base..head PR diff so unrelated post-branch base commits cannot become phantom deletions", () => {
  const root = path.resolve("C:/worktrees/exact-pr-review");
  const calls = [];
  const spawnSyncProcess = (executable, argv, options) => {
    calls.push({ executable, argv, options });
    const command = argv.join(" ");
    if (command === "rev-parse --show-toplevel") return { status: 0, stdout: `${root}\n` };
    if (command === "status --porcelain=v1 -z --untracked-files=all") return { status: 0, stdout: "" };
    if (command === "config --get remote.origin.url") return { status: 0, stdout: "git@github.com:acme/dialer.git\n" };
    if (command === `rev-parse --verify ${BASE_OID}^{commit}`) return { status: 0, stdout: `${BASE_OID}\n` };
    if (command === `rev-parse --verify ${HEAD_OID}^{commit}`) return { status: 0, stdout: `${HEAD_OID}\n` };
    if (command === "rev-parse HEAD") return { status: 0, stdout: `${HEAD_OID}\n` };
    if (command === `merge-base ${BASE_OID} ${HEAD_OID}`) return { status: 0, stdout: `${MERGE_BASE_OID}\n` };
    if (command === `rev-parse --verify ${MERGE_BASE_OID}^{commit}`) return { status: 0, stdout: `${MERGE_BASE_OID}\n` };
    if (argv[0] === "merge-base" && argv[1] === "--is-ancestor") return { status: 0, stdout: "" };
    if (argv.includes("--name-only")) return { status: 0, stdout: "src/dispatcher.mjs\0src/dispatcher.test.mjs\0" };
    if (argv[0] === "diff") return { status: 0, stdout: "diff --git a/src/dispatcher.mjs b/src/dispatcher.mjs\n" };
    throw new Error(`unexpected git argv: ${command}`);
  };
  const artifact = materializePullRequestDiff(pullSnapshot(), root, { purpose: "review", scope: null }, { platform: "linux", realpathSync: IDENTITY_REALPATH, spawnSyncProcess });
  assert.deepEqual(artifact.full_pr_inventory.changed_files, ["src/dispatcher.mjs", "src/dispatcher.test.mjs"]);
  assert.equal(artifact.live_base_oid, BASE_OID);
  assert.equal(artifact.head_oid, HEAD_OID);
  assert.match(artifact.patch_scope.patch_sha256, /^[a-f0-9]{64}$/u);
  assert.deepEqual(summarizePullRequestDiff(artifact), {
    source: "local_git_exact_oid_diff",
    repository: "acme/dialer",
    liveBaseOid: BASE_OID,
    mergeBaseOid: MERGE_BASE_OID,
    headOid: HEAD_OID,
    fullPrChangedFileCount: 2,
    fullPrChangedFilesSha256: artifact.full_pr_inventory.changed_files_sha256,
    fullPrRawDiffBytes: artifact.full_pr_inventory.raw_diff_bytes,
    fullPrRawDiffSha256: artifact.full_pr_inventory.raw_diff_sha256,
    patchPurpose: "full_pr_review",
    patchBaseOid: MERGE_BASE_OID,
    patchChangedFileCount: 2,
    patchBytes: artifact.patch_scope.patch_bytes,
    patchSha256: artifact.patch_scope.patch_sha256,
    wholePrReview: true,
    partialReviewScope: false,
    outsidePatchScopeFullPrFileCount: 0,
    unreviewedFullPrFileCount: 0,
  });
  assert.equal(calls.every((call) => call.executable === "git" && call.options.shell === false && call.options.timeout === 20000), true);
  assert.equal(calls.some((call) => JSON.stringify(call.argv) === JSON.stringify(["diff", "--binary", "--no-color", "--no-ext-diff", "--no-textconv", "--no-renames", "--unified=80", MERGE_BASE_OID, HEAD_OID, "--"])), true);
});

test("PR diff materialization blocks dirty, mismatched, timed-out, and oversized local evidence while issues need no diff", () => {
  assert.equal(materializePullRequestDiff(normalizeGitHubHandoffResponse(graphResponse({ type: "Issue" }), "acme/dialer#249"), "C:/unused", { purpose: "review", scope: null }, { spawnSyncProcess: () => { throw new Error("must not spawn"); } }), null);
  const root = path.resolve("C:/worktrees/exact-pr-review");
  const baseFake = (mode) => (_executable, argv) => {
    const command = argv.join(" ");
    if (command === "rev-parse --show-toplevel") return { status: 0, stdout: `${root}\n` };
    if (command === "status --porcelain=v1 -z --untracked-files=all") return { status: 0, stdout: mode === "dirty" ? "?? rogue.txt\0" : "" };
    if (command === "config --get remote.origin.url") return { status: 0, stdout: mode === "mismatch" ? "https://github.com/other/repo.git\n" : "https://github.com/acme/dialer.git\n" };
    if (command === `rev-parse --verify ${BASE_OID}^{commit}`) return { status: 0, stdout: `${BASE_OID}\n` };
    if (command === `rev-parse --verify ${HEAD_OID}^{commit}`) return { status: 0, stdout: `${HEAD_OID}\n` };
    if (command === "rev-parse HEAD") return { status: 0, stdout: mode === "wrong-head" ? `${MERGE_BASE_OID}\n` : `${HEAD_OID}\n` };
    if (command === `merge-base ${BASE_OID} ${HEAD_OID}`) return mode === "merge-failure" ? { status: 1, stdout: "" } : { status: 0, stdout: `${BASE_OID}\n` };
    if (argv[0] === "merge-base" && argv[1] === "--is-ancestor") return mode === "ancestry-failure" ? { status: 1, stdout: "" } : { status: 0, stdout: "" };
    if (argv.includes("--name-only")) return { status: 0, stdout: "src/dispatcher.mjs\0" };
    if (argv.includes("--raw")) return { status: 0, stdout: `:100644 100644 ${BASE_OID} ${HEAD_OID} M\0src/dispatcher.mjs\0` };
    if (argv[0] === "diff" && mode === "oversized") return { error: Object.assign(new Error("maxBuffer exceeded"), { code: "ENOBUFS" }) };
    if (argv[0] === "diff" && mode === "timeout") return { error: Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }) };
    return { status: 0, stdout: "diff\n" };
  };
  const review = { purpose: "review", scope: null };
  const deps = (mode, extra = {}) => ({ platform: "linux", realpathSync: IDENTITY_REALPATH, spawnSyncProcess: baseFake(mode), ...extra });
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, review, deps("dirty")), /clean worktree.*rogue\.txt/u);
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, review, deps("mismatch")), /local origin does not match/u);
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, review, deps("wrong-head")), /checkout HEAD does not equal/u);
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, review, deps("merge-failure")), /PR merge-base probe exited/u);
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, review, deps("ancestry-failure")), /ancestry probe exited/u);
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, review, deps("oversized")), /exact full PR diff exceeded.*CLAUDE_PR_DIFF_SCOPE_JSON/u);
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, review, deps("timeout", { gitTimeoutMs: 4321 })), /exact full PR diff timed out after 4321 ms/u);
  const counterexampleCalls = [];
  const cleanFake = baseFake("clean");
  const counterexample = materializePullRequestDiff(pullSnapshot(), root, review, {
    platform: "linux",
    realpathSync: IDENTITY_REALPATH,
    spawnSyncProcess: (executable, argv, options) => { counterexampleCalls.push(argv); return cleanFake(executable, argv, options); },
  });
  assert.equal(counterexample.merge_base_oid, BASE_OID);
  assert.equal(counterexampleCalls.some((argv) => JSON.stringify(argv) === JSON.stringify(["diff", "--binary", "--no-color", "--no-ext-diff", "--no-textconv", "--no-renames", "--unified=80", BASE_OID, HEAD_OID, "--"])), true);
});

test("An 11 MB PR keeps full immutable inventory proof but implementation materializes only declared edit paths", () => {
  const root = path.resolve("C:/worktrees/large-pr-implementation");
  const fullPaths = Array.from({ length: 752 }, (_, index) => `generated/file-${String(index).padStart(3, "0")}.txt`).concat(["src/dispatcher.mjs", "src/dispatcher.test.mjs"]);
  const calls = [];
  const spawnSyncProcess = (_executable, argv) => {
    calls.push(argv);
    const command = argv.join(" ");
    if (command === "rev-parse --show-toplevel") return { status: 0, stdout: `${root}\n` };
    if (command === "status --porcelain=v1 -z --untracked-files=all") return { status: 0, stdout: "" };
    if (command === "config --get remote.origin.url") return { status: 0, stdout: "https://github.com/acme/dialer.git\n" };
    if (command === `rev-parse --verify ${BASE_OID}^{commit}`) return { status: 0, stdout: `${BASE_OID}\n` };
    if (command === `rev-parse --verify ${HEAD_OID}^{commit}`) return { status: 0, stdout: `${HEAD_OID}\n` };
    if (command === "rev-parse HEAD") return { status: 0, stdout: `${HEAD_OID}\n` };
    if (command === `merge-base ${BASE_OID} ${HEAD_OID}`) return { status: 0, stdout: `${MERGE_BASE_OID}\n` };
    if (command === `rev-parse --verify ${MERGE_BASE_OID}^{commit}`) return { status: 0, stdout: `${MERGE_BASE_OID}\n` };
    if (argv[0] === "merge-base" && argv[1] === "--is-ancestor") return { status: 0, stdout: "" };
    const separator = argv.indexOf("--");
    const paths = separator < 0 ? [] : argv.slice(separator + 1);
    if (argv.includes("--name-only")) return { status: 0, stdout: `${(paths.length === 0 ? fullPaths : paths).join("\0")}\0` };
    if (argv.includes("--raw")) return { status: 0, stdout: `:100644 100644 ${BASE_OID} ${HEAD_OID} M\0src/dispatcher.mjs\0` };
    if (argv[0] === "diff" && paths.length === 0) throw new Error("killer mutation: implementation attempted the 11 MB full PR patch");
    if (argv[0] === "diff") return { status: 0, stdout: "diff --git a/src/dispatcher.mjs b/src/dispatcher.mjs\n" };
    throw new Error(`unexpected git argv: ${command}`);
  };
  const requestedPaths = ["src/dispatcher.mjs", "src/dispatcher.test.mjs"];
  const artifact = materializePullRequestDiff(pullSnapshot(), root, { purpose: "implementation", paths: requestedPaths }, { platform: "linux", realpathSync: IDENTITY_REALPATH, spawnSyncProcess });
  assert.equal(artifact.full_pr_inventory.changed_file_count, 754);
  assert.match(artifact.full_pr_inventory.changed_files_sha256, /^[a-f0-9]{64}$/u);
  assert.equal(artifact.patch_scope.purpose, "bounded_implementation");
  assert.deepEqual(artifact.patch_scope.requested_paths, requestedPaths);
  assert.equal(artifact.patch_scope.whole_pr_review, false);
  assert.equal(artifact.patch_scope.partial_review_scope, false);
  assert.equal(artifact.patch_scope.outside_patch_scope_full_pr_file_count, 752);
  assert.equal(artifact.patch_scope.unreviewed_full_pr_file_count, null);
  assert.equal(calls.some((argv) => argv[0] === "diff" && !argv.includes("--name-only") && !argv.includes("--raw") && argv.slice(argv.indexOf("--") + 1).length === 0), false);
});

test("Full PR review reuses its bounded inventory without expanding thousands of changed paths onto Git argv", () => {
  const root = path.resolve("C:/worktrees/wide-pr-review");
  const fullPaths = Array.from({ length: 3000 }, (_, index) => `generated/file-${String(index).padStart(4, "0")}.txt`);
  const calls = [];
  const spawnSyncProcess = (_executable, argv) => {
    calls.push(argv);
    const command = argv.join(" ");
    if (command === "rev-parse --show-toplevel") return { status: 0, stdout: `${root}\n` };
    if (command === "status --porcelain=v1 -z --untracked-files=all") return { status: 0, stdout: "" };
    if (command === "config --get remote.origin.url") return { status: 0, stdout: "https://github.com/acme/dialer.git\n" };
    if (command === `rev-parse --verify ${BASE_OID}^{commit}`) return { status: 0, stdout: `${BASE_OID}\n` };
    if (command === `rev-parse --verify ${HEAD_OID}^{commit}`) return { status: 0, stdout: `${HEAD_OID}\n` };
    if (command === "rev-parse HEAD") return { status: 0, stdout: `${HEAD_OID}\n` };
    if (command === `merge-base ${BASE_OID} ${HEAD_OID}`) return { status: 0, stdout: `${MERGE_BASE_OID}\n` };
    if (command === `rev-parse --verify ${MERGE_BASE_OID}^{commit}`) return { status: 0, stdout: `${MERGE_BASE_OID}\n` };
    if (argv[0] === "merge-base" && argv[1] === "--is-ancestor") return { status: 0, stdout: "" };
    if (argv.includes("--name-only")) return { status: 0, stdout: `${fullPaths.join("\0")}\0` };
    if (argv.includes("--raw")) return { status: 0, stdout: `:100644 100644 ${BASE_OID} ${HEAD_OID} M\0${fullPaths[0]}\0` };
    if (argv[0] === "diff") return { status: 0, stdout: `diff --git a/${fullPaths[0]} b/${fullPaths[0]}\n` };
    throw new Error(`unexpected git argv: ${command}`);
  };
  const artifact = materializePullRequestDiff(pullSnapshot(), root, { purpose: "review", scope: null }, { platform: "linux", realpathSync: IDENTITY_REALPATH, spawnSyncProcess });
  assert.equal(artifact.full_pr_inventory.changed_file_count, 3000);
  assert.equal(artifact.patch_scope.changed_file_count, 3000);
  assert.deepEqual(artifact.patch_scope.requested_paths, []);
  assert.equal(calls.filter((argv) => argv.includes("--name-only")).length, 1);
  assert.equal(calls.some((argv) => fullPaths.some((entry) => argv.includes(entry))), false);
  assert.equal(Math.max(...calls.map((argv) => Buffer.byteLength(JSON.stringify(argv), "utf8"))) < 4096, true);
});

test("Binary patches remain content-bound while invalid Git bytes fail before hashing or prompting", () => {
  const root = path.resolve("C:/worktrees/binary-proof");
  const fake = (blobOid, literal, { invalidPatch = false, invalidRaw = false } = {}) => (_executable, argv) => {
    const command = argv.join(" ");
    if (command === "rev-parse --show-toplevel") return { status: 0, stdout: `${root}\n` };
    if (command === "status --porcelain=v1 -z --untracked-files=all") return { status: 0, stdout: "" };
    if (command === "config --get remote.origin.url") return { status: 0, stdout: "https://github.com/acme/dialer.git\n" };
    if (command === `rev-parse --verify ${BASE_OID}^{commit}`) return { status: 0, stdout: `${BASE_OID}\n` };
    if (command === `rev-parse --verify ${HEAD_OID}^{commit}`) return { status: 0, stdout: `${HEAD_OID}\n` };
    if (command === "rev-parse HEAD") return { status: 0, stdout: `${HEAD_OID}\n` };
    if (command === `merge-base ${BASE_OID} ${HEAD_OID}`) return { status: 0, stdout: `${MERGE_BASE_OID}\n` };
    if (command === `rev-parse --verify ${MERGE_BASE_OID}^{commit}`) return { status: 0, stdout: `${MERGE_BASE_OID}\n` };
    if (argv[0] === "merge-base" && argv[1] === "--is-ancestor") return { status: 0, stdout: "" };
    if (argv.includes("--name-only")) return { status: 0, stdout: "assets/logo.bin\0" };
    if (argv.includes("--raw")) return { status: 0, stdout: invalidRaw ? Buffer.from([0xff]) : `:100644 100644 ${BASE_OID} ${blobOid} M\0assets/logo.bin\0` };
    if (argv[0] === "diff") {
      assert.equal(argv.includes("--binary"), true);
      return { status: 0, stdout: invalidPatch ? Buffer.from([0x64, 0x69, 0x66, 0x66, 0xff]) : `diff --git a/assets/logo.bin b/assets/logo.bin\nGIT binary patch\nliteral ${literal}\n` };
    }
    throw new Error(`unexpected git argv: ${command}`);
  };
  const request = { purpose: "implementation", paths: ["assets/logo.bin"] };
  const first = materializePullRequestDiff(pullSnapshot(), root, request, { platform: "linux", realpathSync: IDENTITY_REALPATH, spawnSyncProcess: fake("1".repeat(40), "AA") });
  const second = materializePullRequestDiff(pullSnapshot(), root, request, { platform: "linux", realpathSync: IDENTITY_REALPATH, spawnSyncProcess: fake("2".repeat(40), "BB") });
  assert.notEqual(first.full_pr_inventory.raw_diff_sha256, second.full_pr_inventory.raw_diff_sha256);
  assert.notEqual(first.patch_scope.patch_sha256, second.patch_scope.patch_sha256);
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, request, { platform: "linux", realpathSync: IDENTITY_REALPATH, spawnSyncProcess: fake("3".repeat(40), "CC", { invalidRaw: true }) }), /not exact UTF-8.*not hashed or dispatched/u);
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, request, { platform: "linux", realpathSync: IDENTITY_REALPATH, spawnSyncProcess: fake("3".repeat(40), "CC", { invalidPatch: true }) }), /not exact UTF-8.*not hashed or dispatched/u);
});

test("Oversized PR review fails closed without one exact caller scope and records partial-review evidence when scoped", () => {
  const root = path.resolve("C:/worktrees/large-pr-review");
  const scopeBase = "d".repeat(40);
  const fullPaths = ["src/dispatcher.mjs", "src/dispatcher.test.mjs", "docs/deleted.md"];
  const fake = ({ nonAncestor = false, emptyScope = false } = {}) => (_executable, argv) => {
    const command = argv.join(" ");
    if (command === "rev-parse --show-toplevel") return { status: 0, stdout: `${root}\n` };
    if (command === "status --porcelain=v1 -z --untracked-files=all") return { status: 0, stdout: "" };
    if (command === "config --get remote.origin.url") return { status: 0, stdout: "git@github.com:acme/dialer.git\n" };
    for (const oid of [BASE_OID, HEAD_OID, MERGE_BASE_OID, scopeBase]) if (command === `rev-parse --verify ${oid}^{commit}`) return { status: 0, stdout: `${oid}\n` };
    if (command === "rev-parse HEAD") return { status: 0, stdout: `${HEAD_OID}\n` };
    if (command === `merge-base ${BASE_OID} ${HEAD_OID}`) return { status: 0, stdout: `${MERGE_BASE_OID}\n` };
    if (argv[0] === "merge-base" && argv[1] === "--is-ancestor") {
      if (nonAncestor && argv[2] === scopeBase && argv[3] === HEAD_OID) return { status: 1, stdout: "" };
      return { status: 0, stdout: "" };
    }
    const separator = argv.indexOf("--");
    const paths = separator < 0 ? [] : argv.slice(separator + 1);
    if (argv.includes("--name-only")) {
      if (paths.length === 0) return { status: 0, stdout: `${fullPaths.join("\0")}\0` };
      return { status: 0, stdout: emptyScope ? "" : `${paths.join("\0")}\0` };
    }
    if (argv.includes("--raw")) return { status: 0, stdout: `:100644 100644 ${BASE_OID} ${HEAD_OID} M\0src/dispatcher.mjs\0` };
    if (argv[0] === "diff" && paths.length === 0) return { status: 0, stdout: "X".repeat(11 * 1024 * 1024) };
    if (argv[0] === "diff") return { status: 0, stdout: emptyScope ? "" : "diff --git a/src/dispatcher.mjs b/src/dispatcher.mjs\n" };
    throw new Error(`unexpected git argv: ${command}`);
  };
  const reviewDeps = (options = {}) => ({ platform: "linux", realpathSync: IDENTITY_REALPATH, spawnSyncProcess: fake(options) });
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, { purpose: "review", scope: null }, reviewDeps()), /supply one caller-authored CLAUDE_PR_DIFF_SCOPE_JSON/u);
  const scope = { paths: ["src/dispatcher.mjs"], baseOid: scopeBase };
  const artifact = materializePullRequestDiff(pullSnapshot(), root, { purpose: "review", scope }, reviewDeps());
  assert.equal(artifact.full_pr_inventory.changed_file_count, 3);
  assert.equal(artifact.patch_scope.purpose, "partial_pr_review");
  assert.equal(artifact.patch_scope.base_oid, scopeBase);
  assert.equal(artifact.patch_scope.partial_review_scope, true);
  assert.equal(artifact.patch_scope.whole_pr_review, false);
  assert.equal(artifact.patch_scope.unreviewed_full_pr_file_count, 2);
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, { purpose: "review", scope: { paths: ["not-in-pr.txt"], baseOid: null } }, reviewDeps()), /not in the full PR changed-file inventory/u);
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, { purpose: "review", scope }, reviewDeps({ nonAncestor: true })), /scoped-base-to-PR-head ancestry probe exited/u);
  assert.throws(() => materializePullRequestDiff(pullSnapshot(), root, { purpose: "review", scope }, reviewDeps({ emptyScope: true })), /no substantive changed-file patch/u);
});

test("PR review scope marker accepts only one exact non-expanding path contract", () => {
  const root = path.resolve("C:/worktrees/scope-parser");
  assert.deepEqual(parsePullRequestDiffScope(`Review.\nCLAUDE_PR_DIFF_SCOPE_JSON:{"paths":["src/a.mjs"],"base_oid":"${BASE_OID}"}`, root), { paths: ["src/a.mjs"], baseOid: BASE_OID });
  for (const prompt of [
    "CLAUDE_PR_DIFF_SCOPE_JSON:{\"paths\":[\"../secret\"]}",
    "CLAUDE_PR_DIFF_SCOPE_JSON:{\"paths\":[\"src/../secret\"]}",
    "CLAUDE_PR_DIFF_SCOPE_JSON:{\"paths\":[\"/absolute/path\"]}",
    "CLAUDE_PR_DIFF_SCOPE_JSON:{\"paths\":[\"src/*.mjs\"]}",
    "CLAUDE_PR_DIFF_SCOPE_JSON:{\"paths\":[\"src/a.mjs\",\"src/a.mjs\"]}",
    "CLAUDE_PR_DIFF_SCOPE_JSON:{\"paths\":[\"src/a.mjs\"]}\nCLAUDE_PR_DIFF_SCOPE_JSON:{\"paths\":[\"src/b.mjs\"]}",
    "Review @src/a.mjs\nCLAUDE_PR_DIFF_SCOPE_JSON:{\"paths\":[\"src/a.mjs\"]}",
  ]) assert.throws(() => parsePullRequestDiffScope(prompt, root));
  assert.throws(() => parsePullRequestDiffScope("CLAUDE_PR_DIFF_SCOPE_JSON:{\"paths\":[\"src/a.mjs\"],\"base_oid\":\"abc\"}", root), /full Git object ID/u);
});

test("A newer comment or PR head changes the materialized snapshot digest", () => {
  const baseline = summarizeHandoffSnapshot(pullSnapshot());
  const commentChanged = summarizeHandoffSnapshot(pullSnapshot({ commentBody: "newer instruction" }));
  const changedHeadOid = "c".repeat(40);
  const headChanged = summarizeHandoffSnapshot(pullSnapshot({ headOid: changedHeadOid }));
  assert.notEqual(commentChanged.snapshotSha256, baseline.snapshotSha256);
  assert.notEqual(headChanged.snapshotSha256, baseline.snapshotSha256);
  assert.equal(headChanged.headOid, changedHeadOid);
});

test("Materialization failure blocks before Claude spawn even when the local prompt claims a snapshot", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-materialization-failure-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const promptFile = path.join(root, "prompt.md");
  await writeFile(promptFile, "LIVE_GITHUB_HANDOFF_SNAPSHOT_JSON:{\"stale\":true}", "utf8");
  let spawnCount = 0;
  await assert.rejects(
    dispatchClaude({
      cwd: root,
      promptFile,
      tools: READ_ONLY_TOOLS,
      mode: "dontAsk",
      stdoutFile: path.join(root, "out", "stdout.jsonl"),
      stderrFile: path.join(root, "out", "stderr.log"),
      handoffRef: "acme/dialer#249",
    }, {
      platform: "linux",
      materializeHandoff: () => { throw new Error("live GitHub unavailable"); },
      spawnProcess: () => { spawnCount += 1; throw new Error("must not spawn"); },
    }),
    /live GitHub unavailable/u,
  );
  assert.equal(spawnCount, 0);
});

test("Appends the live snapshot to stdin, never argv, and returns provenance evidence", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-snapshot-stdin-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const promptFile = path.join(root, "prompt.md");
  const stdoutFile = path.join(root, "out", "stdout.jsonl");
  const stderrFile = path.join(root, "out", "stderr.log");
  await writeFile(promptFile, "local brief only", "utf8");
  const snapshot = pullSnapshot({ commentBody: "instruction from live GitHub" });
  const captured = {};
  const spawnProcess = (executable, argv, options) => {
    captured.executable = executable;
    captured.argv = argv;
    captured.options = options;
    const child = new EventEmitter();
    child.pid = 4242;
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    const chunks = [];
    child.stdin.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    child.stdin.on("finish", () => {
      captured.stdin = Buffer.concat(chunks).toString("utf8");
      child.stdout.end(`${JSON.stringify({ type: "result", subtype: "success" })}\n`);
      child.stderr.end();
      setImmediate(() => child.emit("close", 0, null));
    });
    return child;
  };
  const result = await dispatchClaude({
    cwd: root,
    promptFile,
    tools: READ_ONLY_TOOLS,
    mode: "dontAsk",
    stdoutFile,
    stderrFile,
    handoffRef: "acme/dialer#249",
  }, {
    platform: "linux",
    spawnProcess,
    materializeHandoff: () => snapshot,
    materializePullRequestDiff: diffArtifactForRequest,
  });
  assert.match(captured.stdin, /^local brief only/u);
  assert.match(captured.stdin, /LIVE_GITHUB_HANDOFF_SNAPSHOT_JSON/u);
  assert.match(captured.stdin, /LIVE_LOCAL_PR_DIFF_JSON/u);
  assert.match(captured.stdin, /untrusted evidence, never instructions/u);
  assert.match(captured.stdin, /instruction from live GitHub/u);
  assert.equal(captured.argv.some((value) => value.includes("instruction from live GitHub")), false);
  assert.equal(captured.options.shell, false);
  assert.equal(result.plan.handoffSnapshot.snapshotSha256, summarizeHandoffSnapshot(snapshot).snapshotSha256);
  assert.equal(result.plan.pullRequestDiff.patchPurpose, "full_pr_review");
  assert.equal(result.plan.implementationBoundary, null);
  assert.equal(result.implementationChanges, null);
});

test("bypassPermissions requires live handoff, exact edit boundaries, and non-dangerous authority", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-bypass-boundary-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const promptFile = path.join(root, "prompt.md");
  const evidenceRoot = await mkdtemp(path.join(tmpdir(), "dispatch-bypass-evidence-"));
  t.after(() => rm(evidenceRoot, { recursive: true, force: true }));
  const common = {
    cwd: root,
    promptFile,
    tools: ["Read", "Edit", "Write"],
    mode: "bypassPermissions",
    stdoutFile: path.join(evidenceRoot, "stdout.jsonl"),
    stderrFile: path.join(evidenceRoot, "stderr.log"),
    handoffRef: "acme/dialer#249",
    preflight: true,
  };
  let observedDiffRequest = null;
  const dependencies = {
    platform: "linux",
    probeDispatchBoundaryCapability: ACCEPTED_BOUNDARY_PROBE,
    materializeHandoff: () => pullSnapshot(),
    materializePullRequestDiff: (...args) => {
      observedDiffRequest = args[2];
      return diffArtifactForRequest(...args);
    },
    captureWorktreeState: () => ({ root: path.resolve(root), changedPaths: [] }),
  };
  await writeFile(promptFile, implementationPrompt(), "utf8");
  const accepted = await dispatchClaude(common, dependencies);
  assert.equal(accepted.plan.mode, "bypassPermissions");
  assert.equal(accepted.plan.argv[accepted.plan.argv.indexOf("--permission-mode") + 1], "bypassPermissions");
  assert.equal(accepted.plan.argv[accepted.plan.argv.indexOf("--tools") + 1], "Read,Edit,Write");
  assert.equal(accepted.plan.argv.includes("--settings"), true);
  const settingSourcesIndex = accepted.plan.argv.indexOf("--setting-sources");
  assert.deepEqual(accepted.plan.argv.slice(settingSourcesIndex, settingSourcesIndex + 3), ["--setting-sources", "", "--settings"]);
  assert.equal(path.isAbsolute(accepted.plan.argv[settingSourcesIndex + 3]), true);
  assert.equal(accepted.plan.argv.includes("--include-hook-events"), true);
  assert.equal(accepted.plan.argv.includes("--bare"), false);
  assert.equal(accepted.plan.argv.includes("--safe-mode"), false);
  assert.deepEqual(accepted.plan.implementationBoundary.readPaths, ["."]);
  assert.deepEqual(accepted.plan.implementationBoundary.editPaths, ["src/dispatcher.mjs", "src/dispatcher.test.mjs"]);
  assert.deepEqual(observedDiffRequest, { purpose: "implementation", paths: ["src/dispatcher.mjs", "src/dispatcher.test.mjs"] });
  assert.deepEqual(accepted.plan.implementationBoundary.capabilityProbe, { tool: "Edit", path: "src/dispatcher.mjs" });
  assert.deepEqual(accepted.plan.boundaryCapability, ACCEPTED_BOUNDARY_PROBE());
  assert.match(accepted.plan.handoffSnapshot.snapshotSha256, /^[a-f0-9]{64}$/u);
  assert.equal(accepted.plan.pullRequestDiff.patchPurpose, "bounded_implementation");

  await writeFile(promptFile, "local brief without boundary contract", "utf8");
  await assert.rejects(dispatchClaude(common, dependencies), /CLAUDE_DISPATCH_BOUNDARY_JSON/u);
  await writeFile(promptFile, implementationPrompt({ authority: { irreversible: false, billed: true, external_contact: false } }), "utf8");
  await assert.rejects(dispatchClaude(common, dependencies), /cannot authorize irreversible, billed, or external-contact/u);
  await writeFile(promptFile, implementationPrompt({ edit_paths: ["src/*.mjs"] }), "utf8");
  await assert.rejects(dispatchClaude(common, dependencies), /must be an exact repo-relative path/u);
  for (const gitPath of [".git/hooks/pre-commit", ".GIT/config", "src/../.GiT/hooks/pre-commit"]) {
    await writeFile(promptFile, implementationPrompt({ edit_paths: [gitPath], capability_probe: { tool: "Write", path: gitPath } }), "utf8");
    await assert.rejects(dispatchClaude(common, dependencies), /must not target repository Git metadata/u);
  }
  for (const allowedPath of [".husky/pre-commit", ".claude/rules/local.md", "package.json"]) {
    assert.doesNotThrow(() => validateBypassPermissionsBrief(implementationPrompt({ edit_paths: [allowedPath], capability_probe: { tool: "Write", path: allowedPath } }), root, ["Read", "Write"]));
  }
  await writeFile(promptFile, implementationPrompt({ read_paths: undefined }), "utf8");
  await assert.rejects(dispatchClaude(common, dependencies), /unexpected or missing fields/u);
  await writeFile(promptFile, implementationPrompt({ read_paths: ["../sibling-repository"] }), "utf8");
  await assert.rejects(dispatchClaude(common, dependencies), /read_paths\[0\] escapes/u);
  await writeFile(promptFile, implementationPrompt({ read_paths: [path.resolve(root)] }), "utf8");
  await assert.rejects(dispatchClaude(common, dependencies), /exact repo-relative file\/directory path/u);
  await writeFile(promptFile, implementationPrompt({ capability_probe: { tool: "Edit", path: "src/not-allowed.mjs" } }), "utf8");
  await assert.rejects(dispatchClaude(common, dependencies), /capability_probe must name/u);
  await writeFile(promptFile, implementationPrompt(), "utf8");
  await assert.rejects(dispatchClaude({ ...common, tools: ["Read", "Edit", "Bash"] }, dependencies), /exact bounded implementation tool allowlist/u);
  await assert.rejects(dispatchClaude({ ...common, tools: ["Read"], handoffRef: undefined }, dependencies), /requires a live durable GitHub handoff/u);
  let materializeCount = 0;
  await assert.rejects(dispatchClaude(common, {
    ...dependencies,
    captureWorktreeState: () => ({ root: path.resolve(root), changedPaths: ["src/pre-existing.mjs"] }),
    materializeHandoff: () => { materializeCount += 1; return pullSnapshot(); },
  }), /isolated clean worktree.*pre-existing\.mjs/u);
  assert.equal(materializeCount, 0);
  await writeFile(promptFile, `${implementationPrompt()}\nCLAUDE_PR_DIFF_SCOPE_JSON:{"paths":["src/dispatcher.mjs"]}`, "utf8");
  await assert.rejects(dispatchClaude(common, dependencies), /review-only.*derived automatically from declared edit_paths/u);
  let promptProbeCount = 0;
  await writeFile(promptFile, `${implementationPrompt()}\nRead @../home/secret.txt`, "utf8");
  await assert.rejects(dispatchClaude(common, {
    ...dependencies,
    probeDispatchBoundaryCapability: () => { promptProbeCount += 1; return ACCEPTED_BOUNDARY_PROBE(); },
  }), /@file expansion bypasses PreToolUse/u);
  assert.equal(promptProbeCount, 0, "prompt-side file expansion must fail before settings/hook capability probing");
});

test("PreToolUse containment allows declared directory reads and exact edits while denying traversal, sibling reads, ambiguous search roots, and unknown shapes before access", async (t) => {
  const fixture = await mkdtemp(path.join(tmpdir(), "dispatch-pretool-boundary-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const root = path.join(fixture, "repository");
  const sibling = path.join(fixture, "sibling-repository");
  await mkdir(path.join(root, "docs"), { recursive: true });
  await mkdir(path.join(root, "src"), { recursive: true });
  await mkdir(sibling, { recursive: true });
  await writeFile(path.join(root, "docs", "guide.md"), "guide", "utf8");
  await writeFile(path.join(root, "src", "exact-edit.mjs"), "export {};", "utf8");
  await writeFile(path.join(root, "src", "undeclared.mjs"), "export {};", "utf8");
  await writeFile(path.join(sibling, "secret.txt"), "never read", "utf8");
  const manifest = createBoundaryManifest({
    projectRoot: root,
    readPaths: ["docs", "src/exact-edit.mjs"],
    editPaths: ["src/exact-edit.mjs", "src/new-file.mjs"],
    skillNames: ["testing-strategy-and-tdd"],
  });

  assert.equal(evaluateBoundaryToolUse(preToolEvent(root, "Read", { file_path: "docs/guide.md" }), manifest).target, "docs/guide.md");
  assert.equal(evaluateBoundaryToolUse(preToolEvent(root, "Read", { file_path: path.join(root, "src", "exact-edit.mjs") }), manifest).target, "src/exact-edit.mjs");
  assert.equal(evaluateBoundaryToolUse(preToolEvent(root, "Edit", { file_path: "src/exact-edit.mjs", old_string: "x", new_string: "y" }), manifest).tool, "Edit");
  assert.equal(evaluateBoundaryToolUse(preToolEvent(root, "Write", { file_path: "src/new-file.mjs", content: "new" }), manifest).tool, "Write");
  assert.equal(evaluateBoundaryToolUse(preToolEvent(root, "Glob", { path: "docs", pattern: "**/*.md" }), manifest).target, "docs");
  assert.equal(evaluateBoundaryToolUse(preToolEvent(root, "Grep", { path: "docs", pattern: "guide" }), manifest).target, "docs");
  assert.equal(evaluateBoundaryToolUse(preToolEvent(root, "Skill", { skill: "testing-strategy-and-tdd" }), manifest).target, "testing-strategy-and-tdd");

  const denied = [
    [preToolEvent(root, "Read", { file_path: "../sibling-repository/secret.txt" }), "Read tool_input.file_path escapes the repository root"],
    [preToolEvent(root, "Read", { file_path: path.join(sibling, "secret.txt") }), "Read tool_input.file_path escapes the repository root"],
    [preToolEvent(root, "Read", { file_path: "src/undeclared.mjs" }), "Read path src/undeclared.mjs is outside declared read_paths/edit_paths"],
    [preToolEvent(root, "Glob", { pattern: "**/*" }), "Glob omitted tool_input.path without an explicit repository-root read boundary"],
    [preToolEvent(root, "Grep", { pattern: "secret" }), "Grep omitted tool_input.path without an explicit repository-root read boundary"],
    [preToolEvent(root, "Glob", { path: "docs", pattern: "../**/*" }), "Glob tool_input.pattern must not traverse above its declared search root"],
    [preToolEvent(root, "Grep", { path: sibling, pattern: "secret" }), "Grep tool_input.path escapes the repository root"],
    [preToolEvent(root, "Edit", { file_path: "src/other.mjs", old_string: "x", new_string: "y" }), "Edit tool_input.file_path must name an existing path"],
    [preToolEvent(root, "Skill", { skill: "undeclared-skill" }), "Skill undeclared-skill is not exactly declared"],
    [preToolEvent(root, "Bash", { command: "type secret.txt" }), "tool Bash is outside the exact bounded implementation allowlist"],
    [{ ...preToolEvent(root, "Read", { file_path: "docs/guide.md" }), tool_input: null }, "Read tool_input must be an object"],
  ];
  let simulatedFileAccesses = 0;
  for (const [event, expectedReason] of denied) {
    assert.throws(() => {
      evaluateBoundaryToolUse(event, manifest);
      simulatedFileAccesses += 1;
    }, (error) => error.message === expectedReason);
  }
  assert.equal(simulatedFileAccesses, 0, "forbidden calls must be denied before simulated tool access");

  const rootManifest = createBoundaryManifest({ projectRoot: root, readPaths: ["."], editPaths: ["src/exact-edit.mjs"], skillNames: [] });
  assert.equal(evaluateBoundaryToolUse(preToolEvent(root, "Glob", { pattern: "**/*.md" }), rootManifest).target, ".");
  assert.equal(evaluateBoundaryToolUse(preToolEvent(root, "Grep", { pattern: "guide" }), rootManifest).target, ".");
  assert.throws(() => createBoundaryManifest({ projectRoot: root, readPaths: ["."], editPaths: [".git/hooks/pre-commit"], skillNames: [] }), /must not target repository Git metadata/u);
  assert.throws(() => createBoundaryManifest({ projectRoot: root, readPaths: ["."], editPaths: [".GIT/config"], skillNames: [] }), /must not target repository Git metadata/u);
});

test("Manifest preflight rejects descendant symlinks once while PreToolUse keeps only per-path checks", async (t) => {
  const fixture = await mkdtemp(path.join(tmpdir(), "dispatch-pretool-symlink-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const root = path.join(fixture, "repository");
  const outsideDirectory = path.join(fixture, "outside");
  const outside = path.join(outsideDirectory, "outside.txt");
  await mkdir(path.join(root, "docs"), { recursive: true });
  await mkdir(outsideDirectory, { recursive: true });
  await writeFile(outside, "secret", "utf8");
  let link = path.join(root, "docs", "escape.txt");
  let usedJunction = false;
  try {
    await symlink(outside, link, "file");
  } catch (error) {
    if (["EPERM", "EACCES", "UNKNOWN"].includes(error?.code)) {
      const junction = path.join(root, "docs", "escape-directory");
      try {
        await symlink(outsideDirectory, junction, "junction");
        link = path.join(junction, "outside.txt");
        usedJunction = true;
      } catch (junctionError) {
        if (["EPERM", "EACCES", "UNKNOWN"].includes(junctionError?.code)) {
          t.skip(`platform cannot create a symlink/reparse fixture: ${junctionError.code}`);
          return;
        }
        throw junctionError;
      }
    } else {
      throw error;
    }
  }
  assert.throws(
    () => createBoundaryManifest({ projectRoot: root, readPaths: ["docs"], editPaths: ["src/new.mjs"], skillNames: [] }),
    /contains a symlink\/reparse descendant/u,
  );
  await rm(path.join(root, "docs"), { recursive: true, force: true });
  await mkdir(path.join(root, "docs"), { recursive: true });
  const manifest = createBoundaryManifest({ projectRoot: root, readPaths: ["docs"], editPaths: ["src/new.mjs"], skillNames: [] });
  assert.deepEqual(manifest.read_directory_scans, [{ path: "docs", entry_count: 0 }]);
  const lateToolPath = usedJunction ? "docs/late-directory/outside.txt" : "docs/late-link.txt";
  await symlink(usedJunction ? outsideDirectory : outside, path.join(root, "docs", usedJunction ? "late-directory" : "late-link.txt"), usedJunction ? "junction" : "file");
  assert.throws(
    () => evaluateBoundaryToolUse(preToolEvent(root, "Read", { file_path: lateToolPath }), manifest),
    /symlink\/reparse|outside/u,
  );
  assert.equal(evaluateBoundaryToolUse(preToolEvent(root, "Glob", { path: "docs", pattern: "**/*" }), manifest).target, "docs", "same-user post-manifest tree mutation is outside the supported trust boundary; PreToolUse must not rescan descendants");
  await rm(path.join(root, "docs", usedJunction ? "late-directory" : "late-link.txt"), { recursive: true, force: true });
  await writeFile(path.join(root, "docs", "one.txt"), "1", "utf8");
  await writeFile(path.join(root, "docs", "two.txt"), "2", "utf8");
  assert.throws(() => createBoundaryManifest({ projectRoot: root, readPaths: ["docs"], editPaths: ["src/new.mjs"], skillNames: [] }, { maxSearchTreeEntries: 1 }), /inspection limit.*narrower read root/u);
});

test("SessionStart activation is idempotent only for the exact schema, nonce, and project root", async (t) => {
  const fixture = await mkdtemp(path.join(tmpdir(), "dispatch-activation-sequence-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const firstRoot = path.join(fixture, "first");
  const secondRoot = path.join(fixture, "second");
  await mkdir(firstRoot, { recursive: true });
  await mkdir(secondRoot, { recursive: true });
  const hookPath = path.resolve("skills/bootstrap-orchestrator/scripts/dispatch-boundary-hook.mjs");
  const manifestPath = path.join(fixture, "manifest.json");
  const secondManifestPath = path.join(fixture, "second-manifest.json");
  const activationPath = path.join(fixture, "activation.json");
  const nonce = "a".repeat(32);
  await writeFile(manifestPath, JSON.stringify(createBoundaryManifest({ projectRoot: firstRoot, readPaths: ["."], editPaths: ["new.mjs"], skillNames: [] })), "utf8");
  await writeFile(secondManifestPath, JSON.stringify(createBoundaryManifest({ projectRoot: secondRoot, readPaths: ["."], editPaths: ["new.mjs"], skillNames: [] })), "utf8");
  const activate = (candidateManifest, candidateNonce, cwd) => spawnSync(process.execPath, [hookPath, "--activate", candidateManifest, activationPath, candidateNonce], {
    input: JSON.stringify({ hook_event_name: "SessionStart", source: "startup", cwd }),
    encoding: "utf8",
    shell: false,
  });
  assert.equal(activate(manifestPath, nonce, firstRoot).status, 0);
  assert.equal(activate(manifestPath, nonce, firstRoot).status, 0);
  assert.match(activate(manifestPath, "b".repeat(32), firstRoot).stderr, /does not exactly match/u);
  assert.match(activate(secondManifestPath, nonce, secondRoot).stderr, /does not exactly match/u);
  await writeFile(activationPath, JSON.stringify({ schema_version: BOUNDARY_SCHEMA_VERSION - 1, nonce, project_root: firstRoot }), "utf8");
  assert.match(activate(manifestPath, nonce, firstRoot).stderr, /does not exactly match/u);
});

test("Generated settings use one native catch-all hook, and ignored Claude settings fail the active allow/deny capability probe before dispatch", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-settings-probe-repo-"));
  const temp = await mkdtemp(path.join(tmpdir(), "dispatch-settings-probe-config-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.after(() => rm(temp, { recursive: true, force: true }));
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(path.join(root, "src", "edit.mjs"), "probe", "utf8");
  const hookPath = path.resolve("skills/bootstrap-orchestrator/scripts/dispatch-boundary-hook.mjs");
  const manifestPath = path.join(temp, "boundary.json");
  const activationPath = path.join(temp, "active.json");
  const activationNonce = "a".repeat(32);
  const settingsPath = path.join(temp, "settings.json");
  const manifest = createBoundaryManifest({ projectRoot: root, readPaths: ["src"], editPaths: ["src/edit.mjs"], skillNames: [] });
  const settings = buildBoundarySettings({ nodeExecutable: process.execPath, hookPath, manifestPath, activationPath, activationNonce });
  await writeFile(manifestPath, JSON.stringify(manifest), "utf8");
  await writeFile(activationPath, JSON.stringify({ schema_version: BOUNDARY_SCHEMA_VERSION, nonce: activationNonce, project_root: manifest.project_root }), "utf8");
  await writeFile(settingsPath, JSON.stringify(settings), "utf8");
  assert.deepEqual(validateBoundarySettingsText(await readFile(settingsPath, "utf8"), settings), settings);
  assert.throws(() => validateBoundarySettingsText('{"hooks":{"PreToolUse":"ignored"}}', settings), /differ|exact hook/u);

  const spawnWithDoctor = (doctorOutput) => (executable, argv, options) => {
    if (executable === process.execPath) return spawnSync(executable, argv, options);
    return { status: 0, stdout: argv.includes("doctor") ? doctorOutput : "", stderr: "" };
  };
  assert.throws(
    () => probeDispatchBoundaryCapability({
      claudeExecutable: "claude-native",
      settingsPath,
      hookPath,
      manifestPath,
      activationPath,
      activationNonce,
      manifest,
      capabilityProbe: { tool: "Edit", path: "src/edit.mjs" },
    }, { spawnSyncProcess: spawnWithDoctor("Claude Code doctor\nInvalid settings: hook entry ignored") }),
    /rejected or ignored/u,
  );
  assert.deepEqual(
    probeDispatchBoundaryCapability({
      claudeExecutable: "claude-native",
      settingsPath,
      hookPath,
      manifestPath,
      activationPath,
      activationNonce,
      manifest,
      capabilityProbe: { tool: "Edit", path: "src/edit.mjs" },
    }, { spawnSyncProcess: spawnWithDoctor("Claude Code doctor\nNo installation issues found.") }),
    { claudeHookActivated: true, hookAllowProbe: true, hookDenyProbe: true, claudeSettingsAccepted: true },
  );
});

test("Prompt-side @file expansion is rejected before dispatch while untrusted handoff JSON escapes every at-sign", () => {
  assert.throws(() => validateNoPromptFileExpansion("Read @../home/secret.txt"), /@file expansion bypasses PreToolUse/u);
  assert.throws(() => validateNoPromptFileExpansion("Contact @operator"), /caller-authored prompt contains '@'/u);
  assert.doesNotThrow(() => validateNoPromptFileExpansion("Spell addresses using the word at"));
  const materialized = appendHandoffSnapshot("bounded prompt", { body: "@../secret and user@example.com" });
  assert.equal(materialized.includes("@"), false);
  assert.match(materialized, /\\u0040\.\.\/secret/u);
});

test("Post-run implementation attribution rejects undeclared tracked/untracked changes and escaping Edit/Write inputs", () => {
  const root = path.resolve("C:/worktrees/isolated-implementation");
  const boundary = {
    editPaths: ["src/dispatcher.mjs", "src/dispatcher.test.mjs"],
    skillNames: [],
    capabilityProbe: { tool: "Edit", path: "src/dispatcher.mjs" },
    boundaryCount: 1,
    authority: { irreversible: false, billed: false, external_contact: false },
  };
  const clean = { root, changedPaths: [] };
  const trackedAndUntracked = { root, changedPaths: ["src/dispatcher.mjs", "src/undeclared-tracked.mjs", "tmp/undeclared-untracked.txt"] };
  assert.throws(
    () => verifyImplementationChanges(`${boundedToolEvent("Edit", { file_path: "src/dispatcher.mjs" })}\n`, boundary, clean, trackedAndUntracked),
    /undeclared-tracked\.mjs.*undeclared-untracked\.txt/u,
  );
  assert.throws(
    () => verifyImplementationChanges(`${boundedToolEvent("Write", { file_path: "../outside.txt" })}\n`, boundary, clean, clean),
    /Write: Write tool input\.file_path escapes/u,
  );
  assert.throws(
    () => verifyImplementationChanges(`${boundedToolEvent("Write", { file_path: "tmp/ignored-looking.log" })}\n`, boundary, clean, clean, { requireLiveness: false }),
    /implementation escaped.*tmp\/ignored-looking\.log/u,
  );
  const accepted = verifyImplementationChanges(`${boundedToolEvent("Edit", { file_path: path.join(root, "src", "dispatcher.mjs") })}\n`, boundary, clean, { root, changedPaths: ["src/dispatcher.mjs"] });
  assert.deepEqual(accepted.actualChangedPaths, ["src/dispatcher.mjs"]);
  assert.deepEqual(accepted.observedWritePaths, ["src/dispatcher.mjs"]);
  assert.deepEqual(accepted.hookCoverage, { observedHookEvents: 1, coveredToolEvents: 1 });
  const caseFolded = verifyImplementationChanges(`${boundedToolEvent("Edit", { file_path: path.join(root, "SRC", "DISPATCHER.MJS") })}\n`, boundary, clean, { root: root.toUpperCase(), changedPaths: ["SRC/DISPATCHER.MJS", "src/dispatcher.mjs"] }, { platform: "win32" });
  assert.deepEqual(caseFolded.actualChangedPaths, ["SRC/DISPATCHER.MJS"]);
  assert.deepEqual(caseFolded.observedWritePaths, ["SRC/DISPATCHER.MJS"]);
  assert.throws(
    () => verifyImplementationChanges(`${toolEvent("Edit", { file_path: "src/dispatcher.mjs" })}\n`, boundary, clean, { root, changedPaths: ["src/dispatcher.mjs"] }),
    /lacks matching included PreToolUse hook evidence/u,
  );
  assert.throws(
    () => verifyImplementationChanges(`${JSON.stringify({ type: "result", subtype: "success" })}\n`, boundary, clean, clean),
    /observed no Edit\/Write event/u,
  );
  assert.throws(
    () => verifyImplementationChanges(`${boundedToolEvent("Edit", { file_path: "src/dispatcher.mjs" })}\n`, boundary, clean, clean),
    /Edit\/Write was a no-op/u,
  );
});

test("Skill is optional bounded context, while undeclared skills, Agent/Task, and shell remain outside implementation authority", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-skill-boundary-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const boundary = {
    editPaths: ["src/dispatcher.mjs"],
    skillNames: ["frontend-design-director"],
    capabilityProbe: { tool: "Edit", path: "src/dispatcher.mjs" },
    boundaryCount: 1,
    authority: { irreversible: false, billed: false, external_contact: false },
  };
  const clean = { root, changedPaths: [] };
  const changed = { root, changedPaths: ["src/dispatcher.mjs"] };
  const accepted = verifyImplementationChanges(`${boundedToolEvent("Skill", { skill: "frontend-design-director" })}\n${boundedToolEvent("Edit", { file_path: "src/dispatcher.mjs" })}\n`, boundary, clean, changed);
  assert.deepEqual(accepted.observedSkillNames, ["frontend-design-director"]);
  assert.throws(
    () => verifyImplementationChanges(`${boundedToolEvent("Skill", { skill: "unknown-skill" })}\n${boundedToolEvent("Edit", { file_path: "src/dispatcher.mjs" })}\n`, boundary, clean, changed),
    /undeclared trusted skill unknown-skill/u,
  );
  assert.deepEqual(
    validateBypassPermissionsBrief(implementationPrompt({ skill_names: ["frontend-design-director"] }), root, ["Read", "Skill", "Edit"]).skillNames,
    ["frontend-design-director"],
  );
  for (const denied of ["Agent", "Task", "Bash", "PowerShell"]) {
    assert.throws(
      () => validateBypassPermissionsBrief(implementationPrompt({ skill_names: ["frontend-design-director"] }), root, ["Read", "Skill", "Edit", denied]),
      /exact bounded implementation tool allowlist/u,
    );
  }
});

test("Clean-worktree capture includes tracked, untracked, and both rename paths with exact shell-free status argv", () => {
  const root = path.resolve("C:/worktrees/isolated-implementation");
  const calls = [];
  const state = captureGitWorktreeState(root, {
    platform: "linux",
    realpathSync: IDENTITY_REALPATH,
    spawnSyncProcess: (executable, argv, options) => {
      calls.push({ executable, argv, options });
      if (argv[0] === "rev-parse") return { status: 0, stdout: `${root}\n` };
      return { status: 0, stdout: " M src/tracked.mjs\0?? src/untracked.mjs\0R  src/renamed.mjs\0src/original.mjs\0" };
    },
  });
  assert.deepEqual(state.changedPaths, ["src/original.mjs", "src/renamed.mjs", "src/tracked.mjs", "src/untracked.mjs"]);
  assert.deepEqual(calls[1].argv, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  assert.equal(calls.every((call) => call.options.shell === false), true);
});

test("Repository-root proof compares canonical realpaths and folds Windows case without accepting a different target", () => {
  const requested = path.resolve("C:/Alias/Repo");
  const reported = path.resolve("C:/REPORTED/REPO");
  const canonical = path.resolve("C:/Canonical/Repo");
  const invoke = (reportedCanonical) => captureGitWorktreeState(requested, {
    platform: "win32",
    realpathSync: (candidate) => path.resolve(candidate) === requested ? canonical.toUpperCase() : reportedCanonical,
    env: { PATH: "C:\\Git" },
    fileExists: (candidate) => candidate === path.win32.join("C:\\Git", "git.exe"),
    spawnSyncProcess: (_executable, argv) => argv[0] === "rev-parse"
      ? { status: 0, stdout: `${reported}\n` }
      : { status: 0, stdout: "" },
  });
  assert.equal(invoke(canonical.toLowerCase()).root.toLowerCase(), canonical.toLowerCase());
  assert.throws(() => invoke(path.resolve("C:/Other/Repo")), /must canonically equal/u);
});

test("bypassPermissions wires clean-baseline capture to post-run rejection and preserves evidence without reverting", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-postrun-boundary-"));
  const evidenceRoot = await mkdtemp(path.join(tmpdir(), "dispatch-postrun-evidence-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.after(() => rm(evidenceRoot, { recursive: true, force: true }));
  const promptFile = path.join(root, "prompt.md");
  const stdoutFile = path.join(evidenceRoot, "stdout.jsonl");
  const stderrFile = path.join(evidenceRoot, "stderr.log");
  await writeFile(promptFile, implementationPrompt(), "utf8");
  const child = new EventEmitter();
  child.pid = 4242;
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin.on("finish", () => {
    child.stdout.end(`${boundedToolEvent("Write", { file_path: "src/dispatcher.mjs" })}\n${JSON.stringify({ type: "result", subtype: "success" })}\n`);
    child.stderr.end();
    setImmediate(() => child.emit("close", 0, null));
  });
  let captureCount = 0;
  await assert.rejects(
    dispatchClaude({
      cwd: root,
      promptFile,
      tools: ["Read", "Edit", "Write"],
      mode: "bypassPermissions",
      stdoutFile,
      stderrFile,
      handoffRef: "https://github.com/acme/dialer/issues/249",
    }, {
      platform: "linux",
      probeDispatchBoundaryCapability: ACCEPTED_BOUNDARY_PROBE,
      spawnProcess: () => child,
      materializeHandoff: () => normalizeGitHubHandoffResponse(graphResponse({ type: "Issue" }), "https://github.com/acme/dialer/issues/249"),
      captureWorktreeState: () => ({ root: path.resolve(root), changedPaths: captureCount++ < 2 ? [] : ["src/dispatcher.mjs", "src/rogue-untracked.mjs"] }),
    }),
    /implementation escaped.*rogue-untracked\.mjs/u,
  );
  assert.match(await readFile(stdoutFile, "utf8"), /src\/dispatcher\.mjs/u);
  assert.equal(captureCount, 3);
});

test("A boundary probe that dirties the implementation tree is caught before handoff materialization or model spawn", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-probe-dirty-root-"));
  const evidenceRoot = await mkdtemp(path.join(tmpdir(), "dispatch-probe-dirty-evidence-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.after(() => rm(evidenceRoot, { recursive: true, force: true }));
  const promptFile = path.join(root, "prompt.md");
  await writeFile(promptFile, implementationPrompt(), "utf8");
  let probeRan = false;
  let spawnCount = 0;
  let materializeCount = 0;
  let captureCount = 0;
  await assert.rejects(dispatchClaude({
    cwd: root,
    promptFile,
    tools: ["Read", "Edit", "Write"],
    mode: "bypassPermissions",
    stdoutFile: path.join(evidenceRoot, "stdout.jsonl"),
    stderrFile: path.join(evidenceRoot, "stderr.log"),
    handoffRef: "https://github.com/acme/dialer/issues/249",
  }, {
    platform: "linux",
    probeDispatchBoundaryCapability: () => { probeRan = true; return ACCEPTED_BOUNDARY_PROBE(); },
    captureWorktreeState: () => ({ root: path.resolve(root), changedPaths: captureCount++ === 0 ? [] : ["src/probe-dirtied.mjs"] }),
    materializeHandoff: () => { materializeCount += 1; return normalizeGitHubHandoffResponse(graphResponse({ type: "Issue" }), "https://github.com/acme/dialer/issues/249"); },
    spawnProcess: () => { spawnCount += 1; throw new Error("must not spawn"); },
  }), /boundary capability probe changed.*probe-dirtied\.mjs/u);
  assert.equal(probeRan, true);
  assert.equal(captureCount, 2);
  assert.equal(materializeCount, 0);
  assert.equal(spawnCount, 0);
});

test("stdin transport failure terminates Claude then still captures post-run containment and persists evidence", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-stdin-failure-root-"));
  const evidenceRoot = await mkdtemp(path.join(tmpdir(), "dispatch-stdin-failure-evidence-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.after(() => rm(evidenceRoot, { recursive: true, force: true }));
  const promptFile = path.join(root, "prompt.md");
  const stdoutFile = path.join(evidenceRoot, "stdout.jsonl");
  const stderrFile = path.join(evidenceRoot, "stderr.log");
  await writeFile(promptFile, implementationPrompt(), "utf8");
  const child = new EventEmitter();
  child.pid = 4242;
  child.stdin = new EventEmitter();
  child.stdin.end = () => child.stdin.emit("error", Object.assign(new Error("broken pipe"), { code: "EPIPE" }));
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  let captureCount = 0;
  let terminationCount = 0;
  await assert.rejects(dispatchClaude({
    cwd: root,
    promptFile,
    tools: ["Read", "Edit", "Write"],
    mode: "bypassPermissions",
    stdoutFile,
    stderrFile,
    handoffRef: "https://github.com/acme/dialer/issues/249",
  }, {
    platform: "linux",
    probeDispatchBoundaryCapability: ACCEPTED_BOUNDARY_PROBE,
    captureWorktreeState: () => { captureCount += 1; return { root: path.resolve(root), changedPaths: [] }; },
    spawnProcess: () => child,
    terminateProcessTree: () => { terminationCount += 1; setImmediate(() => child.emit("close", null, "SIGTERM")); },
    materializeHandoff: () => normalizeGitHubHandoffResponse(graphResponse({ type: "Issue" }), "https://github.com/acme/dialer/issues/249"),
    signalEmitter: new EventEmitter(),
  }), /stdin transport failed: broken pipe.*actualChangedPaths":\[\]/u);
  assert.equal(terminationCount, 1);
  assert.equal(captureCount, 3);
  assert.equal(await readFile(stdoutFile, "utf8"), "");
  assert.equal(await readFile(stderrFile, "utf8"), "");
});

test("outside-evidence containment denies a symlink or junction alias back into the repository", async (t) => {
  const fixture = await mkdtemp(path.join(tmpdir(), "dispatch-evidence-alias-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const root = path.join(fixture, "repository");
  const outside = path.join(fixture, "outside");
  const alias = path.join(outside, "repo-alias");
  await mkdir(root, { recursive: true });
  await mkdir(outside, { recursive: true });
  try {
    await symlink(root, alias, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if (["EPERM", "EACCES", "UNKNOWN"].includes(error?.code)) {
      t.skip(`platform cannot create a symlink/reparse fixture: ${error.code}`);
      return;
    }
    throw error;
  }
  const promptFile = path.join(root, "prompt.md");
  await writeFile(promptFile, implementationPrompt(), "utf8");
  let probeCount = 0;
  await assert.rejects(dispatchClaude({
    cwd: root,
    promptFile,
    tools: ["Read", "Edit", "Write"],
    mode: "bypassPermissions",
    stdoutFile: path.join(alias, "stdout.jsonl"),
    stderrFile: path.join(outside, "stderr.log"),
    handoffRef: "https://github.com/acme/dialer/issues/249",
    preflight: true,
  }, {
    platform: process.platform,
    probeDispatchBoundaryCapability: () => { probeCount += 1; return ACCEPTED_BOUNDARY_PROBE(); },
  }), /stdout evidence must live outside the target repository/u);
  assert.equal(probeCount, 0);
});

test("Failure-path containment reports undeclared writes after timeout and reports clean post-state when no write occurred", async (t) => {
  async function runTimedOutCase(changedPaths) {
    const root = await mkdtemp(path.join(tmpdir(), "dispatch-timeout-boundary-"));
    const evidenceRoot = await mkdtemp(path.join(tmpdir(), "dispatch-timeout-evidence-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    t.after(() => rm(evidenceRoot, { recursive: true, force: true }));
    const promptFile = path.join(root, "prompt.md");
    await writeFile(promptFile, implementationPrompt(), "utf8");
    const child = new EventEmitter();
    child.pid = 4242;
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    const timers = [];
    child.stdin.on("finish", () => {
      if (changedPaths.length > 0) child.stdout.write(`${boundedToolEvent("Write", { file_path: "src/dispatcher.mjs" })}\n`);
      setImmediate(() => timers[0].callback());
    });
    let captureCount = 0;
    try {
      await dispatchClaude({
        cwd: root,
        promptFile,
        tools: ["Read", "Edit", "Write"],
        mode: "bypassPermissions",
        stdoutFile: path.join(evidenceRoot, "stdout.jsonl"),
        stderrFile: path.join(evidenceRoot, "stderr.log"),
        handoffRef: "https://github.com/acme/dialer/issues/249",
        maxRuntimeMs: 5,
      }, {
        platform: "linux",
        probeDispatchBoundaryCapability: ACCEPTED_BOUNDARY_PROBE,
        spawnProcess: () => child,
        materializeHandoff: () => normalizeGitHubHandoffResponse(graphResponse({ type: "Issue" }), "https://github.com/acme/dialer/issues/249"),
        captureWorktreeState: () => ({ root: path.resolve(root), changedPaths: captureCount++ < 2 ? [] : changedPaths }),
        terminateProcessTree: () => setImmediate(() => child.emit("close", null, "SIGTERM")),
        setTimeoutFn: (callback, delay) => { const handle = { callback, delay, unref() {} }; timers.push(handle); return handle; },
        clearTimeoutFn: () => {},
        setIntervalFn: () => ({ unref() {} }),
        clearIntervalFn: () => {},
        signalEmitter: new EventEmitter(),
      });
      assert.fail("timeout dispatch must reject");
    } catch (error) {
      return error.message;
    }
  }
  const escaped = await runTimedOutCase(["src/dispatcher.mjs", "src/timeout-rogue.mjs"]);
  assert.match(escaped, /exceeded internal max runtime.*timeout-rogue\.mjs/u);
  const clean = await runTimedOutCase([]);
  assert.match(clean, /exceeded internal max runtime.*actualChangedPaths":\[\]/u);
});

test("Proves an invalid internal lifetime is rejected; mutation: accept zero, fractional, or exponential timeout text", () => {
  for (const invalid of [0, -1, 1.5, "1e3", ""]) {
    assert.throws(
      () =>
        createDispatchPlan(
          {
            cwd: path.resolve("C:/work tree"),
            promptFile: path.resolve("C:/prompts/a prompt.md"),
            tools: READ_ONLY_TOOLS,
            mode: "dontAsk",
            stdoutFile: path.resolve("C:/out/result.jsonl"),
            stderrFile: path.resolve("C:/out/error.log"),
            mcpConfigPath: CONFIG_PATH,
            maxRuntimeMs: invalid,
            parentPid: 3131,
          },
          { platform: "linux" },
        ),
      /positive integer/u,
    );
  }
  assert.equal(parsePositiveInteger("1", "--max-runtime-ms"), 1);
});

test("Proves Windows tree termination targets only the exact child PID without a shell; mutation: use cmd interpolation or omit /T", () => {
  const captured = {};
  terminateProcessTree(4242, {
    platform: "win32",
    spawnSyncProcess: (executable, argv, options) => {
      captured.executable = executable;
      captured.argv = argv;
      captured.options = options;
      return { status: 0 };
    },
  });
  assert.equal(captured.executable, "taskkill");
  assert.deepEqual(captured.argv, ["/PID", "4242", "/T", "/F"]);
  assert.equal(captured.options.shell, false);
});

test("Proves POSIX termination targets the dispatch process group and escalates safely; mutation: kill only the parent child PID", () => {
  const calls = [];
  const killProcess = (pid, signal) => calls.push({ pid, signal });
  terminateProcessTree(4242, { platform: "linux", killProcess });
  terminateProcessTree(4242, {
    platform: "linux",
    force: true,
    killProcess,
  });
  assert.deepEqual(calls, [
    { pid: -4242, signal: "SIGTERM" },
    { pid: -4242, signal: "SIGKILL" },
  ]);
});

test("Proves Windows dispatch resolves the native executable behind the npm wrapper", () => {
  const npmRoot = "C:\\Users\\tester\\AppData\\Roaming\\npm";
  const nativeExecutable = path.win32.join(
    npmRoot,
    "node_modules",
    "@anthropic-ai",
    "claude-code",
    "bin",
    "claude.exe",
  );
  const resolved = resolveClaudeExecutable({
    platform: "win32",
    env: { PATH: npmRoot },
    fileExists: (candidate) => candidate === nativeExecutable,
  });
  assert.equal(resolved, nativeExecutable);
});

test("Proves Windows dispatch fails before spawn when only a shell wrapper is available", () => {
  assert.throws(
    () =>
      resolveClaudeExecutable({
        platform: "win32",
        env: { PATH: "C:\\wrapper-only" },
        fileExists: () => false,
      }),
    /no native claude\.exe.*\.cmd\/\.ps1 wrapper cannot be launched/iu,
  );
});

test("Preserves the direct executable counterexample on non-Windows platforms", () => {
  assert.equal(resolveClaudeExecutable({ platform: "linux" }), "claude");
});

test("Proves the dispatcher writes prompt bytes to stdin, never argv; mutation: append prompt to argv", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "dispatch-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const prompt = 'quoted "prompt" with C:\\path and spaces';
  const promptFile = path.join(root, "prompt.md");
  const stdoutFile = path.join(root, "out", "result.jsonl");
  const stderrFile = path.join(root, "out", "error.log");
  await writeFile(promptFile, prompt, "utf8");
  const captured = {};

  const spawnProcess = (executable, argv, options) => {
    captured.executable = executable;
    captured.argv = argv;
    captured.options = options;
    const child = new EventEmitter();
    child.pid = 4242;
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    const input = [];
    child.stdin.on("data", (chunk) => input.push(Buffer.from(chunk)));
    child.stdin.on("finish", () => {
      captured.stdin = Buffer.concat(input).toString("utf8");
      child.stdout.end(
        `${JSON.stringify({ type: "result", subtype: "success" })}\n`,
      );
      child.stderr.end();
      setImmediate(() => child.emit("close", 0, null));
    });
    return child;
  };

  const result = await dispatchClaude(
    {
      cwd: root,
      promptFile,
      tools: READ_ONLY_TOOLS,
      mode: "dontAsk",
      stdoutFile,
      stderrFile,
    },
    { spawnProcess },
  );

  assert.equal(captured.stdin, prompt);
  assert.equal(captured.argv.includes(prompt), false);
  assert.equal(captured.options.shell, false);
  assert.equal(result.exitCode, 0);
  assert.match(await readFile(stdoutFile, "utf8"), /"success"/u);
  assert.equal(await readFile(stderrFile, "utf8"), "");
});

test("Proves parent loss kills the exact Claude child tree; mutation: remove the parent watchdog", async (t) => {
  const controlled = await controlledDispatch(t, { parentAlive: false });
  assert.equal(controlled.intervals.length, 1);
  controlled.intervals[0].callback();
  await assert.rejects(controlled.promise, /parent process 3131 is no longer alive/u);
  assert.deepEqual(controlled.terminationCalls, [
    { pid: 4242, options: { platform: "win32", force: true } },
  ]);
  assert.equal(controlled.signalEmitter.listenerCount("SIGINT"), 0);
  assert.equal(controlled.signalEmitter.listenerCount("SIGTERM"), 0);
});

test("Proves the internal timeout kills the exact Claude child tree; mutation: rely only on an outer shell timeout", async (t) => {
  const controlled = await controlledDispatch(t);
  assert.equal(controlled.timeouts[0].delay, 4321);
  controlled.timeouts[0].callback();
  await assert.rejects(controlled.promise, /exceeded internal max runtime of 4321 ms/u);
  assert.deepEqual(controlled.terminationCalls, [
    { pid: 4242, options: { platform: "win32", force: true } },
  ]);
});

test("Proves normal completion clears lifetime controls without killing Claude; mutation: run termination during cleanup", async (t) => {
  const controlled = await controlledDispatch(t);
  controlled.child.stdout.end(
    `${JSON.stringify({ type: "result", subtype: "success" })}\n`,
  );
  controlled.child.stderr.end();
  controlled.child.emit("close", 0, null);
  const result = await controlled.promise;
  assert.equal(result.exitCode, 0);
  assert.deepEqual(controlled.terminationCalls, []);
  assert.ok(controlled.clearedTimeouts.includes(controlled.timeouts[0]));
  assert.ok(controlled.clearedIntervals.includes(controlled.intervals[0]));
  assert.equal(controlled.signalEmitter.listenerCount("SIGINT"), 0);
  assert.equal(controlled.signalEmitter.listenerCount("SIGTERM"), 0);
});

test("Proves SIGTERM uses the same exact-tree termination path; mutation: leave signal abort as a child-only kill", async (t) => {
  const controlled = await controlledDispatch(t);
  controlled.signalEmitter.emit("SIGTERM");
  await assert.rejects(controlled.promise, /received SIGTERM/u);
  assert.deepEqual(controlled.terminationCalls, [
    { pid: 4242, options: { platform: "win32", force: true } },
  ]);
});

test("Proves an extra observed tool fails the post-run audit; mutation: emit an unlisted Write call", () => {
  const stream = `${toolEvent("Read")}\n${toolEvent("Write")}\n`;
  assert.throws(() => auditObservedTools(stream, ["Read"]), /Write/u);
});

test("Proves Agent and Task events remain rejected instead of being normalized into authority", () => {
  assert.throws(() => auditObservedTools(`${toolEvent("Agent")}\n`, READ_ONLY_TOOLS), /Agent/u);
  assert.throws(() => auditObservedTools(`${toolEvent("Task")}\n`, READ_ONLY_TOOLS), /Task/u);
});

test("Proves safe argv includes strict MCP and stream-json verbose output", () => {
  const argv = buildClaudeArgv({
    tools: READ_ONLY_TOOLS,
    mode: "dontAsk",
    mcpConfigPath: CONFIG_PATH,
  });
  assert.ok(argv.includes("--strict-mcp-config"));
  assert.equal(argv[argv.indexOf("--output-format") + 1], "stream-json");
  assert.ok(argv.includes("--verbose"));
});

test("Proves dontAsk rejects every subset, superset, reordered, shell, mutation, or delegation profile", () => {
  for (const tools of [
    ["Read"],
    ["Read", "Glob", "Grep"],
    [...READ_ONLY_TOOLS].reverse(),
    [...READ_ONLY_TOOLS, "Bash"],
    [...READ_ONLY_TOOLS, "PowerShell"],
    [...READ_ONLY_TOOLS, "Edit"],
    [...READ_ONLY_TOOLS, "Write"],
    [...READ_ONLY_TOOLS, "Agent"],
    [...READ_ONLY_TOOLS, "Task"],
    [...READ_ONLY_TOOLS, "NotebookEdit"],
  ]) {
    assert.throws(
      () =>
        buildClaudeArgv({
          tools,
          mode: "dontAsk",
          mcpConfigPath: CONFIG_PATH,
        }),
      /exact read-only tool profile/iu,
    );
  }
});

test("Preserves the shell-free dontAsk counterexample for pre-generated audit evidence", () => {
  const argv = buildClaudeArgv({
    tools: READ_ONLY_TOOLS,
    mode: "dontAsk",
    mcpConfigPath: CONFIG_PATH,
  });
  assert.equal(argv[argv.indexOf("--tools") + 1], READ_ONLY_TOOLS.join(","));
});
