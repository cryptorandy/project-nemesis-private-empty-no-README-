import type { TicketAsset, TicketDraft, TicketOrder, TicketPhase, TicketSide } from '../types'

type TicketRailProps = {
  ticket: TicketDraft
  phase: TicketPhase
  killed: boolean
  onChange: (patch: Partial<TicketDraft>) => void
  onPreview: () => void
  onOpenGate: () => void
  onCancel: () => void
  onNewDraft: () => void
}

export function TicketRail({
  ticket,
  phase,
  killed,
  onChange,
  onPreview,
  onOpenGate,
  onCancel,
  onNewDraft,
}: TicketRailProps) {
  const notional = ticket.qty * ticket.limit
  const confirmed = phase === 'confirmed'
  const previewed = phase === 'previewed' || confirmed

  return (
    <aside className="ticket-rail" aria-label="Ticket rail">
      <div className="ticket-head">
        <span className="ticket-label">Ticket rail</span>
        <span className={`badge ${phase}`}>
          {phase === 'confirmed' ? 'confirmed-mock' : phase}
        </span>
      </div>
      <h2 className="ticket-title">Draft ticket</h2>
      <div className="mock-banner">
        Mock flow only — never calls Robinhood place-order APIs.
      </div>

      {killed && (
        <p className="locked-note">Confirm locked · kill switch engaged</p>
      )}

      <div className="ticket-form">
        <div className="field-row">
          <div className="field">
            <label htmlFor="asset">Asset</label>
            <select
              id="asset"
              value={ticket.asset}
              disabled={confirmed}
              onChange={(e) =>
                onChange({ asset: e.target.value as TicketAsset })
              }
            >
              <option>Equity</option>
              <option>Option</option>
              <option>Crypto</option>
            </select>
          </div>
          <div className="field">
            <label>Side</label>
            <div className="seg">
              {(['Buy', 'Sell'] as TicketSide[]).map((side) => (
                <button
                  key={side}
                  type="button"
                  className={ticket.side === side ? 'on' : ''}
                  disabled={confirmed}
                  onClick={() => onChange({ side })}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="symbol">Symbol</label>
          <input
            id="symbol"
            value={ticket.symbol}
            disabled={confirmed}
            onChange={(e) =>
              onChange({ symbol: e.target.value.toUpperCase() })
            }
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="qty">Qty</label>
            <input
              id="qty"
              type="number"
              min={1}
              value={ticket.qty}
              disabled={confirmed}
              onChange={(e) =>
                onChange({ qty: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </div>
          <div className="field">
            <label>Order</label>
            <div className="seg">
              {(['Limit', 'Market'] as TicketOrder[]).map((order) => (
                <button
                  key={order}
                  type="button"
                  className={ticket.order === order ? 'on' : ''}
                  disabled={confirmed}
                  onClick={() => onChange({ order })}
                >
                  {order}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="limit">Limit</label>
          <input
            id="limit"
            type="number"
            step="0.01"
            value={ticket.limit}
            disabled={confirmed || ticket.order === 'Market'}
            onChange={(e) =>
              onChange({ limit: Number(e.target.value) || 0 })
            }
          />
        </div>

        {previewed && (
          <div className="preview-box">
            MOCK preview · {ticket.side.toUpperCase()} {ticket.qty}{' '}
            {ticket.symbol} @ ${ticket.limit.toFixed(2)} · notional ~
            ${notional.toLocaleString('en-US')} · no broker call
          </div>
        )}
      </div>

      <div className="ticket-actions">
        {confirmed ? (
          <button type="button" className="btn btn-primary btn-block" onClick={onNewDraft}>
            New draft
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={onPreview}
            >
              Preview (mock)
            </button>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={killed || !previewed}
              onClick={onOpenGate}
            >
              Confirm gate…
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={onCancel}
            >
              Cancel draft
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
