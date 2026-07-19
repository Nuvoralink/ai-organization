#!/usr/bin/env node

import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const BOUNDARY_SCHEMA_VERSION = 1;
const BOUNDED_TOOLS = new Set(["Read", "Glob", "Grep", "Edit", "Write", "Skill"]);
const MAX_BOUNDARY_PATHS = 100;
const MAX_SEARCH_TREE_ENTRIES = 100_000;

function plainObject(value, label) {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function pathKey(value) {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function isContained(parent, candidate, { allowEqual = true } = {}) {
  const relative = path.relative(parent, candidate);
  if (relative === "") return allowEqual;
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function rejectCrossPlatformAbsolute(value, label) {
  if (path.isAbsolute(value) || path.win32.isAbsolute(value) || path.posix.isAbsolute(value)) {
    throw new Error(`${label} must be repository-relative`);
  }
}

function normalizeDeclaredPath(value, label, { allowRoot = false } = {}) {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0 || value.includes("\0")) {
    throw new Error(`${label} must be a non-empty exact repository-relative path`);
  }
  rejectCrossPlatformAbsolute(value, label);
  if (/[*?{}[\]]/u.test(value)) throw new Error(`${label} must not contain glob metacharacters`);
  const normalized = value.replace(/\\/gu, "/");
  const portable = path.posix.normalize(normalized);
  if (portable === ".") {
    if (!allowRoot) throw new Error(`${label} must not name the repository root`);
    return ".";
  }
  if (portable === ".." || portable.startsWith("../") || normalized.startsWith("/")) {
    throw new Error(`${label} escapes the repository root`);
  }
  return portable;
}

function canonicalRoot(projectRoot) {
  if (typeof projectRoot !== "string" || projectRoot.trim() === "") {
    throw new Error("project_root must be a non-empty absolute path");
  }
  const lexical = path.resolve(projectRoot);
  if (!path.isAbsolute(lexical) || !existsSync(lexical)) throw new Error("project_root must exist");
  const rootStat = lstatSync(lexical);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error("project_root must be a real directory, not a symlink/reparse path");
  }
  return { lexical, real: realpathSync.native(lexical) };
}

function assertNoSymlinkSegments(root, candidate, label) {
  const relative = path.relative(root, candidate);
  const segments = relative === "" ? [] : relative.split(path.sep);
  let current = root;
  for (const segment of segments) {
    current = path.join(current, segment);
    if (!existsSync(current)) break;
    if (lstatSync(current).isSymbolicLink()) {
      throw new Error(`${label} crosses a symlink/reparse path`);
    }
  }
}

function assertNoSymlinkDescendants(directory, label) {
  const pending = [directory];
  let visited = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      visited += 1;
      if (visited > MAX_SEARCH_TREE_ENTRIES) {
        throw new Error(`${label} exceeds the bounded symlink/reparse inspection limit; declare a narrower read root`);
      }
      const absolute = path.join(current, entry.name);
      const stat = lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new Error(`${label} contains a symlink/reparse descendant`);
      if (stat.isDirectory()) pending.push(absolute);
    }
  }
}

function resolveCandidate(root, candidate, label, { mustExist = false } = {}) {
  if (typeof candidate !== "string" || candidate.trim() === "" || candidate.includes("\0")) {
    throw new Error(`${label} must be a non-empty path string`);
  }
  const absolute = path.isAbsolute(candidate) || path.win32.isAbsolute(candidate) || path.posix.isAbsolute(candidate)
    ? path.resolve(candidate)
    : path.resolve(root.lexical, candidate);
  if (!isContained(root.lexical, absolute)) throw new Error(`${label} escapes the repository root`);
  assertNoSymlinkSegments(root.lexical, absolute, label);

  let existing = absolute;
  while (!existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing || !isContained(root.lexical, parent)) {
      throw new Error(`${label} has no safe existing repository ancestor`);
    }
    existing = parent;
  }
  const realExisting = realpathSync.native(existing);
  if (!isContained(root.real, realExisting)) throw new Error(`${label} resolves outside the repository root`);
  if (mustExist && !existsSync(absolute)) throw new Error(`${label} must name an existing path`);
  if (existsSync(absolute)) {
    const realCandidate = realpathSync.native(absolute);
    if (!isContained(root.real, realCandidate)) throw new Error(`${label} resolves outside the repository root`);
  }
  return absolute;
}

function uniqueNormalizedPaths(values, label, options) {
  if (!Array.isArray(values) || values.length === 0 || values.length > MAX_BOUNDARY_PATHS) {
    throw new Error(`${label} must contain 1-${MAX_BOUNDARY_PATHS} exact paths`);
  }
  const normalized = values.map((value, index) => normalizeDeclaredPath(value, `${label}[${index}]`, options));
  const keys = normalized.map((value) => process.platform === "win32" ? value.toLowerCase() : value);
  if (new Set(keys).size !== keys.length) throw new Error(`${label} contains a duplicate path`);
  return normalized;
}

export function createBoundaryManifest({ projectRoot, readPaths, editPaths, skillNames }) {
  const root = canonicalRoot(projectRoot);
  const normalizedReads = uniqueNormalizedPaths(readPaths, "read_paths", { allowRoot: true });
  const normalizedEdits = uniqueNormalizedPaths(editPaths, "edit_paths", { allowRoot: false });
  if (!Array.isArray(skillNames) || skillNames.some((value) => typeof value !== "string")) {
    throw new Error("skill_names must be an array of strings");
  }
  const readEntries = normalizedReads.map((relative, index) => {
    const absolute = resolveCandidate(root, relative, `read_paths[${index}]`, { mustExist: true });
    const stat = statSync(absolute);
    if (!stat.isFile() && !stat.isDirectory()) throw new Error(`read_paths[${index}] must name a file or directory`);
    return { path: relative, kind: stat.isDirectory() ? "directory" : "file" };
  });
  for (const [index, relative] of normalizedEdits.entries()) {
    const absolute = resolveCandidate(root, relative, `edit_paths[${index}]`);
    if (existsSync(absolute) && !statSync(absolute).isFile()) {
      throw new Error(`edit_paths[${index}] must name a file or a not-yet-created file`);
    }
  }
  return {
    schema_version: BOUNDARY_SCHEMA_VERSION,
    project_root: root.lexical,
    project_root_real: root.real,
    read_paths: readEntries,
    edit_paths: normalizedEdits,
    skill_names: [...skillNames],
    explicit_root_read: normalizedReads.includes("."),
  };
}

function validateManifest(value) {
  const manifest = plainObject(value, "boundary manifest");
  const keys = Object.keys(manifest).sort();
  const expected = ["edit_paths", "explicit_root_read", "project_root", "project_root_real", "read_paths", "schema_version", "skill_names"].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected) || manifest.schema_version !== BOUNDARY_SCHEMA_VERSION) {
    throw new Error("boundary manifest has an unsupported or ambiguous shape");
  }
  const rebuilt = createBoundaryManifest({
    projectRoot: manifest.project_root,
    readPaths: manifest.read_paths?.map((entry) => plainObject(entry, "read_paths entry").path),
    editPaths: manifest.edit_paths,
    skillNames: manifest.skill_names,
  });
  if (pathKey(rebuilt.project_root_real) !== pathKey(manifest.project_root_real)
    || rebuilt.explicit_root_read !== manifest.explicit_root_read
    || JSON.stringify(rebuilt.read_paths) !== JSON.stringify(manifest.read_paths)) {
    throw new Error("boundary manifest no longer matches the live filesystem");
  }
  return rebuilt;
}

function readAuthorized(manifest, root, candidate) {
  const candidateKey = pathKey(candidate);
  for (const editPath of manifest.edit_paths) {
    if (candidateKey === pathKey(path.resolve(root.lexical, editPath))) return true;
  }
  for (const entry of manifest.read_paths) {
    const declared = path.resolve(root.lexical, entry.path);
    if (entry.kind === "file" && candidateKey === pathKey(declared)) return true;
    if (entry.kind === "directory" && isContained(declared, candidate)) return true;
  }
  return false;
}

function directoryReadAuthorized(manifest, root, candidate) {
  return manifest.read_paths.some((entry) => entry.kind === "directory"
    && isContained(path.resolve(root.lexical, entry.path), candidate));
}

function validateGlobPattern(pattern) {
  if (typeof pattern !== "string" || pattern.trim() === "" || pattern.includes("\0")) {
    throw new Error("Glob tool_input.pattern must be a non-empty string");
  }
  if (path.isAbsolute(pattern) || path.win32.isAbsolute(pattern) || path.posix.isAbsolute(pattern) || pattern.startsWith("~")) {
    throw new Error("Glob tool_input.pattern must be relative to its declared search root");
  }
  const segments = pattern.split(/[\\/]+/u);
  if (segments.includes("..")) throw new Error("Glob tool_input.pattern must not traverse above its declared search root");
}

export function evaluateBoundaryToolUse(event, manifestValue) {
  const manifest = validateManifest(manifestValue);
  const input = plainObject(event, "hook input");
  if (input.hook_event_name !== "PreToolUse" || input.permission_mode !== "bypassPermissions") {
    throw new Error("boundary hook only accepts bypassPermissions PreToolUse events");
  }
  if (typeof input.tool_use_id !== "string" || input.tool_use_id.trim() === "") {
    throw new Error("PreToolUse event is missing tool_use_id");
  }
  if (typeof input.cwd !== "string") throw new Error("PreToolUse event is missing cwd");
  const root = canonicalRoot(manifest.project_root);
  const eventCwd = realpathSync.native(path.resolve(input.cwd));
  if (pathKey(eventCwd) !== pathKey(root.real)) throw new Error("PreToolUse cwd does not match the declared repository root");
  if (typeof input.tool_name !== "string" || !BOUNDED_TOOLS.has(input.tool_name)) {
    throw new Error(`tool ${String(input.tool_name)} is outside the exact bounded implementation allowlist`);
  }
  const toolInput = plainObject(input.tool_input, `${input.tool_name} tool_input`);

  if (input.tool_name === "Skill") {
    if (typeof toolInput.skill !== "string" || !manifest.skill_names.includes(toolInput.skill)) {
      throw new Error(`Skill ${String(toolInput.skill)} is not exactly declared`);
    }
    return { tool: "Skill", target: toolInput.skill };
  }

  if (["Read", "Edit", "Write"].includes(input.tool_name)) {
    const candidate = resolveCandidate(root, toolInput.file_path, `${input.tool_name} tool_input.file_path`, {
      mustExist: input.tool_name !== "Write",
    });
    const relative = path.relative(root.lexical, candidate).replace(/\\/gu, "/");
    if (input.tool_name === "Read") {
      if (!readAuthorized(manifest, root, candidate)) throw new Error(`Read path ${relative} is outside declared read_paths/edit_paths`);
    } else if (!manifest.edit_paths.some((entry) => pathKey(path.resolve(root.lexical, entry)) === pathKey(candidate))) {
      throw new Error(`${input.tool_name} path ${relative} is outside exact edit_paths`);
    }
    return { tool: input.tool_name, target: relative };
  }

  const omittedRoot = toolInput.path === undefined;
  if (omittedRoot && !manifest.explicit_root_read) {
    throw new Error(`${input.tool_name} omitted tool_input.path without an explicit repository-root read boundary`);
  }
  const searchRoot = resolveCandidate(root, omittedRoot ? root.lexical : toolInput.path, `${input.tool_name} tool_input.path`, { mustExist: true });
  const stat = statSync(searchRoot);
  if (input.tool_name === "Glob") {
    validateGlobPattern(toolInput.pattern);
    if (!stat.isDirectory() || !directoryReadAuthorized(manifest, root, searchRoot)) {
      throw new Error("Glob search root must be a declared in-repository read directory");
    }
    assertNoSymlinkDescendants(searchRoot, "Glob search root");
  } else {
    if (typeof toolInput.pattern !== "string" || toolInput.pattern.length === 0) throw new Error("Grep tool_input.pattern must be a non-empty string");
    const authorized = stat.isDirectory()
      ? directoryReadAuthorized(manifest, root, searchRoot)
      : stat.isFile() && readAuthorized(manifest, root, searchRoot);
    if (!authorized) throw new Error("Grep search root must be a declared in-repository read file or directory");
    if (stat.isDirectory()) assertNoSymlinkDescendants(searchRoot, "Grep search root");
  }
  return { tool: input.tool_name, target: path.relative(root.lexical, searchRoot).replace(/\\/gu, "/") || "." };
}

export function allowedDecision(result) {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: `Dispatcher boundary allowed ${result.tool} for ${result.target}`,
    },
  };
}

function validateActivation(manifest, activationPath, nonce) {
  if (typeof activationPath !== "string" || !path.isAbsolute(activationPath) || typeof nonce !== "string" || !/^[a-f0-9]{32}$/u.test(nonce)) {
    throw new Error("boundary hook activation arguments are invalid");
  }
  let activation;
  try { activation = JSON.parse(readFileSync(activationPath, "utf8")); } catch { throw new Error("boundary hook activation proof is missing or invalid"); }
  if (activation?.schema_version !== BOUNDARY_SCHEMA_VERSION || activation?.nonce !== nonce
    || pathKey(activation?.project_root) !== pathKey(manifest.project_root)) {
    throw new Error("boundary hook activation proof does not match this dispatch");
  }
}

function activateBoundaryHook(manifest, activationPath, nonce, input) {
  const event = plainObject(input, "activation hook input");
  if (event.hook_event_name !== "SessionStart" || event.source !== "startup" || typeof event.cwd !== "string") {
    throw new Error("boundary activation requires a startup SessionStart event");
  }
  const eventCwd = realpathSync.native(path.resolve(event.cwd));
  if (pathKey(eventCwd) !== pathKey(manifest.project_root_real)) {
    throw new Error("boundary activation cwd does not match the declared repository root");
  }
  if (typeof activationPath !== "string" || !path.isAbsolute(activationPath) || typeof nonce !== "string" || !/^[a-f0-9]{32}$/u.test(nonce)) {
    throw new Error("boundary activation arguments are invalid");
  }
  writeFileSync(activationPath, `${JSON.stringify({ schema_version: BOUNDARY_SCHEMA_VERSION, nonce, project_root: manifest.project_root })}\n`, { encoding: "utf8", flag: "wx" });
}

function runCli() {
  try {
    if (process.argv.length !== 6 || !["--activate", "--enforce"].includes(process.argv[2])) {
      throw new Error("boundary hook requires mode, manifest, activation, and nonce arguments");
    }
    const [, , mode, manifestPath, activationPath, nonce] = process.argv;
    const manifest = validateManifest(JSON.parse(readFileSync(manifestPath, "utf8")));
    const input = JSON.parse(readFileSync(0, "utf8"));
    if (mode === "--activate") {
      activateBoundaryHook(manifest, activationPath, nonce, input);
      return;
    }
    validateActivation(manifest, activationPath, nonce);
    process.stdout.write(`${JSON.stringify(allowedDecision(evaluateBoundaryToolUse(input, manifest)))}\n`);
  } catch (error) {
    process.stderr.write(`CAPABILITY_BLOCKED: ${error.message}\n`);
    process.exitCode = 2;
  }
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1] ?? "")).href) runCli();
