export type Surface = 'board' | 'research' | 'risk' | 'audit'

/** Live loop statuses shown on the agent rail (real swarm loops). */
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

export type TicketTif = 'Day' | 'GTC'

export type TicketDraft = {
  asset: TicketAsset
  side: TicketSide
  symbol: string
  qty: number
  order: TicketOrder
  limit: number
  /** Time-in-force stub — Day default for equity. */
  tif: TicketTif
  /** Option stub fields (ignored for equity). */
  optionRight?: 'Call' | 'Put'
  optionStrike?: number
  optionExpiry?: string
}

export type TicketPhase = 'draft' | 'previewed' | 'confirmed'

/** Preview payload staged before confirm — never a place receipt. */
export type TicketPreview = {
  id: string
  at: string
  notional: number
  mark: number
  summary: string
  mode: 'mock'
}

export type AuditAction =
  | 'brief'
  | 'preview'
  | 'risk-check'
  | 'confirm-mock'
  | 'place-mock'
  | 'kill'
  | 'resume'
  | 'scan'
  | 'risk'

export type AuditEntry = {
  id: string
  /** Monotonic sequence for immutable rail. */
  seq?: number
  time: string
  entity: string
  action: AuditAction
  details: string
  immutable?: true
}

/** @deprecated alias for QuoteRow */
export type WatchRow = QuoteRow
