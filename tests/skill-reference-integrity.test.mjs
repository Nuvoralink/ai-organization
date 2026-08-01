/**
 * Proves: ORG-SKILL-REFERENCE-INTEGRITY-001; Test type: repository inventory plus mutation;
 * Surface: every canonical skills/** Markdown file; Authority: canonical skill packages;
 * Killer mutations: add a missing local Markdown link, require a nonexistent companion skill,
 * or make an extensionless link resolve only to a non-Markdown file; Gated command: npm test.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalSkillsRoot = path.join(repoRoot, 'skills');

function walkMarkdownFiles(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(candidate);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(candidate);
    }
  };
  visit(root);
  return files.sort();
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function markdownDestination(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('<')) {
    const closing = trimmed.indexOf('>');
    return closing === -1 ? trimmed : trimmed.slice(1, closing);
  }
  return trimmed.split(/\s+/u, 1)[0];
}

function isIgnoredDestination(target) {
  return target === ''
    || target.startsWith('#')
    || /^(?:https?:|mailto:|tel:)/iu.test(target)
    || /\{[^}]+\}/u.test(target);
}

function existingMarkdownTarget(sourceFile, skillPackageRoot, skillsRoot, rawTarget) {
  const destination = markdownDestination(rawTarget);
  if (isIgnoredDestination(destination)) return { ignored: true };

  const withoutFragment = destination.split('#', 1)[0].split('?', 1)[0];
  const hasExtension = path.extname(withoutFragment) !== '';
  const relativeCandidates = [
    path.resolve(path.dirname(sourceFile), withoutFragment),
    path.resolve(skillPackageRoot, withoutFragment),
  ];
  const candidates = hasExtension
    ? relativeCandidates
    : relativeCandidates.map((candidate) => `${candidate}.md`);
  const boundedCandidates = candidates.filter((candidate) => {
    const relative = path.relative(skillsRoot, candidate);
    return relative !== '' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  });

  return {
    ignored: false,
    exists: boundedCandidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()),
    destination,
  };
}

function mandatoryCompanionMatches(source) {
  const matches = [...source.matchAll(/\bload(?:\s+the)?\s+`([a-z0-9][a-z0-9-]*)`(?:\s+skill)?/giu)]
    .map((match) => ({ dependency: match[1], index: match.index }));
  let inLoadList = false;
  let inReadNext = false;
  let offset = 0;

  for (const line of source.split('\n')) {
    if (/^##\s+Read next\s*$/iu.test(line)) {
      inReadNext = true;
      inLoadList = false;
    } else if (/^##\s+/u.test(line)) {
      inReadNext = false;
      inLoadList = false;
    } else if (/^\s*Load\s+(?:these\b|the\s+following\b|alongside\s*:)/iu.test(line)) {
      inLoadList = true;
    } else if (inLoadList) {
      const item = line.match(/^\s*(?:[-*]|\d+\.)\s+`([a-z0-9][a-z0-9-]*)`/iu);
      if (item) matches.push({ dependency: item[1], index: offset + item.index });
      else if (line.trim() !== '' && !/^\s*(?:[-*]|\d+\.)\s+/u.test(line)) inLoadList = false;
    }
    if (inReadNext) {
      const item = line.match(/^\s*[-*]\s+`([a-z0-9][a-z0-9-]*)`/iu);
      if (item) matches.push({ dependency: item[1], index: offset + item.index });
    }
    offset += line.length + 1;
  }

  return matches;
}

function scanSkillReferences(skillsRoot) {
  const markdownFiles = walkMarkdownFiles(skillsRoot);
  const packageNames = new Set(
    fs.readdirSync(skillsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(skillsRoot, entry.name, 'SKILL.md')))
      .map((entry) => entry.name),
  );
  const problems = [];
  let localReferenceCount = 0;
  let ignoredReferenceCount = 0;
  let companionDirectiveCount = 0;

  for (const file of markdownFiles) {
    const relativeFile = path.relative(skillsRoot, file);
    const packageName = relativeFile.split(path.sep)[0];
    const skillPackageRoot = path.join(skillsRoot, packageName);
    const source = fs.readFileSync(file, 'utf8');
    const linkMatches = [
      ...source.matchAll(/\[[^\]\n]+\]\(([^)\n]+)\)/gu),
      ...source.matchAll(/^\s{0,3}\[[^\]\n]+\]:\s*(\S+)/gmu),
      ...source.matchAll(/`((?:\.{1,2}[\\/]|(?:references|documentation)[\\/]|[a-z0-9][a-z0-9-]*[\\/](?:references|documentation)[\\/])[^`\r\n]+\.md(?:#[^`]*)?)`/giu),
    ];

    for (const match of linkMatches) {
      const resolution = existingMarkdownTarget(file, skillPackageRoot, skillsRoot, match[1]);
      if (resolution.ignored) {
        ignoredReferenceCount += 1;
        continue;
      }
      localReferenceCount += 1;
      if (!resolution.exists) {
        problems.push(
          `${relativeFile}:${lineNumber(source, match.index)} -> missing local Markdown target ${resolution.destination}`,
        );
      }
    }

    for (const match of mandatoryCompanionMatches(source)) {
      const dependency = match.dependency;
      if (dependency === 'references') continue;
      companionDirectiveCount += 1;
      if (!packageNames.has(dependency)) {
        problems.push(
          `${relativeFile}:${lineNumber(source, match.index)} -> missing mandatory companion skill ${dependency}`,
        );
      }
    }
  }

  return {
    companionDirectiveCount,
    ignoredReferenceCount,
    localReferenceCount,
    markdownFileCount: markdownFiles.length,
    problems: problems.sort(),
  };
}

test('Proves valid file-relative, package-root-relative, external, templated, and extensionless Markdown references remain usable', (t) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-reference-integrity-'));
  t.after(() => fs.rmSync(fixture, { force: true, recursive: true }));
  const alpha = path.join(fixture, 'alpha');
  const alphaReferences = path.join(alpha, 'references');
  const nestedReferences = path.join(alpha, 'nested', 'references');
  const beta = path.join(fixture, 'beta');
  fs.mkdirSync(alphaReferences, { recursive: true });
  fs.mkdirSync(nestedReferences, { recursive: true });
  fs.mkdirSync(beta, { recursive: true });
  fs.writeFileSync(path.join(alpha, 'SKILL.md'), '# Alpha\n');
  fs.writeFileSync(path.join(beta, 'SKILL.md'), '# Beta\n');
  fs.writeFileSync(path.join(alphaReferences, 'file-relative.md'), '# File relative\n');
  fs.writeFileSync(path.join(alphaReferences, 'package-root.md'), '# Package root\n');
  fs.writeFileSync(path.join(alpha, 'extensionless.md'), '# Extensionless\n');
  fs.writeFileSync(path.join(nestedReferences, 'template.md'), '# Nested package-root reference\n');
  fs.writeFileSync(
    path.join(alphaReferences, 'guide.md'),
    [
      '[file relative](file-relative.md)',
      '[package root](references/package-root.md)',
      '[extensionless](extensionless)',
      '`references/package-root.md`',
      '`nested/references/template.md`',
      '[external](https://example.com/reference.md)',
      '[anchor](#local-section)',
      '[template]({baseDir}/references/generated.md)',
      'Load `beta`.',
      'Load these skills first:',
      '- `beta` — list-form companion.',
      '## Read next',
      '- `beta` — read-next companion.',
    ].join('\n'),
  );

  const result = scanSkillReferences(fixture);
  assert.deepEqual(result.problems, []);
  assert.equal(result.markdownFileCount, 7);
  assert.equal(result.localReferenceCount, 5);
  assert.equal(result.ignoredReferenceCount, 3);
  assert.equal(result.companionDirectiveCount, 3);
});

test('Proves missing local Markdown and mandatory companion references fail instead of silently dropping guidance', (t) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-reference-mutations-'));
  t.after(() => fs.rmSync(fixture, { force: true, recursive: true }));
  const packageRoot = path.join(fixture, 'alpha');
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'SKILL.md'), '# Alpha\n');
  fs.writeFileSync(path.join(packageRoot, 'raw-extensionless'), 'not Markdown\n');
  fs.writeFileSync(
    path.join(packageRoot, 'guide.md'),
    '[missing](references/missing.md)\n[raw extensionless](raw-extensionless)\n[file URI](file:///missing.md)\n`references/missing-backtick.md`\n`ghost-package/references/missing.md`\nLoad `ghost-skill`.\nLoad these skills first:\n- `ghost-list-skill` — required list item.\n## Read next\n- `ghost-read-next` — required follow-up.\n',
  );

  const result = scanSkillReferences(fixture);
  assert.equal(result.problems.length, 8);
  assert.ok(result.problems.some((problem) => problem.includes('missing local Markdown target references/missing.md')));
  assert.ok(result.problems.some((problem) => problem.includes('missing local Markdown target raw-extensionless')));
  assert.ok(result.problems.some((problem) => problem.includes('missing local Markdown target file:///missing.md')));
  assert.ok(result.problems.some((problem) => problem.includes('missing local Markdown target references/missing-backtick.md')));
  assert.ok(result.problems.some((problem) => problem.includes('missing local Markdown target ghost-package/references/missing.md')));
  assert.ok(result.problems.some((problem) => problem.includes('missing mandatory companion skill ghost-skill')));
  assert.ok(result.problems.some((problem) => problem.includes('missing mandatory companion skill ghost-list-skill')));
  assert.ok(result.problems.some((problem) => problem.includes('missing mandatory companion skill ghost-read-next')));
});

test('Proves the complete canonical skill inventory has no dangling enforced references', (t) => {
  const result = scanSkillReferences(canonicalSkillsRoot);
  t.diagnostic(
    `scanned ${result.markdownFileCount} Markdown files, ${result.localReferenceCount} local links, `
      + `${result.ignoredReferenceCount} external/anchor/template links, and ${result.companionDirectiveCount} mandatory companion loads`,
  );
  assert.deepEqual(result.problems, []);
});
