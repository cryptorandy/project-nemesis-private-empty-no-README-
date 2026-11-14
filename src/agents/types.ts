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
  | 'alert'
  | 'risk'
  | 'earn'
  | 'flow'
  | 'cryp'
  | 'news'
  | 'book'
  | 'exec'
  | 'depth'

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
  /** Fired RH alert log id when staged from Alert Watch */
  alertLogId?: string
}

export type AlertHit = {
  alertLogId: string
  alertId: string
  symbol: string
  conditionType: string
  targetPrice: number
  triggeredPrice: number
  triggeredAt: string
  read: boolean
  mark: number
}

export type ResearchDepthPayload = {
  symbol: string
  asOf: string
  name: string
  sector: string
  industry: string
  pe: number | null
  pb: number | null
  marketCap: number | null
  high52: number | null
  low52: number | null
  rsi14: number | null
  macd: number | null
  macdSignal: number | null
  macdHist: number | null
  earningsDate: string | null
  earningsEstimate: number | null
  filings: { form: string; date: string; description: string }[]
  note: string
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
  alertHits?: AlertHit[]
  scanHits?: string[]
  researchDepth?: ResearchDepthPayload
}

export type DeskSwarmState = {
  agents: LiveAgentState[]
  briefs: Partial<Record<AgentId, AgentBrief>>
  deskBrief: AgentBrief | null
  activity: ActivityTick[]
  riskFlags: string[]
  stagedTicket: StagedTicket | null
  optionIdeas: OptionBuyIdea[]
  alertHits: AlertHit[]
  scanHits: string[]
  researchDepth: ResearchDepthPayload | null
  newsLine: string
  loopCount: number
}
