import { useEffect, useState } from 'react'
import {
  AGENTS,
  AGENT_THOUGHTS,
  INITIAL_ACTIVITY,
  STATUS_CYCLE,
  nowTime,
} from '../data/mock'
import {
  NEWS_CRAWL,
  RH_BOARD,
  RH_CRYPTO,
  RH_INDICES,
  RH_POSITIONS,
  type RhPosition,
  type RhQuote,
} from '../data/rh-snapshot'
import type {
  ActivityTick,
  AgentLoopStatus,
  LiveAgentState,
  QuoteRow,
} from '../types'

function pickThought(agentId: string, tick: number): string {
  const lines = AGENT_THOUGHTS[agentId] ?? ['Loop idle']
  return lines[tick % lines.length]
}

function seedAgents(): LiveAgentState[] {
  return AGENTS.map((a, i) => ({
    id: a.id,
    short: a.short,
    name: a.name,
    status: a.status,
    thought: pickThought(a.id, i),
    orbitIndex: i,
  }))
}

function toRow(q: RhQuote): QuoteRow {
  return {
    symbol: q.symbol,
    name: q.name,
    price: q.price,
    changePct: q.changePct,
    note: q.note,
    source: 'rh',
  }
}

function jitterQuote(row: QuoteRow, salt: number): QuoteRow {
  const amp =
    row.symbol === 'BTC' || row.symbol === 'ETH'
      ? row.price * 0.00035
      : row.price * 0.00055
  const delta = Math.sin(salt * 1.73 + row.price * 0.01) * amp
  const next = Math.max(0.01, row.price + delta)
  const chg =
    row.changePct + Math.sin(salt * 0.91 + row.changePct) * 0.035
  return { ...row, price: next, changePct: chg }
}

function jitterPositions(
  positions: RhPosition[],
  board: QuoteRow[],
): RhPosition[] {
  const bySym = Object.fromEntries(board.map((b) => [b.symbol, b.price]))
  return positions.map((p) => {
    const mark = bySym[p.symbol] ?? p.mark
    const value = mark * p.qty
    const cost = p.avgCost * p.qty
    const pnl = value - cost
    const pnlPct = cost === 0 ? 0 : (pnl / cost) * 100
    return { ...p, mark, value, pnl, pnlPct }
  })
}

/**
 * Continuous mock loops over RH MCP snapshot marks.
 * Hosted app cannot call Robinhood MCP — agents refresh rh-snapshot.ts.
 * Never places orders.
 */
export function useLiveDesk(killed: boolean) {
  const [agents, setAgents] = useState<LiveAgentState[]>(seedAgents)
  const [board, setBoard] = useState<QuoteRow[]>(() => RH_BOARD.map(toRow))
  const [indices, setIndices] = useState<QuoteRow[]>(() =>
    RH_INDICES.map(toRow),
  )
  const [crypto, setCrypto] = useState<QuoteRow[]>(() => RH_CRYPTO.map(toRow))
  const [positions, setPositions] = useState<RhPosition[]>(RH_POSITIONS)
  const [flashKeys, setFlashKeys] = useState<Record<string, number>>({})
  const [activity, setActivity] = useState<ActivityTick[]>(INITIAL_ACTIVITY)
  const [newsIdx, setNewsIdx] = useState(0)
  const [clock, setClock] = useState(nowTime)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (killed) {
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          status: 'paused' as AgentLoopStatus,
          thought: 'Paused · kill switch',
        })),
      )
      return
    }

    // High-frequency tape (~1.1s) for TV energy
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
      setClock(nowTime())
    }, 1100)

    return () => window.clearInterval(id)
  }, [killed])

  useEffect(() => {
    if (killed || tick === 0) return

    setAgents((prev) =>
      prev.map((a, i) => {
        if ((tick + i) % 2 !== 0 && (tick + i) % 3 !== 0) return a
        const status =
          STATUS_CYCLE[(tick + i) % STATUS_CYCLE.length] ?? 'idle'
        return {
          ...a,
          status,
          thought: pickThought(a.id, tick + i),
        }
      }),
    )

    const flashes: Record<string, number> = {}

    setBoard((prev) => {
      const next = prev.map((row, i) => {
        if ((tick + i) % 1 !== 0) return row
        const j = jitterQuote(row, tick + i)
        if (Math.abs(j.price - row.price) > 0.0001) {
          flashes[row.symbol] = Date.now()
        }
        return j
      })
      setPositions((pos) => jitterPositions(pos, next))
      return next
    })

    setIndices((prev) =>
      prev.map((row, i) => {
        const j = jitterQuote(row, tick * 1.3 + i)
        flashes[row.symbol] = Date.now()
        return j
      }),
    )

    setCrypto((prev) =>
      prev.map((row, i) => {
        const j = jitterQuote(row, tick * 1.7 + i + 9)
        flashes[row.symbol] = Date.now()
        return j
      }),
    )

    if (Object.keys(flashes).length) {
      setFlashKeys((f) => ({ ...f, ...flashes }))
    }

    if (tick % 2 === 0) {
      const speaker = AGENTS[tick % AGENTS.length]
      setActivity((prev) => [
        {
          id: `act-${tick}-${speaker.id}`,
          time: nowTime(),
          agent: speaker.short,
          text: pickThought(speaker.id, tick),
        },
        ...prev.slice(0, 18),
      ])
    }

    if (tick % 3 === 0) {
      setNewsIdx((i) => (i + 1) % NEWS_CRAWL.length)
    }
  }, [tick, killed])

  const tape = [...indices, ...board.slice(0, 8), ...crypto]

  return {
    agents,
    board,
    indices,
    crypto,
    positions,
    flashKeys,
    activity,
    tape,
    newsLine: NEWS_CRAWL[newsIdx] ?? NEWS_CRAWL[0],
    clock,
    tick,
  }
}
