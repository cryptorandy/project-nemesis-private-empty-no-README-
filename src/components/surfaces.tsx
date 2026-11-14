import type { OptionBuyIdea } from '../agents/optionsScanner'
import type {
  AgentBrief,
  AgentId,
  ResearchDepthPayload,
} from '../agents/types'
import { metaById } from '../agents/roster'
import { RESEARCH_DEPTH_FOCUS } from '../data/agent-context'
import { SIZE_LIMITS } from '../data/mock'
import { RH_AS_OF, RH_PORTFOLIO, RH_SOURCE_NOTE } from '../data/rh-snapshot'
import type { RiskReport } from '../lib/riskChecks'
import type {
  CapitalSnapshot,
  StandingEval,
  StandingRules,
} from '../lib/standingRules'
import { formatPct } from '../lib/standingRules'
import type { AuditEntry, TicketDraft } from '../types'

type ResearchProps = {
  deskBrief: AgentBrief | null
  briefs: Partial<Record<AgentId, AgentBrief>>
  optionIdeas: OptionBuyIdea[]
  researchDepth?: ResearchDepthPayload | null
  focusSymbol?: string
  onPickSymbol?: (symbol: string) => void
}

function moneyCap(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return 'n/a'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  return `$${n.toFixed(0)}`
}

export function ResearchSurface({
  deskBrief,
  briefs,
  optionIdeas,
  researchDepth,
  focusSymbol,
  onPickSymbol,
}: ResearchProps) {
  const depth = researchDepth ?? {
    ...RESEARCH_DEPTH_FOCUS,
    filings: [...RESEARCH_DEPTH_FOCUS.filings],
  }
  const focus = focusSymbol || depth.symbol
  const specialists = (
    Object.entries(briefs) as [AgentId, AgentBrief][]
  ).filter(([id]) => id !== 'chief')
  const depthBrief = briefs.depth

  return (
    <section className="surface" aria-labelledby="research-title">
      <div className="surface-scan" aria-hidden />
      <h1 id="research-title" className="surface-title">
        Research
      </h1>
      <p className="surface-sub">
        Focus-symbol workspace · fundamentals · RSI/MACD · earnings · SEC ·
        Depth agent loops (never place).
      </p>

      <div className="research-depth" aria-label="Focus symbol depth">
        <header className="research-depth-head">
          <button
            type="button"
            className="research-focus-sym linkish"
            onClick={() => onPickSymbol?.(depth.symbol)}
          >
            {depth.symbol}
          </button>
          <span className="research-focus-name">{depth.name}</span>
          <span className="dim">
            {depth.sector} · {depth.industry}
          </span>
          <span className="zone-tag">as of {depth.asOf.slice(11, 16)}Z</span>
        </header>

        <div className="research-fund-grid">
          <div>
            <span className="pnl-label">PE</span>
            <span className="pnl-val">{depth.pe?.toFixed(1) ?? 'n/a'}</span>
          </div>
          <div>
            <span className="pnl-label">PB</span>
            <span className="pnl-val">{depth.pb?.toFixed(1) ?? 'n/a'}</span>
          </div>
          <div>
            <span className="pnl-label">Mkt cap</span>
            <span className="pnl-val">{moneyCap(depth.marketCap)}</span>
          </div>
          <div>
            <span className="pnl-label">52w</span>
            <span className="pnl-val tiny">
              {depth.low52?.toFixed(1) ?? '—'} – {depth.high52?.toFixed(1) ?? '—'}
            </span>
          </div>
        </div>

        <div className="research-tech-strip" aria-label="Technical strip">
          <span>
            RSI14 <strong>{depth.rsi14?.toFixed(1) ?? 'n/a'}</strong>
          </span>
          <span>
            MACD <strong>{depth.macd?.toFixed(2) ?? 'n/a'}</strong>
          </span>
          <span>
            Signal <strong>{depth.macdSignal?.toFixed(2) ?? 'n/a'}</strong>
          </span>
          <span>
            Hist <strong>{depth.macdHist?.toFixed(2) ?? 'n/a'}</strong>
          </span>
        </div>

        <div className="research-earn-sec">
          <div>
            <h3>Earnings</h3>
            <p>
              {depth.earningsDate
                ? `${depth.earningsDate} · est ${depth.earningsEstimate ?? 'n/a'}`
                : 'No near print'}
            </p>
          </div>
          <div>
            <h3>SEC</h3>
            <ul>
              {depth.filings.slice(0, 4).map((f) => (
                <li key={`${f.form}-${f.date}`}>
                  <strong>{f.form}</strong> {f.date} — {f.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="panel-foot">{depth.note}</p>
      </div>

      <div className="research-card">
        <div className="research-focus">
          Desk brief · {deskBrief?.severity ?? 'idle'}
          {focus ? ` · ticket focus ${focus}` : ''}
        </div>
        <h3>{deskBrief?.headline ?? 'Waiting first Chief loop…'}</h3>
        <p className="research-detail">
          {deskBrief?.detail ?? RH_SOURCE_NOTE}
        </p>
        {depthBrief ? (
          <p className="research-detail">
            <strong>DEPTH</strong> — {depthBrief.headline}
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
  standingRules: StandingRules
  standing: StandingEval
  capital: CapitalSnapshot
  hotSeat: boolean
  onToggleHotSeat: () => void
}

export function RiskSurface({
  killed,
  onToggleKill,
  riskFlags,
  risk,
  ticket,
  standingRules,
  standing,
  capital,
  hotSeat,
  onToggleHotSeat,
}: RiskProps) {
  return (
    <section className="surface" aria-labelledby="risk-title">
      <div className="surface-scan" aria-hidden />
      <h1 id="risk-title" className="surface-title">
        Risk
      </h1>
      <p className="surface-sub">
        Standing % of capital rules, Risk Guard flags, kill switch, hot seat.
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
          <button
            type="button"
            className={`btn ${hotSeat ? 'btn-primary' : 'btn-ghost'}`}
            style={{ marginTop: '0.65rem' }}
            onClick={onToggleHotSeat}
          >
            {hotSeat ? 'Hot seat ON' : 'Enable hot seat'}
          </button>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="panel-label">Standing rules</span>
            <span
              className={`panel-status ${standing.blocked ? 'muted' : ''}`}
            >
              {standing.blocked ? 'BLOCK' : 'armed'}
            </span>
          </div>
          <ul className="limit-list">
            <li>
              <span>Max notional % BP</span>
              <span>
                {formatPct(standingRules.maxNotionalPctOfBuyingPower)} → $
                {standing.caps.maxNotionalDollars.toFixed(2)}
              </span>
            </li>
            <li>
              <span>Max day loss % equity</span>
              <span>
                {formatPct(standingRules.maxDayLossPctOfEquity)} → $
                {standing.caps.maxDayLossDollars.toFixed(2)}
              </span>
            </li>
            <li>
              <span>Symbols</span>
              <span>{standingRules.allowedSymbolsMode}</span>
            </li>
            <li>
              <span>Live BP / equity</span>
              <span>
                ${capital.buyingPower.toFixed(2)} / $
                {capital.totalValue.toFixed(2)}
              </span>
            </li>
            {SIZE_LIMITS.slice(0, 1).map((lim) => (
              <li key={lim.label}>
                <span>{lim.label}</span>
                <span>{lim.value}</span>
              </li>
            ))}
          </ul>
          <div className="panel-foot">
            RH as-of {RH_AS_OF} · hard blocks outside rules · confirm always.
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
