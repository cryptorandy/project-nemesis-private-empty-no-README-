/**
 * Options scanner bake — RH MCP option instruments + quotes with Greeks.
 *
 * Captured: 2026-11-13T03:16Z via get_option_chains / get_option_instruments /
 * get_option_quotes / get_earnings_calendar / get_watchlist_items / get_portfolio
 * Account: MCP ••••0788 (856290788 · agentic)
 *
 * Hard rule: every recommendable contract MUST carry delta/gamma/theta/vega.
 * IV (implied_volatility) included when RH returns it.
 * Agents never place orders — ideas stage into the ticket rail only.
 */

export const OPTIONS_SCAN_AS_OF = '2026-11-13T03:16:07Z'

/** % capital rules for MCP account 856290788 */
export const CAPITAL_RULES = {
  accountNumberMasked: '••••0788',
  maxPctBuyingPowerPerTrade: 10,
  maxDayLossPctOfAccount: 5,
  watchlistOnly: true,
  multiplier: 100,
} as const

export type OptionGreeks = {
  delta: number
  gamma: number
  theta: number
  vega: number
  rho?: number
  /** Decimal IV from RH (e.g. 0.89 = 89%). Null only if RH omitted. */
  iv: number | null
}

export type OptionContractBake = {
  instrumentId: string
  underlying: string
  right: 'call' | 'put'
  strike: number
  expiry: string
  mark: number
  bid: number
  ask: number
  volume: number
  openInterest: number
  breakEven: number
  chanceOfProfitLong: number | null
  greeks: OptionGreeks
  /** Why this contract is in the bake universe */
  universe: 'holding' | 'watchlist'
  /** Optional earnings catalyst date YYYY-MM-DD */
  earningsDate?: string
}

/**
 * Universe = equity holdings underlyings + Randy Superstar watchlist.
 * SPY/TSLA board names are excluded (watchlist-only capital rule).
 */
export const SCAN_UNIVERSE = {
  holdings: ['NVDA', 'SOXL', 'SCHD', 'NVDW'] as const,
  watchlistId: '0d15643a-a325-4cc5-b409-f334e12cfe17',
  watchlistName: 'Randys superstar Or Surprise stock',
  watchlist: [
    'XOP',
    'ARKW',
    'ST',
    'BILL',
    'JG',
    'ALL',
    'NCTY',
    'MAC',
  ] as const,
}

export function allowedUnderlyings(): Set<string> {
  return new Set<string>([
    ...SCAN_UNIVERSE.holdings,
    ...SCAN_UNIVERSE.watchlist,
  ])
}

/** Near-ATM / elevated-flow contracts with complete Greeks from RH quotes. */
export const OPTION_CONTRACTS: OptionContractBake[] = [
  {
    instrumentId: '47f35b6e-cf15-41bc-becf-8db3c959c2ac',
    underlying: 'NVDA',
    right: 'call',
    strike: 167.5,
    expiry: '2026-11-20',
    mark: 8.0,
    bid: 7.95,
    ask: 8.05,
    volume: 7339,
    openInterest: 1962,
    breakEven: 175.5,
    chanceOfProfitLong: 0.314472,
    greeks: {
      delta: 0.502512,
      gamma: 0.018532,
      theta: -0.563388,
      vega: 0.096477,
      rho: 0.015999,
      iv: 0.890419,
    },
    universe: 'holding',
    earningsDate: '2026-11-17',
  },
  {
    instrumentId: 'f5d34fd0-9b1c-48a9-8ccc-acdfe05c3492',
    underlying: 'NVDA',
    right: 'call',
    strike: 170,
    expiry: '2026-11-20',
    mark: 6.875,
    bid: 6.8,
    ask: 6.95,
    volume: 44151,
    openInterest: 14148,
    breakEven: 176.88,
    chanceOfProfitLong: 0.292509,
    greeks: {
      delta: 0.456454,
      gamma: 0.018525,
      theta: -0.556138,
      vega: 0.095904,
      rho: 0.014614,
      iv: 0.885203,
    },
    universe: 'holding',
    earningsDate: '2026-11-17',
  },
  {
    instrumentId: '083b5be4-7406-46b3-99b5-3a3e155480d5',
    underlying: 'NVDA',
    right: 'call',
    strike: 172.5,
    expiry: '2026-11-20',
    mark: 5.875,
    bid: 5.8,
    ask: 5.95,
    volume: 31353,
    openInterest: 3224,
    breakEven: 178.38,
    chanceOfProfitLong: 0.269622,
    greeks: {
      delta: 0.411238,
      gamma: 0.018257,
      theta: -0.542369,
      vega: 0.094081,
      rho: 0.013234,
      iv: 0.880882,
    },
    universe: 'holding',
    earningsDate: '2026-11-17',
  },
  {
    instrumentId: '376aa83a-04a9-4149-9358-04207fa963ed',
    underlying: 'NVDA',
    right: 'call',
    strike: 175,
    expiry: '2026-11-20',
    mark: 5.075,
    bid: 5.05,
    ask: 5.1,
    volume: 42457,
    openInterest: 19509,
    breakEven: 180.08,
    chanceOfProfitLong: 0.246909,
    greeks: {
      delta: 0.369379,
      gamma: 0.017603,
      theta: -0.529066,
      vega: 0.09126,
      rho: 0.01193,
      iv: 0.886694,
    },
    universe: 'holding',
    earningsDate: '2026-11-17',
  },
  {
    instrumentId: 'f0551664-506c-4e2a-99c5-e7d2d157283b',
    underlying: 'SOXL',
    right: 'call',
    strike: 70,
    expiry: '2026-11-20',
    mark: 5.15,
    bid: 4.8,
    ask: 5.5,
    volume: 5735,
    openInterest: 6987,
    breakEven: 75.15,
    chanceOfProfitLong: 0.266346,
    greeks: {
      delta: 0.464009,
      gamma: 0.023695,
      theta: -0.432721,
      vega: 0.038323,
      rho: 0.005428,
      iv: 1.738444,
    },
    universe: 'holding',
  },
  {
    instrumentId: 'f99273ef-fdd1-43b2-a865-d5046225b8a4',
    underlying: 'SOXL',
    right: 'call',
    strike: 66,
    expiry: '2026-11-20',
    mark: 6.975,
    bid: 6.5,
    ask: 7.45,
    volume: 1520,
    openInterest: 1387,
    breakEven: 72.98,
    chanceOfProfitLong: 0.30814,
    greeks: {
      delta: 0.557727,
      gamma: 0.022876,
      theta: -0.442845,
      vega: 0.038076,
      rho: 0.006356,
      iv: 1.788959,
    },
    universe: 'holding',
  },
  {
    instrumentId: '105a9192-2776-43fe-8c29-1de2899d2d37',
    underlying: 'BILL',
    right: 'call',
    strike: 55,
    expiry: '2026-11-20',
    mark: 0.875,
    bid: 0.6,
    ask: 1.15,
    volume: 8,
    openInterest: 1130,
    breakEven: 55.88,
    chanceOfProfitLong: 0.27903,
    greeks: {
      delta: 0.397379,
      gamma: 0.119611,
      theta: -0.082617,
      vega: 0.030329,
      rho: 0.004364,
      iv: 0.410005,
    },
    universe: 'watchlist',
  },
  {
    instrumentId: '57b44b62-d868-4fc5-92ac-f1ce18fafd72',
    underlying: 'BILL',
    right: 'call',
    strike: 57,
    expiry: '2026-11-20',
    mark: 0.85,
    bid: 0.1,
    ask: 1.6,
    volume: 0,
    openInterest: 12,
    breakEven: 57.85,
    chanceOfProfitLong: 0.211459,
    greeks: {
      delta: 0.292321,
      gamma: 0.07095,
      theta: -0.109154,
      vega: 0.027019,
      rho: 0.003167,
      iv: 0.61579,
    },
    universe: 'watchlist',
  },
  {
    instrumentId: '4200e9d9-5721-4910-bbe1-36204efc2240',
    underlying: 'MAC',
    right: 'call',
    strike: 25,
    expiry: '2026-11-20',
    mark: 0.75,
    bid: 0.4,
    ask: 1.1,
    volume: 0,
    openInterest: 567,
    breakEven: 25.75,
    chanceOfProfitLong: 0.370243,
    greeks: {
      delta: 0.59085,
      gamma: 0.261117,
      theta: -0.038921,
      vega: 0.014299,
      rho: 0.003007,
      iv: 0.404343,
    },
    universe: 'watchlist',
  },
  {
    instrumentId: '958cb7f0-42fe-411e-bd2b-76547ad6bdc6',
    underlying: 'MAC',
    right: 'call',
    strike: 24,
    expiry: '2026-11-20',
    mark: 1.625,
    bid: 1.15,
    ask: 2.1,
    volume: 0,
    openInterest: 120,
    breakEven: 25.63,
    chanceOfProfitLong: 0.421607,
    greeks: {
      delta: 0.747858,
      gamma: 0.1502,
      theta: -0.045738,
      vega: 0.011748,
      rho: 0.003662,
      iv: 0.577495,
    },
    universe: 'watchlist',
  },
]

export function hasRequiredGreeks(g: OptionGreeks | null | undefined): boolean {
  if (!g) return false
  return (
    Number.isFinite(g.delta) &&
    Number.isFinite(g.gamma) &&
    Number.isFinite(g.theta) &&
    Number.isFinite(g.vega)
  )
}
