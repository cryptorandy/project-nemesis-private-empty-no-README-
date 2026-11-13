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

export const AGENT_CONTEXT_AS_OF = '2026-11-13T02:40:33Z'

/**
 * Soft limits aligned to prefs: 10% BP / trade, 5% day loss, watchlist-only.
 * Dollar notional caps derived from current MCP portfolio bake.
 */
export const SOFT_LIMITS = {
  maxPctBuyingPowerPerTrade: 10,
  maxDayLossPctOfAccount: 5,
  watchlistOnly: true,
  /** Derived: ~10% of baked BP — soft gate, not a hard RH reject */
  maxNotionalPerTicket: 10.37,
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
/** average_price from MCP × multiplier ≈ position premium dollars (~$105 book). */
export const OPTION_POSITIONS: OptionPosBrief[] = [
  {
    underlying: 'NVDA',
    side: 'call',
    strike: 202.5,
    expiry: '2026-11-18',
    qty: 1,
    avgPremium: 0.49,
    notionalApprox: 49,
  },
  {
    underlying: 'SOXL',
    side: 'call',
    strike: 95,
    expiry: '2026-11-20',
    qty: 1,
    avgPremium: 0.52,
    notionalApprox: 52,
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
  totalValue: 352.74,
  equityValue: 144.0,
  optionsValue: 105,
  cash: 103.74,
  buyingPower: 103.74,
  accountMasked: '••••0788',
}
