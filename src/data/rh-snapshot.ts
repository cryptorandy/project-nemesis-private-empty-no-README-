/**
 * Robinhood MCP snapshot baked for the hosted app.
 *
 * Gap: Cursor-published static apps cannot call Robinhood MCP at runtime.
 * Agents refresh this file (or desk state) via MCP; the UI then runs a
 * high-frequency live tape over the last known RH marks. No place-order calls.
 *
 * Captured: 2026-11-13T01:03:25Z via get_equity_quotes / get_crypto_quotes /
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

export const RH_AS_OF = '2026-11-13T01:03:25Z'
export const RH_SOURCE_NOTE =
  'RH MCP snapshot · hosted app cannot poll MCP live — tape animates from last marks'

export const RH_PORTFOLIO: RhPortfolio = {
  totalValue: 352.31,
  equityValue: 143.57,
  optionsValue: 105,
  cash: 103.74,
  buyingPower: 103.74,
  accountMasked: '••••0788',
}

export const RH_INDICES: RhQuote[] = [
  { symbol: 'SPY', name: 'S&P 500', price: 759.24, prevClose: 757.12, changePct: 0.28, source: 'rh' },
  { symbol: 'QQQ', name: 'Nasdaq 100', price: 690.81, prevClose: 688.17, changePct: 0.38, source: 'rh' },
  { symbol: 'IWM', name: 'Russell 2000', price: 278.96, prevClose: 278.44, changePct: 0.19, source: 'rh' },
]

export const RH_BOARD: RhQuote[] = [
  { symbol: 'NVDA', name: 'NVIDIA', price: 167.94, prevClose: 166.19, changePct: 1.05, source: 'rh', note: 'Holding · after-hours' },
  { symbol: 'AAPL', name: 'Apple', price: 355.22, prevClose: 354.88, changePct: 0.1, source: 'rh' },
  { symbol: 'TSLA', name: 'Tesla', price: 400.0, prevClose: 397.45, changePct: 0.64, source: 'rh' },
  { symbol: 'AMD', name: 'AMD', price: 582.02, prevClose: 585.3, changePct: -0.56, source: 'rh' },
  { symbol: 'MSFT', name: 'Microsoft', price: 521.04, prevClose: 523.0, changePct: -0.37, source: 'rh' },
  { symbol: 'AMZN', name: 'Amazon', price: 268.2, prevClose: 267.44, changePct: 0.28, source: 'rh' },
  { symbol: 'META', name: 'Meta', price: 625.8, prevClose: 623.61, changePct: 0.35, source: 'rh' },
  { symbol: 'SOXL', name: 'Direxion Semi 3x', price: 66.87, prevClose: 65.53, changePct: 2.04, source: 'rh', note: 'Position' },
  { symbol: 'SCHD', name: 'Schwab Div', price: 35.95, prevClose: 35.93, changePct: 0.06, source: 'rh', note: 'Position' },
  { symbol: 'NVDW', name: 'Roundhill NVDA Weekly', price: 24.49, prevClose: 24.17, changePct: 1.32, source: 'rh', note: 'Position' },
  { symbol: 'XOP', name: 'Oil & Gas Explore', price: 183.52, prevClose: 183.11, changePct: 0.22, source: 'rh', note: 'Watch · Superstar' },
  { symbol: 'ARKW', name: 'ARK Next Gen Internet', price: 144.02, prevClose: 143.93, changePct: 0.06, source: 'rh', note: 'Watch · Superstar' },
  { symbol: 'BILL', name: 'Bill.com', price: 53.5, prevClose: 54.0, changePct: -0.93, source: 'rh', note: 'Watch · Superstar' },
  { symbol: 'ALL', name: 'Allstate', price: 264.62, prevClose: 266.69, changePct: -0.78, source: 'rh', note: 'Watch · Superstar' },
  { symbol: 'ST', name: 'Sensata', price: 39.41, prevClose: 39.41, changePct: 0, source: 'rh', note: 'Watch · Superstar' },
  { symbol: 'MAC', name: 'Macerich', price: 25.28, prevClose: 25.28, changePct: 0, source: 'rh', note: 'Watch · Superstar' },
]

export const RH_CRYPTO: RhQuote[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 70844.81,
    prevClose: 73655.11,
    changePct: -3.82,
    source: 'rh',
    note: 'BTC-USD mark',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2005.76,
    prevClose: 2047.8,
    changePct: -2.05,
    source: 'rh',
    note: 'ETH-USD mark',
  },
]

export const RH_POSITIONS: RhPosition[] = [
  {
    symbol: 'NVDA',
    qty: 0.090997,
    avgCost: 164.84,
    mark: 167.94,
    value: 15.28,
    pnl: 0.28,
    pnlPct: 1.88,
  },
  {
    symbol: 'SOXL',
    qty: 1,
    avgCost: 44.95,
    mark: 66.87,
    value: 66.87,
    pnl: 21.92,
    pnlPct: 48.76,
  },
  {
    symbol: 'SCHD',
    qty: 1,
    avgCost: 35.91,
    mark: 35.95,
    value: 35.95,
    pnl: 0.04,
    pnlPct: 0.11,
  },
  {
    symbol: 'NVDW',
    qty: 1.041883,
    avgCost: 24.0,
    mark: 24.49,
    value: 25.52,
    pnl: 0.51,
    pnlPct: 2.04,
  },
]

/** Options heat stub — MCP options quotes not wired into board yet */
export const OPTIONS_HEAT_STUB = [
  { underlying: 'NVDA', side: 'Call', strike: 170, expiry: '11/21', iv: '42%', heat: 'elevated' },
  { underlying: 'TSLA', side: 'Call', strike: 410, expiry: '11/21', iv: '51%', heat: 'hot' },
  { underlying: 'SPY', side: 'Put', strike: 750, expiry: '11/14', iv: '14%', heat: 'quiet' },
  { underlying: 'AMD', side: 'Call', strike: 600, expiry: '12/19', iv: '48%', heat: 'watch' },
  { underlying: 'META', side: 'Put', strike: 610, expiry: '11/28', iv: '29%', heat: 'quiet' },
]

export const NEWS_CRAWL = [
  'RH · MCP account ••••0788 equity $143.57 · options $105 · cash $103.74',
  'Scanner Watch · SOXL +2.0% AH · semi levered heat',
  'Crypto Pulse · BTC −3.8% vs prior open · ETH −2.1%',
  'Desk Chief · focus NVDA / SOXL / TSLA · human confirms every ticket',
  'Options Flow stub · TSLA 410c heat · NVDA 170c elevated',
  'Risk Guard · soft limits armed · max notional $5k · no auto-place',
  'Watch · Randy Superstar list XOP ARKW BILL ALL on board',
  'Execution Prep · draft rail ready · preview required before confirm',
]
