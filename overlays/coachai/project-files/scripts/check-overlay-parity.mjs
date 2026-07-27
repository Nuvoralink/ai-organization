#!/usr/bin/env node
/** Universal-overlay parity gate. Hashes only declared orchestration paths/JSON sections. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Drop append-only project-accumulated regions (the agent "## Learned classes" live log) before
// hashing: the overlay owns control-plane STRUCTURE, not the closed-loop-learning rows the orchestrator
// appends over a project's life. Same philosophy as excluded_project_owned, at region granularity
// (a whole-file exclusion can't work — the file's structure above the marker must still be parity-checked).
function stripAppendOnlyRegions(text, markers) {
  for (const marker of markers) {
    const match = new RegExp(`^${escapeRegex(marker)}`, 'm').exec(text);
    if (match) return `${text.slice(0, match.index).replace(/\n+$/, '')}\n`;
  }
  return text;
}
function fileSha(file, appendOnlyMarkers = []) {
  const buffer = fs.readFileSync(file);
  // Git may materialize text as LF or CRLF. Overlay meaning is content, not checkout convention.
  if (buffer.includes(0)) return sha(buffer);
  const text = buffer.toString('utf8').replace(/\r\n/g, '\n');
  return sha(appendOnlyMarkers.length ? stripAppendOnlyRegions(text, appendOnlyMarkers) : text);
}
const normalize = (rel) => rel.replace(/\\/g, '/').replace(/^\.\//, '');
function globRegex(pattern) {
  let out = '^';
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*') { out += '.*'; i += 1; }
    else if (c === '*') out += '[^/]*';
    else out += c.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`${out}$`);
}
function walk(root, rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [normalize(rel)];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => walk(root, path.join(rel, entry.name)));
}
function getSection(value, dotted) {
  return dotted.split('.').reduce((current, key) => current?.[key], value);
}

export function buildOverlayLock(root = process.cwd()) {
  const ownership = JSON.parse(fs.readFileSync(path.join(root, '.ai-organization', 'ownership.json'), 'utf8'));
  const excluded = (ownership.excluded_project_owned ?? []).map(globRegex);
  const isExcluded = (rel) => rel === ownership.lock_file || excluded.some((re) => re.test(rel));
  const appendOnlyMarkers = ownership.append_only_markers ?? [];
  const files = new Set((ownership.managed_files ?? []).map(normalize));
  for (const managedRoot of ownership.managed_roots ?? []) for (const rel of walk(root, managedRoot)) if (!isExcluded(rel)) files.add(rel);
  const fileHashes = [];
  for (const rel of [...files].sort()) {
    const abs = path.join(root, rel);
    fileHashes.push({ path: rel, sha256: fs.existsSync(abs) && fs.statSync(abs).isFile() ? fileSha(abs, appendOnlyMarkers) : null });
  }
  const jsonSections = {};
  for (const [rel, sections] of Object.entries(ownership.managed_json_sections ?? {})) {
    const value = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
    jsonSections[rel] = {};
    for (const section of sections) {
      const sectionValue = getSection(value, section);
      if (sectionValue === undefined) throw new Error(`managed JSON section modified or missing: ${rel}#${section}`);
      jsonSections[rel][section] = sha(JSON.stringify(sectionValue));
    }
  }
  return { version: 1, source: ownership.overlay_source, files: fileHashes, json_sections: jsonSections };
}

export function checkOverlayParity(root = process.cwd()) {
  const lockPath = path.join(root, '.ai-organization', 'overlay-lock.json');
  if (!fs.existsSync(lockPath)) return { ok: false, errors: ['missing .ai-organization/overlay-lock.json'] };
  const expected = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  let actual;
  try { actual = buildOverlayLock(root); }
  catch (error) { return { ok: false, errors: [error.message], managedFileCount: 0 }; }
  const errors = [];
  const expectedFiles = new Map((expected.files ?? []).map((entry) => [entry.path, entry.sha256]));
  const actualFiles = new Map((actual.files ?? []).map((entry) => [entry.path, entry.sha256]));
  for (const [rel, hash] of expectedFiles) {
    if (!actualFiles.has(rel) || actualFiles.get(rel) === null) errors.push(`managed file missing: ${rel}`);
    else if (actualFiles.get(rel) !== hash) errors.push(`managed file modified: ${rel}`);
  }
  for (const rel of actualFiles.keys()) if (!expectedFiles.has(rel)) errors.push(`unlocked file added under managed ownership: ${rel}`);
  for (const [rel, sections] of Object.entries(expected.json_sections ?? {})) for (const [section, hash] of Object.entries(sections)) {
    if (actual.json_sections?.[rel]?.[section] !== hash) errors.push(`managed JSON section modified or missing: ${rel}#${section}`);
  }
  return { ok: errors.length === 0, errors, managedFileCount: actualFiles.size };
}

export function writeOverlayLock(root = process.cwd()) {
  const lockPath = path.join(root, '.ai-organization', 'overlay-lock.json');
  fs.writeFileSync(lockPath, `${JSON.stringify(buildOverlayLock(root), null, 2)}\n`);
  return lockPath;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf('--root');
  const root = rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : process.cwd();
  if (args.includes('--write')) {
    try {
      const lockPath = writeOverlayLock(root);
      console.log(`overlay-parity: wrote ${normalize(path.relative(root, lockPath))}`);
      process.exit(0);
    } catch (error) {
      console.error(`overlay-parity: FAIL\n- ${error.message}`);
      process.exit(1);
    }
  }
  if (args.includes('--print')) { console.log(`${JSON.stringify(buildOverlayLock(root), null, 2)}\n`); process.exit(0); }
  const result = checkOverlayParity(root);
  if (!result.ok) { console.error(['overlay-parity: FAIL', ...result.errors.map((e) => `- ${e}`)].join('\n')); process.exit(1); }
  console.log(`overlay-parity: PASS — ${result.managedFileCount} managed orchestration files/sections match the lock`);
}
