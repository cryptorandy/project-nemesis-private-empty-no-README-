# Project Nemesis

Mixed equities / options / crypto **research + execution desk**. Specialist agents orbit the book; Randy confirms every ticket.

TV-style trading board over a Robinhood MCP snapshot: scrolling tape, indices strip, quote grid, positions/P&L, crypto strip, options heat stub, agent swarm wall, activity + news crawls. Confirm-before-trade only — **no place-order calls**.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

```bash
npm run build
npm run preview
```

## What’s in this build

- Brand-first hero (orbit atmosphere does **not** steal clicks)
- Dense Board: indices · tape crawl · P&L strip · quote grid · positions · crypto · options heat stub · agent swarm · activity · news crawl
- Research / Risk / Audit + Ticket rail
- 9-agent rail with staggered orbit/pulse + status flickers (scanning / briefing / idle / escalate)
- Kill switch (pauses agents + disables confirm)
- Ticket draft → mock preview → human confirm gate → mock confirm
- Layer 1 market truth: agents bake RH MCP into `public/data/market.json`; UI polls it; TS fallback in `src/data/rh-snapshot.ts`
- Clear **as of** timestamps + graceful degrade when poll fails
- High-frequency tape tick between bake refreshes (TV energy, not a live MCP socket)

See [docs/live-vs-mock.md](docs/live-vs-mock.md) for live vs mock detail.

## Refresh market bake (agents)

```bash
# After pulling RH MCP during an agent run, write JSON (+ optional TS sync):
node scripts/refresh-market.mjs --from-stdin --write-ts < /path/to/snapshot.json
# Or validate the committed bake:
node scripts/refresh-market.mjs
```

## Safety

Orders are **never** placed by this UI. Preview and confirm are mock-only. Hosted app cannot call Robinhood MCP at runtime; agents refresh `public/data/market.json` when MCP is reachable, then push/republish.

## Repo note

GitHub remote is currently `project-nemesis-private-empty-no-README-`. Optional rename to `project-nemesis` later — do not rename without asking Randy.
