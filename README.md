# Project Nemesis

Mixed equities / options / crypto **research + execution desk**. Specialist agents run real timed loops; Randy confirms every ticket.

TV-style trading board over a **live RH book feed** (`/api/book` agent ingest + ~30s poll) with static bake fallback, plus a **real agent swarm** that writes briefs into desk state. **Fast path:** editable standing % of capital + hot-seat one-tap confirm → RH-shaped live-intent (never unsupervised).

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
- Dense Board: indices · tape · P&L · quotes · positions · crypto · **ranked options buys (Greeks)** · agent swarm · activity · Chief brief bar
- **Layer 1 live book:** agents push RH MCP positions/portfolio to `POST /api/book`; desk polls every ~30s (fallback `public/data/book.json` + market bake)
- Clear **as of** timestamps + stale after ~3m + graceful degrade when poll fails
- **Layer 2 real agent loops** (Desk Chief → Execution Prep) writing briefs from RH MCP context + heuristics
- **Options scanner:** RH chains/quotes bake with **Δ/Γ/Θ/ν + IV** hard-required; ranked buys; one-tap Stage
- Activity wall shows real loop outputs (not canned status theater)
- Execution Prep **stages** draft tickets only — never places
- Research / Risk / Audit + Ticket rail
- Kill switch (pauses all loops + disables confirm)
- Fast ticket rail (equity + scanner-staged options) → preview → confirm → RH live-intent
- Standing rules panel: **10% BP / trade**, **5% day loss**, **watchlist-only** (editable; $ caps from live BP/equity)
- Session **hot seat** — one-tap confirm per order (kill switch still locks)
- Immutable append-only audit (preview / risk-check / confirm-live / place-live-intent / kill)

See [docs/live-vs-mock.md](docs/live-vs-mock.md).

## Hosted URL

Production: https://project-nemesis.apps.grok.bot

If the app was published **private/team**, unauthenticated browsers get a Grok/Cursor sign-in gate (looks almost empty until you authorize). Sign in with the owning Grok Bot account, or republish as **public** for open load.

Fonts are self-hosted (no Google Fonts CDN) so first paint is not blocked on external CSS.

## Live book refresh (agents — preferred)

```bash
# 1) Pull RH MCP → /tmp/rh-input.json, then always-on pusher:
BOOK_INGEST_SECRET=… CURSOR_APP_TOKEN=… \
  npm run book-pusher -- --mode live --input /tmp/rh-input.json
# One-shot built book:
BOOK_INGEST_SECRET=… CURSOR_APP_TOKEN=… npm run push-live-book < /tmp/book.json
```

Desk polls `/api/book` ~every 30s. Signed-in **Refresh** on the P&L strip re-stamps asOf when ingest secrets are not set yet. Static bake remains a cold-start fallback:

```bash
node scripts/refresh-market.mjs --from-stdin --write-ts < /path/to/snapshot.json
node scripts/refresh-market.mjs
```

## Safety

Orders are **never** placed without explicit ConfirmGate confirm (hot seat = one tap, still per-order). Standing % rules hard-block outside caps. Options ideas stage only — Randy confirms. Hosted app cannot call Robinhood MCP at runtime — confirm queues RH-shaped live-intent for agent `review_*` / `place_*` on MCP ••••0788 (account number resolved by agents, masked in UI). Agents never auto-place. Keep the published app **private**.

## Repo note

GitHub remote is currently `project-nemesis-private-empty-no-README-`. Optional rename to `project-nemesis` later — do not rename without asking Randy.
