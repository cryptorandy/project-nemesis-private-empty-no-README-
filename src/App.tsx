import { useCallback, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  ideaToStagedFields,
  rankOptionBuyIdeas,
  type OptionBuyIdea,
} from './agents/optionsScanner'
import { useAgentSwarm } from './agents/useAgentSwarm'
import type { StagedTicket } from './agents/types'
import { AgentRail } from './components/AgentRail'
import { ConfirmGate } from './components/ConfirmGate'
import { DeskBoard } from './components/DeskBoard'
import { Hero } from './components/Hero'
import {
  AuditSurface,
  ResearchSurface,
  RiskSurface,
} from './components/surfaces'
import { TicketRail } from './components/TicketRail'
import { INITIAL_AUDIT, INITIAL_TICKET } from './data/mock'
import { allowedUnderlyings } from './data/options-scan'
import { RH_BOARD, RH_CRYPTO, RH_WATCHLIST } from './data/rh-snapshot'
import { useLiveDesk } from './hooks/useLiveDesk'
import { appendAudit, sealAudit } from './lib/auditLog'
import { placeAfterConfirm } from './lib/placeOrder'
import { runRiskSoftChecks } from './lib/riskChecks'
import { toRhEquityParams, toRhOptionParams } from './lib/rhOrderParams'
import {
  buildAllowedUniverse,
  capitalFromPortfolio,
  defaultStandingRules,
  evaluateStandingRules,
  type StandingRules,
} from './lib/standingRules'
import type {
  AuditEntry,
  Surface,
  TicketDraft,
  TicketPhase,
  TicketPreview,
} from './types'

const SURFACES: { id: Surface; label: string }[] = [
  { id: 'board', label: 'Board' },
  { id: 'research', label: 'Research' },
  { id: 'risk', label: 'Risk' },
  { id: 'audit', label: 'Audit' },
]

const DAY_PNL_KEY = 'nemesis.sessionDayPnl'

function readDayPnl(): number {
  try {
    const raw = sessionStorage.getItem(DAY_PNL_KEY)
    if (raw == null) return 0
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function lookupMark(symbol: string, ticket?: TicketDraft): number | null {
  if (ticket?.asset === 'Option' && ticket.limit > 0) return ticket.limit
  const eq = RH_BOARD.find((q) => q.symbol === symbol)
  if (eq) return eq.price
  const crypto = RH_CRYPTO.find((q) => q.symbol === symbol)
  return crypto ? crypto.price : null
}

function App() {
  const [entered, setEntered] = useState(false)
  const [surface, setSurface] = useState<Surface>('board')
  const [killed, setKilled] = useState(false)
  const [ticket, setTicket] = useState<TicketDraft>(INITIAL_TICKET)
  const [phase, setPhase] = useState<TicketPhase>('draft')
  const [preview, setPreview] = useState<TicketPreview | null>(null)
  const [gateOpen, setGateOpen] = useState(false)
  const [audit, setAudit] = useState<AuditEntry[]>(() =>
    sealAudit(INITIAL_AUDIT),
  )
  const [focusedAgent, setFocusedAgent] = useState<string | null>(null)
  const [stagedNote, setStagedNote] = useState<string | null>(null)
  const [optionIdeas, setOptionIdeas] = useState<OptionBuyIdea[]>(() =>
    rankOptionBuyIdeas(),
  )
  const [hotSeat, setHotSeat] = useState(false)
  const [standingRules, setStandingRules] = useState<StandingRules>(() =>
    defaultStandingRules(),
  )
  const [dayPnl] = useState(readDayPnl)
  const [userLockedTicket, setUserLockedTicket] = useState(false)

  const live = useLiveDesk(killed)
  const liveMark =
    ticket.asset === 'Option'
      ? lookupMark(ticket.symbol, ticket)
      : (live.board.find((q) => q.symbol === ticket.symbol)?.price ??
        live.crypto.find((q) => q.symbol === ticket.symbol)?.price ??
        lookupMark(ticket.symbol, ticket))

  const capital = useMemo(
    () => capitalFromPortfolio(live.portfolio, dayPnl),
    [live.portfolio, dayPnl],
  )

  const allowedUniverse = useMemo(
    () =>
      buildAllowedUniverse({
        boardSymbols: [
          ...live.board.map((q) => q.symbol),
          ...live.crypto.map((q) => q.symbol),
          ...live.indices.map((q) => q.symbol),
          ...allowedUnderlyings(),
        ],
        positionSymbols: live.positions.map((p) => p.symbol),
        watchlistSymbols: RH_WATCHLIST.symbols,
        extraAllowedSymbols: standingRules.extraAllowedSymbols,
      }),
    [
      live.board,
      live.crypto,
      live.indices,
      live.positions,
      standingRules.extraAllowedSymbols,
    ],
  )

  const standing = useMemo(
    () =>
      evaluateStandingRules(
        ticket,
        standingRules,
        capital,
        liveMark ?? 0,
        allowedUniverse,
      ),
    [ticket, standingRules, capital, liveMark, allowedUniverse],
  )

  const risk = useMemo(
    () =>
      runRiskSoftChecks(ticket, liveMark ?? undefined, {
        maxPctBuyingPowerPerTrade: standingRules.maxNotionalPctOfBuyingPower,
        maxDayLossPctOfAccount: standingRules.maxDayLossPctOfEquity,
        watchlistOnly: standingRules.allowedSymbolsMode === 'watchlist_only',
        buyingPower: live.portfolio.buyingPower,
        totalValue: live.portfolio.totalValue,
        extraAllowed: [
          ...standingRules.extraAllowedSymbols,
          ...[...allowedUniverse],
        ],
      }),
    [ticket, liveMark, standingRules, live.portfolio, allowedUniverse],
  )

  const standingBlocked =
    standing.blocked || risk.checks.some((c) => c.level === 'block')

  const pushAudit = useCallback(
    (entity: string, action: AuditEntry['action'], details: string) => {
      setAudit((prev) => appendAudit(prev, entity, action, details).slice(0, 80))
    },
    [],
  )

  const phaseRef = useRef(phase)
  const gateRef = useRef(gateOpen)
  const userLockRef = useRef(userLockedTicket)
  phaseRef.current = phase
  gateRef.current = gateOpen
  userLockRef.current = userLockedTicket

  const applyStaged = useCallback(
    (staged: StagedTicket, entity: string) => {
      const fromScanner =
        staged.stagedBy === 'scan' ||
        staged.stagedBy === 'flow' ||
        staged.stagedBy === 'options-scan'
      if (
        gateRef.current ||
        phaseRef.current === 'previewed' ||
        phaseRef.current === 'confirmed'
      ) {
        pushAudit(
          entity,
          'brief',
          `Stage held (ticket busy) · ${staged.symbol} ${staged.qty}`,
        )
        return
      }
      if (staged.stagedBy === 'exec' && userLockRef.current) return

      setTicket({
        asset: staged.asset,
        side: staged.side,
        symbol: staged.symbol,
        qty: staged.qty,
        order: staged.order,
        limit: staged.limit,
        tif: staged.tif ?? 'Day',
        optionRight: staged.optionRight,
        optionStrike: staged.optionStrike,
        optionExpiry: staged.optionExpiry,
        optionId: staged.optionId,
      })
      setPhase('draft')
      setPreview(null)
      setUserLockedTicket(fromScanner ? false : userLockRef.current)
      setStagedNote(staged.reason)
      pushAudit(
        entity,
        'brief',
        `Staged ${staged.asset} ${staged.symbol} ${staged.qty}@${staged.limit} — ${staged.reason.slice(0, 120)} (no place)`,
      )
    },
    [pushAudit],
  )

  const onStageTicket = useCallback(
    (staged: StagedTicket) => {
      applyStaged(staged, 'Execution Prep')
    },
    [applyStaged],
  )

  const onStageIdea = useCallback(
    (idea: OptionBuyIdea) => {
      const fields = ideaToStagedFields(idea)
      applyStaged(
        {
          ...fields,
          stagedBy: 'options-scan',
          stagedAt: new Date().toISOString(),
          ideaId: idea.id,
        },
        'Options Scan',
      )
      setSurface('board')
    },
    [applyStaged],
  )

  const onSwarmAudit = useCallback(
    (entity: string, action: 'brief' | 'scan' | 'risk', details: string) => {
      if (
        action === 'risk' ||
        /escalate|soft block|prints|Staged|BUY/i.test(details)
      ) {
        pushAudit(entity, action, details)
      }
    },
    [pushAudit],
  )

  const swarm = useAgentSwarm({
    killed,
    board: live.board,
    crypto: live.crypto,
    positions: live.positions,
    onStageTicket,
    onOptionIdeas: setOptionIdeas,
    onAudit: onSwarmAudit,
  })

  const boardIdeas = optionIdeas.length ? optionIdeas : swarm.optionIdeas

  function toggleKill() {
    setKilled((prev) => {
      const next = !prev
      pushAudit(
        'Randy',
        next ? 'kill' : 'resume',
        next
          ? 'Kill switch engaged — agents paused, confirm disabled'
          : 'Desk resumed — confirm unlocked',
      )
      if (next) setGateOpen(false)
      return next
    })
  }

  function toggleHotSeat() {
    setHotSeat((prev) => {
      const next = !prev
      pushAudit(
        'Randy',
        'hotseat',
        next
          ? 'Hot seat ON — one-tap confirm per order (still explicit)'
          : 'Hot seat OFF — full confirm gate',
      )
      return next
    })
  }

  function patchRules(patch: Partial<StandingRules>) {
    setStandingRules((r) => ({ ...r, ...patch }))
    if (phase === 'previewed' || phase === 'confirmed') {
      setPhase('draft')
      setPreview(null)
    }
  }

  function enterDesk(withKill = false) {
    setEntered(true)
    if (withKill && !killed) toggleKill()
  }

  function patchTicket(patch: Partial<TicketDraft>) {
    setUserLockedTicket(true)
    setTicket((t) => {
      const next = { ...t, ...patch }
      if (patch.asset === 'Crypto' && !patch.symbol) {
        if (t.symbol !== 'BTC' && t.symbol !== 'ETH') next.symbol = 'BTC'
      }
      if (patch.asset === 'Option') {
        if (patch.optionRight == null && !t.optionRight) next.optionRight = 'Call'
        if (patch.optionStrike == null && t.optionStrike == null) {
          next.optionStrike = 170
        }
        if (patch.optionExpiry == null && !t.optionExpiry) {
          next.optionExpiry = '2026-11-21'
        }
        if (patch.limit == null && (t.asset !== 'Option' || t.limit > 1)) {
          next.limit = 0.05
        }
        next.qty = Math.max(1, Math.floor(patch.qty ?? (t.qty < 1 ? 1 : t.qty)))
        if (patch.order == null) next.order = 'Limit'
      }
      if (patch.symbol && next.asset === 'Equity') {
        const m =
          live.board.find((q) => q.symbol === patch.symbol)?.price ??
          lookupMark(patch.symbol)
        if (m != null && next.order === 'Limit' && patch.limit == null) {
          next.limit = Number(m.toFixed(2))
        }
      }
      return next
    })
    if (phase === 'previewed' || phase === 'confirmed') {
      setPhase('draft')
      setPreview(null)
    }
    setStagedNote(null)
  }

  function pickSymbol(symbol: string) {
    const asset =
      symbol === 'BTC' || symbol === 'ETH' ? 'Crypto' : ('Equity' as const)
    const mark =
      live.board.find((q) => q.symbol === symbol)?.price ?? lookupMark(symbol)
    patchTicket({
      symbol,
      asset,
      ...(mark != null ? { limit: Number(mark.toFixed(2)) } : {}),
    })
    setSurface('board')
  }

  function previewTicket() {
    if (standingBlocked) {
      pushAudit(
        'Risk Guard',
        'rules-block',
        `Preview refused · standing/risk block`,
      )
      return
    }
    const report = runRiskSoftChecks(ticket, liveMark ?? undefined, {
      maxPctBuyingPowerPerTrade: standingRules.maxNotionalPctOfBuyingPower,
      maxDayLossPctOfAccount: standingRules.maxDayLossPctOfEquity,
      watchlistOnly: standingRules.allowedSymbolsMode === 'watchlist_only',
      buyingPower: live.portfolio.buyingPower,
      totalValue: live.portfolio.totalValue,
      extraAllowed: [...allowedUniverse],
    })
    const id = `pv-${Date.now().toString(36)}`
    const px =
      ticket.order === 'Market'
        ? `MKT~$${(liveMark ?? report.mark).toFixed(2)}`
        : `$${ticket.limit.toFixed(2)}`
    const optBits =
      ticket.asset === 'Option'
        ? ` ${ticket.optionRight ?? 'Call'} ${ticket.optionStrike ?? '?'} ${ticket.optionExpiry ?? ''}`
        : ''
    const summary = `${ticket.side.toUpperCase()} ${ticket.qty} ${ticket.symbol}${optBits} ${ticket.asset} ${ticket.order} ${px} TIF ${ticket.tif}`

    let reviewNote = 'Local review · RH MCP review_* on agent bridge'
    if (ticket.asset === 'Equity') {
      const p = toRhEquityParams(ticket)
      reviewNote = `RH-shaped equity · ${p.side} ${p.quantity} ${p.symbol} ${p.type}`
    } else if (ticket.asset === 'Option') {
      const p = toRhOptionParams(ticket)
      reviewNote =
        'error' in p
          ? p.error
          : `RH-shaped option · ${p.quantity}× ${p.legs[0]?.option_id.slice(0, 8)}…`
    }

    const nextPreview: TicketPreview = {
      id,
      at: new Date().toISOString(),
      notional: report.notional,
      mark: liveMark ?? report.mark,
      summary,
      mode: 'rh-review',
      reviewNote,
    }
    setPreview(nextPreview)
    setPhase('previewed')
    pushAudit(
      'Execution Prep',
      'preview',
      `Preview ${id} · ${summary} · ${reviewNote}`,
    )
    pushAudit(
      'Risk Guard',
      'risk-check',
      `Standing+soft ${report.worst} · notional $${report.notional.toFixed(2)} · cap $${standing.caps.maxNotionalDollars.toFixed(2)}`,
    )
  }

  function confirmAndPlace() {
    if (killed || phase !== 'previewed' || !preview) return
    if (standingBlocked) {
      pushAudit('Risk Guard', 'rules-block', 'Confirm refused · standing block')
      return
    }
    const result = placeAfterConfirm(ticket, { preferLiveIntent: true })
    if (!result.ok) {
      pushAudit('Execution Prep', 'rules-block', result.reason)
      return
    }
    setPhase('confirmed')
    setGateOpen(false)
    pushAudit(
      'Randy',
      result.mode === 'live-intent' ? 'confirm-live' : 'confirm-mock',
      `Human confirmed ${preview.id} · ${result.summary}${hotSeat ? ' · hot seat' : ''}`,
    )
    pushAudit(
      'Execution Prep',
      result.mode === 'live-intent' ? 'place-live-intent' : 'place-mock',
      `${result.orderId} · ${result.note}`,
    )
  }

  function resetDraft() {
    setTicket({ ...INITIAL_TICKET })
    setPhase('draft')
    setPreview(null)
    setStagedNote(null)
    setUserLockedTicket(false)
  }

  if (!entered) {
    return (
      <Hero
        onEnter={() => enterDesk(false)}
        onKillFromLanding={() => enterDesk(true)}
      />
    )
  }

  return (
    <div className="desk">
      <header className="desk-header">
        <div className="brand-lockup">
          <div className="mark" aria-hidden>
            N
          </div>
          <div className="brand-text">
            <span className="brand-name">Project Nemesis</span>
            <span className="brand-sub">
              TV desk · fast path · % capital rules
            </span>
          </div>
        </div>
        <nav className="nav" aria-label="Desk surfaces" role="tablist">
          {SURFACES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={surface === s.id}
              className={`nav-btn ${surface === s.id ? 'active' : ''}`}
              onClick={() => setSurface(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className={`hotseat-header ${hotSeat ? 'on' : ''}`}
          onClick={toggleHotSeat}
          title="Session hot seat — one-tap confirm"
        >
          Hot seat
        </button>
        <button
          type="button"
          className={`kill-header ${killed ? 'engaged' : ''}`}
          onClick={toggleKill}
        >
          Kill switch
        </button>
      </header>

      <AgentRail
        agents={swarm.agents}
        killed={killed}
        focusedId={focusedAgent}
        onSelect={(id) =>
          setFocusedAgent((prev) => (prev === id ? null : id))
        }
      />

      <div className="desk-body">
        {surface === 'board' && (
          <DeskBoard
            indices={live.indices}
            board={live.board}
            crypto={live.crypto}
            positions={live.positions}
            portfolio={live.portfolio}
            flashKeys={live.flashKeys}
            activity={swarm.activity}
            agents={swarm.agents}
            briefs={swarm.briefs}
            deskBrief={swarm.deskBrief}
            optionIdeas={boardIdeas}
            tape={live.tape}
            newsLine={swarm.newsLine || live.newsLine}
            clock={live.clock}
            asOf={live.asOf}
            asOfShort={live.asOfShort}
            sourceNote={live.sourceNote}
            feedStatus={live.feedStatus}
            killed={killed}
            focusedAgent={focusedAgent}
            loopCount={swarm.loopCount}
            onSelectAgent={(id) =>
              setFocusedAgent((prev) => (prev === id ? null : id))
            }
            onPickSymbol={pickSymbol}
            onStageIdea={onStageIdea}
          />
        )}
        {surface === 'research' && (
          <ResearchSurface
            deskBrief={swarm.deskBrief}
            briefs={swarm.briefs}
            optionIdeas={boardIdeas}
          />
        )}
        {surface === 'risk' && (
          <RiskSurface
            killed={killed}
            onToggleKill={toggleKill}
            riskFlags={swarm.riskFlags}
            risk={risk}
            ticket={ticket}
            standingRules={standingRules}
            standing={standing}
            capital={capital}
            hotSeat={hotSeat}
            onToggleHotSeat={toggleHotSeat}
          />
        )}
        {surface === 'audit' && <AuditSurface entries={audit} />}

        <TicketRail
          ticket={ticket}
          phase={phase}
          preview={preview}
          risk={risk}
          killed={killed}
          hotSeat={hotSeat}
          standingRules={standingRules}
          standing={standing}
          capital={capital}
          allowedCount={allowedUniverse.size}
          stagedNote={stagedNote}
          liveMark={liveMark}
          onChange={patchTicket}
          onPreview={previewTicket}
          onOpenGate={() => {
            if (phase === 'previewed' && !killed && !standingBlocked) {
              setGateOpen(true)
            }
          }}
          onCancel={resetDraft}
          onNewDraft={resetDraft}
          onRulesChange={patchRules}
          onToggleHotSeat={toggleHotSeat}
        />
      </div>

      {gateOpen && (
        <ConfirmGate
          ticket={ticket}
          preview={preview}
          risk={risk}
          killed={killed}
          previewed={phase === 'previewed'}
          hotSeat={hotSeat}
          standingBlocked={standingBlocked}
          onBack={() => setGateOpen(false)}
          onConfirm={confirmAndPlace}
        />
      )}
    </div>
  )
}

export default App
