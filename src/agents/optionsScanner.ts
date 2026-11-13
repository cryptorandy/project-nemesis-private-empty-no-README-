/**
 * Options buy-idea scanner — Greeks are a hard gate.
 * Missing delta/gamma/theta/vega ⇒ contract is never recommended.
 * Ranking uses Greeks + unusual activity + earnings + % capital fit.
 * Never places orders.
 */

import {
  CAPITAL_RULES,
  OPTION_CONTRACTS,
  OPTIONS_SCAN_AS_OF,
  allowedUnderlyings,
  hasRequiredGreeks,
  type OptionContractBake,
  type OptionGreeks,
} from '../data/options-scan'
import { PORTFOLIO_MARKS } from '../data/agent-context'

export type OptionIdeaRisk = 'fit' | 'warn' | 'block'

export type OptionBuyIdea = {
  id: string
  rank: number
  score: number
  underlying: string
  structure: 'long-call' | 'long-put'
  right: 'Call' | 'Put'
  strike: number
  expiry: string
  mark: number
  qty: number
  /** Premium notional = mark × 100 × qty */
  notional: number
  greeks: OptionGreeks
  thesis: string
  riskNote: string
  risk: OptionIdeaRisk
  pctOfBuyingPower: number
  maxBpBudget: number
  volume: number
  openInterest: number
  volOiRatio: number
  instrumentId: string
  universe: 'holding' | 'watchlist'
  earningsDate?: string
  asOf: string
}

function premiumNotional(mark: number, qty: number): number {
  return mark * CAPITAL_RULES.multiplier * qty
}

function daysToExpiry(expiry: string): number {
  return Math.max(
    0,
    Math.round((new Date(expiry).getTime() - Date.now()) / (24 * 3600 * 1000)),
  )
}

function unusualScore(c: OptionContractBake): number {
  const oi = Math.max(c.openInterest, 1)
  const ratio = c.volume / oi
  // Elevated print vs open interest
  if (ratio >= 3) return 28
  if (ratio >= 1.5) return 20
  if (ratio >= 0.8) return 12
  if (c.volume >= 5000) return 10
  if (c.volume >= 1000) return 6
  return 2
}

function deltaScore(delta: number, right: 'call' | 'put'): number {
  const d = right === 'put' ? Math.abs(delta) : delta
  // Prefer directional buys with usable delta, not deep ITM / lottery
  if (d >= 0.35 && d <= 0.55) return 22
  if (d >= 0.28 && d < 0.35) return 16
  if (d > 0.55 && d <= 0.65) return 12
  if (d >= 0.2 && d < 0.28) return 8
  return 2
}

function gammaScore(gamma: number): number {
  if (gamma >= 0.05) return 10
  if (gamma >= 0.02) return 7
  if (gamma >= 0.01) return 4
  return 1
}

function thetaPenalty(theta: number, mark: number): number {
  const burn = Math.abs(theta) / Math.max(mark, 0.05)
  if (burn >= 0.12) return -14
  if (burn >= 0.08) return -8
  if (burn >= 0.05) return -4
  return 0
}

function vegaEarningsBoost(vega: number, earningsDate?: string): number {
  if (!earningsDate) return vega >= 0.08 ? 4 : 0
  const days = Math.round(
    (new Date(earningsDate).getTime() - Date.now()) / (24 * 3600 * 1000),
  )
  if (days < 0 || days > 7) return 0
  // Near earnings: reward vega exposure for directional IV event
  if (vega >= 0.08) return 18
  if (vega >= 0.03) return 10
  return 6
}

function ivContext(iv: number | null): string {
  if (iv == null) return 'IV n/a'
  const pct = (iv * 100).toFixed(0)
  if (iv >= 1.2) return `IV ${pct}% elevated`
  if (iv >= 0.6) return `IV ${pct}% rich`
  if (iv >= 0.35) return `IV ${pct}%`
  return `IV ${pct}% quiet`
}

function capitalFit(
  notional: number,
  buyingPower: number,
  accountValue: number,
): { risk: OptionIdeaRisk; note: string; pctBp: number; budget: number } {
  const budget = (buyingPower * CAPITAL_RULES.maxPctBuyingPowerPerTrade) / 100
  const dayLossCap =
    (accountValue * CAPITAL_RULES.maxDayLossPctOfAccount) / 100
  const pctBp = buyingPower > 0 ? (notional / buyingPower) * 100 : 999

  if (notional > buyingPower) {
    return {
      risk: 'block',
      note: `Premium $${notional.toFixed(0)} > BP $${buyingPower.toFixed(0)}`,
      pctBp,
      budget,
    }
  }
  if (notional > budget) {
    return {
      risk: 'warn',
      note: `${pctBp.toFixed(0)}% BP · cap ${CAPITAL_RULES.maxPctBuyingPowerPerTrade}% ($${budget.toFixed(0)}) · day-loss budget $${dayLossCap.toFixed(0)}`,
      pctBp,
      budget,
    }
  }
  return {
    risk: 'fit',
    note: `${pctBp.toFixed(1)}% BP under ${CAPITAL_RULES.maxPctBuyingPowerPerTrade}% cap · day-loss $${dayLossCap.toFixed(0)}`,
    pctBp,
    budget,
  }
}

function buildThesis(c: OptionContractBake, dte: number): string {
  const g = c.greeks
  const parts: string[] = []
  if (c.earningsDate) {
    parts.push(`Earnings ${c.earningsDate} · vega ${g.vega.toFixed(3)}`)
  }
  const oi = Math.max(c.openInterest, 1)
  const ratio = c.volume / oi
  if (ratio >= 1.5 || c.volume >= 5000) {
    parts.push(`unusual vol ${c.volume.toLocaleString()} / OI ${c.openInterest.toLocaleString()}`)
  }
  parts.push(
    `Δ ${g.delta.toFixed(2)} Γ ${g.gamma.toFixed(3)} Θ ${g.theta.toFixed(2)} ν ${g.vega.toFixed(3)}`,
  )
  parts.push(ivContext(g.iv))
  parts.push(`${dte}d to exp`)
  return parts.join(' · ')
}

function scoreContract(c: OptionContractBake): number {
  const g = c.greeks
  let score = 0
  score += unusualScore(c)
  score += deltaScore(g.delta, c.right)
  score += gammaScore(g.gamma)
  score += thetaPenalty(g.theta, c.mark)
  score += vegaEarningsBoost(g.vega, c.earningsDate)
  if (c.universe === 'holding') score += 4
  // Prefer contracts that can fit % BP when mark is small
  const notional = premiumNotional(c.mark, 1)
  const budget =
    (PORTFOLIO_MARKS.buyingPower * CAPITAL_RULES.maxPctBuyingPowerPerTrade) /
    100
  if (notional <= budget) score += 16
  else if (notional <= PORTFOLIO_MARKS.buyingPower) score += 4
  else score -= 10
  return score
}

/**
 * Rank buy ideas. Drops any contract missing required Greeks.
 * qty always 1 for this MCP account size — never auto-places.
 */
export function rankOptionBuyIdeas(
  buyingPower = PORTFOLIO_MARKS.buyingPower,
  accountValue = PORTFOLIO_MARKS.totalValue,
  limit = 6,
): OptionBuyIdea[] {
  const allowed = allowedUnderlyings()
  const scored: OptionBuyIdea[] = []

  for (const c of OPTION_CONTRACTS) {
    if (!hasRequiredGreeks(c.greeks)) continue
    if (CAPITAL_RULES.watchlistOnly && !allowed.has(c.underlying)) continue

    const qty = 1
    const notional = premiumNotional(c.mark, qty)
    const fit = capitalFit(notional, buyingPower, accountValue)
    const dte = daysToExpiry(c.expiry)
    const oi = Math.max(c.openInterest, 1)

    scored.push({
      id: c.instrumentId,
      rank: 0,
      score: scoreContract(c),
      underlying: c.underlying,
      structure: c.right === 'call' ? 'long-call' : 'long-put',
      right: c.right === 'call' ? 'Call' : 'Put',
      strike: c.strike,
      expiry: c.expiry,
      mark: c.mark,
      qty,
      notional,
      greeks: { ...c.greeks },
      thesis: buildThesis(c, dte),
      riskNote: fit.note,
      risk: fit.risk,
      pctOfBuyingPower: fit.pctBp,
      maxBpBudget: fit.budget,
      volume: c.volume,
      openInterest: c.openInterest,
      volOiRatio: c.volume / oi,
      instrumentId: c.instrumentId,
      universe: c.universe,
      earningsDate: c.earningsDate,
      asOf: OPTIONS_SCAN_AS_OF,
    })
  }

  scored.sort((a, b) => b.score - a.score || a.notional - b.notional)
  return scored.slice(0, limit).map((idea, i) => ({ ...idea, rank: i + 1 }))
}

export function ideaToStagedFields(idea: OptionBuyIdea) {
  return {
    asset: 'Option' as const,
    side: 'Buy' as const,
    symbol: idea.underlying,
    qty: idea.qty,
    order: 'Limit' as const,
    limit: Number(idea.mark.toFixed(2)),
    tif: 'Day' as const,
    optionRight: idea.right,
    optionStrike: idea.strike,
    optionExpiry: idea.expiry,
    reason: `#${idea.rank} ${idea.structure} · ${idea.thesis} · ${idea.riskNote} · NEVER place`,
  }
}
