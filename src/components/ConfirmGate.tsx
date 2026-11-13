import type { TicketDraft } from '../types'

type ConfirmGateProps = {
  ticket: TicketDraft
  killed: boolean
  previewed: boolean
  onBack: () => void
  onConfirm: () => void
}

export function ConfirmGate({
  ticket,
  killed,
  previewed,
  onBack,
  onConfirm,
}: ConfirmGateProps) {
  const summary = `${ticket.side.toUpperCase()} ${ticket.qty} ${ticket.symbol}`

  return (
    <div className="modal-backdrop" role="presentation" onClick={onBack}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="modal-kicker">Confirm before trade</p>
        <h2 id="gate-title">Human gate</h2>
        <p>
          You are about to <strong>mock-confirm</strong> a{' '}
          <code>{summary}</code> ticket. This scaffold does{' '}
          <strong>not</strong> place a real Robinhood order.
        </p>
        <ul className="gate-list">
          <li>
            <span className={`gate-pip ${previewed ? '' : 'off'}`} />
            Preview completed (mock)
          </li>
          <li>
            <span className="gate-pip" />
            Risk Guard soft-check · placeholder pass
          </li>
          <li>
            <span className={`gate-pip ${killed ? 'off' : ''}`} />
            Kill switch {killed ? 'engaged' : 'off'}
          </li>
        </ul>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!previewed || killed}
            onClick={onConfirm}
          >
            Confirm (mock only)
          </button>
        </div>
      </div>
    </div>
  )
}
