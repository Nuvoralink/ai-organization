---
name: visualforge-content-design
description: Voice and tone guide, microcopy library covering every button, label, error, empty-state, confirmation, destructive-action, onboarding, loading, success, permission-denied, help-text, and dangerous-action copy in the product.
---

# Content Design

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `state-page-patterns.md`, `visual-default-breakers.md`.
- Use `opinionated-decision-template.md`.
- No vague copy. Never "Something went wrong." Never "Oops!". Never "An error occurred."
- Every error message tells the user: what happened, why if known, what to try.
- Voice locked from brand identity; tone shifts per context (sober for destructive, warm for success, calm for errors).
- Owns (per `state-page-patterns.md`): recovery copy / CTA discipline (pattern 5), spec-bound-copy annotation pattern, error-message standards. Cite the shared reference for cancellation-as-easy-as-signup, no-fake-urgency, and `(spec-bound)` annotation rules.
- Owns (per `visual-default-breakers.md` §8): the meta-label slop ban (`SECTION 01`, `QUESTION 05` as decorative headers).
- Maintain `decision-log.md`.

## Purpose

Lock the words. Microcopy is design — bad copy can break a great visual system. Without a content contract, copy drifts across surfaces and contradicts the brand voice.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Define voice from brand, then write the full microcopy library.
- **Retrofit:** Inventory existing copy; rewrite to spec; drift entry covers the rewrites.

## Required research pass

```text
Research current microcopy best practices as of 2026 with emphasis on: error messaging (recoverability, blame-free framing, technical detail policy), empty states (teaching first action), destructive confirmations (typed confirmation vs button vs undo), AI / generative content disclosure copy, and accessibility-friendly language. Find 3 reference products and capture copy excerpts.
```

## Inputs

- Brand identity (`05-brand-identity.md`) — voice direction.
- Personas — language map.
- UX flows — every state of every screen.
- Component system — every interactive component.

## Output files

- `docs/design-system/04-interaction/content-design.md` — voice contract, tone variations, vocabulary lock, capitalization, punctuation, i18n readiness.
- `docs/design-system/content/microcopy.json` — structured microcopy library for i18n.
- Decision-log entries (DEC-570 to DEC-594, overflow DEC-595 to DEC-599) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Voice contract (locked from brand)

- **Voice profile:** Direct/Professional | Warm/Approachable | Playful/Confident | Calm/Technical | Sharp/Editorial.
- **Person:** first-person plural ("we") | second-person ("you") | objective.
- **Formality:** casual / professional / formal.
- **Contractions:** allowed / restricted to specific contexts / never.
- **Humor:** never / dry only / earned moments / playful throughout.
- **Sentence length target:** short (under 12 words) / medium / no limit but bias short.

### 2. Tone variations by context

| Context | Tone | Why |
|---|---|---|
| Onboarding | Warm + reassuring | First-time users need confidence |
| Errors (user-recoverable) | Calm + helpful | Don't panic the user |
| Errors (server / network) | Honest + brief | Don't pretend it's user's fault |
| Destructive confirmations | Sober + specific | Override brand warmth; clarity wins |
| Success after action | Brief + confident | "Saved." not "Hooray! All done!" |
| Empty states | Inviting + teaching | First-success pivot point |
| AI / generative output | Transparent + cited | Disclose generative nature |
| Marketing | Brand-voice full | Where voice is loudest |
| Legal / consent | Plain + accurate | Override style for compliance |

### 3. Vocabulary lock

A canonical glossary of terms used in the product. Pair to the persona language map.

| Concept | Canonical term | Plural | Verb forms | Rejected synonyms |
|---|---|---|---|---|
| Workspace | Workspace | Workspaces | "create a workspace", "switch workspaces" | "Team", "Group" |
| Project | Project | Projects | "create project", "archive project" | "Board", "Folder" |
| ... | ... | ... | ... | ... |

Every screen, button, doc must use canonical terms.

### 4. Microcopy library — full coverage

For each category, write every string. Store in `microcopy.json` keyed by purpose, organized so i18n can split.

#### Buttons / actions

| Key | Default copy | Loading variant | Disabled rationale |
|---|---|---|---|
| `action.save` | "Save" | "Saving…" | (n/a) |
| `action.save-changes` | "Save changes" | "Saving…" | "No changes to save" |
| `action.create-project` | "Create project" | "Creating…" | "Add a name to continue" |
| `action.delete` | "Delete" | "Deleting…" | "Select items to delete" |
| `action.confirm-delete` | "Delete permanently" | "Deleting…" | (n/a) |
| `action.cancel` | "Cancel" | (n/a) | (n/a) |
| `action.undo` | "Undo" | (n/a) | (n/a) |
| `action.try-again` | "Try again" | "Retrying…" | (n/a) |
| `action.continue` | "Continue" | (n/a) | (n/a) |
| `action.skip` | "Skip" | (n/a) | (n/a) |
| `action.invite` | "Send invite" | "Sending…" | "Add an email to continue" |
| `action.copy-link` | "Copy link" | (n/a; success → "Copied") | (n/a) |

#### Form labels and helper text

For every form field type used, define a pattern:

```
Label: [Noun, sentence-case, no colon] e.g. "Project name"
Placeholder: [Use only for hints, not labels] e.g. "e.g. Marketing site rebuild"
Helper: [Optional. Plain instruction. Not requirement parroting.]
Required marker: visible asterisk + screen-reader text "required"
```

#### Validation messages

| Validation | Copy |
|---|---|
| Required | "Add a [field] to continue" — never "This field is required" |
| Email format | "Enter a valid email like name@example.com" |
| Min length | "Use at least N characters" |
| Max length | "Keep it under N characters" |
| Pattern (general) | Specific to pattern, not "Invalid format" |
| Match (confirm password) | "These passwords don't match" |
| Unique (already taken) | "That [field] is taken. Try another." |

#### Error messages

For every error category in the UX flows error paths, write the user-facing string:

| Error key | Copy template |
|---|---|
| `error.generic-server` | "Something on our end stopped this from saving. Try again, or contact support if it sticks." |
| `error.network-offline` | "You're offline. We'll save this once you're back." |
| `error.network-flaky` | "Slow connection — this is taking longer than usual. Want to retry?" |
| `error.permission-denied` | "You don't have permission to do that. Ask [owner role] for access." |
| `error.not-found` | "Couldn't find that [resource]. It may have moved or been deleted." |
| `error.rate-limit` | "You're going fast. Try again in a few seconds." |
| `error.validation` | (per-field, see above) |
| `error.timeout` | "This is taking longer than expected. We'll keep trying, or you can retry now." |
| `error.unsupported-browser` | "This feature needs a current version of [browsers]. Try [recommendation]." |

Never:
- "Something went wrong" without context.
- "Oops!" or any cute-error voice.
- "An error occurred. Please try again." (no actionable info).
- Stack traces or error codes alone.
- Blame language ("You entered an invalid…"). Use "Add a valid…".

#### Empty states

For every empty-state screen identified in UX flows:

| Screen state | Headline | Body | Primary CTA | Secondary |
|---|---|---|---|---|
| Projects: no projects yet | "Start your first project" | "Projects organize tasks, files, and people. Create one to get started." | "Create project" | "Import from CSV" |
| Search: no results for query | "Nothing matches \"X\"" | "Try a broader term or check spelling." | "Clear search" | (n/a) |
| Inbox: zero | "You're all caught up" | "New mentions and replies will show up here." | (n/a) | (n/a) |
| Notifications: zero | "Quiet for now" | "We'll let you know when something needs your attention." | "Notification settings" | (n/a) |

#### Confirmation messages

| Action | Confirmation type | Copy |
|---|---|---|
| Save (non-destructive) | Toast | "Saved" |
| Delete (recoverable, undo within 30s) | Toast with action | "Project deleted. **Undo** within 30 seconds." |
| Delete (permanent) | AlertDialog with typed confirm | Dialog title: "Delete \"[name]\" forever?" Body: "This can't be undone. All [N] tasks and [M] files will be removed." Confirm input: "Type the project name to confirm." Confirm button: "Delete permanently". |
| Sign out | AlertDialog | "Sign out?" / "You'll need to sign in again to return." / "Sign out" |
| Discard unsaved changes | AlertDialog | "Discard unsaved changes?" / "Your edits will be lost." / "Discard". |

#### Destructive action philosophy

- **Recoverable (within 30s) — undo affordance:** primary path. Use for most "delete" actions.
- **Permanent — typed confirmation:** when truly unrecoverable, require typing the resource name. Confirm button text matches action verb exactly.
- **Sensitive — re-auth:** for billing, account deletion, security-sensitive — require password / 2FA.

#### Loading copy

- **Inline button:** "Saving…" / "Creating…" / "Loading…"
- **Page-level:** rarely show a loading message; prefer skeleton. If shown, never longer than 5 seconds before becoming "Still loading… [Retry]".
- **Long-running task:** "Processing N of M…" with progress.

#### Success copy

- **Brief:** "Saved", "Sent", "Created", "Copied".
- **With context:** "Invite sent to [email]".
- Never: "Success!", "Done!", "All set!"  — too generic.

#### Permission-denied copy

- Tell user what they can't do, why if known, and how to escalate.
- "You don't have permission to edit this. Ask the project owner ([name]) for editor access."

#### Onboarding copy

For onboarding flow:

- **Welcome step:** product value in one sentence, not "Welcome to [product]!"
- **Setup step:** "Let's set up your first [thing]" — verb-led.
- **First-action step:** action-oriented CTA + reassurance ("You can change this later").
- **Completion:** confirmation + next-action pointer.

#### AI / generative content disclosure

If AI features present:

- Indicate when content is AI-generated.
- Indicate when responses are streaming.
- Indicate when sources are cited.
- Avoid making the AI seem human ("I think…" — prefer "Based on your data…").
- Failure mode: "I couldn't generate that. Try rephrasing or [alternative]."

### 5. Number and date formats

- **Dates:** relative for < 7 days ("3 hours ago"), absolute beyond ("Mar 5"). Lock the format library (date-fns / dayjs / Intl.DateTimeFormat).
- **Numbers:** locale-aware separators. Compact for large (1.2K, 3.4M).
- **Currency:** symbol + locale formatting; never hard-coded "$".
- **Percentages:** include space if locale requires.
- **Pluralization:** ICU MessageFormat for i18n-correct plurals.

### 6. Capitalization rules

- **Sentence case** for buttons, labels, menu items, headings. Lock.
- **Title case** reserved for proper nouns and brand names.
- **ALL CAPS** only for short labels (tags, badges, small section labels) with tracking; never long text.

### 7. Punctuation rules

- **No periods** in button labels, single-sentence form labels, toast messages.
- **Periods** in helper text, body copy, paragraphs of more than one sentence.
- **Em-dash** ( — ) for asides; not " - ".
- **Smart quotes** in body copy ("…"), straight quotes in code blocks.
- **Oxford comma** — pick yes or no and lock.

### 8. Internationalization readiness

- All copy lives in `microcopy.json` for translation.
- No string concatenation in code — use ICU placeholders.
- Allow for 30%+ text expansion in non-English.
- Plurals and gender via ICU MessageFormat.
- Locked terms (brand names, technical terms) marked as non-translatable.

### 9. Decision cards

- DEC-571 Voice profile lock.
- DEC-572 Vocabulary lock (canonical terms).
- DEC-573 Error message philosophy.
- DEC-574 Destructive-action confirmation policy (per action).
- DEC-575 Empty-state philosophy + first-success language.
- DEC-576 Capitalization + punctuation rules.
- DEC-577 i18n readiness lock.

## Anti-slop content rules

- "Friendly and clear copy" without writing the copy fails.
- "Oops! Something went wrong" is the canonical slop. Bury it.
- Generic "Success!" / "Error!" fails.
- "Please" excess — use only when introducing inconvenience ("Please reconnect to continue").
- Cute error voices ("404: This isn't the page you're looking for") fail unless explicitly Playful brand voice.
- "Click here" / "Learn more" without context fails accessibility.

## Quality gate

- Voice profile locked.
- Vocabulary glossary covers all product terms.
- Microcopy library has entries for every key in the categories above.
- Error messages cover every error case in UX flows.
- Empty states cover every empty screen in UX flows.
- Confirmation strategy decided per destructive action.
- i18n structure ready.

## Sources and basis

Voice tied to brand. Microcopy entries cite research where applicable (e.g., destructive-action patterns from Nielsen Norman or competitive audit excerpts).
