import { RH_AGENTIC_ACCOUNT } from './rhAccount'
import type { TicketDraft } from '../types'

/** Params shaped for Robinhood MCP `review_equity_order` / `place_equity_order`. */
export type RhEquityOrderParams = {
  /**
   * Masked in the browser bundle (TD-17). Agents replace with the real
   * agentic account_number from get_accounts before review or place tools.
   */
  account_number: string
  account_resolve: 'agentic_allowed'
  account_masked: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit'
  quantity: string
  limit_price?: string
  time_in_force: 'gfd' | 'gtc'
  market_hours: 'regular_hours'
  ref_id?: string
}

/** Params shaped for Robinhood MCP `review_option_order` / `place_option_order`. */
export type RhOptionOrderParams = {
  account_number: string
  account_resolve: 'agentic_allowed'
  account_masked: string
  legs: Array<{
    option_id: string
    side: 'buy' | 'sell'
    position_effect: 'open' | 'close'
    ratio_quantity: number
  }>
  quantity: string
  type: 'market' | 'limit'
  price?: string
  time_in_force: 'gfd' | 'gtc'
  market_hours: 'regular_hours'
  /** Desk metadata — not sent to RH; helps agents resolve option_id. */
  _desk: {
    underlying: string
    right: 'Call' | 'Put'
    strike: number
    expiry: string
    optionId?: string
  }
  ref_id?: string
}

export type RhOrderPayload =
  | { asset: 'Equity'; params: RhEquityOrderParams }
  | { asset: 'Option'; params: RhOptionOrderParams }
  | { asset: 'Crypto'; error: string }

function newRefId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `nem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Map desk ticket → RH MCP equity order params.
 * Agents pass these to review_equity_order then place_equity_order after confirm.
 */
export function toRhEquityParams(
  ticket: TicketDraft,
  refId?: string,
): RhEquityOrderParams {
  const type = ticket.order === 'Market' ? 'market' : 'limit'
  const params: RhEquityOrderParams = {
    account_number: RH_AGENTIC_ACCOUNT.masked,
    account_resolve: RH_AGENTIC_ACCOUNT.resolveHint,
    account_masked: RH_AGENTIC_ACCOUNT.masked,
    symbol: ticket.symbol.trim().toUpperCase(),
    side: ticket.side === 'Buy' ? 'buy' : 'sell',
    type,
    quantity: String(ticket.qty),
    time_in_force: ticket.tif === 'GTC' ? 'gtc' : 'gfd',
    market_hours: 'regular_hours',
    ref_id: refId ?? newRefId(),
  }
  if (type === 'limit') {
    params.limit_price = ticket.limit.toFixed(2)
  }
  return params
}

/**
 * Map desk option ticket → RH MCP option order params.
 * Requires optionId (from scanner / get_option_instruments) for live place.
 */
export function toRhOptionParams(
  ticket: TicketDraft,
  refId?: string,
): RhOptionOrderParams | { error: string } {
  const optionId = ticket.optionId?.trim()
  if (!optionId) {
    return {
      error:
        'Option ticket missing optionId — scanner must stage RH instrument UUID for live place',
    }
  }
  const type = ticket.order === 'Market' ? 'market' : 'limit'
  const params: RhOptionOrderParams = {
    account_number: RH_AGENTIC_ACCOUNT.masked,
    account_resolve: RH_AGENTIC_ACCOUNT.resolveHint,
    account_masked: RH_AGENTIC_ACCOUNT.masked,
    legs: [
      {
        option_id: optionId,
        side: ticket.side === 'Buy' ? 'buy' : 'sell',
        position_effect: ticket.side === 'Buy' ? 'open' : 'close',
        ratio_quantity: 1,
      },
    ],
    quantity: String(Math.max(1, Math.floor(ticket.qty))),
    type,
    time_in_force: ticket.tif === 'GTC' ? 'gtc' : 'gfd',
    market_hours: 'regular_hours',
    _desk: {
      underlying: ticket.symbol.trim().toUpperCase(),
      right: ticket.optionRight ?? 'Call',
      strike: ticket.optionStrike ?? 0,
      expiry: ticket.optionExpiry ?? '',
      optionId,
    },
    ref_id: refId ?? newRefId(),
  }
  if (type === 'limit') {
    params.price = ticket.limit.toFixed(2)
  }
  return params
}

export function toRhOrderPayload(ticket: TicketDraft): RhOrderPayload {
  if (ticket.asset === 'Equity') {
    return { asset: 'Equity', params: toRhEquityParams(ticket) }
  }
  if (ticket.asset === 'Option') {
    const opt = toRhOptionParams(ticket)
    if ('error' in opt) {
      return { asset: 'Crypto', error: opt.error }
    }
    return { asset: 'Option', params: opt }
  }
  return { asset: 'Crypto', error: 'Crypto RH place not wired on fast path' }
}
