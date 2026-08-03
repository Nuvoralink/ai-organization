#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const TEST_FILE = /(?:^|\/)(?:[^/]+\.)?(?:test|spec)\.[cm]?[jt]sx?$/u;
const IGNORED_DIRECTORY = /^(?:node_modules|dist|build|coverage)$/u;
const IGNORE_EMPTY_FLAGS = /(?:--passWithNoTests|--allow-no-tests|--if-no-tests)/u;

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function expandWorkspaces(root, patterns) {
  const directories = [];
  for (const pattern of patterns) {
    if (!pattern.endsWith("/*")) {
      directories.push(resolve(root, pattern));
      continue;
    }
    const parent = resolve(root, pattern.slice(0, -2));
    for (const entry of await readdir(parent, { withFileTypes: true })) {
      if (entry.isDirectory()) directories.push(resolve(parent, entry.name));
    }
  }
  return directories;
}

async function findTests(directory, relative = "") {
  const files = [];
  for (const entry of await readdir(resolve(directory, relative), { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORY.test(entry.name)) continue;
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await findTests(directory, child));
    else if (entry.isFile() && TEST_FILE.test(child)) files.push(child);
  }
  return files;
}

function vitestDiscoveryRoots(script) {
  const roots = [];
  for (const segment of script.split(/&&|\|\|/u)) {
    const match = segment.match(/(?:^|\s)vitest\s+run(?:\s+([^&|]+))?/u);
    if (!match) continue;
    const tokens = (match[1] ?? "")
      .trim()
      .split(/\s+/u)
      .filter(Boolean);
    const positional = tokens.filter((token) => !token.startsWith("-") && !/^\d+$/u.test(token));
    if (positional.length === 0) roots.push("");
    else roots.push(...positional.map((token) => token.replace(/^\.\//u, "").replace(/\\/gu, "/")));
  }
  return roots;
}

function isTestDiscovered(test, script) {
  const normalizedScript = script.replace(/\\/gu, "/");
  if (normalizedScript.includes(test)) return true;
  return vitestDiscoveryRoots(normalizedScript).some(
    (root) => root === "" || test === root || test.startsWith(`${root.replace(/\/$/u, "")}/`)
  );
}

export async function findTestWorkspaceCoverageViolations(root) {
  const rootManifest = await readJson(resolve(root, "package.json"));
  const patterns = Array.isArray(rootManifest.workspaces)
    ? rootManifest.workspaces
    : rootManifest.workspaces?.packages ?? [];
  const workspaceDirectories = await expandWorkspaces(root, patterns);
  const violations = [];
  const covered = [];

  for (const directory of workspaceDirectories) {
    let manifest;
    try {
      manifest = await readJson(resolve(directory, "package.json"));
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    const tests = await findTests(directory);
    if (tests.length === 0) continue;
    if (!manifest.scripts?.test) {
      violations.push(`${manifest.name ?? directory} has ${tests.length} test file(s) but no test script`);
      continue;
    }
    if (IGNORE_EMPTY_FLAGS.test(manifest.scripts.test)) {
      violations.push(`${manifest.name} test script can pass with zero executed tests`);
      continue;
    }
    const undiscovered = tests.filter((test) => !isTestDiscovered(test, manifest.scripts.test));
    if (undiscovered.length > 0) {
      violations.push(
        `${manifest.name} test script omits ${undiscovered.length} test file(s): ${undiscovered.join(", ")}`
      );
      continue;
    }
    covered.push({ name: manifest.name, tests: tests.length });
  }

  const aggregate = rootManifest.scripts?.["test:all"] ?? "";
  if (!aggregate.includes("npm run --workspaces --if-present test")) {
    violations.push("root test:all must execute every workspace test script");
  }
  if (IGNORE_EMPTY_FLAGS.test(aggregate)) {
    violations.push("root test:all can pass with zero executed tests");
  }
  return { violations, covered };
}

async function main() {
  const rootIndex = process.argv.indexOf("--root");
  const root = rootIndex === -1 ? process.cwd() : resolve(process.argv[rootIndex + 1]);
  const result = await findTestWorkspaceCoverageViolations(root);
  if (result.violations.length > 0) {
    console.error("Test workspace coverage is incomplete:");
    for (const violation of result.violations) console.error(`- ${violation}`);
    process.exitCode = 1;
    return;
  }
  const evidence = result.covered.map(({ name, tests }) => `${name}=${tests}`).join(", ");
  console.log(`Test workspace coverage is complete: ${evidence}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
