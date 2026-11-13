# Project Nemesis

Mixed equities / options / crypto **research + execution desk**. Specialist agents orbit the book; Randy confirms every ticket.

This repo is the MVP shell: brand-first landing, Watch / Research / Risk / Audit surfaces, 9-agent status rail, kill switch, confirm-before-trade gate, and **mock tickets only** (no Robinhood place-order calls).

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

## What’s in MVP

- Design tokens: graphite / cyan / amber · Space Grotesk + IBM Plex Mono
- Brand-first hero — **Project Nemesis**
- Desk shell: Watch · Research · Risk · Audit + Ticket rail
- 9-agent rail (orbiting / active / paused)
- Kill switch (pauses agents + disables confirm)
- Ticket draft → mock preview → human confirm gate → mock confirm
- Append-only audit log stub

## Safety

Orders are **never** placed by this UI. Preview and confirm are mock-only. Wire Robinhood MCP reads later; place remains human-gated.

## Repo note

GitHub remote is currently `project-nemesis-private-empty-no-README-`. Optional rename to `project-nemesis` later — do not rename without asking Randy.
