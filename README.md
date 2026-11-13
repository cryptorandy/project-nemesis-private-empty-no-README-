# Project Nemesis

Mixed equities / options / crypto **research + execution desk**. Specialist agents run real timed loops; Randy confirms every ticket.

TV-style trading board over a Robinhood MCP bake + poll path, plus a **real agent swarm** that writes briefs into desk state. Confirm-before-trade only — **no place-order calls**.

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
- Dense Board: indices · tape · P&L · quotes · positions · crypto · options heat stub · agent swarm · activity · Chief brief bar
- **Layer 1 market truth:** agents bake RH MCP into `public/data/market.json`; UI polls it; TS fallback in `src/data/rh-snapshot.ts`
- Clear **as of** timestamps + graceful degrade when poll fails
- **Layer 2 real agent loops** (Desk Chief → Execution Prep) writing briefs from RH MCP context + heuristics
- Activity wall shows real loop outputs (not canned status theater)
- Execution Prep **stages** draft tickets only — never places
- Research / Risk / Audit + Ticket rail
- Kill switch (pauses all loops + disables confirm)
- Pro ticket builder (equity first; option/crypto stubs) → mock preview → hard confirm gate → mock place
- Risk soft-checks (concentration, buying power, size caps) before confirm
- Immutable append-only audit (preview / risk-check / confirm / place-mock / kill)

See [docs/live-vs-mock.md](docs/live-vs-mock.md).

## Hosted URL

Production: https://project-nemesis.apps.grok.bot

If the app was published **private/team**, unauthenticated browsers get a Grok/Cursor sign-in gate (looks almost empty until you authorize). Sign in with the owning Grok Bot account, or republish as **public** for open load.

Fonts are self-hosted (no Google Fonts CDN) so first paint is not blocked on external CSS.

## Refresh market bake (agents)

```bash
# After pulling RH MCP during an agent run, write JSON (+ optional TS sync):
node scripts/refresh-market.mjs --from-stdin --write-ts < /path/to/snapshot.json
# Or validate the committed bake:
node scripts/refresh-market.mjs
```

## Safety

Orders are **never** placed by agents or this UI. Preview / confirm / place are mock-only (`ALLOW_LIVE_PLACE=false`). Place runs only through the ConfirmGate path. Hosted app cannot call Robinhood MCP at runtime; agents refresh `public/data/market.json` and swarm context (`src/data/agent-context.ts`) when MCP is reachable, then push/republish.

## Repo note

GitHub remote is currently `project-nemesis-private-empty-no-README-`. Optional rename to `project-nemesis` later — do not rename without asking Randy.
