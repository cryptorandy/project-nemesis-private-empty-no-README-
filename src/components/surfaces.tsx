import type { OptionBuyIdea } from '../agents/optionsScanner'
import type { AgentBrief, AgentId } from '../agents/types'
import { metaById } from '../agents/roster'
import { SIZE_LIMITS } from '../data/mock'
import { RH_AS_OF, RH_PORTFOLIO, RH_SOURCE_NOTE } from '../data/rh-snapshot'
import type { RiskReport } from '../lib/riskChecks'
import type { AuditEntry, TicketDraft } from '../types'

type ResearchProps = {
  deskBrief: AgentBrief | null
  briefs: Partial<Record<AgentId, AgentBrief>>
  optionIdeas: OptionBuyIdea[]
}

export function ResearchSurface({
  deskBrief,
  briefs,
  optionIdeas,
}: ResearchProps) {
  const specialists = (
    Object.entries(briefs) as [AgentId, AgentBrief][]
  ).filter(([id]) => id !== 'chief')

  return (
    <section className="surface" aria-labelledby="research-title">
      <div className="surface-scan" aria-hidden />
      <h1 id="research-title" className="surface-title">
        Research
      </h1>
      <p className="surface-sub">
        Desk Chief merge + specialist briefs from live agent loops (RH MCP
        context + heuristics). Options buys require Δ/Γ/Θ/ν.
      </p>
      <div className="research-card">
        <div className="research-focus">
          Desk brief · {deskBrief?.severity ?? 'idle'}
        </div>
        <h3>{deskBrief?.headline ?? 'Waiting first Chief loop…'}</h3>
        <p className="research-detail">
          {deskBrief?.detail ?? RH_SOURCE_NOTE}
        </p>
        {deskBrief?.symbols?.length ? (
          <p className="research-syms">
            Symbols · {deskBrief.symbols.join(' · ')}
          </p>
        ) : null}
        <ul>
          {specialists.slice(0, 6).map(([id, b]) => (
            <li key={id}>
              <strong>{metaById(id).short}</strong> — {b.headline}
            </li>
          ))}
        </ul>
        {optionIdeas.length > 0 && (
          <>
            <h3 className="research-opt-head">Ranked option buys</h3>
            <ul>
              {optionIdeas.slice(0, 4).map((idea) => (
                <li key={idea.id}>
                  <strong>
                    #{idea.rank} {idea.underlying} {idea.right} {idea.strike}
                  </strong>{' '}
                  — Δ {idea.greeks.delta.toFixed(2)} Γ{' '}
                  {idea.greeks.gamma.toFixed(3)} Θ {idea.greeks.theta.toFixed(2)}{' '}
                  ν {idea.greeks.vega.toFixed(3)}
                  {idea.greeks.iv != null
                    ? ` IV ${(idea.greeks.iv * 100).toFixed(0)}%`
                    : ''}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="panel-foot">
          Agent context as-of loops · agents never place orders
        </p>
      </div>
    </section>
  )
}

type RiskProps = {
  killed: boolean
  onToggleKill: () => void
  riskFlags: string[]
  risk: RiskReport
  ticket: TicketDraft
}

export function RiskSurface({
  killed,
  onToggleKill,
  riskFlags,
  risk,
  ticket,
}: RiskProps) {
  return (
    <section className="surface" aria-labelledby="risk-title">
      <div className="surface-scan" aria-hidden />
      <h1 id="risk-title" className="surface-title">
        Risk
      </h1>
      <p className="surface-sub">
        Risk Guard loop flags, pre-ticket soft-checks, kill-switch status.
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
            <span className="panel-status muted">soft blocks</span>
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
        <div className="panel">
          <div className="panel-head">
            <span className="panel-label">Risk Guard flags</span>
            <span className="panel-status">live loop</span>
          </div>
          {riskFlags.length === 0 ? (
            <p className="dim">Waiting first Risk Guard loop…</p>
          ) : (
            <ul className="flag-list">
              {riskFlags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel panel-span">
          <div className="panel-head">
            <span className="panel-label">Live ticket soft-check</span>
            <span className={`risk-level ${risk.worst}`}>{risk.worst}</span>
          </div>
          <p className="risk-ticket-line">
            {ticket.side} {ticket.qty} {ticket.symbol} · est. $
            {risk.notional.toFixed(2)} · book $
            {RH_PORTFOLIO.totalValue.toFixed(2)} · BP $
            {RH_PORTFOLIO.buyingPower.toFixed(2)}
          </p>
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
      </div>
    </section>
  )
}

type AuditProps = {
  entries: readonly AuditEntry[]
}

export function AuditSurface({ entries }: AuditProps) {
  return (
    <section className="surface" aria-labelledby="audit-title">
      <div className="surface-scan" aria-hidden />
      <h1 id="audit-title" className="surface-title">
        Audit log
      </h1>
      <p className="surface-sub">
        Immutable · append-only — previews, risk-checks, confirms, mock
        places, kill/resume. No edit or delete.
      </p>
      <div className="audit-seal">
        <span className="gate-pip" />
        Sealed rail · {entries.length} crumbs · newest first
      </div>
      <table className="audit-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Time</th>
            <th>Entity</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="audit-seq">{e.seq ?? '—'}</td>
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
