export type Surface = 'board' | 'research' | 'risk' | 'audit'

/** Live loop statuses shown on the agent rail (mock cycles). */
export type AgentLoopStatus =
  | 'scanning'
  | 'briefing'
  | 'idle'
  | 'escalate'
  | 'paused'

export type Agent = {
  id: string
  short: string
  name: string
  status: AgentLoopStatus
}

export type LiveAgentState = {
  id: string
  short: string
  name: string
  status: AgentLoopStatus
  thought: string
  orbitIndex: number
}

export type ActivityTick = {
  id: string
  time: string
  agent: string
  text: string
}

export type QuoteRow = {
  symbol: string
  name: string
  price: number
  changePct: number
  note?: string
  source?: 'rh' | 'mock'
}

export type TicketAsset = 'Equity' | 'Option' | 'Crypto'
export type TicketSide = 'Buy' | 'Sell'
export type TicketOrder = 'Limit' | 'Market'

export type TicketDraft = {
  asset: TicketAsset
  side: TicketSide
  symbol: string
  qty: number
  order: TicketOrder
  limit: number
}

export type TicketPhase = 'draft' | 'previewed' | 'confirmed'

export type AuditAction =
  | 'brief'
  | 'preview'
  | 'confirm-mock'
  | 'kill'
  | 'resume'
  | 'scan'
  | 'risk'

export type AuditEntry = {
  id: string
  time: string
  entity: string
  action: AuditAction
  details: string
}

/** @deprecated alias for QuoteRow */
export type WatchRow = QuoteRow
