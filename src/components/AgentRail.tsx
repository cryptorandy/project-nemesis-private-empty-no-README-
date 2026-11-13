import type { Agent } from '../types'

type AgentRailProps = {
  agents: Agent[]
  killed: boolean
}

export function AgentRail({ agents, killed }: AgentRailProps) {
  return (
    <div className="agent-rail" role="status" aria-label="Agent status rail">
      <div className="agent-rail-label">
        Agents {killed ? 'paused' : 'orbiting'}
      </div>
      <div className="agent-pills">
        {agents.map((agent) => {
          const status = killed ? 'paused' : agent.status
          return (
            <span
              key={agent.id}
              className={`agent-pill ${status}`}
              title={`${agent.name} · ${status}`}
            >
              <span className="agent-dot" />
              {agent.short}
            </span>
          )
        })}
      </div>
    </div>
  )
}
