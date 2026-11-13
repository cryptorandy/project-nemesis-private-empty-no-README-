import type { RiskReport } from '../lib/riskChecks'
import { EQUITY_SIZE_PRESETS } from '../data/mock'
import type {
  TicketAsset,
  TicketDraft,
  TicketOrder,
  TicketPhase,
  TicketPreview,
  TicketSide,
  TicketTif,
} from '../types'

type TicketRailProps = {
  ticket: TicketDraft
  phase: TicketPhase
  preview: TicketPreview | null
  risk: RiskReport
  killed: boolean
  /** Set when Execution Prep stages a draft (never places). */
  stagedNote?: string | null
  liveMark: number | null
  onChange: (patch: Partial<TicketDraft>) => void
  onPreview: () => void
  onOpenGate: () => void
  onCancel: () => void
  onNewDraft: () => void
}

function levelClass(level: RiskReport['worst']): string {
  return `risk-level ${level}`
}

export function TicketRail({
  ticket,
  phase,
  preview,
  risk,
  killed,
  stagedNote,
  liveMark,
  onChange,
  onPreview,
  onOpenGate,
  onCancel,
  onNewDraft,
}: TicketRailProps) {
  const confirmed = phase === 'confirmed'
  const previewed = phase === 'previewed' || confirmed
  const equity = ticket.asset === 'Equity'
  const canPreview =
    !confirmed &&
    !!ticket.symbol.trim() &&
    ticket.qty > 0 &&
    !risk.checks.some((c) => c.id === 'symbol' && c.level === 'block')
  const canOpenGate = previewed && !killed && !confirmed

  return (
    <aside className="ticket-rail" aria-label="Pro ticket rail">
      <div className="ticket-head">
        <span className="ticket-label">Pro ticket</span>
        <span className={`badge ${phase}`}>
          {phase === 'confirmed' ? 'placed-mock' : phase}
        </span>
      </div>
      <h2 className="ticket-title">Execution builder</h2>
      <div className="mock-banner">
        Human confirm required · mock place only until RH write path is
        wired. Never auto-places. Agents only stage.
      </div>

      {stagedNote && (
        <p className="staged-note" title={stagedNote}>
          EXEC staged · {stagedNote}
        </p>
      )}

      {killed && (
        <p className="locked-note">Confirm locked · kill switch engaged</p>
      )}

      <div className="ticket-form">
        <div className="field">
          <label>Asset</label>
          <div className="seg seg-3">
            {(['Equity', 'Option', 'Crypto'] as TicketAsset[]).map((asset) => (
              <button
                key={asset}
                type="button"
                className={ticket.asset === asset ? 'on' : ''}
                disabled={confirmed}
                onClick={() => onChange({ asset })}
              >
                {asset}
                {asset === 'Crypto' ? ' ·stub' : ''}
              </button>
            ))}
          </div>
        </div>

        {ticket.asset === 'Crypto' && (
          <div className="stub-note">
            Crypto stub — snapshot marks; same preview → confirm ritual.
          </div>
        )}
        {ticket.asset === 'Option' && (
          <div className="stub-note">
            Options from FLOW scanner · Greeks on board ideas · confirm still
            required · never auto-place.
          </div>
        )}

        <div className="field-row">
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
          <div className="field">
            <label>Type</label>
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
          <label htmlFor="symbol">Symbol</label>
          <input
            id="symbol"
            value={ticket.symbol}
            disabled={confirmed}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) =>
              onChange({ symbol: e.target.value.toUpperCase() })
            }
          />
          {liveMark != null && liveMark > 0 && (
            <span className="field-hint">
              Last mark ${liveMark.toFixed(2)}
              {ticket.order === 'Limit' ? ' · limit editable' : ' · MKT uses mark'}
            </span>
          )}
        </div>

        {ticket.asset === 'Option' && (
          <>
            <div className="field-row">
              <div className="field">
                <label>Right</label>
                <div className="seg">
                  {(['Call', 'Put'] as const).map((right) => (
                    <button
                      key={right}
                      type="button"
                      className={
                        (ticket.optionRight ?? 'Call') === right ? 'on' : ''
                      }
                      disabled={confirmed}
                      onClick={() => onChange({ optionRight: right })}
                    >
                      {right}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="strike">Strike</label>
                <input
                  id="strike"
                  type="number"
                  step="0.5"
                  value={ticket.optionStrike ?? 170}
                  disabled={confirmed}
                  onChange={(e) =>
                    onChange({ optionStrike: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="expiry">Expiry</label>
              <input
                id="expiry"
                value={ticket.optionExpiry ?? ''}
                placeholder="YYYY-MM-DD"
                disabled={confirmed}
                onChange={(e) => onChange({ optionExpiry: e.target.value })}
              />
            </div>
          </>
        )}

        <div className="field-row">
          <div className="field">
            <label htmlFor="qty">Size</label>
            <input
              id="qty"
              type="number"
              min={ticket.asset === 'Crypto' ? 0.0001 : 1}
              step={ticket.asset === 'Crypto' ? 0.0001 : 1}
              value={ticket.qty}
              disabled={confirmed}
              onChange={(e) =>
                onChange({
                  qty: Math.max(
                    ticket.asset === 'Crypto' ? 0.0001 : 1,
                    Number(e.target.value) || 0,
                  ),
                })
              }
            />
            {equity && (
              <div className="size-chips" role="group" aria-label="Size presets">
                {EQUITY_SIZE_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={ticket.qty === n ? 'on' : ''}
                    disabled={confirmed}
                    onClick={() => onChange({ qty: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="field">
            <label>TIF</label>
            <div className="seg">
              {(['Day', 'GTC'] as TicketTif[]).map((tif) => (
                <button
                  key={tif}
                  type="button"
                  className={ticket.tif === tif ? 'on' : ''}
                  disabled={confirmed}
                  onClick={() => onChange({ tif })}
                >
                  {tif}
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

        <div className="notional-row">
          <span>Est. notional</span>
          <strong>
            $
            {risk.notional.toLocaleString('en-US', {
              maximumFractionDigits: 2,
            })}
          </strong>
        </div>

        <div className="risk-panel" aria-label="Risk soft-checks">
          <div className="risk-panel-head">
            <span>Risk soft-checks</span>
            <span className={levelClass(risk.worst)}>{risk.worst}</span>
          </div>
          <ul className="risk-check-list">
            {risk.checks.map((c) => (
              <li key={c.id} className={`risk-check ${c.level}`}>
                <span className={`gate-pip ${c.level === 'pass' ? '' : 'off'} ${c.level}`} />
                <div>
                  <div className="risk-check-label">{c.label}</div>
                  <div className="risk-check-detail">{c.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {previewed && preview && (
          <div className="preview-box">
            <div className="preview-kicker">MOCK preview · {preview.id}</div>
            {preview.summary}
            <div className="preview-foot">
              Notional ~${preview.notional.toFixed(2)} · no broker call ·
              confirm gate next
            </div>
          </div>
        )}
      </div>

      <div className="ticket-actions">
        {confirmed ? (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onNewDraft}
          >
            New draft
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              disabled={!canPreview}
              onClick={onPreview}
            >
              Preview (mock)
            </button>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={!canOpenGate}
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
