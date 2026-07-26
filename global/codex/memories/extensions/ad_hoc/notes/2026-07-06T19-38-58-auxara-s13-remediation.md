# Auxara Sprint 1.3 remediation status

Use this note when resuming Auxara Dialer Sprint 1.3 shared-list/team-run work.

- List ownership is exactly one target: `lists.pod_id` for team/pod OR `lists.assigned_user_id` for an individual. Legacy null/null rows are cleanup artifacts only and must not be treated as personal ownership.
- Sprint 1.3 remediation wired manager reassignment through `PATCH /api/lists/:id/owner`; reassignment/archive drains or stops active shared runs without destroying active call evidence.
- Team-owned active lists are not allowed through legacy solo queue routes. `/api/calls/dial`, `/api/calls/next`, and `/api/calls/up-next` return `DIAL_RUN_REQUIRED`; team dialing goes through `/api/dial-runs`.
- Manual `{prospectId}` dialing remains a human-selected action and intentionally bypasses queue completion/exhaustion status. Archived lists still block manual prospect dial.
- Archived-list import returns `LIST_NOT_DIALABLE`; exhausted lists reactivate to `active` only when an import adds new live rows.
- DLR-016 booker path is wired: `useDialRun` joins active runs, heartbeats the server-minted `mediaSessionId`, and SoftphonePage calls `claim-next` only when the current operator is Ready, online, idle, and on shift.
- A single Ready+online participant can claim even if every other teammate is offline/unavailable; there is no team quorum requirement.
- Legacy solo read-ahead/up-next calls are suppressed in team mode so the shared coordinator remains the only queue authority.
- AI disposition draft enqueue authority is the accepted Telnyx `ENDED` webhook path. Cancel no longer enqueues early. The worker drafts only from usable transcript text; answered call-event timelines are lifecycle evidence, not semantic evidence.
