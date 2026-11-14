/** Shared market-truth shapes for bake JSON + in-app fallback. */

export type MarketQuote = {
  symbol: string
  name: string
  price: number
  prevClose: number
  changePct: number
  source: 'rh' | 'mock'
  note?: string
}

export type MarketPositionAsset = 'equity' | 'option' | 'crypto'

export type MarketPosition = {
  /** Stable row id (eq-/opt-/cry-); falls back to symbol in UI. */
  id?: string
  /** Defaults to equity for schema v1 bakes. */
  asset?: MarketPositionAsset
  /** Underlying ticker (equity/option) or crypto base (BTC). */
  symbol: string
  /** Board label — e.g. "NVDA 197.5c 11/20". */
  display?: string
  qty: number
  avgCost: number
  mark: number
  value: number
  pnl: number
  pnlPct: number
  optionRight?: 'Call' | 'Put'
  optionStrike?: number
  optionExpiry?: string
  optionId?: string
}

export type MarketPortfolio = {
  totalValue: number
  equityValue: number
  optionsValue: number
  cash: number
  buyingPower: number
  accountMasked: string
}

export type MarketWatchlist = {
  id: string
  name: string
  symbols: string[]
}

export type MarketSnapshot = {
  schemaVersion: number
  asOf: string
  refreshedBy: string
  accountMasked: string
  sourceNote: string
  degraded: boolean
  portfolio: MarketPortfolio
  indices: MarketQuote[]
  board: MarketQuote[]
  crypto: MarketQuote[]
  positions: MarketPosition[]
  watchlist: MarketWatchlist
  newsCrawl: string[]
}

/** How the desk is currently receiving marks. */
export type FeedStatus =
  | 'polling'
  | 'fresh'
  | 'baked'
  | 'stale'
  | 'degraded'
