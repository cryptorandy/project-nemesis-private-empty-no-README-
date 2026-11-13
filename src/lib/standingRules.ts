import type { MarketPortfolio } from '../data/market-types'
import type { TicketDraft } from '../types'

function ticketNotional(ticket: TicketDraft, mark: number): number {
  const px = ticket.order === 'Market' ? mark : ticket.limit
  const multiplier = ticket.asset === 'Option' ? 100 : 1
  return Math.max(0, ticket.qty) * Math.max(0, px) * multiplier
}

/** Default standing rules — percent of capital, editable in desk UI. */
export const DEFAULT_STANDING_RULES = {
  maxNotionalPctOfBuyingPower: 10,
  maxDayLossPctOfEquity: 5,
  /** watchlist_only = board ∪ positions ∪ watchlist; any = no symbol allowlist */
  allowedSymbolsMode: 'watchlist_only' as AllowedSymbolsMode,
} as const

export type AllowedSymbolsMode = 'watchlist_only' | 'any'

export type StandingRules = {
  maxNotionalPctOfBuyingPower: number
  maxDayLossPctOfEquity: number
  allowedSymbolsMode: AllowedSymbolsMode
  /** Extra symbols Randy allows beyond watchlist universe (uppercase). */
  extraAllowedSymbols: string[]
}

export type CapitalSnapshot = {
  totalValue: number
  buyingPower: number
  /** Session day P&amp;L (negative = loss). Tracked in desk; starts 0. */
  dayPnl: number
}

export type StandingBlock = {
  id: 'notional' | 'day-loss' | 'symbol' | 'asset'
  label: string
  detail: string
}

export type StandingEval = {
  caps: {
    maxNotionalDollars: number
    maxDayLossDollars: number
  }
  notional: number
  blocks: StandingBlock[]
  /** Hard block — confirm / place must refuse. */
  blocked: boolean
}

export function defaultStandingRules(): StandingRules {
  return {
    maxNotionalPctOfBuyingPower:
      DEFAULT_STANDING_RULES.maxNotionalPctOfBuyingPower,
    maxDayLossPctOfEquity: DEFAULT_STANDING_RULES.maxDayLossPctOfEquity,
    allowedSymbolsMode: DEFAULT_STANDING_RULES.allowedSymbolsMode,
    extraAllowedSymbols: [],
  }
}

export function capitalFromPortfolio(
  portfolio: MarketPortfolio,
  dayPnl: number,
): CapitalSnapshot {
  return {
    totalValue: portfolio.totalValue,
    buyingPower: portfolio.buyingPower,
    dayPnl,
  }
}

export function computeDollarCaps(
  rules: StandingRules,
  capital: CapitalSnapshot,
): StandingEval['caps'] {
  const bp = Math.max(0, capital.buyingPower)
  const equity = Math.max(0, capital.totalValue)
  return {
    maxNotionalDollars: (rules.maxNotionalPctOfBuyingPower / 100) * bp,
    maxDayLossDollars: (rules.maxDayLossPctOfEquity / 100) * equity,
  }
}

/**
 * Build allowlist for watchlist_only mode.
 * Universe = board + crypto + positions + watchlist + extras.
 */
export function buildAllowedUniverse(args: {
  boardSymbols: string[]
  positionSymbols: string[]
  watchlistSymbols: string[]
  extraAllowedSymbols: string[]
}): Set<string> {
  const set = new Set<string>()
  for (const s of [
    ...args.boardSymbols,
    ...args.positionSymbols,
    ...args.watchlistSymbols,
    ...args.extraAllowedSymbols,
  ]) {
    const t = s.trim().toUpperCase()
    if (t) set.add(t)
  }
  return set
}

/**
 * Hard standing-rule evaluation. Trades outside rules are blocked.
 * Dollar caps recompute from live portfolio/BP each call.
 */
export function evaluateStandingRules(
  ticket: TicketDraft,
  rules: StandingRules,
  capital: CapitalSnapshot,
  mark: number,
  allowedUniverse: Set<string>,
): StandingEval {
  const caps = computeDollarCaps(rules, capital)
  const notional = ticketNotional(ticket, mark)
  const blocks: StandingBlock[] = []

  if (ticket.asset === 'Crypto') {
    blocks.push({
      id: 'asset',
      label: 'Asset class',
      detail: 'Crypto place path not armed on fast desk — equity/option only',
    })
  }

  const sym = ticket.symbol.trim().toUpperCase()
  if (rules.allowedSymbolsMode === 'watchlist_only') {
    if (!sym || !allowedUniverse.has(sym)) {
      blocks.push({
        id: 'symbol',
        label: 'Allowed symbols',
        detail: sym
          ? `${sym} outside watchlist universe (watchlist_only)`
          : 'No symbol — watchlist_only standing rule',
      })
    }
  }

  if (notional > caps.maxNotionalDollars + 1e-6) {
    blocks.push({
      id: 'notional',
      label: 'Max notional % BP',
      detail: `~$${notional.toFixed(2)} exceeds ${rules.maxNotionalPctOfBuyingPower}% of BP ($${caps.maxNotionalDollars.toFixed(2)})`,
    })
  }

  const dayLoss = Math.min(0, capital.dayPnl)
  const lossAbs = Math.abs(dayLoss)
  if (lossAbs >= caps.maxDayLossDollars - 1e-6 && caps.maxDayLossDollars > 0) {
    blocks.push({
      id: 'day-loss',
      label: 'Max day loss % equity',
      detail: `Session day loss $${lossAbs.toFixed(2)} at/over ${rules.maxDayLossPctOfEquity}% of equity ($${caps.maxDayLossDollars.toFixed(2)}) — further tickets blocked`,
    })
  }

  return {
    caps,
    notional,
    blocks,
    blocked: blocks.length > 0,
  }
}

export function formatPct(n: number): string {
  return `${n.toFixed(n % 1 === 0 ? 0 : 1)}%`
}
