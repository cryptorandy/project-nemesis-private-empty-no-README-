import { RESEARCH_BRIEF, SIZE_LIMITS } from '../data/mock'
import { RH_AS_OF, RH_SOURCE_NOTE } from '../data/rh-snapshot'
import type { AuditEntry } from '../types'

type RiskProps = {
  killed: boolean
  onToggleKill: () => void
}

export function ResearchSurface() {
  return (
    <section className="surface" aria-labelledby="research-title">
      <div className="surface-scan" aria-hidden />
      <h1 id="research-title" className="surface-title">
        Research
      </h1>
      <p className="surface-sub">
        Ticker workspace — RH snapshot focus · filings hooks later.
      </p>
      <div className="research-card">
        <div className="research-focus">Focus · {RESEARCH_BRIEF.focus}</div>
        <h3>{RESEARCH_BRIEF.headline}</h3>
        <ul>
          {RESEARCH_BRIEF.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p className="panel-foot">{RH_SOURCE_NOTE}</p>
      </div>
    </section>
  )
}

export function RiskSurface({ killed, onToggleKill }: RiskProps) {
  return (
    <section className="surface" aria-labelledby="risk-title">
      <div className="surface-scan" aria-hidden />
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
            RH as-of {RH_AS_OF} · soft blocks only · no auto-place.
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
      <div className="surface-scan" aria-hidden />
      <h1 id="audit-title" className="surface-title">
        Audit log
      </h1>
      <p className="surface-sub">
        Append-only — agent actions, previews, confirms, kill/resume.
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
