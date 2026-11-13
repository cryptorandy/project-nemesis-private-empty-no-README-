import { useCallback, useState } from 'react'
import './App.css'
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
import { INITIAL_AUDIT, INITIAL_TICKET, nowTime } from './data/mock'
import { useLiveDesk } from './hooks/useLiveDesk'
import type { AuditEntry, Surface, TicketDraft, TicketPhase } from './types'

const SURFACES: { id: Surface; label: string }[] = [
  { id: 'board', label: 'Board' },
  { id: 'research', label: 'Research' },
  { id: 'risk', label: 'Risk' },
  { id: 'audit', label: 'Audit' },
]

function App() {
  const [entered, setEntered] = useState(false)
  const [surface, setSurface] = useState<Surface>('board')
  const [killed, setKilled] = useState(false)
  const [ticket, setTicket] = useState<TicketDraft>(INITIAL_TICKET)
  const [phase, setPhase] = useState<TicketPhase>('draft')
  const [gateOpen, setGateOpen] = useState(false)
  const [audit, setAudit] = useState<AuditEntry[]>(INITIAL_AUDIT)
  const [focusedAgent, setFocusedAgent] = useState<string | null>(null)
  const [stagedNote, setStagedNote] = useState<string | null>(null)

  const live = useLiveDesk(killed)

  const pushAudit = useCallback(
    (entity: string, action: AuditEntry['action'], details: string) => {
      setAudit((prev) => [
        {
          id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          time: nowTime(),
          entity,
          action,
          details,
        },
        ...prev,
      ].slice(0, 80))
    },
    [],
  )

  const onStageTicket = useCallback(
    (staged: StagedTicket) => {
      setTicket({
        asset: staged.asset,
        side: staged.side,
        symbol: staged.symbol,
        qty: staged.qty,
        order: staged.order,
        limit: staged.limit,
      })
      setPhase('draft')
      setStagedNote(staged.reason)
      pushAudit(
        'Execution Prep',
        'brief',
        `Staged ${staged.symbol} ${staged.qty}@${staged.limit} — ${staged.reason} (no place)`,
      )
    },
    [pushAudit],
  )

  const onSwarmAudit = useCallback(
    (entity: string, action: 'brief' | 'scan' | 'risk', details: string) => {
      // Only crumb escalate-class risk / scan into audit to keep log readable
      if (action === 'risk' || /escalate|soft block|prints|Staged/i.test(details)) {
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
    onAudit: onSwarmAudit,
  })

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
    setTicket((t) => ({ ...t, ...patch }))
    if (phase === 'previewed') setPhase('draft')
    setStagedNote(null)
  }

  function pickSymbol(symbol: string) {
    patchTicket({
      symbol,
      asset: symbol === 'BTC' || symbol === 'ETH' ? 'Crypto' : 'Equity',
    })
    setSurface('board')
  }

  function preview() {
    setPhase('previewed')
    pushAudit(
      'Execution Prep',
      'preview',
      `Mock preview for ${ticket.symbol} (no Robinhood place)`,
    )
  }

  function confirmMock() {
    setPhase('confirmed')
    setGateOpen(false)
    pushAudit(
      'Randy',
      'confirm-mock',
      `Human confirmed mock ticket ${ticket.symbol} — NO real order placed`,
    )
  }

  function resetDraft() {
    setTicket(INITIAL_TICKET)
    setPhase('draft')
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
            <span className="brand-sub">TV desk · real agent swarm</span>
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
          />
        )}
        {surface === 'research' && (
          <ResearchSurface deskBrief={swarm.deskBrief} briefs={swarm.briefs} />
        )}
        {surface === 'risk' && (
          <RiskSurface
            killed={killed}
            onToggleKill={toggleKill}
            riskFlags={swarm.riskFlags}
          />
        )}
        {surface === 'audit' && <AuditSurface entries={audit} />}

        <TicketRail
          ticket={ticket}
          phase={phase}
          killed={killed}
          stagedNote={stagedNote}
          onChange={patchTicket}
          onPreview={preview}
          onOpenGate={() => setGateOpen(true)}
          onCancel={resetDraft}
          onNewDraft={resetDraft}
        />
      </div>

      {gateOpen && (
        <ConfirmGate
          ticket={ticket}
          killed={killed}
          previewed={phase === 'previewed' || phase === 'confirmed'}
          onBack={() => setGateOpen(false)}
          onConfirm={confirmMock}
        />
      )}
    </div>
  )
}

export default App
