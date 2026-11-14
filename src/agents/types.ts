import type {
  ActivityTick,
  AgentLoopStatus,
  LiveAgentState,
  TicketDraft,
} from '../types'
import type { QuoteRow } from '../types'
import type { MarketPosition } from '../data/market-types'
import type { OptionBuyIdea } from './optionsScanner'

export type AgentId =
  | 'chief'
  | 'scan'
  | 'risk'
  | 'earn'
  | 'flow'
  | 'cryp'
  | 'news'
  | 'book'
  | 'exec'
  | 'alrt'

export type BriefSeverity = 'info' | 'watch' | 'escalate'

export type AgentBrief = {
  agentId: AgentId
  headline: string
  detail: string
  severity: BriefSeverity
  symbols: string[]
  at: string
}

export type StagedTicket = TicketDraft & {
  reason: string
  stagedBy: 'exec' | 'flow' | 'scan' | 'options-scan' | 'alert'
  stagedAt: string
  /** Optional link back to ranked options idea */
  ideaId?: string
  /** Optional RH alert id that staged this ticket */
  alertId?: string
}

/** Fired / configured RH alert surfaced on the desk (stage only — never place). */
export type DeskAlertHit = {
  id: string
  alertId: string
  symbol: string
  assetClass: 'equity' | 'crypto'
  condition: string
  detail: string
  triggeredAt: string
  unread: boolean
  /** Suggested limit for one-tap Stage into ticket rail */
  suggestLimit: number
}

export type SwarmMarketView = {
  board: QuoteRow[]
  crypto: QuoteRow[]
  positions: MarketPosition[]
  bookPnl: number
}

export type LoopResult = {
  agentId: AgentId
  status: AgentLoopStatus
  thought: string
  brief: AgentBrief
  activity: ActivityTick
  stagedTicket?: StagedTicket
  riskFlags?: string[]
  optionIdeas?: OptionBuyIdea[]
  alertHits?: DeskAlertHit[]
}

export type DeskSwarmState = {
  agents: LiveAgentState[]
  briefs: Partial<Record<AgentId, AgentBrief>>
  deskBrief: AgentBrief | null
  activity: ActivityTick[]
  riskFlags: string[]
  stagedTicket: StagedTicket | null
  optionIdeas: OptionBuyIdea[]
  alertHits: DeskAlertHit[]
  newsLine: string
  loopCount: number
}
