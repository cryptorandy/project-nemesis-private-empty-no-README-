import { PORTFOLIO_MARKS } from '../data/agent-context'
import {
  CAPITAL_RULES,
  allowedUnderlyings,
} from '../data/options-scan'
import { RH_PORTFOLIO } from '../data/rh-snapshot'
import type { TicketDraft } from '../types'

/** Soft size caps — % capital rules on MCP ••••0788 */
export const RISK_CAPS = {
  maxPctBuyingPowerPerTrade: CAPITAL_RULES.maxPctBuyingPowerPerTrade,
  maxDayLossPctOfAccount: CAPITAL_RULES.maxDayLossPctOfAccount,
  watchlistOnly: CAPITAL_RULES.watchlistOnly,
  maxBookPct: 8,
  maxOptionContracts: 5,
  cryptoNotionalCap: 2000,
} as const

export type RiskLevel = 'pass' | 'warn' | 'block'

export type RiskCheck = {
  id: string
  label: string
  detail: string
  level: RiskLevel
}

export type RiskReport = {
  notional: number
  mark: number
  checks: RiskCheck[]
  worst: RiskLevel
  /** Soft block: warn/block present — confirm requires acknowledge. */
  needsAck: boolean
}

function worstLevel(levels: RiskLevel[]): RiskLevel {
  if (levels.includes('block')) return 'block'
  if (levels.includes('warn')) return 'warn'
  return 'pass'
}

export function estimateNotional(ticket: TicketDraft, mark: number): number {
  const px = ticket.order === 'Market' ? mark : ticket.limit
  const multiplier = ticket.asset === 'Option' ? 100 : 1
  return Math.max(0, ticket.qty) * Math.max(0, px) * multiplier
}

export function resolveMark(ticket: TicketDraft, liveMark?: number): number {
  if (typeof liveMark === 'number' && liveMark > 0) return liveMark
  if (ticket.order === 'Limit' && ticket.limit > 0) return ticket.limit
  return 0
}

/**
 * Pre-confirm soft checks vs % capital rules on baked RH portfolio.
 * Never places orders — advisory only for the human gate.
 */
export function runRiskSoftChecks(
  ticket: TicketDraft,
  liveMark?: number,
): RiskReport {
  const mark = resolveMark(ticket, liveMark)
  const notional = estimateNotional(ticket, mark)
  const book = RH_PORTFOLIO.totalValue || PORTFOLIO_MARKS.totalValue || 1
  const bp = RH_PORTFOLIO.buyingPower || PORTFOLIO_MARKS.buyingPower
  const bpCap = (bp * RISK_CAPS.maxPctBuyingPowerPerTrade) / 100
  const dayLossCap = (book * RISK_CAPS.maxDayLossPctOfAccount) / 100
  const pctBp = bp > 0 ? (notional / bp) * 100 : 999
  const allowed = allowedUnderlyings()

  const checks: RiskCheck[] = []

  if (!ticket.symbol.trim()) {
    checks.push({
      id: 'symbol',
      label: 'Symbol',
      detail: 'Enter a symbol before preview',
      level: 'block',
    })
  } else {
    checks.push({
      id: 'symbol',
      label: 'Symbol',
      detail: `${ticket.symbol} · ${ticket.asset}`,
      level: 'pass',
    })
  }

  if (ticket.qty <= 0) {
    checks.push({
      id: 'qty',
      label: 'Size',
      detail: 'Quantity must be > 0',
      level: 'block',
    })
  }

  // Watchlist-only (holdings + Superstar)
  if (ticket.symbol.trim() && RISK_CAPS.watchlistOnly) {
    const ok = allowed.has(ticket.symbol.trim().toUpperCase())
    checks.push({
      id: 'watchlist',
      label: 'Watchlist-only',
      detail: ok
        ? `${ticket.symbol} on holdings / Superstar universe`
        : `${ticket.symbol} not on watchlist/holdings — soft block`,
      level: ok ? 'pass' : 'block',
    })
  }

  // 10% buying power per trade
  if (ticket.side === 'Buy') {
    if (notional > bp) {
      checks.push({
        id: 'buying-power',
        label: 'Buying power',
        detail: `Need ~$${notional.toFixed(2)} · BP $${bp.toFixed(2)}`,
        level: 'block',
      })
    } else if (notional > bpCap) {
      checks.push({
        id: 'bp-pct',
        label: `${RISK_CAPS.maxPctBuyingPowerPerTrade}% BP / trade`,
        detail: `~$${notional.toFixed(2)} = ${pctBp.toFixed(1)}% BP · cap $${bpCap.toFixed(2)}`,
        level: 'warn',
      })
      checks.push({
        id: 'buying-power',
        label: 'Buying power',
        detail: `BP $${bp.toFixed(2)} covers premium · over % cap`,
        level: 'pass',
      })
    } else {
      checks.push({
        id: 'bp-pct',
        label: `${RISK_CAPS.maxPctBuyingPowerPerTrade}% BP / trade`,
        detail: `~$${notional.toFixed(2)} = ${pctBp.toFixed(1)}% BP under $${bpCap.toFixed(2)}`,
        level: 'pass',
      })
      checks.push({
        id: 'buying-power',
        label: 'Buying power',
        detail: `BP $${bp.toFixed(2)} covers ~$${notional.toFixed(2)}`,
        level: 'pass',
      })
    }
  } else {
    checks.push({
      id: 'buying-power',
      label: 'Buying power',
      detail: 'Sell · BP not consumed',
      level: 'pass',
    })
    checks.push({
      id: 'bp-pct',
      label: `${RISK_CAPS.maxPctBuyingPowerPerTrade}% BP / trade`,
      detail: 'Sell · % BP rule N/A',
      level: 'pass',
    })
  }

  // 5% account day-loss budget (premium at risk for long options ≈ max loss)
  if (ticket.side === 'Buy') {
    if (notional > dayLossCap) {
      checks.push({
        id: 'day-loss',
        label: `${RISK_CAPS.maxDayLossPctOfAccount}% day-loss budget`,
        detail: `Premium at risk ~$${notional.toFixed(2)} > $${dayLossCap.toFixed(2)} (${RISK_CAPS.maxDayLossPctOfAccount}% of $${book.toFixed(0)})`,
        level: 'warn',
      })
    } else {
      checks.push({
        id: 'day-loss',
        label: `${RISK_CAPS.maxDayLossPctOfAccount}% day-loss budget`,
        detail: `Premium at risk ~$${notional.toFixed(2)} ≤ $${dayLossCap.toFixed(2)}`,
        level: 'pass',
      })
    }
  }

  if (ticket.asset === 'Option') {
    const right = ticket.optionRight ?? 'Call'
    const strike = ticket.optionStrike
    const expiry = ticket.optionExpiry
    checks.push({
      id: 'option-structure',
      label: 'Options structure',
      detail: [
        `${right}`,
        strike != null ? `strike ${strike}` : null,
        expiry ? `exp ${expiry}` : null,
        'Greeks required on scanner ideas',
      ]
        .filter(Boolean)
        .join(' · '),
      level: strike != null && expiry ? 'pass' : 'warn',
    })
    if (ticket.qty > RISK_CAPS.maxOptionContracts) {
      checks.push({
        id: 'option-qty',
        label: 'Max option contracts',
        detail: `${ticket.qty} > ${RISK_CAPS.maxOptionContracts} soft cap`,
        level: 'block',
      })
    } else {
      checks.push({
        id: 'option-qty',
        label: 'Max option contracts',
        detail: `${ticket.qty} ≤ ${RISK_CAPS.maxOptionContracts}`,
        level: 'pass',
      })
    }
  }

  if (ticket.asset === 'Crypto') {
    checks.push({
      id: 'crypto-stub',
      label: 'Crypto ticket',
      detail: 'Crypto stub — marks from snapshot; same confirm ritual',
      level: 'warn',
    })
    if (notional > RISK_CAPS.cryptoNotionalCap) {
      checks.push({
        id: 'crypto-cap',
        label: 'Crypto notional cap',
        detail: `~$${notional.toFixed(2)} exceeds $${RISK_CAPS.cryptoNotionalCap.toLocaleString()}`,
        level: 'block',
      })
    } else {
      checks.push({
        id: 'crypto-cap',
        label: 'Crypto notional cap',
        detail: `~$${notional.toFixed(2)} under $${RISK_CAPS.cryptoNotionalCap.toLocaleString()}`,
        level: 'pass',
      })
    }
  }

  if (ticket.asset === 'Equity') {
    const existing = 0
    const postNameValue =
      ticket.side === 'Buy' ? existing + notional : Math.max(0, existing - notional)
    const concentrationPct = (postNameValue / book) * 100
    if (concentrationPct > RISK_CAPS.maxBookPct) {
      checks.push({
        id: 'concentration',
        label: 'Concentration / name',
        detail: `Post-trade ~${concentrationPct.toFixed(1)}% of book (cap ${RISK_CAPS.maxBookPct}%)`,
        level: 'warn',
      })
    } else {
      checks.push({
        id: 'concentration',
        label: 'Concentration / name',
        detail: `Post-trade ~${concentrationPct.toFixed(1)}% of book (cap ${RISK_CAPS.maxBookPct}%)`,
        level: 'pass',
      })
    }
  }

  const worst = worstLevel(checks.map((c) => c.level))
  return {
    notional,
    mark,
    checks,
    worst,
    needsAck: worst !== 'pass',
  }
}
