# Project Nemesis — what’s live vs mock

## Layer 1 — live Robinhood account feed

### Root cause of “account off”

Cursor-published apps **cannot call Robinhood MCP from the browser** (or from app server code). MCP exists only in cloud-agent sessions. A one-shot `book.json` bake + republish goes stale as soon as Randy trades outside the desk — the UI kept polling yesterday’s file and felt “not live / account off.”

### What works on Cursor apps hosting

| Path | Works? | Notes |
| --- | --- | --- |
| Browser → RH MCP | No | MCP not in the page |
| App server → RH MCP | No | Published app has no MCP session |
| App server → Robinhood REST via secret | No | No bindable RH API token; MCP OAuth stays with Cursor |
| **Agent MCP → POST `/api/book` → desk polls** | **Yes** | Continuous truth; no human republish |
| Agent MCP → commit bake + republish | Yes | Fallback; still needs a publish cycle |

### Live book pipeline (preferred)

1. Cloud agent (timer / desk-open loop) calls RH MCP read tools only:
   - `get_portfolio` / `get_equity_positions` / `get_equity_quotes` (and crypto as needed)
2. Build a scrubbed book (`scripts/build-book-from-rh.mjs`) — account ids masked `••••0788`
3. `POST /api/book` with `Authorization: Bearer $BOOK_INGEST_SECRET`  
   Private apps also need `x-cursor-app-token: $CURSOR_APP_TOKEN` so the gate admits the agent
4. Desk (when open) polls **`/api/book` every ~30s** (focus/visibility re-poll too); falls back to `/data/book.json`
5. Published host stores the latest book in **Postgres** (`live_book`); local Vite uses `.local/live-book.json`

**Always-on pusher (agents):**

```bash
# After writing /tmp/rh-input.json from MCP:
npm run book-pusher -- --mode live --input /tmp/rh-input.json --once
# Continuous (default 60s):
npm run book-pusher -- --mode live --input /tmp/rh-input.json
```

**Bake fallback (no agent secrets yet):**

- Desk **Refresh** button (signed-in) → `POST /api/book` with `{ refresh: true }` — re-stamps `asOf` on the stored/bake book so feed status stays fresh without republish
- Agent keep-alive: `npm run book-pusher -- --mode refresh --once` (same ping; needs secret or app token)

Secrets (declare via bind-app-secrets / dashboard — never paste in chat):

- `BOOK_INGEST_SECRET` — required for unattended agent ingest
- `CURSOR_APP_TOKEN` — personal Cursor API key so agents can reach the private app

Until those values exist, Randy can keep the desk “fresh” with the in-app **Refresh** ping (signed-in). Agents still bake+republish when positions actually change.

### Static bake (still present)

Agents can still write `public/data/market.json` + `public/data/book.json` via `scripts/refresh-market.mjs` for cold start / offline. That path alone is **not** enough for a live desk — use Refresh ping or the pusher loop.

### What the UI does

- Polls `/api/book` ~every **30s** for positions/portfolio (preferred)
- Polls `/data/market.json` ~every 12s for quotes + full snapshot (`cache: no-store`)
- Re-polls immediately on window focus / tab visible
- Seeds from baked `src/data/rh-snapshot.ts` if polls fail
- Shows **as of** timestamps + feed status (`fresh` / `baked` / `stale` / `degraded`); stale after ~**3m**
- Gentle client tick between refreshes for TV energy (not a live MCP socket)
- Degrades gracefully: keeps last known marks when JSON is missing or invalid

### Live RH fields

- Equity quotes (board + index ETFs): NVDA, AAPL, TSLA, SPY, QQQ, AMD, MSFT, AMZN, META, IWM, SOXL, SCHD, NVDW, Superstar watch symbols
- Crypto marks: BTC-USD, ETH-USD
- Portfolio snapshot for MCP account ••••0788: total / equity / options / cash / buying power
- Equity positions: NVDA, SOXL, SCHD, NVDW (qty, avg cost, mark-derived P&L)
- Option positions in live book (`asset: option` + strike/expiry/right/optionId)
- Crypto holdings in live book when open (`asset: crypto`); empty book shows none
- Watchlist metadata (Superstar list id + symbols)
- Option contracts with **delta / gamma / theta / vega / IV** from `get_option_quotes` (scanner bake)

## Layer 2 — real agent swarm (client timed loops)

Agent-loop context in `src/data/agent-context.ts` + options bake in `src/data/options-scan.ts`:

- Daily gainers `run_scan` hits
- Open option positions + resolved strikes
- Ranked **buy** ideas from chains/quotes (Greeks hard-required)
- Earnings calendar near holdings
- SEC filing index hits
- Crypto marks vs prior open
- Soft limits: **10% BP / trade**, **5% day loss**, **watchlist-only**

Specialists (Chief → Alert → Scanner → Depth → Exec) run **real timed loops** over that context + Layer 1 board marks. Kill switch pauses every loop. Alert Watch / Options Flow / Execution Prep only **stage** — never place.

### Tools layer (TD-32)

- **Alert Watch** — `get_alerts` / `get_alert_log` bake → activity **Stage** into ticket (confirm still required)
- **Live Scanner Watch** — `run_scan` Daily gainers hits + MCP ok status; SCAN badges on quote grid when symbols overlap
- **Research Depth** — focus-symbol workspace (fundamentals, RSI/MACD, earnings, SEC) from RH MCP bake

## Still mock / stub

- Ticket preview / confirm / place (mock or live-intent only — **never** calls place-order from the browser)
- Crypto ticket fields (stub; equity + options are first-class)
- Size / % capital soft-checks are advisory vs live book (human ack on warn/block)

## Pro execution UX (layer 3)

- **Ticket rail:** equity + options builder + crypto stub
- **Risk soft-checks:** 10% BP, 5% day-loss budget, watchlist-only, concentration, option qty
- **Hard confirm gate:** preview required; kill switch locks Confirm; human + soft-flag ack
- **Mock / live-intent place:** never unsupervised RH place from the UI
- **Audit:** append-only sealed rail

## Safety

Confirm-before-trade remains. Agents never place from this UI. Full brokerage account numbers are **not** shipped in the browser bundle (masked `••••0788`; agents resolve via `get_accounts`). Published app stays **private**.
