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
   - `get_option_chains` / `get_option_instruments` / `get_option_quotes` (Greeks + IV)
   - `get_earnings_calendar` (near catalysts)
2. Write **`public/data/market.json`** (pollable JSON the app loads).
3. Sync options scanner bake in `src/data/options-scan.ts` + agent context.
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
- Option contracts with **delta / gamma / theta / vega / IV** from `get_option_quotes`

## Layer 2 — real agent swarm (client timed loops)

Agent-loop context in `src/data/agent-context.ts` + options bake in `src/data/options-scan.ts`:

- Daily gainers `run_scan` hits
- Open option positions + resolved strikes (NVDA 202.5c, SOXL 95c)
- Ranked **buy** ideas from chains/quotes (Greeks hard-required)
- Earnings calendar near holdings (NVDA 2026-11-17 pm)
- SEC filing index hits (NVDA 8-K / 10-Q)
- Crypto marks vs prior open
- Soft limits: **10% BP / trade**, **5% day loss**, **watchlist-only**

Nine specialists run **real timed loops** over that context + Layer 1 board marks:

| Agent | Writes |
|---|---|
| Desk Chief | Merged desk brief + severity |
| Scanner Watch | Scan / board-mover briefs |
| Risk Guard | Soft-limit flags (% capital) |
| Earnings Brief | Near prints for holdings |
| Options Flow | Ranked buy ideas (Δ/Γ/Θ/ν + IV) |
| Crypto Pulse | BTC/ETH stress vs cap |
| News / Filings | SEC index hits |
| Portfolio Ops | Book / P&L notes |
| Execution Prep | **Stages** draft tickets only |

### Options scanner (hard Greeks gate)

- Every recommendation **must** include delta, gamma, theta, vega from RH option quotes.
- IV shown when RH returns `implied_volatility`.
- Ranking uses Greeks + unusual vol/OI + earnings proximity + % capital fit.
- Universe = holdings underlyings + Randy Superstar watchlist (watchlist-only).
- Board zone **Options buys** shows structure / expiry / strike / thesis / risk / Greeks.
- **Stage** one-taps into the ticket rail — still requires preview → confirm. **Never auto-places.**

Activity wall, swarm cards, Research, and Risk surfaces read those briefs. Kill switch pauses every loop.

## Still mock / stub

- Ticket preview / confirm / place (mock only — **never** calls place-order)
- Crypto ticket fields (stub; equity + options are first-class)
- Size / % capital soft-checks are advisory vs baked book (human ack on warn/block)

## Pro execution UX (layer 3)

- **Ticket rail:** equity + options builder (right / strike / expiry) + crypto stub
- **Risk soft-checks:** 10% BP, 5% day-loss budget, watchlist-only, concentration, option qty
- **Hard confirm gate:** preview required; kill switch locks Confirm; human + soft-flag ack; sole place entrypoint
- **Mock place:** `src/lib/mockPlace.ts` with `ALLOW_LIVE_PLACE=false` — only called from ConfirmGate
- **Audit:** append-only sealed rail for preview / risk-check / confirm-mock / place-mock / kill / stage

## Safety

Confirm-before-trade remains. Agents never place. Options Flow / Execution Prep only stage into the ticket rail. Kill switch pauses loops and disables confirm. Refresh scripts are read-only bake writers. Published app stays **private**.
