import { useCallback, useMemo, useState } from 'react'
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
import { RH_BOARD, RH_CRYPTO } from './data/rh-snapshot'
import { useLiveDesk } from './hooks/useLiveDesk'
import { appendAudit, sealAudit } from './lib/auditLog'
import { mockPlaceOrder } from './lib/mockPlace'
import { runRiskSoftChecks } from './lib/riskChecks'
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

  const live = useLiveDesk(killed)
  const liveMark = lookupMark(ticket.symbol, ticket)
  const risk = useMemo(
    () => runRiskSoftChecks(ticket, liveMark ?? undefined),
    [ticket, liveMark],
  )

  const pushAudit = useCallback(
    (entity: string, action: AuditEntry['action'], details: string) => {
      setAudit((prev) => appendAudit(prev, entity, action, details).slice(0, 80))
    },
    [],
  )

  const applyStaged = useCallback(
    (staged: StagedTicket, entity: string) => {
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
      })
      setPhase('draft')
      setPreview(null)
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
          stagedBy: 'flow',
          stagedAt: new Date().toISOString(),
          ideaId: idea.id,
        },
        'Options Flow',
      )
      setSurface('board')
    },
    [applyStaged],
  )

  const onSwarmAudit = useCallback(
    (entity: string, action: 'brief' | 'scan' | 'risk', details: string) => {
      if (action === 'risk' || /escalate|soft block|prints|Staged|BUY/i.test(details)) {
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

  function enterDesk(withKill = false) {
    setEntered(true)
    if (withKill && !killed) toggleKill()
  }

  function patchTicket(patch: Partial<TicketDraft>) {
    setTicket((t) => {
      const next = { ...t, ...patch }
      if (patch.asset === 'Crypto' && !patch.symbol) {
        if (t.symbol !== 'BTC' && t.symbol !== 'ETH') next.symbol = 'BTC'
      }
      if (patch.symbol) {
        const m = lookupMark(patch.symbol)
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
    const mark = lookupMark(symbol)
    patchTicket({
      symbol,
      asset,
      ...(mark != null ? { limit: Number(mark.toFixed(2)) } : {}),
    })
    setSurface('board')
  }

  function previewTicket() {
    const report = runRiskSoftChecks(ticket, liveMark ?? undefined)
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
    const nextPreview: TicketPreview = {
      id,
      at: new Date().toISOString(),
      notional: report.notional,
      mark: liveMark ?? report.mark,
      summary,
      mode: 'mock',
    }
    setPreview(nextPreview)
    setPhase('previewed')
    pushAudit(
      'Execution Prep',
      'preview',
      `Mock preview ${id} · ${summary} (no Robinhood place)`,
    )
    pushAudit(
      'Risk Guard',
      'risk-check',
      `Soft-check ${report.worst} · notional $${report.notional.toFixed(2)} · ${report.checks.filter((c) => c.level !== 'pass').map((c) => c.id).join(',') || 'all clear'}`,
    )
  }

  /**
   * Sole place entrypoint. Invoked only from ConfirmGate after human ack.
   * Uses mockPlaceOrder — never Robinhood place-order.
   */
  function confirmAndMockPlace() {
    if (killed || phase !== 'previewed' || !preview) return
    const result = mockPlaceOrder(ticket)
    setPhase('confirmed')
    setGateOpen(false)
    pushAudit(
      'Randy',
      'confirm-mock',
      `Human confirmed ${preview.id} · ${result.summary}`,
    )
    pushAudit(
      'Execution Prep',
      'place-mock',
      `${result.orderId} · ${result.note} · ${result.placedAt}`,
    )
  }

  function resetDraft() {
    setTicket({ ...INITIAL_TICKET })
    setPhase('draft')
    setPreview(null)
    setStagedNote(null)
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
            <span className="brand-sub">TV desk · swarm · pro execution</span>
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
          />
        )}
        {surface === 'audit' && <AuditSurface entries={audit} />}

        <TicketRail
          ticket={ticket}
          phase={phase}
          preview={preview}
          risk={risk}
          killed={killed}
          stagedNote={stagedNote}
          liveMark={liveMark}
          onChange={patchTicket}
          onPreview={previewTicket}
          onOpenGate={() => {
            if (phase === 'previewed' && !killed) setGateOpen(true)
          }}
          onCancel={resetDraft}
          onNewDraft={resetDraft}
        />
      </div>

      {gateOpen && (
        <ConfirmGate
          ticket={ticket}
          preview={preview}
          risk={risk}
          killed={killed}
          previewed={phase === 'previewed'}
          onBack={() => setGateOpen(false)}
          onConfirm={confirmAndMockPlace}
        />
      )}
    </div>
  )
}

export default App
