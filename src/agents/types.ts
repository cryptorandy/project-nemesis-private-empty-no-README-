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
  stagedBy: 'exec' | 'flow'
  stagedAt: string
  /** Optional link back to ranked options idea */
  ideaId?: string
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
}

export type DeskSwarmState = {
  agents: LiveAgentState[]
  briefs: Partial<Record<AgentId, AgentBrief>>
  deskBrief: AgentBrief | null
  activity: ActivityTick[]
  riskFlags: string[]
  stagedTicket: StagedTicket | null
  optionIdeas: OptionBuyIdea[]
  newsLine: string
  loopCount: number
}
