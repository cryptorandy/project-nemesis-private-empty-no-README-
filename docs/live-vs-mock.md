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

## Layer 2 — real agent swarm (client timed loops)

Agent-loop context in `src/data/agent-context.ts` (swarm-owned, captured via MCP):

- Daily gainers `run_scan` hits
- Open option positions + resolved strikes (NVDA 202.5c, SOXL 95c)
- Earnings calendar near holdings (NVDA 2026-11-17 pm)
- SEC filing index hits (NVDA 8-K / 10-Q)
- Crypto marks vs prior open
- Soft-limit stubs used by Risk Guard / Execution Prep

Nine specialists run **real timed loops** over that context + Layer 1 board marks:

| Agent | Writes |
|---|---|
| Desk Chief | Merged desk brief + severity |
| Scanner Watch | Scan / board-mover briefs |
| Risk Guard | Soft-limit flags |
| Earnings Brief | Near prints for holdings |
| Options Flow | Open chain position heat |
| Crypto Pulse | BTC/ETH stress vs cap |
| News / Filings | SEC index hits |
| Portfolio Ops | Book / P&L notes |
| Execution Prep | **Stages** draft tickets only |

Activity wall, swarm cards, Research, and Risk surfaces read those briefs. Kill switch pauses every loop.

## Still mock / stub

- Options heat board zone (structure stub — separate from Options Flow briefs)
- Ticket **preview / confirm** UX (mock only — **never** calls place-order)
- Size-limit numbers are editable placeholders enforced as soft blocks in loops

## Safety

Confirm-before-trade remains. Agents never place. Execution Prep only stages into the ticket rail. Kill switch pauses loops and disables confirm. Refresh scripts are read-only bake writers.
