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
- RH MCP snapshot baked in `src/data/rh-snapshot.ts` + high-frequency live ticks

See [docs/live-vs-mock.md](docs/live-vs-mock.md) for live vs mock detail.

## Hosted URL

Production: https://project-nemesis.apps.grok.bot

If the app was published **private/team**, unauthenticated browsers get a Grok/Cursor sign-in gate (looks almost empty until you authorize). Sign in with the owning Grok Bot account, or republish as **public** for open load.

Fonts are self-hosted (no Google Fonts CDN) so first paint is not blocked on external CSS.

## Safety

Orders are **never** placed by this UI. Preview and confirm are mock-only. Hosted app cannot call Robinhood MCP at runtime; agents refresh the snapshot when MCP is reachable.

## Repo note

GitHub remote is currently `project-nemesis-private-empty-no-README-`. Optional rename to `project-nemesis` later — do not rename without asking Randy.
