<!-- TEMPLATE: one ADR. Copy to {{ADR_DIR}}/ADR-<AREA>-<NNN>-<slug>.md for each architectural decision. ADRs are the HIGHEST authority in the precedence chain (ADR > decision-log row > always-on rule > doc prose). -->
# ADR-{{AREA}}-{{NNN}} — {{TITLE}}

- **Status:** Proposed | Accepted | Superseded by ADR-XXX | Deprecated
- **Date:** {{DATE}}
- **Deciders:** {{DECIDERS}}
- **Related:** decision-log row {{DEC_ID}}; rules {{RELATED_RULES}}; ADRs {{RELATED_ADRS}}

## Context
{{CONTEXT}}
<!-- The forces at play: the requirement, the constraint, the tradeoff. What made this a real decision (more than one defensible side)? -->

## Decision
{{DECISION}}
<!-- The choice, stated precisely enough that code can be judged against it. This is what the doctrine-drift-auditor quotes verbatim. -->

## Alternatives considered
| Option | Strongest argument for | Why rejected |
|---|---|---|
| {{OPTION_A}} (chosen) | {{FOR_A}} | — |
| {{OPTION_B}} | {{FOR_B}} | {{AGAINST_B}} |
<!-- decision-discipline: name at least one real alternative + its strongest argument, stated honestly. A one-row table is theater. -->

## Consequences
- **Positive:** {{POSITIVE}}
- **Negative / accepted cost:** {{NEGATIVE}}
- **Follow-ups:** {{FOLLOWUPS}}

## Reversal trigger
{{REVERSAL}}
<!-- What new fact would make us revisit this? A reversal is a fresh explicit decision, not a silent drift. -->
