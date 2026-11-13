import {
  CRYPTO_MARKS,
  EARNINGS_NEAR,
  FILING_HITS,
  OPTION_POSITIONS,
  PORTFOLIO_MARKS,
  SCAN_GAINERS,
  SOFT_LIMITS,
} from '../data/agent-context'
import { nowTime } from '../data/mock'
import type { ActivityTick, AgentLoopStatus } from '../types'
import { metaById } from './roster'
import type {
  AgentBrief,
  AgentId,
  BriefSeverity,
  LoopResult,
  SwarmMarketView,
  StagedTicket,
} from './types'

function isoNow(): string {
  return new Date().toISOString()
}

function money(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  })
}

function pct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function brief(
  agentId: AgentId,
  headline: string,
  detail: string,
  severity: BriefSeverity,
  symbols: string[],
): AgentBrief {
  return { agentId, headline, detail, severity, symbols, at: isoNow() }
}

function activity(
  agentId: AgentId,
  text: string,
  tickKey: string,
): ActivityTick {
  return {
    id: `act-${agentId}-${tickKey}`,
    time: nowTime(),
    agent: metaById(agentId).short,
    text,
  }
}

function statusFrom(severity: BriefSeverity): AgentLoopStatus {
  if (severity === 'escalate') return 'escalate'
  if (severity === 'watch') return 'scanning'
  return 'idle'
}

function boardMovers(market: SwarmMarketView, minAbs = 0.8) {
  return [...market.board]
    .map((q) => ({ ...q, abs: Math.abs(q.changePct) }))
    .filter((q) => q.abs >= minAbs)
    .sort((a, b) => b.abs - a.abs)
}

function concentration(market: SwarmMarketView) {
  const total = Math.max(
    market.positions.reduce((s, p) => s + Math.abs(p.value), 0),
    0.01,
  )
  return market.positions
    .map((p) => ({
      symbol: p.symbol,
      value: p.value,
      pct: (Math.abs(p.value) / total) * 100,
      pnlPct: p.pnlPct,
    }))
    .sort((a, b) => b.pct - a.pct)
}

/** Desk Chief — merge specialist briefs into one desk pulse. */
export function runChief(
  briefs: Partial<Record<AgentId, AgentBrief>>,
  loopN: number,
): LoopResult {
  const list = Object.values(briefs).filter(Boolean) as AgentBrief[]
  const escalations = list.filter((b) => b.severity === 'escalate')
  const watches = list.filter((b) => b.severity === 'watch')
  const top = escalations[0] ?? watches[0] ?? list[loopN % Math.max(list.length, 1)]

  let severity: BriefSeverity = 'info'
  let headline = 'Desk pulse · no blockers'
  let detail =
    'Specialists quiet — human confirms every ticket · no place path armed'
  const symbols: string[] = []

  if (escalations.length) {
    severity = 'escalate'
    headline = `Escalate · ${escalations.length} thread${escalations.length > 1 ? 's' : ''}`
    detail = escalations.map((b) => `${metaById(b.agentId).short}: ${b.headline}`).join(' · ')
    escalations.forEach((b) => symbols.push(...b.symbols))
  } else if (watches.length) {
    severity = 'watch'
    headline = `Watch · ${watches.length} open thread${watches.length > 1 ? 's' : ''}`
    detail = watches
      .slice(0, 3)
      .map((b) => `${metaById(b.agentId).short}: ${b.headline}`)
      .join(' · ')
    watches.forEach((b) => symbols.push(...b.symbols))
  } else if (top) {
    headline = `Merge · ${metaById(top.agentId).short} lead`
    detail = top.detail
    symbols.push(...top.symbols)
  }

  const b = brief('chief', headline, detail, severity, [...new Set(symbols)].slice(0, 6))
  return {
    agentId: 'chief',
    status: statusFrom(severity),
    thought: headline,
    brief: b,
    activity: activity('chief', `${headline} — ${detail}`, `${loopN}`),
  }
}

/** Scanner Watch — RH gainers scan + board movers. */
export function runScanner(market: SwarmMarketView, loopN: number): LoopResult {
  const hit = SCAN_GAINERS[loopN % SCAN_GAINERS.length]
  const boardHit = boardMovers(market, 1.2)[0]
  const holdOverlap = market.positions.find(
    (p) =>
      Math.abs(
        market.board.find((q) => q.symbol === p.symbol)?.changePct ?? p.pnlPct,
      ) >= 1.5,
  )

  let severity: BriefSeverity = 'info'
  let headline = `${hit.symbol} +${hit.changePct.toFixed(1)}% scan`
  let detail = `Daily gainers · ${hit.name} last ${money(hit.last)} · rel vol ${hit.relVolume.toFixed(2)}`
  const symbols = [hit.symbol]

  if (holdOverlap) {
    severity = 'watch'
    const chg =
      market.board.find((q) => q.symbol === holdOverlap.symbol)?.changePct ??
      holdOverlap.pnlPct
    headline = `Holding heat · ${holdOverlap.symbol} ${pct(chg)}`
    detail = `${detail} · book name ${holdOverlap.symbol} marked on board`
    symbols.unshift(holdOverlap.symbol)
  } else if (boardHit && Math.abs(boardHit.changePct) >= 1.8) {
    severity = 'watch'
    headline = `Board mover · ${boardHit.symbol} ${pct(boardHit.changePct)}`
    detail = `${detail} · board ${boardHit.symbol} ${money(boardHit.price)}`
    symbols.unshift(boardHit.symbol)
  }

  if (hit.changePct >= 15) severity = 'escalate'

  const b = brief('scan', headline, detail, severity, symbols)
  return {
    agentId: 'scan',
    status: statusFrom(severity),
    thought: headline,
    brief: b,
    activity: activity('scan', `${headline} · ${detail}`, `${loopN}-${hit.symbol}`),
  }
}

/** Risk Guard — concentration + soft limits vs book. */
export function runRisk(market: SwarmMarketView, loopN: number): LoopResult {
  const conc = concentration(market)
  const top = conc[0]
  const optNotional = OPTION_POSITIONS.reduce((s, o) => s + o.notionalApprox, 0)
  const flags: string[] = []
  let severity: BriefSeverity = 'info'

  if (top && top.pct >= SOFT_LIMITS.maxPctBookPerName) {
    flags.push(
      `${top.symbol} ${top.pct.toFixed(1)}% of equity book ≥ ${SOFT_LIMITS.maxPctBookPerName}% soft cap`,
    )
    severity = 'escalate'
  } else if (top && top.pct >= SOFT_LIMITS.maxPctBookPerName * 0.75) {
    flags.push(`${top.symbol} concentration ${top.pct.toFixed(1)}% · near soft cap`)
    severity = 'watch'
  }

  if (optNotional > 0) {
    flags.push(`Options premium notional ~${money(optNotional)} · under contract cap`)
  }

  const draftProbe = 167.5 * 1
  if (draftProbe > SOFT_LIMITS.maxNotionalPerTicket) {
    flags.push(`Draft probe exceeds ${money(SOFT_LIMITS.maxNotionalPerTicket)} ticket cap`)
    severity = 'escalate'
  } else {
    flags.push(
      `Ticket soft cap ${money(SOFT_LIMITS.maxNotionalPerTicket)} · BP ${money(PORTFOLIO_MARKS.buyingPower)}`,
    )
  }

  const cryptoRisk = CRYPTO_MARKS.reduce((s, c) => s + Math.abs(c.changePct), 0)
  if (cryptoRisk > 5) {
    flags.push(`Crypto tape stress Σ|Δ| ${cryptoRisk.toFixed(1)}% · no crypto book yet`)
    if (severity === 'info') severity = 'watch'
  }

  const headline =
    severity === 'escalate'
      ? `Soft block · ${top?.symbol ?? 'limits'}`
      : severity === 'watch'
        ? `Watch · ${top?.symbol ?? 'book'} concentration`
        : 'Risk pass · soft limits clear'

  const detail = flags.slice(0, 3).join(' · ')
  const b = brief(
    'risk',
    headline,
    detail,
    severity,
    top ? [top.symbol] : [],
  )

  return {
    agentId: 'risk',
    status: statusFrom(severity),
    thought: headline,
    brief: b,
    activity: activity('risk', `${headline} — ${detail}`, `${loopN}`),
    riskFlags: flags,
  }
}

/** Earnings Brief — holdings + near calendar. */
export function runEarnings(loopN: number): LoopResult {
  const holding = EARNINGS_NEAR.filter((e) => e.relation === 'holding')
  const upcoming = EARNINGS_NEAR.filter((e) => e.actual == null)
  const focus = holding[0] ?? upcoming[loopN % Math.max(upcoming.length, 1)]

  let severity: BriefSeverity = 'info'
  let headline = 'Earnings calendar quiet near book'
  let detail = 'No holding prints in next window'
  const symbols: string[] = []

  if (focus) {
    symbols.push(focus.symbol)
    const when = `${focus.date} ${focus.timing ?? ''}`.trim()
    if (focus.actual == null) {
      severity = focus.relation === 'holding' ? 'escalate' : 'watch'
      headline = `${focus.symbol} prints ${when}`
      detail = `Est EPS ${focus.estimate ?? 'n/a'} · ${focus.relation} · verified=${focus.verified}`
    } else {
      headline = `${focus.symbol} reported · actual ${focus.actual}`
      detail = `Est ${focus.estimate ?? 'n/a'} vs actual ${focus.actual} · ${when}`
    }
  }

  const peers = upcoming
    .filter((e) => e.symbol !== focus?.symbol)
    .slice(0, 2)
    .map((e) => `${e.symbol} ${e.date}`)
  if (peers.length) detail = `${detail} · also ${peers.join(', ')}`

  const b = brief('earn', headline, detail, severity, symbols)
  return {
    agentId: 'earn',
    status: statusFrom(severity),
    thought: headline,
    brief: b,
    activity: activity('earn', `${headline} · ${detail}`, `${loopN}`),
  }
}

/** Options Flow — open positions + heat heuristics. */
export function runOptions(market: SwarmMarketView, loopN: number): LoopResult {
  const pos = OPTION_POSITIONS[loopN % OPTION_POSITIONS.length]
  const und = market.board.find((q) => q.symbol === pos.underlying)
  const daysToExp = Math.max(
    0,
    Math.round(
      (new Date(pos.expiry).getTime() - Date.now()) / (24 * 3600 * 1000),
    ),
  )

  let severity: BriefSeverity = 'info'
  if (daysToExp <= 5) severity = 'escalate'
  else if (daysToExp <= 10 || (und && Math.abs(und.changePct) >= 1.5))
    severity = 'watch'

  const moneyness =
    und != null
      ? ((und.price - pos.strike) / pos.strike) * 100
      : null

  const headline = `${pos.underlying} ${pos.strike}${pos.side === 'call' ? 'c' : 'p'} · ${daysToExp}d`
  const detail = [
    `Long ${pos.qty} · avg prem ${money(pos.avgPremium)} · ~${money(pos.notionalApprox)}`,
    und ? `und ${money(und.price)} ${pct(und.changePct)}` : null,
    moneyness != null ? `Δ strike ${pct(moneyness)}` : null,
    `exp ${pos.expiry}`,
  ]
    .filter(Boolean)
    .join(' · ')

  const b = brief('flow', headline, detail, severity, [pos.underlying])
  return {
    agentId: 'flow',
    status: statusFrom(severity),
    thought: headline,
    brief: b,
    activity: activity('flow', `${headline} — ${detail}`, `${loopN}-${pos.underlying}`),
  }
}

/** Crypto Pulse — marks vs open + risk budget. */
export function runCrypto(market: SwarmMarketView, loopN: number): LoopResult {
  const live = market.crypto
  const marks = CRYPTO_MARKS.map((c) => {
    const q = live.find((x) => x.symbol === c.symbol)
    return {
      ...c,
      mark: q?.price ?? c.mark,
      changePct: q?.changePct ?? c.changePct,
    }
  })
  const focus = marks[loopN % marks.length]
  const worst = [...marks].sort(
    (a, b) => Math.abs(b.changePct) - Math.abs(a.changePct),
  )[0]

  let severity: BriefSeverity = 'info'
  if (Math.abs(worst.changePct) >= 3.5) severity = 'escalate'
  else if (Math.abs(worst.changePct) >= 2) severity = 'watch'

  const headline = `${focus.symbol} ${pct(focus.changePct)} · mark ${money(focus.mark)}`
  const detail = `vs open ${money(focus.open)} · crypto book $0 · cap ${money(SOFT_LIMITS.cryptoNotionalCap)} · stress lead ${worst.symbol}`

  const b = brief(
    'cryp',
    headline,
    detail,
    severity,
    marks.map((m) => m.symbol),
  )
  return {
    agentId: 'cryp',
    status: statusFrom(severity),
    thought: headline,
    brief: b,
    activity: activity('cryp', `${headline} · ${detail}`, `${loopN}`),
  }
}

/** News / Filings — SEC index hits for holdings. */
export function runNews(loopN: number): LoopResult {
  const hit = FILING_HITS[loopN % FILING_HITS.length]
  const fresh =
    Math.abs(new Date(hit.date).getTime() - Date.now()) < 3 * 24 * 3600 * 1000

  const severity: BriefSeverity = fresh
    ? hit.form === '8-K'
      ? 'watch'
      : 'info'
    : 'info'

  const headline = `${hit.symbol} ${hit.form} · ${hit.date}`
  const detail = `${hit.description} · holdings filings queue · no NLP depth yet`

  const b = brief('news', headline, detail, severity, [hit.symbol])
  return {
    agentId: 'news',
    status: statusFrom(severity),
    thought: headline,
    brief: b,
    activity: activity('news', `${headline} — ${detail}`, `${loopN}`),
  }
}

/** Portfolio Ops — positions / P&L snapshot. */
export function runPortfolio(market: SwarmMarketView, loopN: number): LoopResult {
  const sorted = [...market.positions].sort((a, b) => b.pnl - a.pnl)
  const lead = sorted[0]
  const lag = sorted[sorted.length - 1]
  const bookPnl = market.bookPnl

  let severity: BriefSeverity = 'info'
  if (lead && lead.pnlPct >= 40) severity = 'watch'
  if (lag && lag.pnlPct <= -5) severity = 'escalate'

  const headline = lead
    ? `Book · ${lead.symbol} leads ${pct(lead.pnlPct)}`
    : 'Book · empty'
  const detail = [
    `Acct ${money(PORTFOLIO_MARKS.totalValue)} · eq ${money(PORTFOLIO_MARKS.equityValue)} · opt ${money(PORTFOLIO_MARKS.optionsValue)}`,
    `Unrealized ${money(bookPnl)}`,
    lag && lag !== lead ? `lag ${lag.symbol} ${pct(lag.pnlPct)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const symbols = sorted.slice(0, 3).map((p) => p.symbol)
  const b = brief('book', headline, detail, severity, symbols)
  return {
    agentId: 'book',
    status: statusFrom(severity),
    thought: headline,
    brief: b,
    activity: activity('book', `${headline} — ${detail}`, `${loopN}`),
  }
}

/**
 * Execution Prep — stage a draft ticket from risk-cleared ideas.
 * NEVER places. Only stages into desk state for Randy.
 */
export function runExecPrep(
  market: SwarmMarketView,
  briefs: Partial<Record<AgentId, AgentBrief>>,
  riskFlags: string[],
  loopN: number,
): LoopResult {
  const blocked = riskFlags.some((f) => /soft block|exceeds/i.test(f))
  const scan = briefs.scan
  const earn = briefs.earn
  const book = briefs.book

  let staged: StagedTicket | undefined
  let severity: BriefSeverity = 'info'
  let headline = 'Draft rail idle · no place path'
  let detail = 'Waiting on scanner / earnings / book cues · confirm stays human'
  const symbols: string[] = []

  if (blocked) {
    severity = 'escalate'
    headline = 'Staging held · Risk soft block'
    detail = riskFlags[0] ?? 'Risk Guard soft block'
  } else {
    // Prefer a holding that fits buying power as a 1-share micro stage
    const affordable = [...market.positions]
      .map((p) => {
        const px =
          market.board.find((q) => q.symbol === p.symbol)?.price ?? p.mark
        return { p, px }
      })
      .filter(({ px }) => px > 0 && px <= PORTFOLIO_MARKS.buyingPower)
      .sort((a, b) => b.p.pnlPct - a.p.pnlPct)[0]

    const hold = affordable?.p
    const boardPx = affordable?.px ?? market.board[0]?.price ?? 100

    const reasonParts: string[] = []
    if (earn?.severity === 'escalate' || earn?.severity === 'watch') {
      reasonParts.push(`EARN: ${earn.headline}`)
    }
    if (scan?.severity !== 'info' && scan) {
      reasonParts.push(`SCAN: ${scan.headline}`)
    }
    if (book) reasonParts.push(`BOOK: ${book.headline}`)

    const symbol = hold?.symbol ?? 'SCHD'
    const limit = Math.round(boardPx * 100) / 100
    const qty = 1
    const notional = qty * limit

    if (
      notional <= SOFT_LIMITS.maxNotionalPerTicket &&
      notional <= PORTFOLIO_MARKS.buyingPower
    ) {
      staged = {
        asset: 'Equity',
        side: 'Buy',
        symbol,
        qty,
        order: 'Limit',
        limit,
        reason:
          reasonParts.join(' · ') ||
          `Routine stage · ${symbol} micro-lot under soft caps`,
        stagedBy: 'exec',
        stagedAt: isoNow(),
      }
      severity = 'watch'
      headline = `Staged ${symbol} ${qty}@${limit}`
      detail = `${staged.reason} · preview required · NEVER place`
      symbols.push(symbol)
    } else if (loopN % 2 === 0) {
      severity = 'watch'
      headline = 'Stage skipped · size / BP gate'
      detail = `Notional ${money(notional)} vs cap ${money(SOFT_LIMITS.maxNotionalPerTicket)} / BP ${money(PORTFOLIO_MARKS.buyingPower)}`
    } else {
      headline = 'Confirm gate standing by'
      detail = 'Sync draft rail · no Robinhood place-order calls from agents'
    }
  }

  const b = brief('exec', headline, detail, severity, symbols)
  return {
    agentId: 'exec',
    status: statusFrom(severity),
    thought: headline,
    brief: b,
    activity: activity('exec', `${headline} — ${detail}`, `${loopN}`),
    stagedTicket: staged,
  }
}

export function runAgent(
  id: AgentId,
  market: SwarmMarketView,
  briefs: Partial<Record<AgentId, AgentBrief>>,
  riskFlags: string[],
  loopN: number,
): LoopResult {
  switch (id) {
    case 'chief':
      return runChief(briefs, loopN)
    case 'scan':
      return runScanner(market, loopN)
    case 'risk':
      return runRisk(market, loopN)
    case 'earn':
      return runEarnings(loopN)
    case 'flow':
      return runOptions(market, loopN)
    case 'cryp':
      return runCrypto(market, loopN)
    case 'news':
      return runNews(loopN)
    case 'book':
      return runPortfolio(market, loopN)
    case 'exec':
      return runExecPrep(market, briefs, riskFlags, loopN)
  }
}
