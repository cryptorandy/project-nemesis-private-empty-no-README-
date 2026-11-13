import type { StandingEval, StandingRules } from '../lib/standingRules'
import { formatPct } from '../lib/standingRules'
import type { CapitalSnapshot } from '../lib/standingRules'

type Props = {
  rules: StandingRules
  capital: CapitalSnapshot
  standing: StandingEval
  hotSeat: boolean
  onChange: (patch: Partial<StandingRules>) => void
  onToggleHotSeat: () => void
  allowedCount: number
}

export function StandingRulesPanel({
  rules,
  capital,
  standing,
  hotSeat,
  onChange,
  onToggleHotSeat,
  allowedCount,
}: Props) {
  return (
    <div className="standing-panel" aria-label="Standing risk rules">
      <div className="standing-head">
        <span className="standing-label">Standing rules</span>
        <span
          className={`standing-status ${standing.blocked ? 'blocked' : 'ok'}`}
        >
          {standing.blocked ? 'BLOCK' : 'armed'}
        </span>
      </div>

      <button
        type="button"
        className={`hotseat-toggle ${hotSeat ? 'on' : ''}`}
        onClick={onToggleHotSeat}
        aria-pressed={hotSeat}
      >
        <span className="hotseat-pip" />
        Hot seat {hotSeat ? 'ON · one-tap confirm' : 'off · full gate'}
      </button>

      <div className="standing-grid">
        <label className="standing-field">
          <span>Max notional % BP</span>
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            value={rules.maxNotionalPctOfBuyingPower}
            onChange={(e) =>
              onChange({
                maxNotionalPctOfBuyingPower: clampPct(Number(e.target.value)),
              })
            }
          />
        </label>
        <label className="standing-field">
          <span>Max day loss % equity</span>
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            value={rules.maxDayLossPctOfEquity}
            onChange={(e) =>
              onChange({
                maxDayLossPctOfEquity: clampPct(Number(e.target.value)),
              })
            }
          />
        </label>
      </div>

      <div className="standing-mode">
        <span>Symbols</span>
        <div className="seg">
          <button
            type="button"
            className={
              rules.allowedSymbolsMode === 'watchlist_only' ? 'on' : ''
            }
            onClick={() => onChange({ allowedSymbolsMode: 'watchlist_only' })}
          >
            Watchlist
          </button>
          <button
            type="button"
            className={rules.allowedSymbolsMode === 'any' ? 'on' : ''}
            onClick={() => onChange({ allowedSymbolsMode: 'any' })}
          >
            Any
          </button>
        </div>
      </div>

      <ul className="standing-caps">
        <li>
          <span>Live BP</span>
          <strong>${capital.buyingPower.toFixed(2)}</strong>
        </li>
        <li>
          <span>Cap {formatPct(rules.maxNotionalPctOfBuyingPower)} BP</span>
          <strong>${standing.caps.maxNotionalDollars.toFixed(2)}</strong>
        </li>
        <li>
          <span>Equity</span>
          <strong>${capital.totalValue.toFixed(2)}</strong>
        </li>
        <li>
          <span>Day loss lock {formatPct(rules.maxDayLossPctOfEquity)}</span>
          <strong>${standing.caps.maxDayLossDollars.toFixed(2)}</strong>
        </li>
        <li>
          <span>Session day P&amp;L</span>
          <strong
            className={capital.dayPnl < 0 ? 'dn' : capital.dayPnl > 0 ? 'up' : ''}
          >
            {capital.dayPnl >= 0 ? '+' : ''}
            ${capital.dayPnl.toFixed(2)}
          </strong>
        </li>
        <li>
          <span>Allowlist</span>
          <strong>
            {rules.allowedSymbolsMode === 'watchlist_only'
              ? `${allowedCount} syms`
              : 'open'}
          </strong>
        </li>
      </ul>

      {standing.blocks.length > 0 && (
        <ul className="standing-blocks">
          {standing.blocks.map((b) => (
            <li key={b.id}>
              <strong>{b.label}</strong> — {b.detail}
            </li>
          ))}
        </ul>
      )}

      <p className="standing-foot">
        % of capital · recomputed each ticket · confirm always required · never
        unsupervised
      </p>
    </div>
  )
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 1
  return Math.min(100, Math.max(1, Math.round(n)))
}
