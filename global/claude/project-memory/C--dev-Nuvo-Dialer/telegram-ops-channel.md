---
name: telegram-ops-channel
description: "Telegram 2-way ops channel LIVE (2026-06-20) — I SEND to Amin via the bot (sendMessage) + RECEIVE his replies (POST /api/webhooks/telegram → telegram_inbound log → railway get-logs). How to reach Amin async when he's away."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 217d7e0f-4357-4e96-8416-ae26c504eeeb
---

**The dialer's Telegram bot is a 2-way async ops channel to Amin — use it when he's away and I need a decision.** Both directions LIVE + verified end-to-end (2026-06-20, #96 main `5e90150`).

**SEND (I → Amin):** `notifyTelegram(message)` (`backend/src/lib/notifyTelegram.ts`) OR a direct curl `sendMessage`. Token + chat id are in `backend/.env` (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID=86105633` = Amin). The bot already sends deploy-failure alerts (the Railway webhook forwarder). To ask Amin a question:
`TOKEN=$(grep -E '^TELEGRAM_BOT_TOKEN=' backend/.env|cut -d= -f2-|tr -d '"'); curl -s -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" -d '{"chat_id":"86105633","text":"…"}'` — source the token from .env, never print it.

**RECEIVE (Amin → me):** Amin replies to the bot in Telegram → Telegram POSTs to `POST /api/webhooks/telegram` (`backend/src/routes/webhooks.ts`) → the route logs `telegram_inbound {fromUser, text}`. **I read his reply via Railway logs** (`mcp__railway__get-logs`): api service `45bb250f-6c8b-4746-80fd-d9549b266b49`, project `acff21c9-1a8b-4b26-abb4-544c9238b1fc`, env `85b4dea0-b784-461a-b9bd-45ce765267cc`, types `["deploy"]`, filter `telegram_inbound`. **~30s ingestion lag — if the filtered query is empty, re-check with no filter + a recent `startDate`.** (Replies are NOT persisted to the DB — log-only by design; read them while fresh.)

**AUTHN (so the public URL can't be spoofed into injecting a fake "decision"):** the webhook verifies Telegram's `X-Telegram-Bot-Api-Secret-Token` header, compared constant-time to a secret DERIVED from the bot token — `HMAC-SHA256(botToken, 'telegram-webhook-v1')` hex, **no new env var** — plus a chat-id allowlist (only `TELEGRAM_CHAT_ID` is acted on). Fail-closed (401) on a bad/missing secret; ack-200 otherwise so Telegram doesn't retry. Test: `backend/src/__tests__/telegram-webhook.test.ts`.

**To (re)register** (only if the prod URL or secret ever changes): recompute the secret = `node -e "console.log(require('crypto').createHmac('sha256', process.argv[1]).update('telegram-webhook-v1').digest('hex'))" "$TOKEN"`, then `curl -s -X POST "https://api.telegram.org/bot$TOKEN/setWebhook" -d '{"url":"https://dialer-api.auxara.io/api/webhooks/telegram","secret_token":"<secret>","allowed_updates":["message"]}'`. `getWebhookInfo` confirms (url + pending_update_count + last_error). Already registered + healthy as of 2026-06-20.

**Async-decision pattern:** send Amin the question + options → poll `telegram_inbound` via get-logs (or pick it up on the next natural turn) → act on his reply. Don't blind-build a decision he owns; reach him here. See [[user-profile-and-operating-mode]] (only bring him product/scope/architecture calls) + [[decision-defaults]] (his standing answers — apply before asking).

---

## 2026-06-21 — VERIFIED end-to-end + the REAL limitation (corrects the earlier "verified")

**The RECEIVE side genuinely works** — proven by pulling Amin's actual Telegram message out of the app log: `[INFO] text="are you there" event="telegram_inbound" fromUser="asharifk"`. (My earlier "verified" was weaker — I curled the route myself, which only proved the route 200s when called, NOT that Telegram delivers to it. The real proof is reading a genuinely-Telegram-delivered message from the log.)

**THE REAL LIMITATION (this is why Amin said "it still didn't work"):** nothing *re-invokes me* when a reply arrives. His message lands in the log fine, but I only SEE it when I'm actively looking. There is no push that wakes Claude on a cold inbound. So the channel works for its intended use — **I ask a question → I poll → I get his answer** — but it is NOT a "message me anytime and I'll respond" inbox. When Amin messages first while I'm idle/between turns, it goes unread until he pokes me in chat or I'm otherwise invoked. **When I genuinely need his decision while he's away: send the question via the bot, then `ScheduleWakeup` to poll `telegram_inbound` every few min until his reply lands** (that's the only mechanism that makes the channel "reach me").

**OPERATIONAL FIXES (both bit me 2026-06-21):**
- **SEND must use `--data-urlencode`, not raw `-d` JSON** — apostrophes / em-dashes / quotes in the text → Telegram `400` with raw `-d`. Pattern: `curl -s -X POST ".../sendMessage" --data-urlencode "chat_id=$CHAT" --data-urlencode "text=…"`.
- **The railway MCP drops intermittently; the railway CLI (`railway 4.47.0`) works** — read replies with `railway logs -s 45bb250f-6c8b-4746-80fd-d9549b266b49 -d -n 120 | grep -i telegram` (`-n`/`--lines` disables streaming so it does NOT hang; the repo is linked to project nuvora-dialer but to the **worker** service by default, so pass `-s <api-svc-id>` explicitly). The api service id is `45bb250f-6c8b-4746-80fd-d9549b266b49`.
- **`getWebhookInfo` is a railway-independent delivery check** — `curl .../getWebhookInfo`: `pending_update_count:0` + no `last_error` = Telegram delivered + got a 200. A non-zero pending or a `last_error_message` = delivery failing (and it says why). `getUpdates` returns `409 Conflict` while a webhook is active — that's expected (confirms the webhook owns updates), not a bug.
- The bot is **@Nuvora_EA_bot** ("EmailAssistbot", id 8218787198) — a repurposed bot; that's the one wired to Amin's chat 86105633.
