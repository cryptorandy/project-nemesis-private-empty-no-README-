import type { CSSProperties } from 'react'
import type { LiveAgentState } from '../types'

type AgentRailProps = {
  agents: LiveAgentState[]
  killed: boolean
  focusedId: string | null
  mutedIds?: string[]
  focusSymbol?: string
  onSelect: (id: string) => void
  onToggleMute?: (id: string) => void
  onFocusSymbolChange?: (symbol: string) => void
}

const STATUS_LABEL: Record<string, string> = {
  scanning: 'scanning',
  briefing: 'briefing',
  idle: 'idle',
  escalate: 'escalate',
  paused: 'paused',
  muted: 'muted',
}

export function AgentRail({
  agents,
  killed,
  focusedId,
  mutedIds = [],
  focusSymbol = '',
  onSelect,
  onToggleMute,
  onFocusSymbolChange,
}: AgentRailProps) {
  const muted = new Set(mutedIds)
  const spotlight =
    (focusedId && agents.find((a) => a.id === focusedId)) ||
    agents.find(
      (a) =>
        !muted.has(a.id) &&
        (a.status === 'scanning' || a.status === 'escalate'),
    ) ||
    agents[0]

  return (
    <div className="agent-rail" role="region" aria-label="Agent status rail">
      <div className="agent-rail-label">
        Agents {killed ? 'paused' : 'orbiting'}
        {focusSymbol ? ` · focus ${focusSymbol}` : ''}
      </div>
      <div className="agent-focus-row">
        <label className="agent-focus-label" htmlFor="agent-focus-sym">
          Focus
        </label>
        <input
          id="agent-focus-sym"
          className="agent-focus-input"
          type="text"
          placeholder="e.g. NVDA"
          value={focusSymbol}
          disabled={killed}
          onChange={(e) =>
            onFocusSymbolChange?.(e.target.value.toUpperCase().trim())
          }
          aria-label="Focus symbol for agent loops"
        />
        {focusSymbol ? (
          <button
            type="button"
            className="agent-focus-clear"
            disabled={killed}
            onClick={() => onFocusSymbolChange?.('')}
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="agent-pills" role="toolbar" aria-label="Specialist agents">
        {agents.map((agent) => {
          const isMuted = muted.has(agent.id)
          const status = killed ? 'paused' : isMuted ? 'muted' : agent.status
          const selected = focusedId === agent.id
          return (
            <div key={agent.id} className="agent-pill-wrap">
              <button
                type="button"
                aria-pressed={selected}
                className={`agent-pill ${status}${selected ? ' selected' : ''}${isMuted ? ' muted' : ''}`}
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
              {onToggleMute ? (
                <button
                  type="button"
                  className={`agent-mute-btn${isMuted ? ' on' : ''}`}
                  disabled={killed}
                  aria-pressed={isMuted}
                  title={isMuted ? `Unmute ${agent.short}` : `Mute ${agent.short}`}
                  onClick={() => onToggleMute(agent.id)}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
      {spotlight && (
        <div className="agent-thought" aria-live="polite">
          <span className="agent-thought-tag">{spotlight.short}</span>
          <span className="agent-thought-text">
            {killed
              ? 'Paused · kill switch'
              : muted.has(spotlight.id)
                ? 'Muted · loop skipped'
                : spotlight.thought}
          </span>
        </div>
      )}
    </div>
  )
}
