import { useEffect, useRef, useState } from 'react'
import { AGENT_CONTEXT_AS_OF } from '../data/agent-context'
import { INITIAL_ACTIVITY, nowTime } from '../data/mock'
import type { MarketPosition } from '../data/market-types'
import type {
  ActivityTick,
  AgentLoopStatus,
  LiveAgentState,
  QuoteRow,
} from '../types'
import { runAgent } from './heuristics'
import { AGENT_ROSTER } from './roster'
import type { OptionBuyIdea } from './optionsScanner'
import type {
  AgentBrief,
  AgentId,
  DeskSwarmState,
  StagedTicket,
  SwarmMarketView,
} from './types'

function seedAgents(): LiveAgentState[] {
  return AGENT_ROSTER.map((a, i) => ({
    id: a.id,
    short: a.short,
    name: a.name,
    status: 'idle' as AgentLoopStatus,
    thought: `Armed · waiting first loop · ctx ${AGENT_CONTEXT_AS_OF.slice(11, 16)}Z`,
    orbitIndex: i,
  }))
}

const INITIAL: DeskSwarmState = {
  agents: seedAgents(),
  briefs: {},
  deskBrief: null,
  activity: INITIAL_ACTIVITY,
  riskFlags: [],
  stagedTicket: null,
  optionIdeas: [],
  newsLine: `Swarm armed · RH agent context ${AGENT_CONTEXT_AS_OF} · no place path`,
  loopCount: 0,
}

export type UseAgentSwarmArgs = {
  killed: boolean
  board: QuoteRow[]
  crypto: QuoteRow[]
  positions: MarketPosition[]
  /** Called when Execution Prep stages a draft (never places). */
  onStageTicket?: (ticket: StagedTicket) => void
  /** Called when Options Flow publishes ranked buy ideas (Greeks required). */
  onOptionIdeas?: (ideas: OptionBuyIdea[]) => void
  /** Audit crumbs for loop / stage events */
  onAudit?: (
    entity: string,
    action: 'brief' | 'scan' | 'risk',
    details: string,
  ) => void
}

/**
 * Real timed agent loops writing briefs into desk state.
 * Kill switch pauses all timers. Agents never place orders.
 */
export function useAgentSwarm({
  killed,
  board,
  crypto,
  positions,
  onStageTicket,
  onOptionIdeas,
  onAudit,
}: UseAgentSwarmArgs) {
  const [state, setState] = useState<DeskSwarmState>(INITIAL)
  const marketRef = useRef<SwarmMarketView>({
    board,
    crypto,
    positions,
    bookPnl: 0,
  })
  const briefsRef = useRef<Partial<Record<AgentId, AgentBrief>>>({})
  const flagsRef = useRef<string[]>([])
  const loopRef = useRef<Partial<Record<AgentId, number>>>({})
  const stageCb = useRef(onStageTicket)
  const ideasCb = useRef(onOptionIdeas)
  const auditCb = useRef(onAudit)

  useEffect(() => {
    stageCb.current = onStageTicket
    ideasCb.current = onOptionIdeas
    auditCb.current = onAudit
  }, [onStageTicket, onOptionIdeas, onAudit])

  useEffect(() => {
    const bookPnl = positions.reduce((s, p) => s + p.pnl, 0)
    marketRef.current = { board, crypto, positions, bookPnl }
  }, [board, crypto, positions])

  useEffect(() => {
    if (killed) {
      setState((prev) => ({
        ...prev,
        agents: prev.agents.map((a) => ({
          ...a,
          status: 'paused' as AgentLoopStatus,
          thought: 'Paused · kill switch',
        })),
        newsLine: 'Kill switch · all agent loops paused · confirm disabled',
      }))
      return
    }

    const timers: number[] = []

    for (const meta of AGENT_ROSTER) {
      const fire = () => {
        const id = meta.id
        const n = (loopRef.current[id] ?? 0) + 1
        loopRef.current[id] = n

        // Working pulse
        setState((prev) => ({
          ...prev,
          agents: prev.agents.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: meta.workStatus,
                  thought: `${meta.name} loop #${n}…`,
                }
              : a,
          ),
        }))

        const result = runAgent(
          id,
          marketRef.current,
          briefsRef.current,
          flagsRef.current,
          n,
        )

        briefsRef.current = {
          ...briefsRef.current,
          [id]: result.brief,
        }
        if (result.riskFlags) flagsRef.current = result.riskFlags

        if (result.stagedTicket) {
          stageCb.current?.(result.stagedTicket)
        }
        if (result.optionIdeas) {
          ideasCb.current?.(result.optionIdeas)
        }

        const auditAction =
          id === 'risk' ? 'risk' : id === 'scan' || id === 'flow' || id === 'cryp' ? 'scan' : 'brief'
        auditCb.current?.(
          meta.name,
          auditAction,
          result.brief.detail.slice(0, 160),
        )

        setState((prev) => {
          const briefs = { ...prev.briefs, [id]: result.brief }
          const activity: ActivityTick[] = [
            result.activity,
            ...prev.activity,
          ].slice(0, 24)
          const agents = prev.agents.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: result.status,
                  thought: result.thought,
                }
              : a,
          )
          return {
            ...prev,
            agents,
            briefs,
            deskBrief: id === 'chief' ? result.brief : prev.deskBrief ?? briefs.chief ?? null,
            activity,
            riskFlags: result.riskFlags ?? prev.riskFlags,
            stagedTicket: result.stagedTicket ?? prev.stagedTicket,
            optionIdeas: result.optionIdeas ?? prev.optionIdeas,
            newsLine: `${meta.short} · ${result.thought}`,
            loopCount: prev.loopCount + 1,
          }
        })
      }

      // Initial pass shortly after mount (staggered)
      const boot = window.setTimeout(fire, meta.offsetMs)
      timers.push(boot)
      const interval = window.setInterval(fire, meta.intervalMs)
      timers.push(interval)
    }

    return () => {
      timers.forEach((t) => {
        window.clearTimeout(t)
        window.clearInterval(t)
      })
    }
  }, [killed])

  return {
    agents: state.agents,
    briefs: state.briefs,
    deskBrief: state.deskBrief,
    activity: state.activity,
    riskFlags: state.riskFlags,
    stagedTicket: state.stagedTicket,
    optionIdeas: state.optionIdeas,
    newsLine: state.newsLine,
    loopCount: state.loopCount,
    clock: nowTime(),
  }
}
