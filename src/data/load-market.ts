import type { MarketSnapshot } from './market-types'
import {
  NEWS_CRAWL,
  RH_AS_OF,
  RH_BOARD,
  RH_CRYPTO,
  RH_INDICES,
  RH_PORTFOLIO,
  RH_POSITIONS,
  RH_SOURCE_NOTE,
  RH_WATCHLIST,
} from './rh-snapshot'

export const MARKET_JSON_URL = '/data/market.json'

/** Baked fallback when poll fails or is still loading. */
export function bakedMarketSnapshot(): MarketSnapshot {
  return {
    schemaVersion: 1,
    asOf: RH_AS_OF,
    refreshedBy: 'baked-ts',
    accountMasked: RH_PORTFOLIO.accountMasked,
    sourceNote: RH_SOURCE_NOTE,
    degraded: false,
    portfolio: { ...RH_PORTFOLIO },
    indices: RH_INDICES.map((q) => ({ ...q })),
    board: RH_BOARD.map((q) => ({ ...q })),
    crypto: RH_CRYPTO.map((q) => ({ ...q })),
    positions: RH_POSITIONS.map((p) => ({ ...p })),
    watchlist: { ...RH_WATCHLIST, symbols: [...RH_WATCHLIST.symbols] },
    newsCrawl: [...NEWS_CRAWL],
  }
}

function isQuoteArray(v: unknown): boolean {
  return Array.isArray(v) && v.every((q) => q && typeof q === 'object' && 'symbol' in q)
}

/** Loose runtime check so a bad deploy degrades instead of crashing. */
export function parseMarketSnapshot(raw: unknown): MarketSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.asOf !== 'string' || !o.portfolio || typeof o.portfolio !== 'object') {
    return null
  }
  if (!isQuoteArray(o.indices) || !isQuoteArray(o.board) || !isQuoteArray(o.crypto)) {
    return null
  }
  if (!Array.isArray(o.positions) || !Array.isArray(o.newsCrawl)) return null

  const portfolio = o.portfolio as Record<string, unknown>
  const watch =
    o.watchlist && typeof o.watchlist === 'object'
      ? (o.watchlist as Record<string, unknown>)
      : null

  return {
    schemaVersion: typeof o.schemaVersion === 'number' ? o.schemaVersion : 1,
    asOf: o.asOf,
    refreshedBy: typeof o.refreshedBy === 'string' ? o.refreshedBy : 'unknown',
    accountMasked:
      typeof o.accountMasked === 'string'
        ? o.accountMasked
        : String(portfolio.accountMasked ?? '••••'),
    sourceNote:
      typeof o.sourceNote === 'string'
        ? o.sourceNote
        : 'RH market JSON · hosted bake+refresh',
    degraded: Boolean(o.degraded),
    portfolio: {
      totalValue: Number(portfolio.totalValue) || 0,
      equityValue: Number(portfolio.equityValue) || 0,
      optionsValue: Number(portfolio.optionsValue) || 0,
      cash: Number(portfolio.cash) || 0,
      buyingPower: Number(portfolio.buyingPower) || 0,
      accountMasked: String(portfolio.accountMasked ?? '••••'),
    },
    indices: o.indices as MarketSnapshot['indices'],
    board: o.board as MarketSnapshot['board'],
    crypto: o.crypto as MarketSnapshot['crypto'],
    positions: o.positions as MarketSnapshot['positions'],
    watchlist: {
      id: String(watch?.id ?? ''),
      name: String(watch?.name ?? 'Watch'),
      symbols: Array.isArray(watch?.symbols)
        ? (watch.symbols as string[])
        : [],
    },
    newsCrawl: o.newsCrawl as string[],
  }
}

export async function fetchMarketSnapshot(
  signal?: AbortSignal,
): Promise<MarketSnapshot | null> {
  try {
    const res = await fetch(MARKET_JSON_URL, {
      cache: 'no-store',
      signal,
    })
    if (!res.ok) return null
    const raw: unknown = await res.json()
    return parseMarketSnapshot(raw)
  } catch {
    return null
  }
}

export function formatAsOfLabel(asOfIso: string): string {
  try {
    const d = new Date(asOfIso)
    if (Number.isNaN(d.getTime())) return asOfIso
    return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, 'Z')
  } catch {
    return asOfIso
  }
}

export function formatAsOfShort(asOfIso: string): string {
  try {
    const d = new Date(asOfIso)
    if (Number.isNaN(d.getTime())) return asOfIso.slice(11, 16) + 'Z'
    return d.toISOString().slice(11, 19) + 'Z'
  } catch {
    return asOfIso.slice(11, 16) + 'Z'
  }
}
