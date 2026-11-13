import { RH_PORTFOLIO, RH_POSITIONS } from '../data/rh-snapshot'
import type { TicketDraft } from '../types'

/** Soft size caps — placeholders until live Risk Guard owns limits. */
export const RISK_CAPS = {
  maxNotional: 5000,
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
 * Pre-confirm soft checks against baked RH portfolio + stub caps.
 * Never places orders — advisory only for the human gate.
 */
export function runRiskSoftChecks(
  ticket: TicketDraft,
  liveMark?: number,
): RiskReport {
  const mark = resolveMark(ticket, liveMark)
  const notional = estimateNotional(ticket, mark)
  const book = RH_PORTFOLIO.totalValue || 1
  const bp = RH_PORTFOLIO.buyingPower
  const existing =
    RH_POSITIONS.find((p) => p.symbol === ticket.symbol)?.value ?? 0
  const postNameValue =
    ticket.side === 'Buy' ? existing + notional : Math.max(0, existing - notional)
  const concentrationPct = (postNameValue / book) * 100

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

  if (ticket.asset === 'Equity') {
    if (notional > RISK_CAPS.maxNotional) {
      checks.push({
        id: 'notional',
        label: 'Max notional / ticket',
        detail: `~$${notional.toFixed(2)} exceeds $${RISK_CAPS.maxNotional.toLocaleString()} soft cap`,
        level: 'block',
      })
    } else if (notional > RISK_CAPS.maxNotional * 0.6) {
      checks.push({
        id: 'notional',
        label: 'Max notional / ticket',
        detail: `~$${notional.toFixed(2)} · approaching $${RISK_CAPS.maxNotional.toLocaleString()} cap`,
        level: 'warn',
      })
    } else {
      checks.push({
        id: 'notional',
        label: 'Max notional / ticket',
        detail: `~$${notional.toFixed(2)} under $${RISK_CAPS.maxNotional.toLocaleString()}`,
        level: 'pass',
      })
    }
  }

  if (ticket.asset === 'Option') {
    checks.push({
      id: 'option-stub',
      label: 'Options ticket',
      detail: 'Structure stub — chain preview not wired; soft-check only',
      level: 'warn',
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

  if (ticket.side === 'Buy') {
    if (notional > bp) {
      checks.push({
        id: 'buying-power',
        label: 'Buying power',
        detail: `Need ~$${notional.toFixed(2)} · BP $${bp.toFixed(2)} (placeholder snap)`,
        level: 'warn',
      })
    } else {
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
