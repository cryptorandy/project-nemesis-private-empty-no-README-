import type { Agent, AuditEntry, TicketDraft, WatchRow } from '../types'

export const AGENTS: Agent[] = [
  { id: 'chief', short: 'CHIEF', name: 'Desk Chief', status: 'orbiting' },
  { id: 'scan', short: 'SCAN', name: 'Scanner Watch', status: 'active' },
  { id: 'risk', short: 'RISK', name: 'Risk Guard', status: 'orbiting' },
  { id: 'earn', short: 'EARN', name: 'Earnings Brief', status: 'orbiting' },
  { id: 'flow', short: 'FLOW', name: 'Options Flow', status: 'orbiting' },
  { id: 'cryp', short: 'CRYP', name: 'Crypto Pulse', status: 'orbiting' },
  { id: 'news', short: 'NEWS', name: 'News / Filings', status: 'orbiting' },
  { id: 'book', short: 'BOOK', name: 'Portfolio Ops', status: 'active' },
  { id: 'exec', short: 'EXEC', name: 'Execution Prep', status: 'orbiting' },
]

export const WATCH: WatchRow[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA',
    note: 'Scanner · volume surge',
    price: 131.42,
    changePct: 1.84,
  },
  {
    symbol: 'AAPL',
    name: 'Apple',
    note: 'Holding · quiet',
    price: 228.1,
    changePct: -0.42,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla',
    note: 'Options Flow · call heat',
    price: 248.55,
    changePct: 2.11,
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    note: 'Crypto Pulse',
    price: 97420,
    changePct: 1.22,
  },
  {
    symbol: 'SPY',
    name: 'S&P 500 ETF',
    note: 'Desk risk anchor',
    price: 582.3,
    changePct: 0.31,
  },
]

export const RESEARCH_BRIEF = {
  focus: 'NVDA',
  headline: 'Volume surge on scanner · soft risk pass',
  bullets: [
    'Last ~$131.42 · sample quote (not live Robinhood)',
    'Earnings Brief: next print placeholder — wire MCP later',
    'Options Flow: call heat flagged on nearby strikes (stub)',
    'Risk Guard: notional under $5k soft limit for draft size',
  ],
}

export const SIZE_LIMITS = [
  { label: 'Max notional / ticket', value: '$5,000' },
  { label: 'Max % book / name', value: '8%' },
  { label: 'Max option contracts', value: '5' },
  { label: 'Crypto notional cap', value: '$2,000' },
]

export const INITIAL_TICKET: TicketDraft = {
  asset: 'Equity',
  side: 'Buy',
  symbol: 'NVDA',
  qty: 10,
  order: 'Limit',
  limit: 130.5,
}

export const INITIAL_AUDIT: AuditEntry[] = [
  {
    id: 'a3',
    time: '09:41:02',
    entity: 'Desk Chief',
    action: 'brief',
    details: 'Morning desk brief published (sample)',
  },
  {
    id: 'a2',
    time: '09:40:18',
    entity: 'Scanner Watch',
    action: 'scan',
    details: 'Hit NVDA volume surge → Watch annotation',
  },
  {
    id: 'a1',
    time: '09:39:55',
    entity: 'Risk Guard',
    action: 'risk',
    details: 'Soft limits loaded (placeholders)',
  },
]

export function formatMoney(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  })
}

export function formatPct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export function nowTime(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false })
}
