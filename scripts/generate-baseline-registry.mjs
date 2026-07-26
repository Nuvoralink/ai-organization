#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = JSON.parse(fs.readFileSync(path.join(repoRoot, 'registries', 'project-roots.local.json'), 'utf8'));
const allowedExtensions = ['', '.md', '.txt', '.json', '.yaml', '.yml', '.mjs', '.js', '.ts', '.tsx', '.py', '.ps1', '.sh', '.css', '.html', '.csv', '.toml', '.lock', '.template'];

function directories(root, excluded = []) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => (entry.isDirectory() || entry.isSymbolicLink()) && !excluded.includes(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function declaredName(skillRoot) {
  const skillFile = path.join(skillRoot, 'SKILL.md');
  const content = fs.readFileSync(skillFile, 'utf8');
  const match = /^---\s*[\r\n]+[\s\S]*?^name:\s*["']?([^"'\r\n]+)["']?\s*$/m.exec(content);
  if (!match) throw new Error(`Missing declared skill name: ${skillFile}`);
  return match[1].trim();
}

const codexRoot = path.join(roots.HOME, '.codex', 'skills');
const agentsRoot = path.join(roots.HOME, '.agents', 'skills');
const claudeRoot = path.join(roots.HOME, '.claude', 'skills');
const codexSkills = directories(codexRoot, ['_retired', '.claude', '.system', 'council', 'studio']);
const agentsSkills = directories(agentsRoot);
const claudeDirectSkills = ['neon-postgres', 'ui-ux-pro-max'];

const artifacts = [];
const mappings = [];

function addMapping(artifact, mapping) {
  artifacts.push(artifact);
  mappings.push({
    ...mapping,
    ownership: 'canonical',
    allowedExtensions: mapping.allowedExtensions ?? allowedExtensions,
    exclude: mapping.exclude ?? [],
    detectLocalOnly: true,
    allowRootLink: mapping.allowRootLink ?? false,
    allowInstalledRootLink: mapping.allowInstalledRootLink ?? false,
    lock: mapping.lock ?? '${HOME}/.nuvoralink-control-plane/installed-lock.json'
  });
}

addMapping({
  id: 'global-claude-doctrine', family: 'global-doctrine', lifecycle: 'active', owner: 'organization', source: 'global/claude/CLAUDE.md',
  destinations: ['${HOME}/.claude/CLAUDE.md'], provenance: 'user-authored-global', sensitivity: 'orchestration-only'
}, {
  id: 'global-claude-doctrine', source: 'global/claude/CLAUDE.md', captureFrom: '${HOME}/.claude/CLAUDE.md', destinations: ['${HOME}/.claude/CLAUDE.md'], mode: 'file', allowedExtensions: ['.md']
});

addMapping({
  id: 'global-claude-rules', family: 'global-rules', lifecycle: 'active', owner: 'organization', source: 'global/claude/rules',
  destinations: ['${HOME}/.claude/rules'], provenance: 'user-authored-global', sensitivity: 'orchestration-only'
}, {
  id: 'global-claude-rules', source: 'global/claude/rules', captureFrom: '${HOME}/.claude/rules', destinations: ['${HOME}/.claude/rules'], mode: 'tree', allowedExtensions: ['.md']
});

addMapping({
  id: 'global-claude-agents', family: 'global-agents', lifecycle: 'active', owner: 'organization', source: 'global/claude/agents',
  destinations: ['${HOME}/.claude/agents'], provenance: 'user-authored-global', sensitivity: 'orchestration-only'
}, {
  id: 'global-claude-agents', source: 'global/claude/agents', captureFrom: '${HOME}/.claude/agents', destinations: ['${HOME}/.claude/agents'], mode: 'tree', allowedExtensions: ['.md']
});

addMapping({
  id: 'global-codex-doctrine', family: 'global-doctrine', lifecycle: 'active', owner: 'organization', source: 'global/codex/AGENTS.md',
  destinations: ['${HOME}/.codex/AGENTS.md'], provenance: 'user-authored-global', sensitivity: 'orchestration-only'
}, {
  id: 'global-codex-doctrine', source: 'global/codex/AGENTS.md', captureFrom: '${HOME}/.codex/AGENTS.md', destinations: ['${HOME}/.codex/AGENTS.md'], mode: 'file', allowedExtensions: ['.md']
});

for (const directory of codexSkills) {
  const sourceRoot = path.join(codexRoot, directory);
  const name = declaredName(sourceRoot);
  addMapping({
    id: `skill-${directory}`, family: 'skill', lifecycle: 'active', owner: 'organization', source: `skills/${directory}`,
    destinations: [`${'${HOME}'}/.codex/skills/${directory}`, `${'${HOME}'}/.claude/skills/${directory}`],
    declaredName: name, installDirectory: directory, aliases: name === directory ? [] : [directory],
    provenance: 'user-authored-codex-home', sensitivity: 'orchestration-only', license: 'review-required'
  }, {
    id: `skill-${directory}`, source: `skills/${directory}`, captureFrom: `${'${HOME}'}/.codex/skills/${directory}`,
    destinations: [`${'${HOME}'}/.codex/skills/${directory}`, `${'${HOME}'}/.claude/skills/${directory}`], mode: 'tree', allowInstalledRootLink: true
  });
}

for (const directory of agentsSkills) {
  const sourceRoot = path.join(agentsRoot, directory);
  const name = declaredName(sourceRoot);
  addMapping({
    id: `skill-${directory}`, family: 'skill', lifecycle: 'active', owner: 'organization', source: `skills/${directory}`,
    destinations: [`${'${HOME}'}/.agents/skills/${directory}`, `${'${HOME}'}/.claude/skills/${directory}`],
    declaredName: name, installDirectory: directory, aliases: name === directory ? [] : [directory],
    provenance: 'user-authored-agents-home', sensitivity: 'orchestration-only', license: 'review-required'
  }, {
    id: `skill-${directory}`, source: `skills/${directory}`, captureFrom: `${'${HOME}'}/.agents/skills/${directory}`,
    destinations: [`${'${HOME}'}/.agents/skills/${directory}`, `${'${HOME}'}/.claude/skills/${directory}`], mode: 'tree', allowInstalledRootLink: true
  });
}

for (const directory of claudeDirectSkills) {
  const sourceRoot = path.join(claudeRoot, directory);
  const name = declaredName(sourceRoot);
  addMapping({
    id: `skill-${directory}`, family: 'skill', lifecycle: 'active', owner: 'organization', source: `skills/${directory}`,
    destinations: [`${'${HOME}'}/.agents/skills/${directory}`, `${'${HOME}'}/.claude/skills/${directory}`],
    declaredName: name, installDirectory: directory, aliases: name === directory ? [] : [directory],
    provenance: 'user-authored-claude-home', sensitivity: 'orchestration-only', license: 'review-required'
  }, {
    id: `skill-${directory}`, source: `skills/${directory}`, captureFrom: `${'${HOME}'}/.claude/skills/${directory}`,
    destinations: [`${'${HOME}'}/.agents/skills/${directory}`, `${'${HOME}'}/.claude/skills/${directory}`], mode: 'tree'
  });
}

addMapping({
  id: 'dependency-council-studio', family: 'engine-dependency', lifecycle: 'active', owner: 'organization', source: 'dependencies/llm-council',
  destinations: ['${DEPENDENCY:council-studio}'], provenance: 'user-authored-development-repository', sensitivity: 'orchestration-only', license: 'review-required'
}, {
  id: 'dependency-council-studio', source: 'dependencies/llm-council', captureFrom: '${DEPENDENCY:council-studio}', destinations: ['${DEPENDENCY:council-studio}'],
  mode: 'tree', allowedExtensions: ['', '.md', '.py', '.toml', '.lock'], exclude: ['.claude/settings.json', '.venv', 'data'],
  installedIgnore: ['.env', '.env.example'], detectLocalOnly: true
});

for (const directory of ['council', 'studio']) {
  const sourceRoot = path.join(roots['DEPENDENCY:council-studio'], '.claude', 'skills', directory);
  const name = declaredName(sourceRoot);
  addMapping({
    id: `skill-${directory}`, family: 'skill', lifecycle: 'active', owner: 'organization', source: `dependencies/llm-council/.claude/skills/${directory}`,
    destinations: [`${'${HOME}'}/.codex/skills/${directory}`, `${'${HOME}'}/.claude/skills/${directory}`],
    declaredName: name, installDirectory: directory, aliases: [], dependency: 'dependency-council-studio',
    provenance: 'user-authored-development-repository', sensitivity: 'orchestration-only', license: 'review-required'
  }, {
    id: `skill-${directory}`, source: `dependencies/llm-council/.claude/skills/${directory}`, captureFrom: `${'${DEPENDENCY:council-studio}'}/.claude/skills/${directory}`,
    destinations: [`${'${HOME}'}/.codex/skills/${directory}`, `${'${HOME}'}/.claude/skills/${directory}`], mode: 'tree', allowedExtensions: ['.md'], allowInstalledRootLink: true
  });
}

const deny = JSON.parse(fs.readFileSync(path.join(repoRoot, 'control-plane.manifest.json'), 'utf8')).deny;
fs.writeFileSync(path.join(repoRoot, 'registries', 'artifacts.v1.json'), `${JSON.stringify({ version: '1.0.0', artifacts }, null, 2)}\n`);
fs.writeFileSync(path.join(repoRoot, 'control-plane.manifest.json'), `${JSON.stringify({ version: '1.0.0', deny, mappings }, null, 2)}\n`);
console.log(`artifacts=${artifacts.length} mappings=${mappings.length} codexSkills=${codexSkills.length} agentsSkills=${agentsSkills.length} claudeDirectSkills=${claudeDirectSkills.length}`);
