#!/usr/bin/env node

// Auxara Dialer doc/code drift gate.
//
// Converted from the carried-over CoachAI gate (V2 authority inventory / SRP-001/002/004 / score
// authority — none of which exist in the dialer) to the DIALER's actual source-of-truth surfaces
// (Sprint 0.1): the ARC-005 central registries resolve to real files, the migration-001 Prisma
// models + FORCED RLS exist, and the shared taxonomy enums stay in sync. CoachAI-equivalent DEEP
// checks (tenant-security manifest, telemetry SRP, surface-authority map) are reintroduced as the
// dialer analogues land in their owning sprints (1.0+).
//
// It ALSO owns the deferred-endpoint doc-liveness reverse-drift check (see
// `validateDeferredEndpointDocLiveness`): when an endpoint is re-scoped to `deferred` in the parity
// gate's `BACKEND_DELIVERY_CLASSIFICATION` (code retained as a seam, runtime unmounted, cited
// `deferredBy`), a SECONDARY describing-doc must not keep asserting it is Built/live/current/
// PENDING_WIRING/Slice-N-owed without the DEFERRED qualifier. Residual (owned by the doctrine-drift +
// functionality-parity LENSES): that check is KEY-anchored — a doc naming the endpoint only by its
// contract-dotted name, its URL path, or in key-less prose is not reachable by it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import markdownit from 'markdown-it';
import { parseFragment } from 'parse5';
import { parseSrcset } from 'srcset';
import ts from 'typescript';
import { BACKEND_DELIVERY_CLASSIFICATION } from './check-backend-endpoint-parity.mjs';

const LIVING_MARKDOWN_ROOTS = ['docs/app-plan', 'docs/design-system'];
const UX_CONTENT_CONTRACT = 'docs/app-plan/product/05-ux-ui-content-contract.md';
const SURFACE_AUTHORITY_MAP = 'docs/app-plan/assurance/surface-authority-map.md';
const COMPANION_HANDOFF = 'docs/design-system/handoffs/dialer-companion/README.md';
const COMPANION_MODULE_ROOT = 'frontend/src/pages/companion';
const COMPANION_SHARED_AUTHORITY_ROOT = 'shared/src/copy';
const COMPANION_SHARED_AUTHORITY_FILE = /^companion[^/]*\.(?:ts|tsx|js|jsx)$/i;
const COMPANION_HANDOFF_ROOT = 'docs/design-system/handoffs/dialer-companion';
const SPRINT_1_4_AUTHORITY = 'docs/app-plan/implementation/sprints/sprint-1-4.md';
const BUG_BACKLOG = 'docs/BUG_BACKLOG.md';
const CENTRALIZATION_DOCTRINE = '.claude/rules/centralization-doctrine.md';
const SOURCE_OF_TRUTH_MAP = 'docs/app-plan/assurance/source-of-truth-map.md';
const CENTRAL_REGISTRY_ROOTS = ['shared/src/config', 'shared/src/taxonomy'];
const COMPANION_HANDOFF_EXCLUSIONS = new Map([
  [
    'docs/design-system/handoffs/dialer-companion/support.js',
    'prototype controller, not product authority prose',
  ],
  [
    'docs/design-system/handoffs/dialer-companion/tokens/domain.css',
    'prototype token mirror governed by the token gate',
  ],
  [
    'docs/design-system/handoffs/dialer-companion/tokens/elevation.css',
    'prototype token mirror governed by the token gate',
  ],
  [
    'docs/design-system/handoffs/dialer-companion/tokens/fonts.css',
    'prototype token mirror governed by the token gate',
  ],
  [
    'docs/design-system/handoffs/dialer-companion/tokens/primitives.css',
    'prototype token mirror governed by the rail/token gate',
  ],
  [
    'docs/design-system/handoffs/dialer-companion/tokens/semantic.css',
    'prototype token mirror governed by the token gate',
  ],
]);
const RAIL_AUTHORITY_ROOTS = ['docs', 'frontend/src', 'shared/src'];
const RAIL_AUTHORITY_EXTENSIONS = new Set([
  '.md',
  '.css',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.html',
  '.mjs',
  '.cjs',
]);
const SUPPORTED_EXTERNAL_LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);
const RAW_DIAL_BACKEND_ABSENCE_PATTERNS = [
  /\braw[- ]number\s+dial\s+has\s+no\s+backend\b/i,
  /\braw(?:[- ]number)?\s+dial\s+backend\s+(?:does\s+not|doesn't|is\s+not|isn't)\s+exist\b/i,
  /\b(?:there\s+is|phase[- ]?[ab]\s+has|has)\s+no\s+raw[- ]number\s+dial(?:\s+backend)?\b/i,
  /\bno\s+raw[- ]number\s+(?:dial\s+)?(?:backend|endpoint)\b/i,
  /\b(?:when\s+)?(?:the\s+)?(?:phase[- ]?b\s+)?raw[- ]dial\s+(?:backend|endpoint)\s+lands?\b/i,
];

// This gate parses but never renders Markdown or embedded HTML. CommonMark mode gives list-relative
// indentation, reference definitions, inline-code, and fenced/indented-code semantics to one maintained
// parser. All syntactically valid destinations remain observable so the stricter authority-link scheme
// policy below can report them instead of letting renderer safety turn them back into plain text.
const commonMark = markdownit('commonmark', {
  html: true,
  linkify: false,
  typographer: false,
});
const commonMarkDefaultValidateLink = commonMark.validateLink.bind(commonMark);
commonMark.validateLink = () => true;

function normalizePath(file) {
  return file.split(path.sep).join('/');
}

function walkMarkdownFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdownFiles(candidate));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(candidate);
  }
  return files;
}

function walkFiles(directory) {
  const files = [];
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(candidate));
    else if (entry.isFile()) files.push(candidate);
  }
  return files;
}

function markdownSection(source, heading) {
  const start = source.indexOf(heading);
  if (start < 0) return null;
  const afterHeading = start + heading.length;
  const nextHeading = source.indexOf('\n## ', afterHeading);
  return source.slice(start, nextHeading < 0 ? source.length : nextHeading);
}

function normalizeDocumentedRegistryPath(file) {
  return file.replace(/^shared\/(config|taxonomy)\//, 'shared/src/$1/').replaceAll('\\', '/');
}

function registryPathsInSection(section) {
  const paths = new Set();
  if (section == null) return paths;
  const pattern = /`(shared\/(?:src\/)?(?:config|taxonomy)\/[A-Za-z0-9._/-]+\.ts)`/g;
  for (const line of section.split(/\r?\n/u)) {
    if (!line.trimStart().startsWith('|')) continue;
    for (const match of line.matchAll(pattern)) {
      paths.add(normalizeDocumentedRegistryPath(match[1]));
    }
  }
  return paths;
}

/**
 * ARC-005's two documentation authorities are a bijection over the shared config/taxonomy roots.
 * Parsing is deliberately bounded to the named inventory sections and exact inline-code paths: an
 * example, generated path, or prose backtick elsewhere in either document cannot become authority.
 */
export function validateCentralRegistryDocumentation(repoRoot = process.cwd()) {
  const failures = [];
  const doctrinePath = path.join(repoRoot, CENTRALIZATION_DOCTRINE);
  const sourceMapPath = path.join(repoRoot, SOURCE_OF_TRUTH_MAP);
  if (!fs.existsSync(doctrinePath)) {
    failures.push(`Missing centralization doctrine: ${CENTRALIZATION_DOCTRINE}`);
    return failures;
  }
  if (!fs.existsSync(sourceMapPath)) {
    failures.push(`Missing source-of-truth map: ${SOURCE_OF_TRUTH_MAP}`);
    return failures;
  }

  const doctrineSection = markdownSection(
    fs.readFileSync(doctrinePath, 'utf8'),
    '## 1. Central registries by domain',
  );
  const sourceMapSection = markdownSection(
    fs.readFileSync(sourceMapPath, 'utf8'),
    '## Authority inventory',
  );
  if (doctrineSection == null) {
    failures.push(`${CENTRALIZATION_DOCTRINE}: central-registry inventory section is missing`);
  }
  if (sourceMapSection == null) {
    failures.push(`${SOURCE_OF_TRUTH_MAP}: authority inventory section is missing`);
  }

  const doctrinePaths = registryPathsInSection(doctrineSection);
  const sourceMapPaths = registryPathsInSection(sourceMapSection);
  const onDisk = new Set(
    CENTRAL_REGISTRY_ROOTS.flatMap((root) =>
      walkFiles(path.join(repoRoot, root))
        .filter((file) => path.extname(file) === '.ts')
        .map((file) => normalizePath(path.relative(repoRoot, file))),
    ),
  );

  for (const file of [...onDisk].sort()) {
    if (!doctrinePaths.has(file)) {
      failures.push(`Central registry missing from centralization doctrine inventory: ${file}`);
    }
    if (!sourceMapPaths.has(file)) {
      failures.push(`Central registry missing from source-of-truth map inventory: ${file}`);
    }
  }
  for (const [label, documentedPaths] of [
    ['centralization doctrine', doctrinePaths],
    ['source-of-truth map', sourceMapPaths],
  ]) {
    for (const file of [...documentedPaths].sort()) {
      if (!onDisk.has(file)) failures.push(`Stale ${label} central-registry path: ${file}`);
    }
  }
  return failures;
}

export function discoverCompanionAuthorityInventory(repoRoot = process.cwd()) {
  const moduleRoot = path.join(repoRoot, COMPANION_MODULE_ROOT);
  const sharedRoot = path.join(repoRoot, COMPANION_SHARED_AUTHORITY_ROOT);
  const handoffRoot = path.join(repoRoot, COMPANION_HANDOFF_ROOT);
  const allModuleFiles = walkFiles(moduleRoot)
    .map((file) => normalizePath(path.relative(repoRoot, file)))
    .sort();
  const moduleFiles = allModuleFiles
    .filter((file) => ['.ts', '.tsx', '.css'].includes(path.extname(file)))
    .sort();
  const unclassifiedModuleFiles = allModuleFiles.filter((file) => !moduleFiles.includes(file));
  const sharedFiles = walkFiles(sharedRoot)
    .map((file) => normalizePath(path.relative(repoRoot, file)))
    .filter((file) => COMPANION_SHARED_AUTHORITY_FILE.test(path.basename(file)))
    .sort();
  const handoffFiles = walkFiles(handoffRoot)
    .map((file) => normalizePath(path.relative(repoRoot, file)))
    .sort();
  const includedHandoffFiles = handoffFiles.filter(
    (file) =>
      file === COMPANION_HANDOFF ||
      file === 'docs/design-system/handoffs/dialer-companion/Dialer Companion.dc.html',
  );
  const unclassifiedHandoffFiles = handoffFiles.filter(
    (file) => !includedHandoffFiles.includes(file) && !COMPANION_HANDOFF_EXCLUSIONS.has(file),
  );
  const excludedHandoffFiles = handoffFiles.filter((file) =>
    COMPANION_HANDOFF_EXCLUSIONS.has(file),
  );
  return {
    sources: [...includedHandoffFiles, ...moduleFiles, ...sharedFiles].sort(),
    moduleRootPresent: fs.existsSync(moduleRoot),
    sharedRootPresent: fs.existsSync(sharedRoot),
    handoffRootPresent: fs.existsSync(handoffRoot),
    allModuleFiles,
    moduleFiles,
    unclassifiedModuleFiles,
    sharedFiles,
    handoffFiles,
    includedHandoffFiles,
    excludedHandoffFiles,
    excludedHandoffReasons: Object.fromEntries(
      excludedHandoffFiles.map((file) => [file, COMPANION_HANDOFF_EXCLUSIONS.get(file)]),
    ),
    unclassifiedHandoffFiles,
  };
}

function parseCommonMark(source) {
  const environment = {};
  return { tokens: commonMark.parse(source, environment), environment };
}

function walkTokens(tokens) {
  const flattened = [];
  for (const token of tokens) {
    flattened.push(token);
    if (token.children) flattened.push(...walkTokens(token.children));
  }
  return flattened;
}

const NON_SEMANTIC_HTML_ELEMENTS = new Set(['pre', 'code', 'script', 'style']);
const SEMANTIC_TEXT_CONTAINERS = new Set([
  'main',
  'section',
  'article',
  'div',
  'p',
  'li',
  'button',
  'label',
  'blockquote',
  'caption',
  'td',
  'th',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]);

function htmlSemanticData(html) {
  const targets = [];
  const text = [];
  const srcsetErrors = [];
  const root = parseFragment(html);
  const visit = (node, suppressed = false) => {
    const tagName = node.tagName?.toLowerCase();
    const nextSuppressed = suppressed || NON_SEMANTIC_HTML_ELEMENTS.has(tagName);
    if (!nextSuppressed && node.nodeName === '#text' && node.value) text.push(node.value);
    if (!suppressed && tagName) {
      const attribute = (name) => node.attrs?.find((candidate) => candidate.name === name)?.value;
      if ((tagName === 'a' || tagName === 'link') && attribute('href')) {
        targets.push(attribute('href'));
      }
      if ((tagName === 'img' || tagName === 'source' || tagName === 'script') && attribute('src')) {
        targets.push(attribute('src'));
      }
      const srcset = tagName === 'img' || tagName === 'source' ? attribute('srcset') : undefined;
      if (srcset) {
        try {
          for (const candidate of parseSrcset(srcset, { strict: true }))
            targets.push(candidate.url);
        } catch (error) {
          srcsetErrors.push(error instanceof Error ? error.message : String(error));
        }
      }
    }
    for (const child of node.childNodes ?? []) visit(child, nextSuppressed);
  };
  visit(root);
  return {
    text: text.join(' ').replace(/\s+/g, ' ').trim(),
    targets,
    srcsetErrors,
  };
}

function updateInlineSuppressionDepth(html, depth) {
  let nextDepth = depth;
  for (const match of html.matchAll(/<\s*(\/?)\s*(pre|code|script|style)\b[^>]*>/gi)) {
    const closing = match[1] === '/';
    const selfClosing = /\/\s*>$/.test(match[0]);
    if (closing) nextDepth = Math.max(0, nextDepth - 1);
    else if (!selfClosing) nextDepth += 1;
  }
  return nextDepth;
}

function inlineProse(tokens, includeInlineCode = false) {
  const parts = [];
  let suppressionDepth = 0;
  for (const token of tokens ?? []) {
    if (token.type === 'html_inline') {
      suppressionDepth = updateInlineSuppressionDepth(token.content, suppressionDepth);
      continue;
    }
    if (suppressionDepth > 0) continue;
    if (token.type === 'code_inline') {
      if (includeInlineCode) parts.push(token.content);
      continue;
    }
    if (token.type === 'text') parts.push(token.content);
    else if (token.type === 'softbreak' || token.type === 'hardbreak') parts.push(' ');
    else if (token.children) parts.push(inlineProse(token.children, includeInlineCode));
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function markdownParagraphs(source, { includeInlineCode = false } = {}) {
  const { tokens } = parseCommonMark(source);
  const paragraphs = [];
  for (const token of tokens) {
    if (token.type === 'inline') {
      const targets = [];
      const htmlData = htmlSemanticData(token.content);
      for (const child of walkTokens(token.children ?? [])) {
        if (child.type === 'link_open') {
          const target = child.attrGet('href');
          if (target) targets.push(target);
        } else if (child.type === 'image') {
          const target = child.attrGet('src');
          if (target) targets.push(target);
        }
      }
      targets.push(...htmlData.targets);
      const text = inlineProse(token.children, includeInlineCode);
      if (text || targets.length || htmlData.srcsetErrors.length) {
        paragraphs.push({
          text,
          targets,
          srcsetErrors: htmlData.srcsetErrors,
          line: (token.map?.[0] ?? 0) + 1,
        });
      }
    } else if (token.type === 'html_block') {
      const data = htmlSemanticData(token.content);
      if (data.text || data.targets.length || data.srcsetErrors.length) {
        paragraphs.push({ ...data, line: (token.map?.[0] ?? 0) + 1 });
      }
    }
  }
  return paragraphs;
}

function markdownPropositions(source, { includeInlineCode = false } = {}) {
  const { tokens } = parseCommonMark(source);
  const propositions = [];
  for (const token of tokens.filter((candidate) => candidate.type === 'inline')) {
    let text = '';
    let suppressionDepth = 0;
    const markdownLinkStack = [];
    const htmlLinkStack = [];
    const targetRanges = [];
    const append = (value, extraTargets = []) => {
      if (!value || suppressionDepth > 0) return;
      const start = text.length;
      text += value;
      const targets = new Set([...markdownLinkStack, ...htmlLinkStack, ...extraTargets]);
      for (const target of targets) targetRanges.push({ start, end: text.length, target });
    };

    for (const child of token.children ?? []) {
      if (child.type === 'link_open') {
        const target = child.attrGet('href');
        if (target) markdownLinkStack.push(target);
        continue;
      }
      if (child.type === 'link_close') {
        markdownLinkStack.pop();
        continue;
      }
      if (child.type === 'html_inline') {
        if (/^<\s*\/\s*a\s*>/i.test(child.content)) htmlLinkStack.pop();
        else if (/^<\s*a\b/i.test(child.content)) {
          const anchor = parseFragment(child.content).childNodes?.find(
            (node) => node.tagName?.toLowerCase() === 'a',
          );
          const target = anchor?.attrs?.find((attribute) => attribute.name === 'href')?.value;
          if (target) htmlLinkStack.push(target);
        }
        suppressionDepth = updateInlineSuppressionDepth(child.content, suppressionDepth);
        continue;
      }
      if (child.type === 'image') {
        const target = child.attrGet('src');
        append(child.content, target ? [target] : []);
      } else if (child.type === 'code_inline') {
        if (includeInlineCode) append(child.content);
      } else if (child.type === 'text') append(child.content);
      else if (child.type === 'softbreak' || child.type === 'hardbreak') append(' ');
    }

    const boundaryPattern = /[.!?;]+(?=\s|$)|,\s*(?:but|however|yet)\s+/gi;
    let start = 0;
    const pushProposition = (end) => {
      const propositionText = text.slice(start, end).replace(/\s+/g, ' ').trim();
      if (propositionText) {
        propositions.push({
          text: propositionText,
          targets: [
            ...new Set(
              targetRanges
                .filter((range) => range.start < end && range.end > start)
                .map((range) => range.target),
            ),
          ],
          line: (token.map?.[0] ?? 0) + 1,
        });
      }
      start = end;
    };
    for (const boundary of text.matchAll(boundaryPattern)) {
      pushProposition((boundary.index ?? 0) + boundary[0].length);
    }
    pushProposition(text.length);
  }
  return propositions;
}

function extractMarkdownLinkTargets(source) {
  const { tokens, environment } = parseCommonMark(source);
  const targets = new Set();
  const srcsetErrors = [];
  for (const token of tokens) {
    if (token.type === 'inline') {
      for (const child of walkTokens(token.children ?? [])) {
        if (child.type === 'link_open') {
          const target = child.attrGet('href');
          if (target) targets.add(target);
        } else if (child.type === 'image') {
          const target = child.attrGet('src');
          if (target) targets.add(target);
        }
      }
      const data = htmlSemanticData(token.content);
      for (const target of data.targets) targets.add(target);
      srcsetErrors.push(...data.srcsetErrors);
    } else if (token.type === 'html_block') {
      const data = htmlSemanticData(token.content);
      for (const target of data.targets) targets.add(target);
      srcsetErrors.push(...data.srcsetErrors);
    }
  }
  for (const reference of Object.values(environment.references ?? {})) {
    if (reference.href) targets.add(reference.href);
  }
  return { targets: [...targets], srcsetErrors };
}

function classifyMarkdownTarget(target) {
  if (target === '' || target.startsWith('#')) return { kind: 'non-file' };
  if (target.startsWith('//')) return { kind: 'unsupported', reason: 'scheme-relative URL' };

  // A drive path is a filesystem target, not a URI scheme. It can never be a portable living-doc
  // authority and must fail closed even when this gate runs on a non-Windows CI worker.
  if (/^[a-z]:[\\/]/i.test(target) || target.startsWith('\\\\')) {
    return { kind: 'unsupported', reason: 'absolute filesystem path' };
  }

  const scheme = target.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
  if (!scheme) return { kind: 'local' };
  // Preserve markdown-it's default unsafe-destination decision while giving this gate the more
  // actionable scheme name. The parser override above only keeps rejected destinations visible;
  // this policy boundary still rejects them and never renders/evaluates their contents.
  if (!commonMarkDefaultValidateLink(target)) {
    return { kind: 'unsupported', reason: `${scheme}: URI scheme` };
  }
  if (SUPPORTED_EXTERNAL_LINK_SCHEMES.has(scheme)) return { kind: 'external' };
  return { kind: 'unsupported', reason: `${scheme}: URI scheme` };
}

function isWithinDirectory(directory, candidate) {
  const relative = path.relative(directory, candidate);
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
}

function realPath(candidate) {
  return fs.realpathSync.native ? fs.realpathSync.native(candidate) : fs.realpathSync(candidate);
}

function brokenAuthorityLinkTargets(repoRoot, file, { targets, srcsetErrors }, authorityLabel) {
  const failures = [];
  const sentenceLabel = `${authorityLabel[0].toUpperCase()}${authorityLabel.slice(1)}`;
  const absoluteRepoRoot = path.resolve(repoRoot);
  const canonicalRepoRoot = realPath(absoluteRepoRoot);
  const relativeFile = normalizePath(path.relative(absoluteRepoRoot, file));
  for (const srcsetError of srcsetErrors) {
    failures.push(`Invalid raw HTML srcset in ${authorityLabel}: ${relativeFile} (${srcsetError})`);
  }
  for (const originalTarget of targets) {
    const classification = classifyMarkdownTarget(originalTarget);
    if (classification.kind === 'external' || classification.kind === 'non-file') continue;
    if (classification.kind === 'unsupported') {
      failures.push(
        `Unsupported ${authorityLabel} link target (${classification.reason}): ${relativeFile} -> ${originalTarget}`,
      );
      continue;
    }
    let target = originalTarget.split('#', 1)[0].split('?', 1)[0];
    if (target === '') continue;
    try {
      target = decodeURI(target);
    } catch {
      failures.push(
        `${sentenceLabel} link has invalid URI encoding: ${relativeFile} -> ${originalTarget}`,
      );
      continue;
    }
    const resolved = target.startsWith('/')
      ? path.join(absoluteRepoRoot, target.slice(1))
      : path.resolve(path.dirname(file), target);
    if (!isWithinDirectory(absoluteRepoRoot, resolved)) {
      failures.push(
        `${sentenceLabel} link escapes repository root: ${relativeFile} -> ${originalTarget}`,
      );
      continue;
    }
    if (!fs.existsSync(resolved)) {
      failures.push(`Unresolved ${authorityLabel} link: ${relativeFile} -> ${originalTarget}`);
      continue;
    }
    let canonicalTarget;
    try {
      canonicalTarget = realPath(resolved);
    } catch {
      failures.push(`Unresolved ${authorityLabel} link: ${relativeFile} -> ${originalTarget}`);
      continue;
    }
    if (!isWithinDirectory(canonicalRepoRoot, canonicalTarget)) {
      failures.push(
        `${sentenceLabel} link resolves outside repository root: ${relativeFile} -> ${originalTarget}`,
      );
    }
  }
  return failures;
}

function brokenLivingMarkdownLinks(repoRoot) {
  const failures = [];
  const absoluteRepoRoot = path.resolve(repoRoot);
  for (const relativeRoot of LIVING_MARKDOWN_ROOTS) {
    const absoluteRoot = path.join(absoluteRepoRoot, relativeRoot);
    if (!fs.existsSync(absoluteRoot)) {
      failures.push(`Missing living Markdown authority root: ${relativeRoot}`);
      continue;
    }
    for (const file of walkMarkdownFiles(absoluteRoot)) {
      const source = fs.readFileSync(file, 'utf8');
      const markdownTargets = extractMarkdownLinkTargets(source);
      failures.push(
        ...brokenAuthorityLinkTargets(repoRoot, file, markdownTargets, 'living Markdown'),
      );
    }
  }
  return failures;
}

function brokenCompanionHtmlLinks(repoRoot, inventory) {
  const failures = [];
  for (const relativeFile of inventory.sources.filter((file) => file.endsWith('.html'))) {
    const absoluteFile = path.join(repoRoot, relativeFile);
    if (!fs.existsSync(absoluteFile)) continue;
    const data = htmlSemanticData(fs.readFileSync(absoluteFile, 'utf8'));
    failures.push(...brokenAuthorityLinkTargets(repoRoot, absoluteFile, data, 'Companion HTML'));
  }
  return failures;
}

function typescriptAuthorityBlocks(source, relativeFile) {
  const usesJsx = relativeFile.endsWith('.tsx') || relativeFile.endsWith('.jsx');
  const languageVariant = usesJsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, languageVariant, source);
  const scriptKind = relativeFile.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : relativeFile.endsWith('.jsx')
      ? ts.ScriptKind.JSX
      : /\.(?:mjs|cjs|js)$/.test(relativeFile)
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    relativeFile,
    source,
    ts.ScriptTarget.Latest,
    false,
    scriptKind,
  );
  const blocks = [];
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const start = scanner.getTokenPos();
    const end = scanner.getTextPos();
    const line = sourceFile.getLineAndCharacterOfPosition(start).line + 1;
    const tokenText = scanner.getTokenText();
    if (
      token === ts.SyntaxKind.SingleLineCommentTrivia ||
      token === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      const kind = token === ts.SyntaxKind.SingleLineCommentTrivia ? 'line-comment' : 'comment';
      const text = tokenText.replace(/^\/\/?\**/, '').replace(/\*\/$/, '');
      const previous = blocks.at(-1);
      const separator = previous ? source.slice(previous.end, start) : '';
      if (
        kind === 'line-comment' &&
        previous?.kind === kind &&
        /^[\t ]*\r?\n[\t ]*$/.test(separator)
      ) {
        previous.text += ` ${text}`;
        previous.end = end;
      } else {
        blocks.push({ text, line, kind, end });
      }
    } else if (
      token === ts.SyntaxKind.StringLiteral ||
      token === ts.SyntaxKind.NoSubstitutionTemplateLiteral
    ) {
      blocks.push({ text: scanner.getTokenValue(), line, kind: 'string', end });
    }
    token = scanner.scan();
  }
  const visitTemplateExpressions = (node) => {
    if (ts.isTemplateExpression(node)) {
      const text = [
        node.head.text,
        ...node.templateSpans.flatMap((span) => [
          ` \${${span.expression.getText(sourceFile)}} `,
          span.literal.text,
        ]),
      ].join('');
      blocks.push({
        text,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
        kind: 'template',
        end: node.end,
      });
      return;
    }
    ts.forEachChild(node, visitTemplateExpressions);
  };
  visitTemplateExpressions(sourceFile);

  const jsxTagName = (node) => {
    if (ts.isJsxElement(node)) return node.openingElement.tagName.getText(sourceFile).toLowerCase();
    if (ts.isJsxSelfClosingElement(node)) return node.tagName.getText(sourceFile).toLowerCase();
    return '';
  };
  const jsxExpressionText = (expression) => {
    if (!expression) return '';
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
      return expression.text;
    }
    if (ts.isTemplateExpression(expression)) {
      return [
        expression.head.text,
        ...expression.templateSpans.flatMap((span) => [
          ` \${${span.expression.getText(sourceFile)}} `,
          span.literal.text,
        ]),
      ].join('');
    }
    return '';
  };
  const collectJsxText = (node, suppressed = false) => {
    const tagName = jsxTagName(node);
    const nextSuppressed = suppressed || NON_SEMANTIC_HTML_ELEMENTS.has(tagName);
    if (nextSuppressed) return '';
    if (ts.isJsxText(node)) return node.text;
    if (ts.isJsxExpression(node)) return jsxExpressionText(node.expression);
    const parts = [];
    ts.forEachChild(node, (child) => {
      parts.push(collectJsxText(child, nextSuppressed));
    });
    return parts.join(' ');
  };
  const visitJsx = (node, insideJsx = false, suppressed = false) => {
    const isContainer = ts.isJsxElement(node) || ts.isJsxFragment(node);
    if (isContainer) {
      const directChildren = ts.isJsxElement(node) ? node.children : node.children;
      const hasDirectSemanticText = directChildren.some(
        (child) =>
          (ts.isJsxText(child) && child.text.trim() !== '') ||
          (ts.isJsxExpression(child) && jsxExpressionText(child.expression).trim() !== ''),
      );
      const tagName = jsxTagName(node);
      const nextSuppressed = suppressed || NON_SEMANTIC_HTML_ELEMENTS.has(tagName);
      if (
        !nextSuppressed &&
        (!insideJsx || hasDirectSemanticText || SEMANTIC_TEXT_CONTAINERS.has(tagName))
      ) {
        const text = collectJsxText(node).replace(/\s+/g, ' ').trim();
        if (text) {
          blocks.push({
            text,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
            kind: 'jsx-text',
            end: node.end,
          });
        }
      }
      ts.forEachChild(node, (child) => {
        visitJsx(child, true, nextSuppressed);
      });
      return;
    }
    ts.forEachChild(node, (child) => {
      visitJsx(child, insideJsx, suppressed);
    });
  };
  if (usesJsx) visitJsx(sourceFile);
  return blocks;
}

function cssAuthorityBlocks(source) {
  const blocks = [];
  for (const match of source.matchAll(/\/\*[\s\S]*?\*\//g)) {
    const start = match.index ?? 0;
    blocks.push({
      text: match[0].slice(2, -2),
      line: source.slice(0, start).split(/\r?\n/).length,
      kind: 'comment',
      end: start + match[0].length,
    });
  }
  return blocks;
}

function htmlAuthorityBlocks(source) {
  const root = parseFragment(source, { sourceCodeLocationInfo: true });
  const blocks = [];
  const collectText = (node, suppressed = false) => {
    const tagName = node.tagName?.toLowerCase();
    const nextSuppressed = suppressed || NON_SEMANTIC_HTML_ELEMENTS.has(tagName);
    if (nextSuppressed) return '';
    if (node.nodeName === '#text') return node.value ?? '';
    return (node.childNodes ?? []).map((child) => collectText(child, nextSuppressed)).join(' ');
  };
  const rootText = collectText(root).replace(/\s+/g, ' ').trim();
  if (rootText) {
    const firstLocatedChild = (root.childNodes ?? []).find(
      (child) => child.sourceCodeLocation?.startLine,
    );
    blocks.push({
      text: rootText,
      line: firstLocatedChild?.sourceCodeLocation?.startLine ?? 1,
      kind: 'html-root-text',
    });
  }
  const visit = (node, suppressed = false) => {
    const tagName = node.tagName?.toLowerCase();
    const nextSuppressed = suppressed || NON_SEMANTIC_HTML_ELEMENTS.has(tagName);
    if (!nextSuppressed && tagName) {
      const hasDirectSemanticText = (node.childNodes ?? []).some(
        (child) => child.nodeName === '#text' && child.value?.trim(),
      );
      if (hasDirectSemanticText || SEMANTIC_TEXT_CONTAINERS.has(tagName)) {
        const text = collectText(node).replace(/\s+/g, ' ').trim();
        if (text) {
          blocks.push({
            text,
            line: node.sourceCodeLocation?.startLine ?? 1,
            kind: 'html-text',
          });
        }
      }
    }
    for (const child of node.childNodes ?? []) visit(child, nextSuppressed);
  };
  visit(root);
  return blocks;
}

function sourceAuthorityBlocks(source, relativeFile) {
  if (relativeFile.endsWith('.css')) return cssAuthorityBlocks(source);
  if (relativeFile.endsWith('.html')) return htmlAuthorityBlocks(source);
  return typescriptAuthorityBlocks(source, relativeFile);
}

function walkRailAuthorityFiles(directory) {
  const files = [];
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkRailAuthorityFiles(candidate));
    else if (entry.isFile() && RAIL_AUTHORITY_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(candidate);
    }
  }
  return files;
}

function railAuthorityBlocks(source, relativeFile) {
  if (relativeFile.endsWith('.md')) return markdownParagraphs(source, { includeInlineCode: true });
  // Keep each CSS declaration/comment line isolated. That catches a stale `--space-14: 56px`
  // side-rail comment without associating the legitimate mobile 56px token on one line with the
  // authoritative 64px rail token on the next.
  if (relativeFile.endsWith('.css')) {
    return source
      .split(/\r?\n/)
      .map((text, index) => ({ text: text.replaceAll(';', ' '), line: index + 1 }));
  }
  return sourceAuthorityBlocks(source, relativeFile);
}

function currentRetiredRailClaim(text) {
  const rail = '(?:side[- ]?rail|nav(?:igation)?[- ]?rail|icon[- ]?rail|rail)';
  const collapsed = '(?:collapsed|collapse|default|icon)';
  const expanded = '(?:expanded|expand|open|pinned|hover)';
  const retiredCollapsed = '(?:\\b56\\s*px\\b|--space-14\\b|\\bspace-14\\b)';
  const retiredExpanded = '(?:\\b224\\s*px\\b|--space-56\\b|\\bspace-56\\b)';
  const patterns = [
    new RegExp(
      `${retiredCollapsed}[^.!?\\r\\n]{0,100}\\b${collapsed}[^.!?\\r\\n]{0,60}${rail}\\b`,
      'i',
    ),
    new RegExp(
      `${retiredCollapsed}[^.!?\\r\\n]{0,100}\\b(?:side[- ]?rail|nav(?:igation)?[- ]?rail|icon[- ]?rail)\\b`,
      'i',
    ),
    new RegExp(
      `\\b${collapsed}[^.!?\\r\\n]{0,60}${rail}\\b[^.!?\\r\\n]{0,100}${retiredCollapsed}`,
      'i',
    ),
    new RegExp(
      `\\b(?:side[- ]?rail|nav(?:igation)?[- ]?rail|icon[- ]?rail)\\b[^.!?\\r\\n]{0,40}(?:is|uses?|width|:)\\s*[^.!?\\r\\n]{0,30}${retiredCollapsed}`,
      'i',
    ),
    new RegExp(
      `${retiredExpanded}[^.!?\\r\\n]{0,100}\\b${expanded}[^.!?\\r\\n]{0,60}${rail}\\b`,
      'i',
    ),
    new RegExp(
      `${retiredExpanded}[^.!?\\r\\n]{0,100}\\b${rail}\\b[^.!?\\r\\n]{0,60}${expanded}`,
      'i',
    ),
    new RegExp(
      `\\b${rail}\\b[^.!?\\r\\n]{0,120}(?:${expanded})[^.!?\\r\\n]{0,120}${retiredExpanded}`,
      'i',
    ),
    new RegExp(
      `\\b${rail}\\b[^.!?\\r\\n]{0,120}${retiredExpanded}[^.!?\\r\\n]{0,80}(?:${expanded})`,
      'i',
    ),
    new RegExp(
      `\\b${expanded}[^.!?\\r\\n]{0,80}${rail}\\b[^.!?\\r\\n]{0,120}${retiredExpanded}`,
      'i',
    ),
  ];
  return text.split(';').some((clause) =>
    patterns.some((pattern) => {
      const match = clause.match(pattern);
      return (
        match?.index !== undefined &&
        !isHistoricalOrNegatedClaim(clause, match.index, match[0].length)
      );
    }),
  );
}

function retiredRailAuthorityFailures(repoRoot) {
  const failures = [];
  for (const relativeRoot of RAIL_AUTHORITY_ROOTS) {
    const absoluteRoot = path.join(repoRoot, relativeRoot);
    for (const file of walkRailAuthorityFiles(absoluteRoot)) {
      const relativeFile = normalizePath(path.relative(repoRoot, file));
      const source = fs.readFileSync(file, 'utf8');
      for (const block of railAuthorityBlocks(source, relativeFile)) {
        if (currentRetiredRailClaim(block.text)) {
          failures.push(
            `${relativeFile}:${block.line} must use 64px/space-16 collapsed and 248px/space-62 open+pinned for the tablet+ side rail; 56px/space-14 is mobile-only and 224px/space-56 is a generic scale token`,
          );
        }
      }
    }
  }
  return failures;
}

function isHistoricalOrNegatedClaim(text, claimIndex, claimLength) {
  const before = text.slice(0, claimIndex);
  const boundaryPattern = /[.!?;:]|,\s*(?:but|however|yet)\s+/gi;
  let clauseStart = 0;
  for (const boundary of before.matchAll(boundaryPattern)) {
    clauseStart = (boundary.index ?? 0) + boundary[0].length;
  }
  const prefix = before.slice(clauseStart).slice(-180);
  const suffix = text
    .slice(claimIndex + claimLength)
    .split(/[.!?;]/, 1)[0]
    .slice(0, 120);

  const negatedReportingVerb =
    /\b(?:no\s+longer|must\s+not|cannot|should\s+not|do\s+not|never)\s+(?:claim|say|state|describe|assert|believe|assume|report|document)\b[^.!?;:]{0,120}$/i;
  const historicalProposition =
    /\b(?:formerly|previously|historically|once|used\s+to)\b[^.!?;:]{0,100}$/i;
  const rejectedClaimPrefix =
    /\b(?:reject|remove|delete|avoid)\s+(?:the\s+)?(?:claim|statement|assertion)\b[^.!?;:]{0,100}$/i;
  const rejectedClaimSuffix =
    /^\s*(?:is|was|remains)\s+(?:not\s+(?:true|correct|current)|false|stale|superseded)\b/i;

  return (
    negatedReportingVerb.test(prefix) ||
    historicalProposition.test(prefix) ||
    rejectedClaimPrefix.test(prefix) ||
    (/\b(?:claim|statement|assertion)\b/i.test(prefix) && rejectedClaimSuffix.test(suffix))
  );
}

function currentRawDialAbsenceClaim(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  for (const pattern of RAW_DIAL_BACKEND_ABSENCE_PATTERNS) {
    const match = normalized.match(pattern);
    if (
      match?.index !== undefined &&
      !isHistoricalOrNegatedClaim(normalized, match.index, match[0].length)
    ) {
      return true;
    }
  }
  return false;
}

function conflatesExplicitClipboardReadWithFuturePageInspection(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return [
    /\bonly\s+(?:the\s+)?(?:future\s+)?(?:mv3|browser\s+extension|extension)[^.!?;]{0,120}\b(?:can|could|will)\s+read\b[^.!?;]{0,80}\bclipboard\b/i,
    /\b(?:browser\s+)?pop-out\b[^.!?;]{0,100}\b(?:cannot|can't)\s+read\b[^.!?;]{0,80}\bclipboard\b/i,
  ].some((pattern) => pattern.test(normalized));
}

function staleRawDialGuardTerminology(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const rawCall = '(?:raw(?:[- ]number)?[- ]dial|raw\\s+Call|rawDialAvailable)';
  return [
    new RegExp(`\\bstale[- ]disabl(?:e|es|ed|ing)\\b[^.!?;]{0,100}\\b${rawCall}\\b`, 'i'),
    new RegExp(`\\b${rawCall}\\b[^.!?;]{0,100}\\bstale[- ]disabl(?:e|es|ed|ing)\\b`, 'i'),
  ].some((pattern) => pattern.test(normalized));
}

function companionRawDialGuardTerminologyFailures(repoRoot, inventory) {
  const failures = [];
  const authoritySources = [
    SPRINT_1_4_AUTHORITY,
    BUG_BACKLOG,
    ...new Set([COMPANION_HANDOFF, ...inventory.sources]),
  ];
  for (const relativeFile of authoritySources) {
    const absoluteFile = path.join(repoRoot, relativeFile);
    if (!fs.existsSync(absoluteFile)) {
      failures.push(`Missing Companion raw-Call guard authority source: ${relativeFile}`);
      continue;
    }
    const source = fs.readFileSync(absoluteFile, 'utf8');
    const blocks = relativeFile.endsWith('.md')
      ? markdownParagraphs(source)
      : sourceAuthorityBlocks(source, relativeFile);
    for (const block of blocks) {
      if (staleRawDialGuardTerminology(block.text)) {
        failures.push(
          `${relativeFile}:${block.line} must describe raw Call disablement as the intentional founder-approved Slice-9 approval/wiring guard, retired only after approval and complete wiring; it is not stale current code`,
        );
      }
    }
  }
  return failures;
}

function companionCallingHoursContractFailures(repoRoot) {
  const absoluteHandoff = path.join(repoRoot, COMPANION_HANDOFF);
  if (!fs.existsSync(absoluteHandoff)) {
    return [`Missing Companion handoff authority: ${COMPANION_HANDOFF}`];
  }
  const source = fs.readFileSync(absoluteHandoff, 'utf8');
  const prose = markdownParagraphs(source, { includeInlineCode: true })
    .map((paragraph) => paragraph.text)
    .join(' ')
    .replace(/\s+/g, ' ');
  const requiredClaims = [
    ['block hard-blocks Call', /\bblock\b[^.]{0,160}\bhard[- ]blocks?\b[^.]{0,160}\bcall\b/i],
    [
      'confirm is the default centered alert with both decisions',
      /\b(?:default[^.]{0,120}confirm|confirm[^.]{0,120}default)\b/i,
      /\bconfirm\b[^.]{0,200}\bcentered\b[^.]{0,200}\balert\b/i,
      /\bdon['’]t call\b[^.]{0,200}\bcall anyway\b/i,
    ],
    ['off proceeds without a prompt', /\boff\b[^.]{0,160}\bwithout\b[^.]{0,80}\bprompt\b/i],
  ];
  const missingClaims = requiredClaims
    .filter(([, ...patterns]) => patterns.some((pattern) => !pattern.test(prose)))
    .map(([label]) => label);
  const staleUniversalConfirm =
    /\b(?:always\s+(?:opens?|shows?)\s+(?:a\s+)?confirm|can\s+always\s+proceed|never\s+(?:a\s+)?(?:silent\s+)?block)\b/i.test(
      prose,
    );
  if (missingClaims.length === 0 && !staleUniversalConfirm) return [];
  return [
    `${COMPANION_HANDOFF} must preserve CMP-012 block | confirm | off behavior and identify the existing centered-confirm mock as the default confirm reference${
      missingClaims.length > 0 ? ` (missing: ${missingClaims.join('; ')})` : ''
    }`,
  ];
}

function universalCallingHoursAuthorityFailures(repoRoot) {
  const failures = [];
  const policyContext = '(?:CMP-012|calling[- ]hours|out[- ]of[- ]hours|hours\\s*=\\s*late)';
  const universalClaim =
    '(?:never\\s+(?:a\\s+)?(?:silent\\s+)?block|can\\s+always\\s+proceed|always\\s+blocks?|always\\s+(?:opens?|shows?)\\s+(?:a\\s+)?confirm)';
  const patterns = [
    new RegExp(`\\b${policyContext}\\b[^.!?]{0,220}\\b${universalClaim}\\b`, 'i'),
    new RegExp(`\\b${universalClaim}\\b[^.!?]{0,220}\\b${policyContext}\\b`, 'i'),
  ];
  const inventory = discoverCompanionAuthorityInventory(repoRoot);
  const authoritySources = ['docs/design-system/locked-surfaces.md', ...inventory.sources];
  for (const relativeFile of authoritySources) {
    const absoluteFile = path.join(repoRoot, relativeFile);
    if (!fs.existsSync(absoluteFile)) {
      failures.push(`Missing named Companion calling-hours authority source: ${relativeFile}`);
      continue;
    }
    const source = fs.readFileSync(absoluteFile, 'utf8');
    const blocks = relativeFile.endsWith('.md')
      ? markdownParagraphs(source, { includeInlineCode: true })
      : sourceAuthorityBlocks(source, relativeFile);
    for (const block of blocks) {
      if (patterns.some((pattern) => pattern.test(block.text.replace(/\s+/g, ' ')))) {
        failures.push(
          `${relativeFile}:${block.line} must not describe CMP-012 as a universal confirm/proceed path; preserve block | confirm | off and scope the current mock to default confirm`,
        );
      }
    }
  }
  return failures;
}

/** Mechanical floor for living doc links and the known Sprint-1.4 stale-authority echo class. */
export function validateLivingDocumentation(repoRoot = process.cwd()) {
  const failures = brokenLivingMarkdownLinks(repoRoot);
  const companionInventory = discoverCompanionAuthorityInventory(repoRoot);
  if (!companionInventory.moduleRootPresent) {
    failures.push(`Missing Companion module authority root: ${COMPANION_MODULE_ROOT}`);
  }
  if (!companionInventory.sharedRootPresent) {
    failures.push(`Missing shared Companion authority root: ${COMPANION_SHARED_AUTHORITY_ROOT}`);
  }
  if (!companionInventory.handoffRootPresent) {
    failures.push(`Missing Companion handoff authority root: ${COMPANION_HANDOFF_ROOT}`);
  }
  for (const relativeFile of companionInventory.unclassifiedModuleFiles) {
    failures.push(
      `Unclassified Companion module artifact: ${relativeFile}; every live module file must be included in semantic authority scanning or explicitly excluded`,
    );
  }
  for (const relativeFile of companionInventory.unclassifiedHandoffFiles) {
    failures.push(
      `Unclassified Companion handoff artifact: ${relativeFile}; every handoff file must be included in authority scanning or carry one explicit exclusion reason`,
    );
  }
  for (const excludedFile of companionInventory.excludedHandoffFiles) {
    if (!COMPANION_HANDOFF_EXCLUSIONS.get(excludedFile)) {
      failures.push(`Companion handoff exclusion is missing a reason: ${excludedFile}`);
    }
  }
  failures.push(...brokenCompanionHtmlLinks(repoRoot, companionInventory));
  failures.push(...companionRawDialGuardTerminologyFailures(repoRoot, companionInventory));
  failures.push(...retiredRailAuthorityFailures(repoRoot));
  failures.push(...companionCallingHoursContractFailures(repoRoot));
  failures.push(...universalCallingHoursAuthorityFailures(repoRoot));
  const surfaceMapPath = path.join(repoRoot, SURFACE_AUTHORITY_MAP);
  if (!fs.existsSync(surfaceMapPath)) {
    failures.push(`Missing surface authority map: ${SURFACE_AUTHORITY_MAP}`);
  } else {
    const surfaceMap = fs.readFileSync(surfaceMapPath, 'utf8');
    for (const proposition of markdownPropositions(surfaceMap)) {
      const referencedTargets = proposition.targets.join(' ');
      if (
        /05-ux-ui-content-contract\.md/i.test(`${proposition.text} ${referencedTargets}`) &&
        /\bskeleton\b/i.test(proposition.text)
      ) {
        failures.push(
          `${SURFACE_AUTHORITY_MAP}:${proposition.line} must not describe the live UX/content contract as a skeleton (${UX_CONTENT_CONTRACT})`,
        );
      }
    }
  }

  for (const relativeFile of companionInventory.sources) {
    const absoluteFile = path.join(repoRoot, relativeFile);
    if (!fs.existsSync(absoluteFile)) {
      failures.push(`Missing named Companion authority source: ${relativeFile}`);
      continue;
    }
    const source = fs.readFileSync(absoluteFile, 'utf8');
    const blocks = relativeFile.endsWith('.md')
      ? markdownParagraphs(source, { includeInlineCode: true })
      : sourceAuthorityBlocks(source, relativeFile);
    for (const block of blocks) {
      if (currentRawDialAbsenceClaim(block.text)) {
        failures.push(
          `${relativeFile}:${block.line} must not claim the raw-dial backend is absent or still needs to land; visible Companion consumption remains founder-approved Slice 9`,
        );
      }
      if (conflatesExplicitClipboardReadWithFuturePageInspection(block.text)) {
        failures.push(
          `${relativeFile}:${block.line} must distinguish explicit human clipboard paste/read in the browser pop-out from passive host-page inspection reserved for the future extension`,
        );
      }
    }
  }
  return failures;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deferred-endpoint doc liveness (INT-004 / B06 embed-only unwind).
//
// The parity gate proves a `deferred` key's ROUTE is unmounted; it cannot see a SECONDARY
// describing-doc still asserting the endpoint is Built/live/current/PENDING_WIRING/Slice-N-owed. This
// check closes that reverse-drift class: for every deferred key, wherever a scanned living doc NAMES
// that registry key, the naming SCOPE (a table row, a list item, or a paragraph) must carry the
// DEFERRED keyword AND the classification row's OWN `deferredBy` decision-ID — or make no liveness
// claim at all. The key list AND the qualifier ID(s) are DERIVED from the classification, never
// retyped. It is negation/history-tolerant (direct negation via `livenessNegated` + negated-reporting
// and historical framing via `isHistoricalOrNegatedClaim`), so "not current Sprint-1.4 runtime",
// "no longer live", and "No Slice-9 consumer is owed" are not liveness claims. Fenced/indented code is
// skipped; escape hatch is `endpoint-doc-liveness-ok: <reason>` anywhere in the scope.
//
// RESIDUAL BLIND SPOTS (owned by the doctrine-drift + functionality-parity LENSES, not this gate): a
// doc that describes the deferred endpoint ONLY by its contract-dotted name (`booking.availability`),
// ONLY by its URL path, or in pure prose ("native booking") — never naming the registry key — is not
// reachable by this KEY-anchored scan. The registry key is the only mechanically-derivable identifier
// (e.g. `bookingAppointments` -> the doc's `booking.create` contract name is NOT derivable), so the
// gate enforces the exact key and leaves the fuzzy prose forms to the semantic-audit lenses.
const DEFERRED_ENDPOINT_DOC_ROOTS = [
  'docs/app-plan/data-and-api',
  'docs/app-plan/assurance',
  'docs/design-system/handoffs',
];
const DEFERRED_ENDPOINT_DOC_FILES = ['docs/app-plan/auditability/decision-log.md'];
const DEFERRED_ENDPOINT_LIVENESS_ESCAPE = 'endpoint-doc-liveness-ok';
// Each signal is a GLOBAL regex used only via String.prototype.matchAll (which clones the regex and
// never advances the shared lastIndex), so it is safe to reuse across every scope/file.
const DEFERRED_ENDPOINT_LIVENESS_SIGNALS = [
  { label: 'Built', pattern: /\bbuilt\b/gi },
  { label: 'live', pattern: /\blive\b/gi },
  { label: 'current', pattern: /\bcurrent(?:ly)?\b/gi },
  { label: 'PENDING_WIRING', pattern: /PENDING_WIRING/g },
  { label: 'Slice-N', pattern: /\bslice[\s-]?\d+\b/gi },
];

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Acceptable "DEFERRED qualifier" ID patterns, DERIVED from the classification row's own `deferredBy`
 * (e.g. "INT-004 (PR #256)" -> the decision code `INT-004` + the PR ref `#256`/`PR #256`). A scope is
 * qualified only when it ALSO carries the word `deferred`, so a bare decision-ID mention elsewhere in
 * the scope cannot green a stale liveness claim on its own.
 */
function deferralQualifierPatterns(deferredBy) {
  const patterns = [];
  for (const match of deferredBy.matchAll(/\b[A-Z]{2,}-\d+\b/g)) {
    patterns.push(new RegExp(`\\b${escapeRegExp(match[0])}\\b`, 'i'));
  }
  for (const match of deferredBy.matchAll(/#(\d+)\b/g)) {
    patterns.push(new RegExp(`(?:#|PR\\s*#?)${match[1]}\\b`, 'i'));
  }
  return patterns;
}

/**
 * Segment a Markdown source into liveness-claim SCOPES: each table row is its own scope; each list
 * item and each paragraph is its own scope (wrapped continuation lines joined). Fenced code and a
 * leading-indented code line at a fresh block position are excluded so an example cannot false-flag.
 * `line` is the 1-based line number of the scope's first line.
 */
function deferredEndpointDocScopes(source) {
  const lines = source.split(/\r?\n/);
  const scopes = [];
  let fence = null;
  let prose = null;
  const flush = () => {
    if (prose) scopes.push(prose);
    prose = null;
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(```+|~~~+)/);
    if (fence) {
      if (fenceMatch && trimmed.startsWith(fence)) fence = null;
      flush();
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1].slice(0, 3);
      flush();
      continue;
    }
    if (trimmed === '') {
      flush();
      continue;
    }
    if (/^\|/.test(trimmed)) {
      flush();
      scopes.push({ text: line, line: index + 1 });
      continue;
    }
    if (!prose && /^(?: {4,}|\t)/.test(line)) {
      // A leading-indented line at a fresh block position is an indented code block; skip it.
      continue;
    }
    if (/^\s*(?:[-*+]|\d+[.)])\s+/.test(line)) {
      flush();
      prose = { text: trimmed, line: index + 1 };
      continue;
    }
    if (prose) prose.text += ` ${trimmed}`;
    else prose = { text: trimmed, line: index + 1 };
  }
  flush();
  return scopes;
}

// A liveness word directly negated by an immediately-preceding negator ("not live", "no longer
// current", "No Slice-9 … owed", "never built") is NOT a positive claim. This complements
// `isHistoricalOrNegatedClaim` (which only catches negated REPORTING verbs — "no longer claim" — and
// historical framing), so a scope that honestly says the endpoint is not live without repeating the
// full DEFERRED annotation is not flagged.
function livenessNegated(text, index) {
  const before = text.slice(Math.max(0, index - 32), index);
  return /\b(?:not|no\s+longer|never|without|isn'?t|aren'?t|no)\s+$/i.test(before);
}

function positiveLivenessLabel(text) {
  for (const { label, pattern } of DEFERRED_ENDPOINT_LIVENESS_SIGNALS) {
    for (const match of text.matchAll(pattern)) {
      if (match.index === undefined) continue;
      if (livenessNegated(text, match.index)) continue;
      if (!isHistoricalOrNegatedClaim(text, match.index, match[0].length)) return label;
    }
  }
  return null;
}

/**
 * Reverse-drift gate: a doc that NAMES a `deferred` endpoint key must annotate it DEFERRED (with the
 * classification's own decision-ID) in the SAME scope wherever it makes a liveness claim about it.
 * Derives both the key list and the qualifier ID(s) from BACKEND_DELIVERY_CLASSIFICATION.
 */
export function validateDeferredEndpointDocLiveness(
  root = process.cwd(),
  classifications = BACKEND_DELIVERY_CLASSIFICATION,
) {
  const deferredKeys = Object.entries(classifications)
    .filter(([, row]) => row && row.status === 'deferred')
    .map(([key, row]) => ({
      key,
      deferredBy: String(row.deferredBy ?? ''),
      keyPattern: new RegExp(`(?<![A-Za-z0-9_$])${escapeRegExp(key)}(?![A-Za-z0-9_$])`),
      qualifierPatterns: deferralQualifierPatterns(String(row.deferredBy ?? '')),
    }));

  const files = new Set();
  for (const relativeRoot of DEFERRED_ENDPOINT_DOC_ROOTS) {
    const absoluteRoot = path.join(root, relativeRoot);
    if (fs.existsSync(absoluteRoot)) {
      for (const file of walkMarkdownFiles(absoluteRoot)) files.add(file);
    }
  }
  for (const relativeFile of DEFERRED_ENDPOINT_DOC_FILES) {
    const absoluteFile = path.join(root, relativeFile);
    if (fs.existsSync(absoluteFile)) files.add(absoluteFile);
  }

  const failures = [];
  let occurrenceCount = 0;
  for (const absoluteFile of [...files].sort()) {
    const relativeFile = normalizePath(path.relative(root, absoluteFile));
    const scopes = deferredEndpointDocScopes(fs.readFileSync(absoluteFile, 'utf8'));
    for (const scope of scopes) {
      if (scope.text.includes(DEFERRED_ENDPOINT_LIVENESS_ESCAPE)) continue;
      for (const entry of deferredKeys) {
        if (!entry.keyPattern.test(scope.text)) continue;
        occurrenceCount += 1;
        const qualified =
          /\bdeferred\b/i.test(scope.text) &&
          entry.qualifierPatterns.some((pattern) => pattern.test(scope.text));
        if (qualified) continue;
        const liveness = positiveLivenessLabel(scope.text);
        if (liveness) {
          failures.push(
            `${relativeFile}:${scope.line} describes DEFERRED endpoint key \`${entry.key}\` as live ("${liveness}") without an adjacent DEFERRED (${entry.deferredBy}) qualifier — annotate the deferral in this scope or drop the liveness claim`,
          );
        }
      }
    }
  }
  return {
    failures,
    deferredKeyCount: deferredKeys.length,
    scannedFileCount: files.size,
    occurrenceCount,
  };
}

export function runDocCodeDriftGate(root = process.cwd()) {
  if (
    !fs.existsSync(path.join(root, 'backend/src')) &&
    !fs.existsSync(path.join(root, 'frontend/src'))
  ) {
    return { failures: [], skipped: true };
  }

  const exists = (file) => fs.existsSync(path.join(root, file));
  const read = (file) => {
    try {
      return fs.readFileSync(path.join(root, file), 'utf8');
    } catch {
      return '';
    }
  };

  const failures = [];
  failures.push(...validateCentralRegistryDocumentation(root));

  function sortedDifference(left, right) {
    return [...left].filter((value) => !right.has(value)).sort();
  }

  function duplicates(values) {
    const seen = new Set();
    const dupes = new Set();
    for (const value of values) {
      if (seen.has(value)) dupes.add(value);
      seen.add(value);
    }
    return [...dupes].sort();
  }

  function extractPermissionKeysFromTaxonomy(source) {
    const keys = [];
    const keyPattern = /\bkey:\s*'([^']+)'/g;
    let match;
    while ((match = keyPattern.exec(source))) {
      keys.push(match[1]);
    }
    return keys;
  }

  function extractGlossaryPermissionKeys(source) {
    const sectionMatch = source.match(/## Permission key registry\s+[\s\S]*?(?=\n## [^\n]+|\s*$)/);
    if (!sectionMatch) return null;
    const keys = [];
    const rowPattern = /^\|\s*`([^`]+)`\s*\|/gm;
    let match;
    while ((match = rowPattern.exec(sectionMatch[0]))) {
      if (match[1] !== 'Key') keys.push(match[1]);
    }
    return keys;
  }

  // 1. ARC-005 shared config/taxonomy registries are discovered and checked above; contracts that
  // sit outside those managed roots retain explicit existence checks here.
  for (const file of [
    'shared/src/index.ts',
    'shared/src/contracts/endpoints.ts',
    'shared/src/contracts/auth.ts',
    'shared/src/contracts/calls.ts',
    'shared/src/contracts/dispositions.ts',
    'shared/src/contracts/compliance.ts',
    'shared/src/contracts/battlecards.ts',
    'shared/src/contracts/conversations.ts',
    'shared/src/contracts/teleprompter.ts',
  ]) {
    if (!exists(file)) failures.push(`Missing ARC-005 central registry: ${file}`);
  }

  // 2. Migration-001 Prisma models exist.
  const schema = read('backend/prisma/schema.prisma');
  for (const model of [
    'Tenant',
    'User',
    'Role',
    'Permission',
    'RolePermission',
    'UserPermission',
    'AuditLog',
  ]) {
    if (!new RegExp(`model\\s+${model}\\b`).test(schema)) {
      failures.push(`Prisma schema missing migration-001 model: ${model}`);
    }
  }

  // 3. RLS is present AND forced in migration 001 (ADR-AUTH-005 backstop; FORCE so owner is subject).
  const migration = read('backend/prisma/migrations/0001_init/migration.sql');
  if (!/ROW LEVEL SECURITY/.test(migration)) {
    failures.push('migration 0001 is missing RLS (ADR-AUTH-005 tenant-isolation backstop)');
  }
  if (!/FORCE ROW LEVEL SECURITY/.test(migration)) {
    failures.push('migration 0001 RLS is not FORCED — the connecting owner role could bypass it');
  }

  // 4. Shared enums stay in sync with the Prisma enums they mirror.
  const tenantKind = read('shared/src/taxonomy/tenantKind.ts');
  for (const value of ['customer', 'internal']) {
    if (!tenantKind.includes(`'${value}'`))
      failures.push(`tenantKind registry missing value '${value}'`);
    if (!new RegExp(`\\b${value}\\b`).test(schema))
      failures.push(`Prisma TenantKind enum missing value '${value}'`);
  }
  const scopes = read('shared/src/taxonomy/scopes.ts');
  for (const value of ['self', 'team', 'tenant', 'platform']) {
    if (!scopes.includes(`'${value}'`)) failures.push(`scopes registry missing value '${value}'`);
  }

  // 5. Backend source-of-truth libs exist.
  for (const file of [
    'backend/src/lib/env.ts',
    'backend/src/lib/telemetry.ts',
    'backend/src/lib/tenantContext.ts',
    'backend/src/lib/prisma.ts',
  ]) {
    if (!exists(file)) failures.push(`Missing backend source-of-truth lib: ${file}`);
  }

  // 6. Living docs that own drift-prevention exist (routing layer + blast radius).
  for (const file of ['docs/DOCUMENTATION_INDEX.md', 'docs/ARCHITECTURE_BLAST_RADIUS.md']) {
    if (!exists(file)) failures.push(`Missing living doc: ${file}`);
  }

  // 7. Permission registry mirror stays synced.
  //
  // Proves: REQ-AUTH-003
  // Test type: gate / contract
  // Surface: docs/app-plan/product/27-glossary-taxonomy.md Permission key registry
  //   <-> shared/src/taxonomy/permissions.ts
  // Authority: shared/src/taxonomy/permissions.ts (ARC-005); glossary is a mirror.
  // Negative path: remove one permission row from the glossary and this gate names the missing key.
  // Mutation that must break it: deleting this block lets glossary/taxonomy drift pass silently.
  const permissionTaxonomyKeys = extractPermissionKeysFromTaxonomy(
    read('shared/src/taxonomy/permissions.ts'),
  );
  const glossaryPermissionKeys = extractGlossaryPermissionKeys(
    read('docs/app-plan/product/27-glossary-taxonomy.md'),
  );
  if (glossaryPermissionKeys === null) {
    failures.push(
      'Glossary missing Permission key registry section (docs/app-plan/product/27-glossary-taxonomy.md)',
    );
  } else {
    const taxonomySet = new Set(permissionTaxonomyKeys);
    const glossarySet = new Set(glossaryPermissionKeys);
    for (const key of duplicates(permissionTaxonomyKeys)) {
      failures.push(`permissions.ts defines duplicate permission key: ${key}`);
    }
    for (const key of duplicates(glossaryPermissionKeys)) {
      failures.push(`glossary permission registry duplicates key: ${key}`);
    }
    for (const key of sortedDifference(taxonomySet, glossarySet)) {
      failures.push(`glossary permission registry missing key from permissions.ts: ${key}`);
    }
    for (const key of sortedDifference(glossarySet, taxonomySet)) {
      failures.push(`glossary permission registry has key not in permissions.ts: ${key}`);
    }
  }

  // 8. Living documentation links + known product-authority stale echoes fail closed.
  // Proves: NFR-012 + COMPANION-RAW-DIAL-001
  // Test type: gate / regression
  // Surface: CommonMark AST links/definitions/raw HTML prose/attributes/srcset; living docs; the
  // discovered Companion module/shared/handoff inventory; comments/strings/templates/JSX/CSS;
  // CMP-012 handoff; repo-wide living rail authority prose.
  // Authority: live product/05 UX routing contract + shared raw/prospect dial contracts/routes +
  // ADR-CMP-012 + the live 64px/space-16 side-rail token.
  // Mutation that must break it: re-add Skeleton through an inline/reference target, a nonexistent
  // nested-list/srcset link, a clipboard/host-page conflation, a universal CMP-012 claim, retired
  // collapsed/expanded rail ownership, raw-backend-absent HTML/JSX, or an unclassified handoff file.
  failures.push(...validateLivingDocumentation(root));

  const deferredEndpointLiveness = validateDeferredEndpointDocLiveness(root);
  failures.push(...deferredEndpointLiveness.failures);

  return { failures, skipped: false, deferredEndpointLiveness };
}

function main() {
  const result = runDocCodeDriftGate();
  if (result.skipped) {
    console.log('check-doc-code-drift: backend/ and frontend/ not scaffolded yet — skipping.');
    process.exit(0);
  }
  if (result.failures.length) {
    console.error('check-doc-code-drift failed:');
    for (const failure of result.failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(
    'check-doc-code-drift: OK (registries + RLS + enums + glossary permissions + living doc authorities in sync)',
  );
  const liveness = result.deferredEndpointLiveness;
  if (liveness) {
    console.log(
      `check-doc-code-drift: deferred-endpoint doc liveness OK — ${liveness.deferredKeyCount} deferred key(s); ${liveness.occurrenceCount} doc key-mention(s) across ${liveness.scannedFileCount} scanned doc(s) each carry the DEFERRED + decision-ID qualifier or make no liveness claim. Residual (doctrine-drift / functionality-parity lenses): contract-dotted-name, URL-path, and key-less prose references are NOT key-anchored here.`,
    );
  }
  process.exit(0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
