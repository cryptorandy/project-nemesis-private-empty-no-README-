import type { TicketDraft } from '../types'

/**
 * Live Robinhood place is intentionally unreachable from this UI.
 * Flip only when a safe server-side write path + confirm ritual exist.
 */
export const ALLOW_LIVE_PLACE = false as const

export type MockPlaceResult = {
  ok: true
  mode: 'mock'
  orderId: string
  placedAt: string
  summary: string
  note: string
}

/**
 * Mock place — the only place path in this build.
 * Must be invoked exclusively from the ConfirmGate confirm handler.
 * Never calls Robinhood place-order APIs.
 */
export function mockPlaceOrder(ticket: TicketDraft): MockPlaceResult {
  if (ALLOW_LIVE_PLACE) {
    throw new Error(
      'ALLOW_LIVE_PLACE is true but no RH write adapter is wired — refusing place',
    )
  }

  const px =
    ticket.order === 'Market' ? 'MKT' : `$${ticket.limit.toFixed(2)}`
  const orderId = `mock-${Date.now().toString(36)}`

  return {
    ok: true,
    mode: 'mock',
    orderId,
    placedAt: new Date().toISOString(),
    summary: `${ticket.side.toUpperCase()} ${ticket.qty} ${ticket.symbol} ${ticket.order} ${px}`,
    note: 'Mock place only — no Robinhood place-order call',
  }
}
