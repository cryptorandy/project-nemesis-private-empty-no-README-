import type { CSSProperties } from 'react'
import type { AgentBrief, AgentId } from '../agents/types'
import { formatMoney, formatPct } from '../data/mock'
import type { FeedStatus, MarketPortfolio, MarketPosition } from '../data/market-types'
import { OPTIONS_HEAT_STUB } from '../data/rh-snapshot'
import type { ActivityTick, LiveAgentState, QuoteRow } from '../types'

type DeskBoardProps = {
  indices: QuoteRow[]
  board: QuoteRow[]
  crypto: QuoteRow[]
  positions: MarketPosition[]
  portfolio: MarketPortfolio
  flashKeys: Record<string, number>
  activity: ActivityTick[]
  agents: LiveAgentState[]
  briefs: Partial<Record<AgentId, AgentBrief>>
  deskBrief: AgentBrief | null
  tape: QuoteRow[]
  newsLine: string
  clock: string
  asOfShort: string
  asOf: string
  sourceNote: string
  feedStatus: FeedStatus
  killed: boolean
  focusedAgent: string | null
  loopCount: number
  onSelectAgent: (id: string) => void
  onPickSymbol: (symbol: string) => void
}

function feedLabel(status: FeedStatus): string {
  switch (status) {
    case 'fresh':
      return 'poll · fresh'
    case 'stale':
      return 'stale bake'
    case 'degraded':
      return 'degraded'
    case 'polling':
      return 'polling'
    default:
      return 'baked'
  }
}

function Chg({ n }: { n: number }) {
  return (
    <span className={`chg ${n >= 0 ? 'up' : 'down'}`}>{formatPct(n)}</span>
  )
}

export function DeskBoard({
  indices,
  board,
  crypto,
  positions,
  portfolio,
  flashKeys,
  activity,
  agents,
  briefs,
  deskBrief,
  tape,
  newsLine,
  clock,
  asOfShort,
  asOf,
  sourceNote,
  feedStatus,
  killed,
  focusedAgent,
  loopCount,
  onSelectAgent,
  onPickSymbol,
}: DeskBoardProps) {
  const bookPnl = positions.reduce((s, p) => s + p.pnl, 0)

  return (
    <section className="board" aria-label="Nemesis trading board">
      <div className="board-scan" aria-hidden />

      {/* Indices strip */}
      <div className="indices-strip" role="list" aria-label="Indices">
        <span className="strip-clock">{clock}</span>
        {indices.map((q) => (
          <button
            key={q.symbol}
            type="button"
            className={`index-chip${flashKeys[q.symbol] ? ' flash' : ''}`}
            role="listitem"
            onClick={() => onPickSymbol(q.symbol)}
          >
            <span className="index-sym">{q.symbol}</span>
            <span className="index-px">{formatMoney(q.price)}</span>
            <Chg n={q.changePct} />
          </button>
        ))}
        <span
          className={`strip-meta feed-${feedStatus}`}
          title={`${sourceNote} · as of ${asOf}`}
        >
          RH · as of {asOfShort} · {feedLabel(feedStatus)} · MCP{' '}
          {portfolio.accountMasked}
        </span>
      </div>

      {/* Scrolling tape crawl */}
      <div className="tape-crawl" aria-label="Quote tape">
        <div className="tape-track">
          {[...tape, ...tape].map((q, i) => (
            <button
              key={`${q.symbol}-${i}`}
              type="button"
              className="tape-item"
              onClick={() => onPickSymbol(q.symbol)}
            >
              <strong>{q.symbol}</strong> {formatMoney(q.price)}{' '}
              <Chg n={q.changePct} />
            </button>
          ))}
        </div>
      </div>

      {/* P&L strip */}
      <div className="pnl-strip" aria-label="Portfolio snapshot">
        <div className="pnl-cell">
          <span className="pnl-label">Account</span>
          <span className="pnl-val">{formatMoney(portfolio.totalValue)}</span>
        </div>
        <div className="pnl-cell">
          <span className="pnl-label">Equity</span>
          <span className="pnl-val">{formatMoney(portfolio.equityValue)}</span>
        </div>
        <div className="pnl-cell">
          <span className="pnl-label">Options</span>
          <span className="pnl-val">
            {formatMoney(portfolio.optionsValue)}
          </span>
        </div>
        <div className="pnl-cell">
          <span className="pnl-label">Cash / BP</span>
          <span className="pnl-val">{formatMoney(portfolio.buyingPower)}</span>
        </div>
        <div className="pnl-cell">
          <span className="pnl-label">Unrealized</span>
          <span className={`pnl-val ${bookPnl >= 0 ? 'up' : 'down'}`}>
            {formatMoney(bookPnl)}
          </span>
        </div>
        <div className="pnl-cell muted">
          <span className="pnl-label">As of</span>
          <span className="pnl-val tiny" title={sourceNote}>
            {asOfShort} · {feedLabel(feedStatus)}
          </span>
        </div>
        <div className="pnl-cell muted">
          <span className="pnl-label">Swarm</span>
          <span className="pnl-val tiny">
            {killed ? 'paused' : `${loopCount} loops`}
          </span>
        </div>
      </div>

      {deskBrief && (
        <div className="desk-brief-bar" aria-live="polite">
          <span className="desk-brief-kicker">CHIEF</span>
          <span className={`desk-brief-sev ${deskBrief.severity}`}>
            {deskBrief.severity}
          </span>
          <span className="desk-brief-head">{deskBrief.headline}</span>
          <span className="desk-brief-detail">{deskBrief.detail}</span>
        </div>
      )}

      <div className="board-grid">
        {/* Quote grid */}
        <div className="zone zone-quotes">
          <header className="zone-head">
            <h2>Quote grid</h2>
            <span className="zone-tag">
              RH · as of {asOfShort} · {feedLabel(feedStatus)}
            </span>
          </header>
          <div className="quote-grid">
            {board.map((q) => (
              <button
                key={q.symbol}
                type="button"
                className={`quote-cell${flashKeys[q.symbol] ? ' flash' : ''}`}
                onClick={() => onPickSymbol(q.symbol)}
              >
                <span className="qc-sym">{q.symbol}</span>
                <span className="qc-px">{formatMoney(q.price)}</span>
                <Chg n={q.changePct} />
                {q.note && <span className="qc-note">{q.note}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Positions */}
        <div className="zone zone-pos">
          <header className="zone-head">
            <h2>Positions</h2>
            <span className="zone-tag">MCP account</span>
          </header>
          <table className="pos-table">
            <thead>
              <tr>
                <th>Sym</th>
                <th>Qty</th>
                <th>Mark</th>
                <th>Value</th>
                <th>P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.symbol}>
                  <td>
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => onPickSymbol(p.symbol)}
                    >
                      {p.symbol}
                    </button>
                  </td>
                  <td>{p.qty < 1 ? p.qty.toFixed(4) : p.qty.toFixed(2)}</td>
                  <td
                    className={flashKeys[p.symbol] ? 'flash-td' : undefined}
                  >
                    {formatMoney(p.mark)}
                  </td>
                  <td>{formatMoney(p.value)}</td>
                  <td className={p.pnl >= 0 ? 'up' : 'down'}>
                    {formatMoney(p.pnl)}{' '}
                    <span className="dim">{formatPct(p.pnlPct)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Crypto strip */}
        <div className="zone zone-crypto">
          <header className="zone-head">
            <h2>Crypto</h2>
            <span className="zone-tag">RH marks</span>
          </header>
          <div className="crypto-row">
            {crypto.map((q) => (
              <button
                key={q.symbol}
                type="button"
                className={`crypto-card${flashKeys[q.symbol] ? ' flash' : ''}`}
                onClick={() => onPickSymbol(q.symbol)}
              >
                <span className="qc-sym">{q.symbol}</span>
                <span className="qc-px">{formatMoney(q.price)}</span>
                <Chg n={q.changePct} />
                <span className="qc-note">{q.note}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Options heat stub */}
        <div className="zone zone-opt">
          <header className="zone-head">
            <h2>Options heat</h2>
            <span className="zone-tag stub">stub · not live chain</span>
          </header>
          <ul className="opt-list">
            {OPTIONS_HEAT_STUB.map((o) => (
              <li key={`${o.underlying}-${o.strike}-${o.side}`}>
                <button
                  type="button"
                  className="opt-row"
                  onClick={() => onPickSymbol(o.underlying)}
                >
                  <span className="opt-u">{o.underlying}</span>
                  <span>
                    {o.side} {o.strike}
                  </span>
                  <span className="dim">{o.expiry}</span>
                  <span className="dim">IV {o.iv}</span>
                  <span className={`heat ${o.heat}`}>{o.heat}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Agent swarm wall */}
        <div className="zone zone-swarm">
          <header className="zone-head">
            <h2>Agent swarm</h2>
            <span className="zone-tag">
              {killed ? 'paused' : 'timed loops · real briefs'}
            </span>
          </header>
          <div className="swarm-grid">
            {agents.map((a) => {
              const status = killed ? 'paused' : a.status
              const b = briefs[a.id as AgentId]
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`swarm-card ${status}${focusedAgent === a.id ? ' selected' : ''}`}
                  style={
                    {
                      '--orbit-i': String(a.orbitIndex),
                    } as CSSProperties
                  }
                  onClick={() => onSelectAgent(a.id)}
                  title={`${a.name} · ${status}${b ? ` · ${b.headline}` : ''}`}
                >
                  <span className="swarm-orbit" aria-hidden>
                    <span className="swarm-ring" />
                    <span className="swarm-dot" />
                  </span>
                  <span className="swarm-short">{a.short}</span>
                  <span className="swarm-status">{status}</span>
                  <span className="swarm-thought">
                    {killed
                      ? 'Paused'
                      : b?.headline ?? a.thought}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Activity crawl / feed — real loop outputs */}
        <div className="zone zone-activity">
          <header className="zone-head">
            <h2>Activity</h2>
            <span className="zone-tag">loop outputs</span>
          </header>
          <ul className="activity-list dense">
            {activity.map((t) => (
              <li key={t.id} className="activity-row">
                <span className="activity-time">{t.time}</span>
                <span className="activity-agent">{t.agent}</span>
                <span className="activity-text" title={t.text}>
                  {t.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* News crawl */}
      <div className="news-crawl" aria-live="polite">
        <span className="news-kicker">DESK</span>
        <span key={newsLine} className="news-line">
          {newsLine}
        </span>
      </div>
    </section>
  )
}
