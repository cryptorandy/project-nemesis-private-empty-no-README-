type HeroProps = {
  onEnter: () => void
  onKillFromLanding: () => void
}

export function Hero({ onEnter, onKillFromLanding }: HeroProps) {
  return (
    <div className="hero">
      <div className="hero-atmosphere" aria-hidden>
        <div className="orbit-field hero-orbit">
          <div className="orbit-ring" />
          <div className="orbit-ring" />
          <div className="orbit-ring" />
          <div className="orbit-core" />
        </div>
        <div className="hero-gridlines" />
      </div>

      <header className="hero-top">
        <div className="mark" aria-hidden>
          N
        </div>
        <div className="standby">Desk standby · RH linked</div>
      </header>

      <div className="hero-body">
        <div className="hero-copy">
          <h1 className="hero-brand">Project Nemesis</h1>
          <p className="hero-headline">
            Desk live · human confirms every ticket
          </p>
          <p className="hero-support">
            Mixed equities, options, and crypto — a TV trading-floor board over
            Randy’s Robinhood book. Nine specialists orbit; confirm gate stays
            human.
          </p>
          <div className="cta-row">
            <button type="button" className="btn btn-primary" onClick={onEnter}>
              Enter desk
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onKillFromLanding}
            >
              Kill switch
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
