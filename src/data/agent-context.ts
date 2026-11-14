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

export const AGENT_CONTEXT_AS_OF = '2026-11-14T16:30:00Z'

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

/** Live RH run_scan meta (Daily gainers) — status shown on Scanner Watch. */
export const SCAN_LIVE_META = {
  scanId: '5957f14d-ca0f-4cd0-b437-f97b46ae173e',
  title: 'Daily gainers',
  asOf: '2026-11-14T16:30:00Z',
  mcpOk: true,
  totalItems: 230,
}

/** Top Daily gainers scan hits (RH run_scan · live at capture). */
export const SCAN_GAINERS: ScanHit[] = [
  { symbol: 'PRHI', name: 'Presurance Holdings', last: 7.33, changePct: 38.56, netChange: 2.04, relVolume: 1.0 },
  { symbol: 'AKAN', name: 'Akanda', last: 1.865, changePct: 37.13, netChange: 0.5, relVolume: 1.03 },
  { symbol: 'KG', name: 'Kestrel Group', last: 4.53, changePct: 34.82, netChange: 1.17, relVolume: 1.0 },
  { symbol: 'LFWD', name: 'Lifeward', last: 5.42, changePct: 33.49, netChange: 1.36, relVolume: 1.0 },
  { symbol: 'CNSP', name: 'CNS Pharmaceuticals', last: 3.68, changePct: 27.34, netChange: 0.79, relVolume: 1.0 },
  { symbol: 'CLRO', name: 'ClearOne', last: 4.2845, changePct: 27.14, netChange: 0.91, relVolume: 1.07 },
  { symbol: 'CURX', name: 'Curanex', last: 6.09, changePct: 26.88, netChange: 1.29, relVolume: 1.0 },
  { symbol: 'NORD', name: 'Nordicus Partners', last: 3.17, changePct: 26.29, netChange: 0.66, relVolume: 1.0 },
]

export type AlertConfig = {
  alertId: string
  symbol: string
  displayName: string
  enabled: boolean
  conditionType: string
  targetPrice: number
}

/** Configured RH alerts (get_alerts). */
export const ALERT_CONFIGS: AlertConfig[] = [
  {
    alertId: '2792a998-5fa1-4ec0-aea7-baa485bfa9b4',
    symbol: 'INTC',
    displayName: 'Intel',
    enabled: true,
    conditionType: 'price_above',
    targetPrice: 68,
  },
  {
    alertId: 'c7c9ba73-20dd-46ac-9b74-df6ec80ed985',
    symbol: 'INTC',
    displayName: 'Intel',
    enabled: true,
    conditionType: 'price_below',
    targetPrice: 62,
  },
]

export type AlertFired = {
  alertLogId: string
  alertId: string
  symbol: string
  conditionType: string
  targetPrice: number
  triggeredPrice: number
  triggeredAt: string
  read: boolean
  mark: number
}

/** Fired RH alert log (get_alert_log) — unread first. */
export const ALERT_FIRED: AlertFired[] = [
  {
    alertLogId: '01a1d078-a84b-7d31-8550-75882d248922',
    alertId: 'c7c9ba73-20dd-46ac-9b74-df6ec80ed985',
    symbol: 'INTC',
    conditionType: 'price_below',
    targetPrice: 62,
    triggeredPrice: 61.99,
    triggeredAt: '2026-11-12T15:55:30Z',
    read: false,
    mark: 59.665,
  },
  {
    alertLogId: '01a1ca7a-db90-7cf1-a544-a8eec95a41d7',
    alertId: 'c7c9ba73-20dd-46ac-9b74-df6ec80ed985',
    symbol: 'INTC',
    conditionType: 'price_below',
    targetPrice: 62,
    triggeredPrice: 61.93,
    triggeredAt: '2026-11-11T12:00:11Z',
    read: false,
    mark: 59.665,
  },
]

/** Focus-symbol Research Depth bake (fundamentals + RSI/MACD + filings). */
export const RESEARCH_DEPTH_FOCUS = {
  symbol: 'NVDA',
  asOf: '2026-11-14T16:30:00Z',
  name: 'NVIDIA',
  sector: 'Electronic Technology',
  industry: 'Semiconductors',
  pe: 20.586,
  pb: 17.173,
  marketCap: 4.005e12,
  high52: 243.37,
  low52: 148.8,
  rsi14: 24.79,
  macd: -14.209,
  macdSignal: -10.076,
  macdHist: -4.132,
  earningsDate: '2026-11-17',
  earningsEstimate: 2.48,
  filings: [
    { form: '8-K', date: '2026-11-12', description: 'Current report' },
    { form: '8-K', date: '2026-09-03', description: 'Current report' },
    { form: '10-Q', date: '2026-08-26', description: 'Quarterly report' },
  ],
  note: 'RH MCP get_equity_fundamentals + RSI/MACD day · SEC index · earnings near',
}

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
/** average_price from MCP × multiplier ≈ position premium dollars (~$105 book). */
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
    mark: 70263.71,
    open: 73638.24,
    changePct: ((70263.71 - 73638.24) / 73638.24) * 100,
  },
  {
    symbol: 'ETH',
    mark: 1994.92,
    open: 2048.225,
    changePct: ((1994.92 - 2048.225) / 2048.225) * 100,
  },
]

export const PORTFOLIO_MARKS = {
  totalValue: 384.26,
  equityValue: 120.61,
  optionsValue: 125,
  cash: 138.65,
  buyingPower: 138.65,
  accountMasked: '••••0788',
}
