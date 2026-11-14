/**
 * Agent-loop context baked from Robinhood MCP (read-only).
 * Owned by the swarm layer — not the board quote adapter (rh-snapshot.ts).
 *
 * Captured: 2026-11-13T02:40Z via get_portfolio / get_option_positions /
 * get_option_instruments / get_earnings_results / get_earnings_calendar /
 * get_sec_filing_index / run_scan / get_crypto_quotes / get_equity_quotes
 * Account: MCP ••••0788 (agentic)
 *
 * Agents never place orders. Execution Prep only stages draft tickets.
 */

export const AGENT_CONTEXT_AS_OF = '2026-11-14T20:51:00Z'

/**
 * Soft limits aligned to prefs: 10% BP / trade, 5% day loss, watchlist-only.
 * Dollar notional caps derived from current MCP portfolio bake.
 */
export const SOFT_LIMITS = {
  maxPctBuyingPowerPerTrade: 10,
  maxDayLossPctOfAccount: 5,
  watchlistOnly: true,
  /** Derived: ~10% of baked BP — soft gate, not a hard RH reject */
  maxNotionalPerTicket: 13.87,
  maxPctBookPerName: 8,
  maxOptionContracts: 5,
  cryptoNotionalCap: 2000,
}

export type ScanHit = {
  symbol: string
  name: string
  last: number
  changePct: number
  netChange: number
  relVolume: number
}

/** Top Daily gainers scan hits (RH run_scan · live at capture). */
export const SCAN_GAINERS: ScanHit[] = [
  { symbol: 'MOD', name: 'Modine', last: 134.15, changePct: 26.44, netChange: 28.05, relVolume: 1.05 },
  { symbol: 'CBRS', name: 'Cerebras Systems', last: 116.72, changePct: 19.41, netChange: 18.97, relVolume: 1.01 },
  { symbol: 'SITM', name: 'SiTime', last: 480.0, changePct: 2.01, netChange: 9.45, relVolume: 1.0 },
  { symbol: 'BRKRP', name: 'Bruker Pref', last: 458.95, changePct: 3.79, netChange: 16.76, relVolume: 1.0 },
  { symbol: 'ASML', name: 'ASML', last: 1513.03, changePct: 1.06, netChange: 15.91, relVolume: 1.0 },
  { symbol: 'SNDK', name: 'Sandisk', last: 951.05, changePct: 1.45, netChange: 13.59, relVolume: 1.01 },
  { symbol: 'MU', name: 'Micron', last: 809.43, changePct: 1.38, netChange: 10.99, relVolume: 1.01 },
  { symbol: 'MPWR', name: 'Monolithic Power', last: 1458.98, changePct: 0.8, netChange: 11.58, relVolume: 1.0 },
]

export type OptionPosBrief = {
  underlying: string
  side: 'call' | 'put'
  strike: number
  expiry: string
  qty: number
  avgPremium: number
  notionalApprox: number
}

/** Open option positions on MCP account (instruments resolved). */
/** average_price from MCP is $/contract; avgPremium = that / 100. */
export const OPTION_POSITIONS: OptionPosBrief[] = [
  {
    underlying: 'NVDA',
    side: 'call',
    strike: 197.5,
    expiry: '2026-11-20',
    qty: 1,
    avgPremium: 0.52,
    notionalApprox: 52,
  },
  {
    underlying: 'SOXL',
    side: 'call',
    strike: 80,
    expiry: '2026-11-20',
    qty: 1,
    avgPremium: 0.57,
    notionalApprox: 57,
  },
]

export type AlertConfigBake = {
  alertId: string
  symbol: string
  assetClass: 'equity' | 'crypto'
  conditionType: string
  targetPrice: number
  enabled: boolean
}

export type AlertFireBake = {
  logId: string
  alertId: string
  symbol: string
  assetClass: 'equity' | 'crypto'
  conditionType: string
  targetPrice: number
  triggeredPrice: number
  triggeredAt: string
  read: boolean
}

/** Configured RH alerts (get_alerts) — Alert Watch loops over these. */
export const ALERT_CONFIGS: AlertConfigBake[] = [
  {
    alertId: '2792a998-5fa1-4ec0-aea7-baa485bfa9b4',
    symbol: 'INTC',
    assetClass: 'equity',
    conditionType: 'price_above',
    targetPrice: 68,
    enabled: true,
  },
  {
    alertId: 'c7c9ba73-20dd-46ac-9b74-df6ec80ed985',
    symbol: 'INTC',
    assetClass: 'equity',
    conditionType: 'price_below',
    targetPrice: 62,
    enabled: true,
  },
]

/**
 * Fired alert log (get_alert_log) — unread first.
 * Captured 2026-11-14 · agents stage tickets only; never place.
 */
export const ALERT_FIRES: AlertFireBake[] = [
  {
    logId: '01a1d078-a84b-7d31-8550-75882d248922',
    alertId: 'c7c9ba73-20dd-46ac-9b74-df6ec80ed985',
    symbol: 'INTC',
    assetClass: 'equity',
    conditionType: 'price_below',
    targetPrice: 62,
    triggeredPrice: 61.99,
    triggeredAt: '2026-11-12T15:55:30Z',
    read: false,
  },
  {
    logId: '01a1ca7a-db90-7cf1-a544-a8eec95a41d7',
    alertId: 'c7c9ba73-20dd-46ac-9b74-df6ec80ed985',
    symbol: 'INTC',
    assetClass: 'equity',
    conditionType: 'price_below',
    targetPrice: 62,
    triggeredPrice: 61.93,
    triggeredAt: '2026-11-11T12:00:11Z',
    read: false,
  },
]

/** Last known INTC mark for Alert Watch stage limit (get_equity_quotes). */
export const ALERT_MARKS: Record<string, number> = {
  INTC: 59.665,
}

export type EarningsEvent = {
  symbol: string
  date: string
  timing: 'am' | 'pm' | null
  estimate: number | null
  actual: number | null
  verified: boolean
  relation: 'holding' | 'watch' | 'macro'
}

export const EARNINGS_NEAR: EarningsEvent[] = [
  {
    symbol: 'NVDA',
    date: '2026-11-17',
    timing: 'pm',
    estimate: 2.48,
    actual: null,
    verified: true,
    relation: 'holding',
  },
  {
    symbol: 'CSCO',
    date: '2026-11-12',
    timing: 'pm',
    estimate: 1.29,
    actual: 1.4,
    verified: true,
    relation: 'macro',
  },
  {
    symbol: 'AMAT',
    date: '2026-11-12',
    timing: 'pm',
    estimate: 4.06,
    actual: 4.16,
    verified: true,
    relation: 'macro',
  },
  {
    symbol: 'DIS',
    date: '2026-11-17',
    timing: 'am',
    estimate: 1.69,
    actual: null,
    verified: true,
    relation: 'macro',
  },
  {
    symbol: 'HD',
    date: '2026-11-17',
    timing: 'am',
    estimate: 3.87,
    actual: null,
    verified: true,
    relation: 'macro',
  },
  {
    symbol: 'PANW',
    date: '2026-11-18',
    timing: 'pm',
    estimate: 0.88,
    actual: null,
    verified: true,
    relation: 'watch',
  },
]

export type FilingHit = {
  symbol: string
  form: string
  date: string
  description: string
}

export const FILING_HITS: FilingHit[] = [
  {
    symbol: 'NVDA',
    form: '8-K',
    date: '2026-11-12',
    description: 'Current report',
  },
  {
    symbol: 'NVDA',
    form: '8-K',
    date: '2026-09-03',
    description: 'Current report',
  },
  {
    symbol: 'NVDA',
    form: '10-Q',
    date: '2026-08-26',
    description: 'Quarterly report',
  },
]

export type CryptoMark = {
  symbol: string
  mark: number
  open: number
  changePct: number
}

export const CRYPTO_MARKS: CryptoMark[] = [
  {
    symbol: 'BTC',
    mark: 65282.44,
    open: 67023.37,
    changePct: ((65282.44 - 67023.37) / 67023.37) * 100,
  },
  {
    symbol: 'ETH',
    mark: 1816.915,
    open: 1897.43,
    changePct: ((1816.915 - 1897.43) / 1897.43) * 100,
  },
]

export const PORTFOLIO_MARKS = {
  totalValue: 371.5,
  equityValue: 147.03,
  optionsValue: 104,
  cash: 120.47,
  buyingPower: 120.47,
  accountMasked: '••••0788',
}
