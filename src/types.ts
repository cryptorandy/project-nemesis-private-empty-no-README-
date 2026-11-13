export type Surface = 'watch' | 'research' | 'risk' | 'audit'

export type AgentStatus = 'orbiting' | 'active' | 'paused'

export type Agent = {
  id: string
  short: string
  name: string
  status: AgentStatus
}

export type WatchRow = {
  symbol: string
  name: string
  note: string
  price: number
  changePct: number
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
