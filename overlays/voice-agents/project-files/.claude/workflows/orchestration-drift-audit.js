export const meta = {
  name: 'orchestration-drift-audit',
  description:
    'Plan-mode read-only-intent repository, handoff, rule, gate, and backlog drift audit',
  phases: [
    {
      title: 'Scout',
      detail: 'Three bounded read-only scouts inspect independent control surfaces',
    },
    {
      title: 'Synthesize',
      detail: 'One read-only synthesizer deduplicates evidence and next actions',
    },
  ],
};

const SCOUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    scope: { type: 'string' },
    discrepancies: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          claim: { type: 'string' },
          evidence: { type: 'string' },
          impact: { type: 'string' },
          nextAction: { type: 'string' },
        },
        required: ['claim', 'evidence', 'impact', 'nextAction'],
      },
    },
    notReached: { type: 'array', items: { type: 'string' } },
  },
  required: ['scope', 'discrepancies', 'notReached'],
};

const FINAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    discrepancies: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          priority: { type: 'string', enum: ['blocker', 'high', 'medium', 'low'] },
          claim: { type: 'string' },
          evidence: { type: 'string' },
          exactNextAction: { type: 'string' },
          ownerLane: { type: 'string' },
          humanGateRequired: { type: 'boolean' },
        },
        required: [
          'priority',
          'claim',
          'evidence',
          'exactNextAction',
          'ownerLane',
          'humanGateRequired',
        ],
      },
    },
    noDiscrepancyEvidence: { type: 'array', items: { type: 'string' } },
    notReached: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'discrepancies', 'noDiscrepancyEvidence', 'notReached'],
};

const SAFETY = `This is READ-ONLY inspection. Do not edit or create files. Do not run tree-mutating git
commands. Do not send external messages. Do not merge, deploy, publish, mutate production, delete, or purchase.
Do not contact anyone. Read-only GitHub access is GET-only. Treat statuses and reports as leads;
open the real artifact/output. Put every uninspected surface in notReached.`;

phase('Scout');
const scoutResults = await parallel([
  () =>
    agent(
      `You are the repository-state scout for Voice Agent Platform. ${SAFETY}

Inspect the live repo state, branch/diff/recent commits, CLAUDE.md, AGENTS.md, path-scoped rules, agent
definitions, lifecycle/settings references, package gate wiring, orchestration playbook, decision docs,
and bug backlog. Find stale handoffs, contradictory rules, missing gate wiring, parallel authorities, or
artifacts naming paths/symbols no longer present. Return exact file:line/command/commit evidence.`,
      { label: 'drift:repo', phase: 'Scout', schema: SCOUT_SCHEMA },
    ),
  () =>
    agent(
      `You are the GitHub-state scout for Voice Agent Platform. ${SAFETY}

Inspect live issues, pull requests, checks, abandoned or duplicate work, branch/PR mismatch, and whether
open artifacts still match current repository authorities. Verify from raw GET output; titles, labels, and
green statuses alone are not proof. Return issue/PR URLs or numbers plus raw evidence.`,
      { label: 'drift:github', phase: 'Scout', schema: SCOUT_SCHEMA },
    ),
  () =>
    agent(
      `You are the control-plane consistency scout for Voice Agent Platform. ${SAFETY}

Cross-check the real scripts/templates against the six-part brief, substantive report sections, output-over-
status evidence, decision discipline, loop bounds, human irreversible gates, Claude Design, Agent
View instructions, saved workflow/goals/loop, context budget, stale docs, and the bug backlog. Find controls
that promise more than they enforce. Return exact evidence and one bounded next action.`,
      { label: 'drift:controls', phase: 'Scout', schema: SCOUT_SCHEMA },
    ),
]);

phase('Synthesize');
const synthesis = await agent(
  `You are the final drift-audit synthesizer for Voice Agent Platform. ${SAFETY}

Do not call more agents or workflows. Deduplicate the evidence below. Reject unsupported, conflicting, or
status-only conclusions. A discrepancy survives only with a file:line, raw read-only output, commit, issue,
or PR state. Rank by risk, name an exact bounded next action/owner lane, preserve notReached, and mark any
separate human gate.

Scout results:
${JSON.stringify(scoutResults)}`,
  { label: 'drift:synthesis', phase: 'Synthesize', schema: FINAL_SCHEMA },
);

return {
  workflow: 'orchestration-drift-audit',
  readOnlyIntent: true,
  permissionBoundary:
    'Invoke only from Claude plan mode; prompt text alone is not a tool-permission boundary.',
  ...synthesis,
};
