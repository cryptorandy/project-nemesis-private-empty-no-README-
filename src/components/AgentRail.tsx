import type { CSSProperties } from 'react'
import type { LiveAgentState } from '../types'

type AgentRailProps = {
  agents: LiveAgentState[]
  killed: boolean
  focusedId: string | null
  onSelect: (id: string) => void
}

const STATUS_LABEL: Record<string, string> = {
  scanning: 'scanning',
  briefing: 'briefing',
  idle: 'idle',
  escalate: 'escalate',
  paused: 'paused',
}

export function AgentRail({
  agents,
  killed,
  focusedId,
  onSelect,
}: AgentRailProps) {
  const spotlight =
    (focusedId && agents.find((a) => a.id === focusedId)) ||
    agents.find((a) => a.status === 'scanning' || a.status === 'escalate') ||
    agents[0]

  return (
    <div className="agent-rail" role="region" aria-label="Agent status rail">
      <div className="agent-rail-label">
        Agents {killed ? 'paused' : 'orbiting'}
      </div>
      <div className="agent-pills" role="toolbar" aria-label="Specialist agents">
        {agents.map((agent) => {
          const status = killed ? 'paused' : agent.status
          const selected = focusedId === agent.id
          return (
            <button
              key={agent.id}
              type="button"
              aria-pressed={selected}
              className={`agent-pill ${status}${selected ? ' selected' : ''}`}
              style={
                {
                  '--orbit-i': String(agent.orbitIndex),
                } as CSSProperties
              }
              title={`${agent.name} · ${STATUS_LABEL[status] ?? status}`}
              onClick={() => onSelect(agent.id)}
            >
              <span className="agent-orbit" aria-hidden>
                <span className="agent-orbit-ring" />
                <span className="agent-dot" />
              </span>
              <span className="agent-pill-body">
                <span className="agent-short">{agent.short}</span>
                <span className="agent-status">
                  {STATUS_LABEL[status] ?? status}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      {spotlight && (
        <div className="agent-thought" aria-live="polite">
          <span className="agent-thought-tag">{spotlight.short}</span>
          <span className="agent-thought-text">
            {killed ? 'Paused · kill switch' : spotlight.thought}
          </span>
        </div>
      )}
    </div>
  )
}
