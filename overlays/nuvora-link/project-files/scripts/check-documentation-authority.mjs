#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HISTORICAL_BANNER =
  "> **Historical record — not current implementation authority.**";

const registryRowPattern =
  /^\|\s*`(?<document>docs\/[^`]+\.md)`\s*\|\s*(?<owner>[^|]+?)\s*\|\s*(?<status>living|historical)\s*\|\s*(?<purpose>[^|]+?)\s*\|\s*$/gmu;

const forbiddenClaimRules = [
  {
    id: "fixed-database-poll",
    actionPattern: /\b(?:polls?|scans?|sweeps?|queries?)\b/iu,
    pattern:
      /\b(?:worker|api|service|system|scheduler|recovery)\b[^.!?]{0,120}\b(?:polls?|scans?|sweeps?|queries?)\b[^.!?]{0,80}\b(?:postgres(?:ql)?|database|outbox)\b[^.!?]{0,60}\b(?:periodically|recurringly|on a fixed interval|every\s+\d+)\b/iu
  },
  {
    id: "fixed-database-poll",
    actionPattern: /\b(?:polls?|scans?|sweeps?|queries?)\b/iu,
    pattern:
      /\b(?:postgres(?:ql)?|database|outbox)\b[^.!?]{0,100}\b(?:polls?|scans?|sweeps?|queries?)\b[^.!?]{0,80}\b(?:periodically|recurringly|on a fixed interval|every\s+\d+)\b/iu
  },
  {
    id: "cron-as-durability",
    actionPattern: /\b(?:poll|scan|sweep|query)\w*\b/iu,
    pattern:
      /\b(?:cron(?:-based)?|fixed[- ]interval|periodic|daily|hourly|every\s+\d+\s*(?:seconds?|minutes?|hours?))\b[^.!?]{0,140}\b(?:poll|scan|sweep|query|recovery)\w*\b[^.!?]{0,80}\b(?:postgres(?:ql)?|database|outbox)\b/iu
  },
  {
    id: "queue-only-reminder-authority",
    actionPattern: /\b(?:durable delayed|queue-only|redis)\b/iu,
    pattern:
      /\breminder(?:\s+gates?|\s+pipeline|\s+scheduling|\s+jobs?)?\b[^.!?]{0,100}\b(?:is|are|remain|uses?|stores?)\b[^.!?]{0,80}\b(?:durable delayed (?:bullmq )?jobs?|queue-only|redis(?: queue)? (?:is|as) (?:the )?(?:authority|source of truth))\b/iu
  },
  {
    id: "legacy-reminder-job-family",
    actionPattern: /\bjobs?\b/iu,
    pattern:
      /\b(?:pre-appointment|morning-of|morning reminder|reminder gate)\b[^.!?]{0,80}\bjobs?\b/iu
  },
  {
    id: "unbounded-retry",
    actionPattern: /\bretr(?:y|ies|ied|ying)\b/iu,
    pattern:
      /\bretr(?:y|ies|ied|ying)\b[^.!?]{0,60}\b(?:forever|indefinitely|without (?:a )?(?:limit|cap|horizon)|until success)\b/iu
  },
  {
    id: "unbounded-read",
    actionPattern: /\b(?:loads?|reads?|fetches?|materializes?)\b/iu,
    pattern:
      /\b(?:loads?|reads?|fetches?|materializes?)\b[^.!?]{0,40}\b(?:all|entire)\b[^.!?]{0,50}\b(?:rows?|history|deliveries|appointments|callbacks|messages|table)\b[^.!?]{0,60}\b(?:without|with no)\b[^.!?]{0,20}\b(?:limit|pagination|bound)\b/iu
  }
];

const negationPattern =
  /\b(?:no|not|never|without|cannot|must not|does not|do not|is not|are not|instead of|rather than|forbid(?:den)?|prevent(?:s|ed|ing)?|reject(?:s|ed|ing)?|remove(?:s|d|ing)?|retir(?:e|es|ed|ing)|avoid(?:s|ed|ing)?|absence)\b/iu;

const normalizePath = (value) => value.replaceAll("\\", "/");

const walkMarkdown = (directory, root, output = []) => {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walkMarkdown(absolute, root, output);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      output.push(normalizePath(path.relative(root, absolute)));
    }
  }
  return output;
};

export const parseDocumentationRegistry = (text) => {
  const rows = [];
  registryRowPattern.lastIndex = 0;
  for (const match of text.matchAll(registryRowPattern)) {
    rows.push({
      document: match.groups.document,
      owner: match.groups.owner.trim(),
      status: match.groups.status,
      purpose: match.groups.purpose.trim()
    });
  }
  return rows;
};

const semanticMarkdownBlocks = (text) => {
  const blocks = [];
  const lines = text.split(/\r?\n/u);
  let inFence = false;
  let fenceMarker = null;
  let current = [];
  let startLine = 1;
  const flush = () => {
    if (current.length === 0) return;
    const semantic = current
      .join(" ")
      .replace(/`[^`]*`/gu, " ")
      .replace(/!?\[([^\]]*)\]\([^)]*\)/gu, "$1")
      .replace(/<[^>]+>/gu, " ")
      .replace(/\s+/gu, " ")
      .trim();
    if (semantic) blocks.push({ line: startLine, text: semantic });
    current = [];
  };

  lines.forEach((line, index) => {
    const fence = line.match(/^\s*(```+|~~~+)/u)?.[1];
    if (fence) {
      flush();
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[0];
      } else if (fence[0] === fenceMarker) {
        inFence = false;
        fenceMarker = null;
      }
      return;
    }
    if (inFence) return;
    if (!line.trim()) {
      flush();
      return;
    }
    if (current.length === 0) startLine = index + 1;
    current.push(line.trim());
  });
  flush();
  return blocks;
};

const claimIsNegated = (text, match, rule) => {
  const actionIndex = match[0].search(rule.actionPattern);
  const actionStart = match.index + Math.max(0, actionIndex);
  const sentenceBoundary = Math.max(
    text.lastIndexOf(".", actionStart - 1),
    text.lastIndexOf("!", actionStart - 1),
    text.lastIndexOf("?", actionStart - 1)
  );
  const start = Math.max(sentenceBoundary + 1, actionStart - 100);
  return negationPattern.test(text.slice(start, actionStart));
};

const openingAuthorityBlock = (text) => {
  const lines = text.split(/\r?\n/u);
  let start = 0;
  if (lines[0]?.trim() === "---") {
    const closingFrontmatter = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
    if (closingFrontmatter >= 0) start = closingFrontmatter + 1;
  }
  return lines.slice(start, start + 10).join("\n");
};

export function findDocumentationAuthorityViolations(rootDirectory) {
  const root = path.resolve(rootDirectory);
  const docsRoot = path.join(root, "docs");
  const indexPath = path.join(docsRoot, "DOCUMENTATION_INDEX.md");
  const violations = [];
  if (!fs.existsSync(indexPath)) {
    return {
      documents: [],
      registry: [],
      violations: ["docs/DOCUMENTATION_INDEX.md is missing"]
    };
  }

  const documents = walkMarkdown(docsRoot, root).sort();
  const registry = parseDocumentationRegistry(fs.readFileSync(indexPath, "utf8"));
  const rowsByDocument = new Map();
  for (const row of registry) {
    const rows = rowsByDocument.get(row.document) ?? [];
    rows.push(row);
    rowsByDocument.set(row.document, rows);
    if (!row.owner) violations.push(`${row.document} has no owner`);
    if (!row.purpose) violations.push(`${row.document} has no purpose`);
  }

  for (const document of documents) {
    const rows = rowsByDocument.get(document) ?? [];
    if (rows.length === 0) violations.push(`${document} is missing from the documentation registry`);
    if (rows.length > 1) violations.push(`${document} appears ${rows.length} times in the documentation registry`);
  }
  for (const [document, rows] of rowsByDocument) {
    if (!documents.includes(document)) {
      violations.push(`${document} is a stale registry path (file does not exist)`);
    }
    if (rows.length > 1 && !documents.includes(document)) {
      violations.push(`${document} appears ${rows.length} times in the documentation registry`);
    }
  }

  for (const row of registry) {
    const absolute = path.join(root, row.document);
    if (!fs.existsSync(absolute)) continue;
    const text = fs.readFileSync(absolute, "utf8");
    if (row.status === "historical") {
      if (!openingAuthorityBlock(text).includes(HISTORICAL_BANNER)) {
        violations.push(`${row.document} is historical but missing the standard historical banner`);
      }
      continue;
    }
    for (const block of semanticMarkdownBlocks(text)) {
      for (const rule of forbiddenClaimRules) {
        const match = rule.pattern.exec(block.text);
        if (match && !claimIsNegated(block.text, match, rule)) {
          violations.push(
            `${row.document}:${block.line} has forbidden living claim ${rule.id}: ${match[0]}`
          );
        }
        rule.pattern.lastIndex = 0;
      }
    }
  }

  return { documents, registry, violations };
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  const rootFlag = process.argv.indexOf("--root");
  const root = rootFlag >= 0 && process.argv[rootFlag + 1]
    ? path.resolve(process.argv[rootFlag + 1])
    : path.resolve(path.dirname(modulePath), "..");
  const result = findDocumentationAuthorityViolations(root);
  if (result.violations.length > 0) {
    console.error([
      "documentation-authority: FAIL",
      ...result.violations.map((violation) => `- ${violation}`)
    ].join("\n"));
    process.exit(1);
  }
  const living = result.registry.filter(({ status }) => status === "living").length;
  const historical = result.registry.length - living;
  console.log(
    `documentation-authority: PASS — documents=${result.documents.length} living=${living} historical=${historical}`
  );
}
