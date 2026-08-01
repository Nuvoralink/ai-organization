import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const userRoot = path.resolve(skillRoot, '..', '..', '..');
const localSkillRoots = [
  path.join(userRoot, '.codex', 'skills'),
  path.join(userRoot, '.agents', 'skills'),
  path.join(userRoot, '.claude', 'skills'),
];
const markdownFiles = [
  path.join(skillRoot, 'SKILL.md'),
  ...fs
    .readdirSync(path.join(skillRoot, 'references'), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(skillRoot, 'references', entry.name)),
];
const missing = [];

for (const file of markdownFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].trim().split('#', 1)[0];
    if (!target || /^(?:https?:|mailto:)/i.test(target)) continue;
    // Skill references are package-root-relative, matching Codex skill resolution.
    const resolved = path.resolve(skillRoot, target.replaceAll('/', path.sep));
    if (!fs.existsSync(resolved)) missing.push(`${path.relative(skillRoot, file)} -> ${target}`);
  }

  for (const match of source.matchAll(/\bLoad\s+`([a-z0-9][a-z0-9-]*)`/g)) {
    const dependency = match[1];
    const installed = localSkillRoots.some((root) =>
      fs.existsSync(path.join(root, dependency, 'SKILL.md')),
    );
    if (!installed) {
      missing.push(`${path.relative(skillRoot, file)} -> unresolved companion skill ${dependency}`);
    }
  }
}

if (missing.length > 0) {
  process.stderr.write(`Missing database-design skill references:\n${missing.join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(`Database-design skill reference links OK (${markdownFiles.length} files).\n`);
