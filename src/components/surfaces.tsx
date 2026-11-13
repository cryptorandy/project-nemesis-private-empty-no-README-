import {
  formatMoney,
  formatPct,
  RESEARCH_BRIEF,
  SIZE_LIMITS,
  WATCH,
} from '../data/mock'
import type { AuditEntry } from '../types'

type RiskProps = {
  killed: boolean
  onToggleKill: () => void
}

export function WatchSurface() {
  return (
    <section className="surface" aria-labelledby="watch-title">
      <h1 id="watch-title" className="surface-title">
        Watch
      </h1>
      <p className="surface-sub">
        Live tape of watchlists + scanner hits — sample data.
      </p>
      <div className="watch-list">
        {WATCH.map((row) => (
          <div key={row.symbol} className="watch-row">
            <div className="watch-sym">{row.symbol}</div>
            <div className="watch-meta">
              <div className="watch-name">{row.name}</div>
              <div className="watch-note">{row.note}</div>
            </div>
            <div className="watch-px">
              {formatMoney(row.price)}
              <span
                className={`watch-chg ${row.changePct >= 0 ? 'up' : 'down'}`}
              >
                {formatPct(row.changePct)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ResearchSurface() {
  return (
    <section className="surface" aria-labelledby="research-title">
      <h1 id="research-title" className="surface-title">
        Research
      </h1>
      <p className="surface-sub">
        Ticker workspace stub — quotes, briefs, filings hooks later.
      </p>
      <div className="research-card">
        <div className="research-focus">Focus · {RESEARCH_BRIEF.focus}</div>
        <h3>{RESEARCH_BRIEF.headline}</h3>
        <ul>
          {RESEARCH_BRIEF.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function RiskSurface({ killed, onToggleKill }: RiskProps) {
  return (
    <section className="surface" aria-labelledby="risk-title">
      <h1 id="risk-title" className="surface-title">
        Risk
      </h1>
      <p className="surface-sub">
        Book heat, soft limits, kill-switch status.
      </p>
      <div className="panel-grid">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-label">Kill switch</span>
            <span className={`panel-status ${killed ? 'muted' : ''}`}>
              {killed ? 'Engaged' : 'Armed'}
            </span>
          </div>
          <p>
            Pause all agent loops and disable confirm. Drafts stay visible.
            Resume requires explicit unlock.
          </p>
          <button
            type="button"
            className={`btn ${killed ? 'btn-primary' : 'btn-amber'}`}
            onClick={onToggleKill}
          >
            {killed ? 'Resume desk' : 'Engage kill switch'}
          </button>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="panel-label">Size limits</span>
            <span className="panel-status muted">placeholders</span>
          </div>
          <ul className="limit-list">
            {SIZE_LIMITS.map((lim) => (
              <li key={lim.label}>
                <span>{lim.label}</span>
                <span>{lim.value}</span>
              </li>
            ))}
          </ul>
          <div className="panel-foot">
            Editable settings UI ships later · soft blocks only.
          </div>
        </div>
      </div>
    </section>
  )
}

type AuditProps = {
  entries: AuditEntry[]
}

export function AuditSurface({ entries }: AuditProps) {
  return (
    <section className="surface" aria-labelledby="audit-title">
      <h1 id="audit-title" className="surface-title">
        Audit log
      </h1>
      <p className="surface-sub">
        Append-only stub — agent actions, previews, confirms, kill/resume.
      </p>
      <table className="audit-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Entity</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="audit-time">{e.time}</td>
              <td>{e.entity}</td>
              <td>
                <span className={`audit-action ${e.action}`}>{e.action}</span>
              </td>
              <td>{e.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
