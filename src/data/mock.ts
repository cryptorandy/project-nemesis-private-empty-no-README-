import type {
  ActivityTick,
  Agent,
  AuditEntry,
  TicketDraft,
} from '../types'
import { RH_BOARD, RH_CRYPTO, RH_INDICES } from './rh-snapshot'

export const AGENTS: Agent[] = [
  { id: 'chief', short: 'CHIEF', name: 'Desk Chief', status: 'briefing' },
  { id: 'scan', short: 'SCAN', name: 'Scanner Watch', status: 'scanning' },
  { id: 'risk', short: 'RISK', name: 'Risk Guard', status: 'idle' },
  { id: 'earn', short: 'EARN', name: 'Earnings Brief', status: 'briefing' },
  { id: 'flow', short: 'FLOW', name: 'Options Flow', status: 'scanning' },
  { id: 'cryp', short: 'CRYP', name: 'Crypto Pulse', status: 'idle' },
  { id: 'news', short: 'NEWS', name: 'News / Filings', status: 'scanning' },
  { id: 'book', short: 'BOOK', name: 'Portfolio Ops', status: 'briefing' },
  { id: 'exec', short: 'EXEC', name: 'Execution Prep', status: 'idle' },
]

export const WATCH = [...RH_BOARD, ...RH_CRYPTO]
export const INDICES = RH_INDICES

export const SIZE_LIMITS = [
  { label: 'Max % BP / trade', value: '10%' },
  { label: 'Max day loss / account', value: '5%' },
  { label: 'Universe', value: 'Watchlist + holdings' },
  { label: 'Max option contracts', value: '5' },
  { label: 'Crypto notional cap', value: '$2,000' },
]

export const INITIAL_TICKET: TicketDraft = {
  asset: 'Equity',
  side: 'Buy',
  symbol: 'NVDA',
  qty: 1,
  order: 'Limit',
  limit: 166.5,
  tif: 'Day',
}

export const INITIAL_AUDIT: AuditEntry[] = [
  {
    id: 'a4',
    seq: 4,
    time: '02:40:33',
    entity: 'Portfolio Ops',
    action: 'brief',
    details: 'RH market.json + agent context · MCP ••••0788',
    immutable: true,
  },
  {
    id: 'a3',
    seq: 3,
    time: '02:40:20',
    entity: 'Scanner Watch',
    action: 'scan',
    details: 'Daily gainers scan captured · MOD / CBRS / MU',
    immutable: true,
  },
  {
    id: 'a2',
    seq: 2,
    time: '02:40:10',
    entity: 'Earnings Brief',
    action: 'brief',
    details: 'NVDA prints 2026-11-17 pm · est 2.48',
    immutable: true,
  },
  {
    id: 'a1',
    seq: 1,
    time: '02:39:55',
    entity: 'Risk Guard',
    action: 'risk',
    details: 'Soft limits armed · confirm-before-trade · no auto-place',
    immutable: true,
  },
]

export const EQUITY_SIZE_PRESETS = [1, 2, 5, 10] as const

export const INITIAL_ACTIVITY: ActivityTick[] = [
  {
    id: 'act-0',
    time: '02:40:33',
    agent: 'BOOK',
    text: 'RH portfolio bake · waiting first swarm loop',
  },
  {
    id: 'act-1',
    time: '02:40:20',
    agent: 'SCAN',
    text: 'Daily gainers context armed · MOD +26% / CBRS +19%',
  },
  {
    id: 'act-2',
    time: '02:40:10',
    agent: 'EARN',
    text: 'NVDA earnings 11/17 pm · est EPS 2.48',
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
