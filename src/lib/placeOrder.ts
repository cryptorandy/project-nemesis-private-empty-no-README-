import type { TicketDraft } from '../types'
import { mockPlaceOrder, type MockPlaceResult } from './mockPlace'
import {
  toRhCryptoParams,
  toRhEquityParams,
  toRhOptionParams,
  type RhCryptoOrderParams,
  type RhEquityOrderParams,
  type RhOptionOrderParams,
} from './rhOrderParams'
import { RH_AGENTIC_ACCOUNT } from './rhAccount'

/**
 * Live RH MCP place cannot run inside the hosted browser.
 * After human confirm, we either mock-place or queue a live intent whose
 * params match review_* / place_* MCP tools for an agent bridge.
 *
 * Flip only when a safe server/agent bridge exists — never unsupervised.
 */
export const LIVE_PLACE_VIA_AGENT_BRIDGE = true as const

export type PlaceMode = 'mock' | 'live-intent'

export type PlaceResult = {
  ok: true
  mode: PlaceMode
  orderId: string
  placedAt: string
  summary: string
  note: string
  rhParams?: RhEquityOrderParams | RhOptionOrderParams | RhCryptoOrderParams
  /** Agents: call review_* then place_* with these params after UI confirm. */
  agentHint: string
}

export type PlaceRefusal = {
  ok: false
  reason: string
}

/**
 * Sole place entrypoint after ConfirmGate human confirm.
 * Always requires prior explicit confirm (caller responsibility).
 * Never auto-places; never skips standing-rule checks (caller must block first).
 */
export function placeAfterConfirm(
  ticket: TicketDraft,
  opts?: { preferLiveIntent?: boolean },
): PlaceResult | PlaceRefusal {
  const preferLive =
    opts?.preferLiveIntent !== false && LIVE_PLACE_VIA_AGENT_BRIDGE

  if (ticket.asset === 'Crypto') {
    const rhParams = toRhCryptoParams(ticket)
    if (preferLive) {
      const orderId = `live-intent-${rhParams.ref_id ?? Date.now().toString(36)}`
      return {
        ok: true,
        mode: 'live-intent',
        orderId,
        placedAt: new Date().toISOString(),
        summary: `${ticket.side.toUpperCase()} ${ticket.qty} ${rhParams.symbol} crypto`,
        note: `Confirmed · queued RH place_crypto_order on ${RH_AGENTIC_ACCOUNT.masked} — agent must preview_crypto_order then place_crypto_order (never unsupervised)`,
        rhParams,
        agentHint:
          'MCP: preview_crypto_order(params) → on clear + human already confirmed in desk → place_crypto_order(params)',
      }
    }
    const mock: MockPlaceResult = mockPlaceOrder(ticket)
    return {
      ...mock,
      mode: 'mock',
      rhParams,
      agentHint: 'Mock only — RH crypto place not invoked',
    }
  }

  if (ticket.asset === 'Equity') {
    const rhParams = toRhEquityParams(ticket)
    if (preferLive) {
      const orderId = `live-intent-${rhParams.ref_id ?? Date.now().toString(36)}`
      return {
        ok: true,
        mode: 'live-intent',
        orderId,
        placedAt: new Date().toISOString(),
        summary: `${ticket.side.toUpperCase()} ${ticket.qty} ${ticket.symbol} equity`,
        note: `Confirmed · queued RH place_equity_order on ${RH_AGENTIC_ACCOUNT.masked} — agent must review_equity_order then place_equity_order (never unsupervised)`,
        rhParams,
        agentHint:
          'MCP: review_equity_order(params) → on clear + human already confirmed in desk → place_equity_order(params)',
      }
    }
    const mock: MockPlaceResult = mockPlaceOrder(ticket)
    return {
      ...mock,
      mode: 'mock',
      rhParams,
      agentHint: 'Mock only — RH place not invoked',
    }
  }

  // Option
  const opt = toRhOptionParams(ticket)
  if ('error' in opt) {
    const mock = mockPlaceOrder(ticket)
    return {
      ok: true,
      mode: preferLive ? 'live-intent' : 'mock',
      orderId: preferLive
        ? `opt-intent-${Date.now().toString(36)}`
        : mock.orderId,
      placedAt: new Date().toISOString(),
      summary: `${ticket.side.toUpperCase()} ${ticket.qty} ${ticket.symbol} ${ticket.optionRight ?? 'Call'} ${ticket.optionStrike ?? ''}`.trim(),
      note: preferLive
        ? `Confirmed option · ${opt.error} · agent must resolve option_id then review_option_order / place_option_order`
        : mock.note,
      agentHint:
        'MCP: get_option_instruments → review_option_order → place_option_order after desk confirm',
    }
  }

  if (preferLive) {
    const orderId = `live-intent-${opt.ref_id ?? Date.now().toString(36)}`
    return {
      ok: true,
      mode: 'live-intent',
      orderId,
      placedAt: new Date().toISOString(),
      summary: `${ticket.side.toUpperCase()} ${ticket.qty} ${ticket.symbol} ${ticket.optionRight ?? 'Call'} ${ticket.optionStrike ?? ''}`,
      note: `Confirmed · queued RH place_option_order on ${RH_AGENTIC_ACCOUNT.masked} — agent must review_option_order then place_option_order`,
      rhParams: opt,
      agentHint:
        'MCP: review_option_order(params) → place_option_order(params) after desk confirm',
    }
  }

  const mock = mockPlaceOrder(ticket)
  return {
    ...mock,
    mode: 'mock',
    rhParams: opt,
    agentHint: 'Mock only — RH option place not invoked',
  }
}
