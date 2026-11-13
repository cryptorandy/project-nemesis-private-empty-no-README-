import type {
  ActivityTick,
  Agent,
  AgentLoopStatus,
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

export const AGENT_THOUGHTS: Record<string, string[]> = {
  chief: [
    'Re-ranking open threads',
    'Merging scanner + risk briefs',
    'Desk pulse · no blockers',
    'Prioritizing NVDA / SOXL / TSLA',
  ],
  scan: [
    'Sweeping volume surge list',
    'Hit · SOXL AH relative volume',
    'Watchlist Superstar delta check',
    'Scanner quiet · holding marks',
  ],
  risk: [
    'Book concentration pass',
    'Soft limit: notional under cap',
    'Options notional $105 stub',
    'Cash / BP snapshot ok',
  ],
  earn: [
    'Calendar near holdings',
    'Tomorrow print list stub',
    'NVDA earnings packet idle',
    'Peer estimate delta stub',
  ],
  flow: [
    'Chain heat on watch names',
    'TSLA 410c heat flagged',
    'IV context stub refresh',
    'Defined-risk ideas queued',
  ],
  cryp: [
    'BTC −3.8% vs prior open',
    'ETH mark refresh',
    'Crypto notional under cap',
    'Pulse · risk budget check',
  ],
  news: [
    'Headline index for watch',
    'SEC filing index hit stub',
    '8-K delta queue empty',
    'Filings quiet · holding',
  ],
  book: [
    'Positions / P&L snapshot',
    'SOXL unrealized lead',
    'Drift vs targets · flat',
    'Book ops tick complete',
  ],
  exec: [
    'Draft ticket rail sync',
    'Preview quote stub ready',
    'No place path armed',
    'Confirm gate standing by',
  ],
}

export const STATUS_CYCLE: AgentLoopStatus[] = [
  'scanning',
  'briefing',
  'idle',
  'scanning',
  'briefing',
  'escalate',
  'idle',
  'scanning',
]

export const WATCH = [...RH_BOARD, ...RH_CRYPTO]
export const INDICES = RH_INDICES

export const RESEARCH_BRIEF = {
  focus: 'NVDA',
  headline: 'AH bid firm · holding micro-lot · soft risk pass',
  bullets: [
    'RH last ~$166.54 AH · prev close $166.19',
    'Earnings Brief: next print placeholder — wire MCP later',
    'Options Flow stub: 170c elevated IV',
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
  qty: 1,
  order: 'Limit',
  limit: 166.5,
}

export const INITIAL_AUDIT: AuditEntry[] = [
  {
    id: 'a4',
    time: '02:39:56',
    entity: 'Portfolio Ops',
    action: 'brief',
    details: 'RH market.json baked · MCP ••••0788 · as of 02:39:56Z',
  },
  {
    id: 'a3',
    time: '02:39:40',
    entity: 'Scanner Watch',
    action: 'scan',
    details: 'SOXL +3.2% AH annotated on board',
  },
  {
    id: 'a2',
    time: '02:39:20',
    entity: 'Crypto Pulse',
    action: 'scan',
    details: 'BTC/ETH marks refreshed from RH',
  },
  {
    id: 'a1',
    time: '02:38:50',
    entity: 'Risk Guard',
    action: 'risk',
    details: 'Soft limits armed · confirm-before-trade',
  },
]

export const INITIAL_ACTIVITY: ActivityTick[] = [
  {
    id: 'act-0',
    time: '02:39:56',
    agent: 'BOOK',
    text: 'RH portfolio $352.77 · equity $144.03',
  },
  {
    id: 'act-1',
    time: '02:39:40',
    agent: 'SCAN',
    text: 'SOXL AH surge · board heat',
  },
  {
    id: 'act-2',
    time: '02:39:20',
    agent: 'CRYP',
    text: 'BTC mark $70,279 · −4.6%',
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
