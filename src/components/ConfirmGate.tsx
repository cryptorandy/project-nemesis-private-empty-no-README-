import { useState } from 'react'
import type { RiskReport } from '../lib/riskChecks'
import type { TicketDraft, TicketPreview } from '../types'

type ConfirmGateProps = {
  ticket: TicketDraft
  preview: TicketPreview | null
  risk: RiskReport
  killed: boolean
  previewed: boolean
  onBack: () => void
  /** Sole path into mock place — never call place outside this handler. */
  onConfirm: () => void
}

export function ConfirmGate({
  ticket,
  preview,
  risk,
  killed,
  previewed,
  onBack,
  onConfirm,
}: ConfirmGateProps) {
  const [ackRisk, setAckRisk] = useState(false)
  const [ackHuman, setAckHuman] = useState(false)

  const summary = `${ticket.side.toUpperCase()} ${ticket.qty} ${ticket.symbol}`
  const hardBlocked = killed || !previewed || !preview
  const softNeedsAck = risk.needsAck
  const canConfirm =
    !hardBlocked && ackHuman && (!softNeedsAck || ackRisk)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onBack}>
      <div
        className="modal modal-gate"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="modal-kicker">Hard confirm gate</p>
        <h2 id="gate-title">Human must confirm</h2>
        <p>
          You are about to <strong>mock-place</strong>{' '}
          <code>{summary}</code>. This UI does <strong>not</strong> call
          Robinhood place-order. Live place stays offline (
          <code>ALLOW_LIVE_PLACE=false</code>).
        </p>

        {preview && (
          <div className="gate-preview">
            <div className="preview-kicker">Staged preview · {preview.id}</div>
            <div>{preview.summary}</div>
            <div className="preview-foot">
              Est. notional ${preview.notional.toFixed(2)} · TIF {ticket.tif}
            </div>
          </div>
        )}

        <ul className="gate-list">
          <li>
            <span className={`gate-pip ${previewed ? '' : 'off'}`} />
            Preview completed (mock) — Confirm disabled without it
          </li>
          <li>
            <span
              className={`gate-pip ${risk.worst === 'pass' ? '' : 'warn'}`}
            />
            Risk soft-check · {risk.worst}
            {softNeedsAck ? ' · acknowledge required' : ' · clear'}
          </li>
          <li>
            <span className={`gate-pip ${killed ? 'off' : ''}`} />
            Kill switch {killed ? 'engaged — Confirm locked' : 'off'}
          </li>
          <li>
            <span className="gate-pip" />
            Place path = this gate only · mock until RH write is safe
          </li>
        </ul>

        {softNeedsAck && (
          <div className="gate-risk-box">
            <div className="risk-panel-head">
              <span>Soft flags</span>
              <span className={`risk-level ${risk.worst}`}>{risk.worst}</span>
            </div>
            <ul className="risk-check-list compact">
              {risk.checks
                .filter((c) => c.level !== 'pass')
                .map((c) => (
                  <li key={c.id} className={`risk-check ${c.level}`}>
                    <span className={`gate-pip off ${c.level}`} />
                    <div>
                      <div className="risk-check-label">{c.label}</div>
                      <div className="risk-check-detail">{c.detail}</div>
                    </div>
                  </li>
                ))}
            </ul>
            <label className="gate-ack">
              <input
                type="checkbox"
                checked={ackRisk}
                disabled={hardBlocked}
                onChange={(e) => setAckRisk(e.target.checked)}
              />
              I acknowledge soft risk flags for this mock place
            </label>
          </div>
        )}

        <label className="gate-ack">
          <input
            type="checkbox"
            checked={ackHuman}
            disabled={hardBlocked}
            onChange={(e) => setAckHuman(e.target.checked)}
          />
          I am Randy (or authorized) and explicitly confirm this ticket
        </label>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            Confirm · mock place
          </button>
        </div>
      </div>
    </div>
  )
}
