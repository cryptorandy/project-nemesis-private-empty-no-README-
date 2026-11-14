/**
 * RH preview → place bridge (TD-34).
 *
 * Browser cannot call Robinhood MCP. Preview builds an RH-shaped review_*
 * payload for the gate. After ConfirmGate, we enqueue a place intent that
 * agents may execute with place_* ONLY when deskConfirmed === true.
 *
 * Never unsupervised. Never auto-place.
 */
import type { TicketDraft, TicketPreview } from '../types'
import { RH_AGENTIC_ACCOUNT } from './rhAccount'
import {
  toRhCryptoParams,
  toRhEquityParams,
  toRhOptionParams,
  type RhCryptoOrderParams,
  type RhEquityOrderParams,
  type RhOptionOrderParams,
} from './rhOrderParams'

export type RhReviewAlert = {
  code: string
  severity: 'info' | 'warn' | 'block'
  message: string
}

export type RhReviewPayload = {
  tool:
    | 'review_equity_order'
    | 'review_option_order'
    | 'preview_crypto_order'
  accountMasked: string
  asOf: string
  quote: { symbol: string; mark: number }
  params: RhEquityOrderParams | RhOptionOrderParams | RhCryptoOrderParams
  alerts: RhReviewAlert[]
  /** Soft local review — agent re-runs live review_* before place. */
  source: 'desk-soft-review'
  note: string
}

export type PlaceBridgeIntent = {
  id: string
  createdAt: string
  confirmedAt: string
  deskConfirmed: true
  previewId: string
  ticket: TicketDraft
  review: RhReviewPayload
  rhParams: RhEquityOrderParams | RhOptionOrderParams | RhCryptoOrderParams
  agentHint: string
  /** Agents set after place_* succeeds — never set by unsupervised code. */
  placedRhOrderId?: string
  status: 'queued' | 'placed' | 'abandoned'
}

const QUEUE_KEY = 'nemesis.placeBridgeQueue'

function isoNow(): string {
  return new Date().toISOString()
}

function toolFor(asset: TicketDraft['asset']): RhReviewPayload['tool'] {
  if (asset === 'Option') return 'review_option_order'
  if (asset === 'Crypto') return 'preview_crypto_order'
  return 'review_equity_order'
}

/**
 * Soft RH-shaped review for Preview / ConfirmGate.
 * Agents must still call live review_* / preview_* before place_*.
 */
export function softReviewTicket(
  ticket: TicketDraft,
  mark: number,
  buyingPower: number,
): RhReviewPayload {
  const alerts: RhReviewAlert[] = []
  const notional =
    ticket.asset === 'Option'
      ? ticket.qty * (ticket.order === 'Market' ? mark : ticket.limit) * 100
      : ticket.qty * (ticket.order === 'Market' ? mark : ticket.limit)

  if (notional > buyingPower + 1e-6) {
    alerts.push({
      code: 'buying_power',
      severity: 'block',
      message: `Est. notional $${notional.toFixed(2)} exceeds BP $${buyingPower.toFixed(2)}`,
    })
  } else if (notional > buyingPower * 0.1) {
    alerts.push({
      code: 'size',
      severity: 'warn',
      message: `Est. notional $${notional.toFixed(2)} > 10% of BP`,
    })
  } else {
    alerts.push({
      code: 'buying_power',
      severity: 'info',
      message: `BP $${buyingPower.toFixed(2)} covers est. $${notional.toFixed(2)}`,
    })
  }

  let params: RhEquityOrderParams | RhOptionOrderParams | RhCryptoOrderParams
  if (ticket.asset === 'Equity') {
    params = toRhEquityParams(ticket)
  } else if (ticket.asset === 'Option') {
    const opt = toRhOptionParams(ticket)
    if ('error' in opt) {
      alerts.push({
        code: 'option_id',
        severity: 'warn',
        message: opt.error,
      })
      params = toRhEquityParams({ ...ticket, asset: 'Equity' })
    } else {
      params = opt
    }
  } else {
    params = toRhCryptoParams(ticket)
  }

  const symbol =
    ticket.asset === 'Crypto'
      ? (params as RhCryptoOrderParams).symbol
      : ticket.symbol

  return {
    tool: toolFor(ticket.asset),
    accountMasked: RH_AGENTIC_ACCOUNT.masked,
    asOf: isoNow(),
    quote: { symbol, mark },
    params,
    alerts,
    source: 'desk-soft-review',
    note: `Soft ${toolFor(ticket.asset)} · agent re-runs live MCP review before place_* · desk confirm required`,
  }
}

export function reviewNoteFromPayload(review: RhReviewPayload): string {
  const worst = review.alerts.some((a) => a.severity === 'block')
    ? 'BLOCK'
    : review.alerts.some((a) => a.severity === 'warn')
      ? 'WARN'
      : 'OK'
  const head = review.alerts[0]?.message ?? review.note
  return `${review.tool} · ${worst} · ${head}`
}

export function readPlaceBridgeQueue(): PlaceBridgeIntent[] {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as PlaceBridgeIntent[]) : []
  } catch {
    return []
  }
}

function writeQueue(items: PlaceBridgeIntent[]) {
  try {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(0, 40)))
  } catch {
    // ignore quota
  }
}

/**
 * Enqueue place intent ONLY after ConfirmGate confirm.
 * Agents: place_* only when deskConfirmed === true on this record.
 */
export function enqueueConfirmedPlace(args: {
  preview: TicketPreview
  ticket: TicketDraft
  review: RhReviewPayload
  orderId: string
  agentHint: string
  rhParams: RhEquityOrderParams | RhOptionOrderParams | RhCryptoOrderParams
}): PlaceBridgeIntent {
  const intent: PlaceBridgeIntent = {
    id: args.orderId,
    createdAt: isoNow(),
    confirmedAt: isoNow(),
    deskConfirmed: true,
    previewId: args.preview.id,
    ticket: { ...args.ticket },
    review: args.review,
    rhParams: args.rhParams,
    agentHint: args.agentHint,
    status: 'queued',
  }
  const next = [intent, ...readPlaceBridgeQueue()]
  writeQueue(next)
  return intent
}

export function formatBridgeAgentBrief(intent: PlaceBridgeIntent): string {
  return [
    `DESK CONFIRMED place intent ${intent.id}`,
    `deskConfirmed=true @ ${intent.confirmedAt}`,
    `preview ${intent.previewId}`,
    `tool chain: live ${intent.review.tool} → place_*`,
    intent.agentHint,
    'NEVER place if deskConfirmed is missing/false',
  ].join(' · ')
}
