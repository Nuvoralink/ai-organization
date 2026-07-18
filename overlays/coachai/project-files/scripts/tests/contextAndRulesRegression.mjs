/**
 * Proves: REQ-ORG-001
 * Test type: regression
 * Surface: agent startup context and canonical rule routing
 * Authority: .ai-organization/context-budget.json and AGENTS.md
 * What this test proves about the product: every agent starts with one valid bounded router and every rule remains reachable without a parallel authority.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { checkAgentContext } from '../check-agent-context.mjs';
import { checkRulesWiring } from '../check-rules-wiring.mjs';
import { organizationFixture, writeJson } from './fixture-helpers.mjs';

const source = process.cwd();

test('clean startup and rule wiring pass', () => {
  const root = organizationFixture(source);
  assert.equal(checkAgentContext(root).ok, true);
  assert.equal(checkRulesWiring(root).ok, true);
});

test('killer mutations: double import, missing import, and over-budget context fail', () => {
  const duplicate = organizationFixture(source);
  fs.appendFileSync(path.join(duplicate, 'CLAUDE.md'), '\n@AGENTS.md\n');
  assert.match(checkAgentContext(duplicate).errors.join('\n'), /imported more than once|exactly once/i);

  const missing = organizationFixture(source);
  fs.writeFileSync(path.join(missing, 'CLAUDE.md'), '@DOES-NOT-EXIST.md\n');
  assert.match(checkAgentContext(missing).errors.join('\n'), /missing startup import/i);

  const budget = organizationFixture(source);
  const configPath = path.join(budget, '.ai-organization/context-budget.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.maximum_tokens = 10;
  writeJson(configPath, config);
  assert.match(checkAgentContext(budget).errors.join('\n'), /exceeds hard maximum/i);
});

test('killer mutations: unrouted and unexpected always-on rules fail', () => {
  const unrouted = organizationFixture(source);
  const agents = path.join(unrouted, 'AGENTS.md');
  fs.writeFileSync(agents, fs.readFileSync(agents, 'utf8').replace('.cursor/rules/analysis-pipeline.mdc', 'analysis pipeline rule'));
  assert.match(checkRulesWiring(unrouted).errors.join('\n'), /absent from AGENTS/i);

  const always = organizationFixture(source);
  const file = path.join(always, '.cursor/rules/coachai-engineering-rules.mdc');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('alwaysApply: false', 'alwaysApply: true'));
  assert.match(checkRulesWiring(always).errors.join('\n'), /not budget-approved/i);
});
