import { useEffect, useRef, useState } from 'react'
import { nowTime } from '../data/mock'
import {
  bakedMarketSnapshot,
  fetchMarketSnapshot,
  formatAsOfShort,
} from '../data/load-market'
import type {
  FeedStatus,
  MarketPortfolio,
  MarketPosition,
  MarketQuote,
} from '../data/market-types'
import type { QuoteRow } from '../types'

/** Poll interval for /data/market.json (hosted bake refresh). */
const POLL_MS = 12_000
/** Marks older than this are labeled stale (agent refresh overdue). */
const STALE_MS = 30 * 60 * 1000

function toRow(q: MarketQuote): QuoteRow {
  return {
    symbol: q.symbol,
    name: q.name,
    price: q.price,
    changePct: q.changePct,
    note: q.note,
    source: q.source === 'mock' ? 'mock' : 'rh',
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
  positions: MarketPosition[],
  board: QuoteRow[],
): MarketPosition[] {
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

function deriveFeedStatus(
  asOf: string,
  degraded: boolean,
  pollOk: boolean | null,
  lastPollAt: number | null,
): FeedStatus {
  if (degraded) return 'degraded'
  if (pollOk === false && lastPollAt !== null) return 'degraded'
  const age = Date.now() - new Date(asOf).getTime()
  if (Number.isFinite(age) && age > STALE_MS) return 'stale'
  if (pollOk === true) return 'fresh'
  if (pollOk === null) return 'baked'
  return 'polling'
}

/**
 * Layer 1 data plane: poll RH MCP bake + gentle tick between refreshes.
 * Agent swarm lives in useAgentSwarm — this hook does not own agent theater.
 * Never places orders.
 */
export function useLiveDesk(killed: boolean) {
  const seed = bakedMarketSnapshot()
  const [board, setBoard] = useState<QuoteRow[]>(() => seed.board.map(toRow))
  const [indices, setIndices] = useState<QuoteRow[]>(() =>
    seed.indices.map(toRow),
  )
  const [crypto, setCrypto] = useState<QuoteRow[]>(() =>
    seed.crypto.map(toRow),
  )
  const [positions, setPositions] = useState<MarketPosition[]>(() =>
    seed.positions.map((p) => ({ ...p })),
  )
  const [portfolio, setPortfolio] = useState<MarketPortfolio>({
    ...seed.portfolio,
  })
  const [newsCrawl, setNewsCrawl] = useState<string[]>([...seed.newsCrawl])
  const [asOf, setAsOf] = useState(seed.asOf)
  const [sourceNote, setSourceNote] = useState(seed.sourceNote)
  const [degradedFlag, setDegradedFlag] = useState(seed.degraded)
  const [pollOk, setPollOk] = useState<boolean | null>(null)
  const [lastPollAt, setLastPollAt] = useState<number | null>(null)
  const asOfRef = useRef(seed.asOf)
  const [flashKeys, setFlashKeys] = useState<Record<string, number>>({})
  const [newsIdx, setNewsIdx] = useState(0)
  const [clock, setClock] = useState(nowTime)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()

    async function poll() {
      const snap = await fetchMarketSnapshot(ctrl.signal)
      if (cancelled) return
      setLastPollAt(Date.now())
      if (!snap) {
        setPollOk(false)
        return
      }
      setPollOk(true)
      setDegradedFlag(snap.degraded)
      const prevMs = new Date(asOfRef.current).getTime()
      const nextMs = new Date(snap.asOf).getTime()
      if (!Number.isFinite(nextMs) || nextMs < prevMs) return

      asOfRef.current = snap.asOf
      setAsOf(snap.asOf)
      setSourceNote(snap.sourceNote)
      setBoard(snap.board.map(toRow))
      setIndices(snap.indices.map(toRow))
      setCrypto(snap.crypto.map(toRow))
      setPositions(snap.positions.map((p) => ({ ...p })))
      setPortfolio({ ...snap.portfolio })
      setNewsCrawl([...snap.newsCrawl])
    }

    void poll()
    const id = window.setInterval(() => void poll(), POLL_MS)
    return () => {
      cancelled = true
      ctrl.abort()
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (killed) return

    const id = window.setInterval(() => {
      setTick((t) => t + 1)
      setClock(nowTime())
    }, 1100)

    return () => window.clearInterval(id)
  }, [killed])

  useEffect(() => {
    if (killed || tick === 0) return

    const flashes: Record<string, number> = {}

    setBoard((prev) => {
      const next = prev.map((row, i) => {
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

    if (tick % 3 === 0 && newsCrawl.length) {
      setNewsIdx((i) => (i + 1) % newsCrawl.length)
    }
  }, [tick, killed, newsCrawl.length])

  const feedStatus = deriveFeedStatus(
    asOf,
    degradedFlag,
    pollOk,
    lastPollAt,
  )
  const tape = [...indices, ...board.slice(0, 8), ...crypto]
  const asOfShort = formatAsOfShort(asOf)

  return {
    board,
    indices,
    crypto,
    positions,
    portfolio,
    flashKeys,
    tape,
    /** Fallback crawl when swarm newsLine idle */
    newsLine: newsCrawl[newsIdx] ?? newsCrawl[0] ?? '',
    clock,
    tick,
    asOf,
    asOfShort,
    sourceNote,
    feedStatus,
    lastPollAt,
  }
}
