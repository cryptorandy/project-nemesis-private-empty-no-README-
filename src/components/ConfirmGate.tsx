import { useState } from 'react'
import type { RiskReport } from '../lib/riskChecks'
import type { TicketDraft, TicketPreview } from '../types'

type ConfirmGateProps = {
  ticket: TicketDraft
  preview: TicketPreview | null
  risk: RiskReport
  killed: boolean
  previewed: boolean
  hotSeat: boolean
  standingBlocked: boolean
  onBack: () => void
  /** Sole path into place — never call place outside this handler. */
  onConfirm: () => void
}

export function ConfirmGate({
  ticket,
  preview,
  risk,
  killed,
  previewed,
  hotSeat,
  standingBlocked,
  onBack,
  onConfirm,
}: ConfirmGateProps) {
  const [ackRisk, setAckRisk] = useState(false)
  const [ackHuman, setAckHuman] = useState(false)

  const optBits =
    ticket.asset === 'Option'
      ? ` ${ticket.optionRight ?? 'Call'} ${ticket.optionStrike ?? ''} ${ticket.optionExpiry ?? ''}`.trim()
      : ''
  const summary = `${ticket.side.toUpperCase()} ${ticket.qty} ${ticket.symbol}${optBits ? ` · ${optBits}` : ''}`
  const hardBlocked = killed || !previewed || !preview || standingBlocked
  const softNeedsAck = risk.needsAck && !hotSeat
  const canConfirm =
    !hardBlocked &&
    (hotSeat || (ackHuman && (!softNeedsAck || ackRisk)))

  return (
    <div className="modal-backdrop" role="presentation" onClick={onBack}>
      <div
        className={`modal modal-gate ${hotSeat ? 'hotseat' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="modal-kicker">
          {hotSeat ? 'Hot seat · one-tap confirm' : 'Hard confirm gate'}
        </p>
        <h2 id="gate-title">
          {hotSeat ? 'Confirm this order' : 'Human must confirm'}
        </h2>
        <p>
          Explicit confirm for <strong>{summary}</strong>. Standing % rules
          enforced. Never unsupervised — this tap is required every order.
          {ticket.asset === 'Equity'
            ? ' Equity → RH review_equity_order / place_equity_order after confirm.'
            : ticket.asset === 'Option'
              ? ' Option → RH review_option_order / place_option_order after confirm.'
              : ' Crypto → RH preview_crypto_order / place_crypto_order after confirm.'}
        </p>

        {preview && (
          <div className="gate-preview">
            <div className="preview-kicker">
              Staged preview · {preview.id} · {preview.mode}
            </div>
            <div>{preview.summary}</div>
            <div className="preview-foot">
              Est. notional ${preview.notional.toFixed(2)} · TIF {ticket.tif}
              {preview.reviewNote ? ` · ${preview.reviewNote}` : ''}
            </div>
          </div>
        )}

        <ul className="gate-list">
          <li>
            <span className={`gate-pip ${previewed ? '' : 'off'}`} />
            Preview completed — Confirm disabled without it
          </li>
          <li>
            <span className={`gate-pip ${standingBlocked ? 'off' : ''}`} />
            Standing rules{' '}
            {standingBlocked ? 'BLOCKED — outside % / allowlist' : 'clear'}
          </li>
          <li>
            <span
              className={`gate-pip ${risk.worst === 'pass' ? '' : 'warn'}`}
            />
            Risk soft-check · {risk.worst}
            {softNeedsAck
              ? ' · acknowledge required'
              : hotSeat
                ? ' · hot seat'
                : ' · clear'}
          </li>
          <li>
            <span className={`gate-pip ${killed ? 'off' : ''}`} />
            Kill switch {killed ? 'engaged — Confirm locked' : 'off'}
          </li>
          <li>
            <span className="gate-pip" />
            Place path = this gate only · one confirm per order
          </li>
        </ul>

        {!hotSeat && softNeedsAck && (
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
              I acknowledge soft risk flags for this place
            </label>
          </div>
        )}

        {!hotSeat && (
          <label className="gate-ack">
            <input
              type="checkbox"
              checked={ackHuman}
              disabled={hardBlocked}
              onChange={(e) => setAckHuman(e.target.checked)}
            />
            I am Randy (or authorized) and explicitly confirm this ticket
          </label>
        )}

        {hotSeat && (
          <p className="hotseat-note">
            Hot seat armed — one tap places the confirm. Kill switch or standing
            blocks still lock this button.
          </p>
        )}

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
            {hotSeat ? 'Confirm · one tap' : 'Confirm · place'}
          </button>
        </div>
      </div>
    </div>
  )
}
