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

export type MarketAssetClass = 'equity' | 'option' | 'crypto'

export type MarketPosition = {
  symbol: string
  qty: number
  avgCost: number
  mark: number
  value: number
  pnl: number
  pnlPct: number
  /** Defaults to equity when omitted (legacy bake). */
  asset?: MarketAssetClass
  /** Option contract fields (asset === 'option'). */
  right?: 'Call' | 'Put'
  strike?: number
  expiry?: string
  optionId?: string
  /** Display label e.g. NVDA 197.5C 11/20 */
  label?: string
  /** Crypto pair id e.g. BTC-USD when asset === 'crypto'. */
  pair?: string
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

export type BookOrderState =
  | 'open'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'partial'

export type BookOrder = {
  id: string
  asset: MarketAssetClass
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit'
  state: BookOrderState
  qty: number
  filledQty: number
  avgPrice: number | null
  limitPrice: number | null
  createdAt: string
  updatedAt: string
  /** RH order UUID for audit crumbs */
  rhOrderId: string
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
  orders?: BookOrder[]
}

/** How the desk is currently receiving marks. */
export type FeedStatus =
  | 'polling'
  | 'fresh'
  | 'baked'
  | 'stale'
  | 'degraded'
