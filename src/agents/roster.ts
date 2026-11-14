import type { AgentId } from './types'
import type { AgentLoopStatus } from '../types'

export type AgentMeta = {
  id: AgentId
  short: string
  name: string
  /** Loop period in ms while desk is live */
  intervalMs: number
  /** Stagger offset so loops don't fire in lockstep */
  offsetMs: number
  workStatus: AgentLoopStatus
}

export const AGENT_ROSTER: AgentMeta[] = [
  {
    id: 'chief',
    short: 'CHIEF',
    name: 'Desk Chief',
    intervalMs: 7000,
    offsetMs: 400,
    workStatus: 'briefing',
  },
  {
    id: 'scan',
    short: 'SCAN',
    name: 'Scanner Watch',
    intervalMs: 8500,
    offsetMs: 900,
    workStatus: 'scanning',
  },
  {
    id: 'alert',
    short: 'ALERT',
    name: 'Alert Watch',
    intervalMs: 10500,
    offsetMs: 1200,
    workStatus: 'scanning',
  },
  {
    id: 'risk',
    short: 'RISK',
    name: 'Risk Guard',
    intervalMs: 11000,
    offsetMs: 1500,
    workStatus: 'scanning',
  },
  {
    id: 'earn',
    short: 'EARN',
    name: 'Earnings Brief',
    intervalMs: 14000,
    offsetMs: 2200,
    workStatus: 'briefing',
  },
  {
    id: 'flow',
    short: 'FLOW',
    name: 'Options Flow',
    intervalMs: 12000,
    offsetMs: 2800,
    workStatus: 'scanning',
  },
  {
    id: 'cryp',
    short: 'CRYP',
    name: 'Crypto Pulse',
    intervalMs: 9500,
    offsetMs: 3300,
    workStatus: 'scanning',
  },
  {
    id: 'news',
    short: 'NEWS',
    name: 'News / Filings',
    intervalMs: 13000,
    offsetMs: 3800,
    workStatus: 'scanning',
  },
  {
    id: 'book',
    short: 'BOOK',
    name: 'Portfolio Ops',
    intervalMs: 10000,
    offsetMs: 4500,
    workStatus: 'briefing',
  },
  {
    id: 'exec',
    short: 'EXEC',
    name: 'Execution Prep',
    intervalMs: 9000,
    offsetMs: 5200,
    workStatus: 'briefing',
  },
  {
    id: 'depth',
    short: 'DEPTH',
    name: 'Research Depth',
    intervalMs: 15000,
    offsetMs: 5800,
    workStatus: 'briefing',
  },
]

export function metaById(id: AgentId): AgentMeta {
  const m = AGENT_ROSTER.find((a) => a.id === id)
  if (!m) throw new Error(`Unknown agent ${id}`)
  return m
}
