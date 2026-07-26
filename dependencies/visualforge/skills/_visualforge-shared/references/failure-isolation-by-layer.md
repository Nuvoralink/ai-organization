# Failure-isolation by layer

When a feature's implementation spans multiple layers (persistence, notification, decoration), the failure mode of one layer must not cascade into the others. The discipline is: **explicitly classify each step on the critical path or the degraded path, and isolate the degraded path so its failure cannot cancel the critical path's success.**

This is not a generic "use try/catch everywhere" rule. The whole point is to make the classification explicit. Wrapping every line in try/catch swallows real correctness bugs. The discipline is in the classification, not the syntax.

## The two classes

**Critical path** — the work whose success defines the user-visible outcome. If it fails, the user-visible outcome is failure. Examples:
- Persisting a deletion request (BG-001).
- Authenticating a session.
- Validating a typed-confirm.

**Degraded path** — work that *supports* the user-visible outcome but whose failure should produce a partial-success outcome, not a total-failure outcome. Examples:
- Sending a confirmation email after the deletion is persisted.
- Logging an audit event after the action commits.
- Rendering a decoration (banner, badge, toast) in a layout.

Both paths can succeed independently. The user-visible outcome is determined by the critical path alone. The degraded path's failure is logged but does not cancel the success.

## How to apply

For every multi-step action or component, list the steps and classify each:

| Step | Class | What its failure must NOT cancel |
|---|---|---|
| Validate input | Critical | (none — it's the gate) |
| Persist transaction | Critical | (none — it's the source of truth) |
| Send notification email | Degraded | The success redirect after persistence |
| Log audit event | Degraded | The response status |
| Render layout decoration | Degraded | The page itself |

Then in code:

```typescript
// CRITICAL path — awaited, errors propagate
await prisma.$transaction(async (tx) => { /* persist */ });

// DEGRADED path — wrapped, errors logged + swallowed
try {
  await inngest.send({ name: "X", data: { ... } });
} catch (err) {
  console.error("[feature] notification queue failed; persistence already complete", err);
}

// Critical-path completion is independent of the degraded path
redirect("/feature/success");
```

For decorative components in a global layout:

```typescript
export async function SomeBanner(): Promise<ReactNode> {
  // The banner runs on every page; its failure must not 500 the app.
  let state;
  try {
    state = await readBannerState();
  } catch (err) {
    console.error("[banner] state read failed", err);
    return null;
  }
  return state.shouldShow ? <Banner ... /> : null;
}
```

## What this protocol is NOT

- **Not "swallow all errors."** Critical-path errors MUST propagate. Wrapping persistence in try/catch is wrong — it would silently lose data while reporting success. The classification is the whole point.
- **Not a substitute for retries.** Degraded-path failures should also be retryable by the user (e.g. a resend-confirmation-email button) or by an infrastructure layer (e.g. an Inngest retry policy). The try/catch is the inner safety net, not the only safety net.
- **Not a license for inconsistent state.** When the degraded path is "send the email about the persisted deletion," the deletion record IS the source of truth — a future "backfill missing emails" job can re-derive the email from the record. The discipline is sound because the record is durable.

## Real-session examples that motivated this protocol

Three findings on the same day named the same gap:

**Finding A — Inngest send failure cascades to user-visible 500.** A server action awaited `inngest.send()` after the persistence transaction. When Inngest had a transient outage, the send threw, the redirect after it never fired, and the user saw a 500 even though the deletion was persisted. The user thought the action failed; the data said otherwise.

**Finding B — Layout decoration takes down every page.** A `<DeletionScheduledBanner>` was injected into the root `app/layout.tsx`. The banner called `getCurrentUser()` to decide whether to render. When session-decrypt failed (a transient infrastructure issue), the banner threw, the layout failed to render, and every page in the app returned 500.

**Finding C — Email-prefetcher consumed a one-time token.** A magic-link confirm endpoint did the side-effect on GET. Email clients prefetch GET URLs for safety scanning, and the prefetcher burned the user's token before the user clicked. The "GET = page; POST = action" split is the standard fix; the deeper principle is that **HTTP method should match work class** (GET = read-only / idempotent; POST = side-effecting).

All three are instances of "non-critical-or-deferred work treated as critical-path." Different symptoms; one discipline.

## HTTP-method discipline (extension of the principle)

GET handlers are commonly hit by prefetchers (email-client safety scanners, browser tab prefetchers, CDN warmers). A GET that performs a single-use side effect (consuming a token, debiting a balance, scheduling a write) is **structurally unsafe** even with a valid auth session.

**Rule:** any single-use or otherwise non-idempotent side effect requires a POST handler. The corresponding GET (if any) should validate state read-only and render a "click to confirm" page.

This applies to:
- One-time-token confirmation (magic links, email-link reauth, click-to-cancel-deletion).
- Any endpoint where "re-running the request" is not equivalent to "running it once."
- Any debit / decrement / single-claim operation.

The companion test discipline: the page test must assert that rendering the page does NOT trigger the side effect (mock the persistence call and assert `not.toHaveBeenCalled()`). A regression that adds the side effect back to GET fails this probe.

## Cross-cite

- `test-discipline-and-mutation-protocol.md` — the page-migration probe checklist's "Side-effect specificity" row covers the testing half of this rule.
- `testing-strategy-and-tdd` § "The proxy-assertion fallacy" — the principle a `redirect`-throw test must assert the specific URL, not just "something threw."
- Real findings: BG-001 pressure-test pass on 2026-05-19 surfaced all three motivating examples in a single audit.
