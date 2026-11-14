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
/** Positions + portfolio only — preferred over full market bake when newer. */
export const BOOK_JSON_URL = '/data/book.json'
/** Live book from agent ingest (Postgres-backed on published host). */
export const LIVE_BOOK_API_URL = '/api/book'

export type BookSnapshot = {
  schemaVersion: number
  asOf: string
  refreshedBy: string
  accountMasked: string
  sourceNote: string
  degraded: boolean
  portfolio: MarketSnapshot['portfolio']
  positions: MarketSnapshot['positions']
}

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

export function bakedBookSnapshot(): BookSnapshot {
  const full = bakedMarketSnapshot()
  return {
    schemaVersion: 1,
    asOf: full.asOf,
    refreshedBy: full.refreshedBy,
    accountMasked: full.accountMasked,
    sourceNote: 'RH MCP book · TS fallback',
    degraded: full.degraded,
    portfolio: { ...full.portfolio },
    positions: full.positions.map((p) => ({ ...p })),
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

/** Loose parse for the lighter positions/portfolio bake. */
export function parseBookSnapshot(raw: unknown): BookSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.asOf !== 'string' || !o.portfolio || typeof o.portfolio !== 'object') {
    return null
  }
  if (!Array.isArray(o.positions)) return null
  const portfolio = o.portfolio as Record<string, unknown>
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
        : 'RH book JSON · positions prefer this over stale market bake',
    degraded: Boolean(o.degraded),
    portfolio: {
      totalValue: Number(portfolio.totalValue) || 0,
      equityValue: Number(portfolio.equityValue) || 0,
      optionsValue: Number(portfolio.optionsValue) || 0,
      cash: Number(portfolio.cash) || 0,
      buyingPower: Number(portfolio.buyingPower) || 0,
      accountMasked: String(portfolio.accountMasked ?? '••••'),
    },
    positions: o.positions as BookSnapshot['positions'],
  }
}

async function fetchBookFromUrl(
  url: string,
  signal?: AbortSignal,
): Promise<BookSnapshot | null> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      credentials: 'same-origin',
      signal,
    })
    if (!res.ok) return null
    const raw: unknown = await res.json()
    return parseBookSnapshot(raw)
  } catch {
    return null
  }
}

/**
 * Prefer live /api/book (agent-ingested RH), then static /data/book.json.
 * Continuous truth without waiting for a human republish when ingest is running.
 */
export async function fetchBookSnapshot(
  signal?: AbortSignal,
): Promise<BookSnapshot | null> {
  const live = await fetchBookFromUrl(LIVE_BOOK_API_URL, signal)
  if (live) return live
  return fetchBookFromUrl(BOOK_JSON_URL, signal)
}

/**
 * Signed-in desk keep-alive: POST { refresh: true } to /api/book.
 * Bumps asOf on the stored/bake book so feed stays fresh without agent secrets.
 * Never places trades. Returns new asOf or null on failure.
 */
export async function pingBookRefresh(
  signal?: AbortSignal,
): Promise<{ asOf: string } | null> {
  try {
    const res = await fetch(LIVE_BOOK_API_URL, {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        refresh: true,
        refreshedBy: 'desk-refresh',
      }),
      signal,
    })
    if (!res.ok) return null
    const raw: unknown = await res.json()
    if (!raw || typeof raw !== 'object') return null
    const asOf = (raw as { asOf?: unknown }).asOf
    return typeof asOf === 'string' ? { asOf } : null
  } catch {
    return null
  }
}

/** Apply book over market when book asOf is equal or newer. */
export function mergeBookIntoMarket(
  market: MarketSnapshot,
  book: BookSnapshot | null,
): MarketSnapshot {
  if (!book) return market
  const marketMs = new Date(market.asOf).getTime()
  const bookMs = new Date(book.asOf).getTime()
  if (!Number.isFinite(bookMs)) return market
  if (Number.isFinite(marketMs) && bookMs < marketMs) return market
  return {
    ...market,
    asOf: book.asOf,
    refreshedBy: book.refreshedBy,
    accountMasked: book.accountMasked,
    sourceNote: book.sourceNote,
    degraded: book.degraded || market.degraded,
    portfolio: { ...book.portfolio },
    positions: book.positions.map((p) => ({ ...p })),
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
