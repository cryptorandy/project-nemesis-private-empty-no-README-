# Project Nemesis — what’s live vs mock

## Layer 1 — live Robinhood market truth (bake + refresh)

### Hosted-app limit

Cursor-published static apps **cannot call Robinhood MCP from the browser**. There is no live RH socket in the hosted app.

### Bake + refresh pattern

1. During an agent run (MCP available), pull:
   - `get_portfolio` / `get_equity_positions`
   - `get_equity_quotes` (indices + board equities)
   - `get_crypto_quotes` (BTC-USD, ETH-USD)
   - `get_watchlist_items` (Superstar watch)
2. Write **`public/data/market.json`** (pollable JSON the app loads).
3. Optionally sync the TypeScript fallback:  
   `node scripts/refresh-market.mjs --from-stdin --write-ts < snapshot.json`  
   or validate: `node scripts/refresh-market.mjs`
4. Commit + push + republish so hosted clients see new marks on poll.

### What the UI does

- Polls `/data/market.json` ~every 12s (`cache: no-store`)
- Seeds from baked `src/data/rh-snapshot.ts` if the poll fails
- Shows clear **as of** timestamps + feed status (`fresh` / `baked` / `stale` / `degraded`)
- Gentle client tick between refreshes for TV energy (not a live MCP stream)
- Degrades gracefully: keeps last known marks when JSON is missing or invalid

### Live RH fields in the bake

- Equity quotes (board + index ETFs): NVDA, AAPL, TSLA, SPY, QQQ, AMD, MSFT, AMZN, META, IWM, SOXL, SCHD, NVDW, Superstar watch symbols
- Crypto marks: BTC-USD, ETH-USD
- Portfolio snapshot for MCP account ••••0788: total / equity / options / cash / buying power
- Equity positions: NVDA, SOXL, SCHD, NVDW (qty, avg cost, mark-derived P&L)
- Watchlist metadata (Superstar list id + symbols)

## Stub / mock only

- Options heat zone (structure stub — not live chains)
- Ticket preview / confirm (mock only — **never** calls place-order)
- Size limits placeholders
- Agent status/thought cycles (UI motion — not autonomous trading)
- News crawl lines (desk-authored stubs mixing RH facts + agent chatter)

## Safety

Confirm-before-trade remains. Kill switch pauses agent loops and disables confirm. No Robinhood place-order path in this app. Refresh scripts are read-only bake writers.
