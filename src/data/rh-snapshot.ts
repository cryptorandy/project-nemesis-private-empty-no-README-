/**
 * Robinhood MCP snapshot baked for the hosted app (TypeScript fallback).
 *
 * Gap: Cursor-published static apps cannot call Robinhood MCP at runtime.
 * Agents refresh `public/data/market.json` (+ this file) via MCP; the UI polls
 * that JSON and falls back here if the poll fails. No place-order calls.
 *
 * Captured: 2026-11-13T02:39:56Z via get_equity_quotes / get_crypto_quotes /
 * get_portfolio / get_equity_positions / get_watchlist_items
 * Account: MCP ••••0788 (agentic)
 */

export type RhQuote = {
  symbol: string
  name: string
  price: number
  prevClose: number
  changePct: number
  source: 'rh'
  note?: string
}

export type RhPosition = {
  symbol: string
  qty: number
  avgCost: number
  mark: number
  value: number
  pnl: number
  pnlPct: number
}

export type RhPortfolio = {
  totalValue: number
  equityValue: number
  optionsValue: number
  cash: number
  buyingPower: number
  accountMasked: string
}

export const RH_AS_OF = '2026-11-13T02:39:56Z'
export const RH_SOURCE_NOTE =
  'RH MCP bake · hosted app polls /data/market.json — MCP unavailable in browser'

export const RH_PORTFOLIO: RhPortfolio = {
  totalValue: 350.61,
  equityValue: 141.87,
  optionsValue: 105,
  cash: 103.74,
  buyingPower: 103.74,
  accountMasked: '••••0788',
}

export const RH_INDICES: RhQuote[] = [
  { symbol: 'SPY', name: 'S&P 500', price: 759.92, prevClose: 757.12, changePct: 0.37, source: 'rh' },
  { symbol: 'QQQ', name: 'Nasdaq 100', price: 692.01, prevClose: 688.17, changePct: 0.56, source: 'rh' },
  { symbol: 'IWM', name: 'Russell 2000', price: 279.12, prevClose: 278.44, changePct: 0.24, source: 'rh' },
]

export const RH_BOARD: RhQuote[] = [
  { symbol: 'NVDA', name: 'NVIDIA', price: 166.54, prevClose: 166.19, changePct: 0.21, source: 'rh', note: 'Holding · after-hours' },
  { symbol: 'AAPL', name: 'Apple', price: 355.8, prevClose: 354.88, changePct: 0.26, source: 'rh' },
  { symbol: 'TSLA', name: 'Tesla', price: 400.58, prevClose: 397.45, changePct: 0.79, source: 'rh' },
  { symbol: 'AMD', name: 'AMD', price: 582.99, prevClose: 585.3, changePct: -0.39, source: 'rh' },
  { symbol: 'MSFT', name: 'Microsoft', price: 521.26, prevClose: 523, changePct: -0.33, source: 'rh' },
  { symbol: 'AMZN', name: 'Amazon', price: 268.45, prevClose: 267.44, changePct: 0.38, source: 'rh' },
  { symbol: 'META', name: 'Meta', price: 627.15, prevClose: 623.61, changePct: 0.57, source: 'rh' },
  { symbol: 'SOXL', name: 'Direxion Semi 3x', price: 67.64, prevClose: 65.53, changePct: 3.22, source: 'rh', note: 'Position' },
  { symbol: 'SCHD', name: 'Schwab Div', price: 35.93, prevClose: 35.93, changePct: 0, source: 'rh', note: 'Position' },
  { symbol: 'NVDW', name: 'Roundhill NVDA Weekly', price: 24.3, prevClose: 24.17, changePct: 0.54, source: 'rh', note: 'Position' },
  { symbol: 'XOP', name: 'Oil & Gas Explore', price: 183.57, prevClose: 183.11, changePct: 0.25, source: 'rh', note: 'Watch · Superstar' },
  { symbol: 'ARKW', name: 'ARK Next Gen Internet', price: 144.02, prevClose: 143.93, changePct: 0.06, source: 'rh', note: 'Watch · Superstar' },
  { symbol: 'BILL', name: 'Bill.com', price: 53.5, prevClose: 54, changePct: -0.93, source: 'rh', note: 'Watch · Superstar' },
  { symbol: 'ALL', name: 'Allstate', price: 266.28, prevClose: 266.69, changePct: -0.15, source: 'rh', note: 'Watch · Superstar' },
  { symbol: 'ST', name: 'Sensata', price: 39.41, prevClose: 39.41, changePct: 0, source: 'rh', note: 'Watch · Superstar' },
  { symbol: 'MAC', name: 'Macerich', price: 25.28, prevClose: 25.28, changePct: 0, source: 'rh', note: 'Watch · Superstar' },
]

export const RH_CRYPTO: RhQuote[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 70278.73,
    prevClose: 73638.24,
    changePct: -4.56,
    source: 'rh',
    note: 'BTC-USD mark',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 1995.68,
    prevClose: 2047.8,
    changePct: -2.54,
    source: 'rh',
    note: 'ETH-USD mark',
  },
]

export const RH_POSITIONS: RhPosition[] = [
  {
    symbol: 'NVDA',
    qty: 0.090997,
    avgCost: 164.84,
    mark: 166.54,
    value: 15.16,
    pnl: 0.15,
    pnlPct: 1.03,
  },
  {
    symbol: 'SOXL',
    qty: 1,
    avgCost: 44.95,
    mark: 67.64,
    value: 67.64,
    pnl: 22.69,
    pnlPct: 50.48,
  },
  {
    symbol: 'SCHD',
    qty: 1,
    avgCost: 35.91,
    mark: 35.93,
    value: 35.93,
    pnl: 0.02,
    pnlPct: 0.06,
  },
  {
    symbol: 'NVDW',
    qty: 1.041883,
    avgCost: 24.0,
    mark: 24.3,
    value: 25.32,
    pnl: 0.31,
    pnlPct: 1.25,
  },
]

export const RH_WATCHLIST = {
  id: '0d15643a-a325-4cc5-b409-f334e12cfe17',
  name: 'Randys superstar Or Surprise stock',
  symbols: ['XOP', 'ARKW', 'ST', 'BILL', 'JG', 'ALL', 'NCTY', 'MAC'],
}

/** Options heat stub — MCP options quotes not wired into board yet */
export const OPTIONS_HEAT_STUB = [
  { underlying: 'NVDA', side: 'Call', strike: 170, expiry: '11/21', iv: '42%', heat: 'elevated' },
  { underlying: 'TSLA', side: 'Call', strike: 410, expiry: '11/21', iv: '51%', heat: 'hot' },
  { underlying: 'SPY', side: 'Put', strike: 750, expiry: '11/14', iv: '14%', heat: 'quiet' },
  { underlying: 'AMD', side: 'Call', strike: 600, expiry: '12/19', iv: '48%', heat: 'watch' },
  { underlying: 'META', side: 'Put', strike: 610, expiry: '11/28', iv: '29%', heat: 'quiet' },
]

export const NEWS_CRAWL = [
  'RH · MCP account ••••0788 equity $144.03 · options $105 · cash $103.74',
  'Market truth · as of 02:39:56Z · bake+refresh via agent MCP',
  'Crypto Pulse · BTC −4.6% vs prior open · ETH −2.5%',
  'Scanner Watch · SOXL +3.2% AH · semi levered heat',
  'Desk Chief · focus NVDA / SOXL / TSLA · human confirms every ticket',
  'Watch · Randy Superstar list XOP ARKW BILL ALL on board',
  'Risk Guard · standing 10% BP / 5% day loss · watchlist_only · no auto-place',
  'Execution Prep · fast path · hot seat one-tap · confirm every order',
]
