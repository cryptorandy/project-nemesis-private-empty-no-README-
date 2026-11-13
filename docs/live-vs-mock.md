# Project Nemesis — what’s live vs mock

## Live (Robinhood MCP snapshot baked into the app)

Captured via Cursor Robinhood MCP into `src/data/rh-snapshot.ts`:

- Equity quotes (board + indices): NVDA, AAPL, TSLA, SPY, QQQ, AMD, MSFT, AMZN, META, IWM, SOXL, SCHD, NVDW, Superstar watch symbols
- Crypto marks: BTC-USD, ETH-USD
- Portfolio snapshot for MCP account ••••0788: total / equity / options / cash / buying power
- Equity positions: NVDA, SOXL, SCHD, NVDW (qty, avg cost, mark-derived P&L)

## Live-feeling (client loops — not a live MCP socket)

Hosted Cursor apps **cannot call Robinhood MCP at runtime**. The UI:

- Animates high-frequency tape / quote / crypto / index ticks from the last RH marks
- Cycles agent statuses (scanning / briefing / idle / escalate) with staggered orbit/pulse
- Scrolls tape crawl + news crawl; refreshes agent activity feed

Agents refresh `rh-snapshot.ts` (or future desk state) when they can reach MCP.

## Stub / mock only

- Options heat zone (structure stub — not live chains)
- Ticket preview / confirm (mock only — **never** calls place-order)
- Size limits placeholders
- News crawl lines (desk-authored stubs mixing RH facts + agent chatter)

## Safety

Confirm-before-trade remains. Kill switch pauses agent loops and disables confirm. No Robinhood place-order path in this app.
