import { formatMoney } from '../data/mock'
import type { BookOrder } from '../data/market-types'

type OrdersStripProps = {
  orders: BookOrder[]
  onPickSymbol: (symbol: string) => void
}

function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8)
}

export function OrdersStrip({ orders, onPickSymbol }: OrdersStripProps) {
  const open = orders.filter((o) => o.state === 'open' || o.state === 'partial')
  const recent = orders
    .filter((o) => o.state !== 'open')
    .slice(0, 6)

  return (
    <div className="orders-strip" aria-label="Open orders and fills">
      <header className="zone-head">
        <h2>Orders / fills</h2>
        <span className="zone-tag">
          {open.length ? `${open.length} open` : 'no open'} · RH ids
        </span>
      </header>
      {open.length === 0 && recent.length === 0 ? (
        <p className="dim orders-empty">No recent RH orders in book</p>
      ) : (
        <ul className="orders-list">
          {open.map((o) => (
            <li key={o.id} className={`order-row state-${o.state}`}>
              <span className="order-state">OPEN</span>
              <button
                type="button"
                className="linkish"
                onClick={() => onPickSymbol(o.symbol)}
              >
                {o.symbol}
              </button>
              <span>
                {o.side} {o.qty} {o.type}
              </span>
              <span className="dim" title={o.rhOrderId}>
                id {shortId(o.rhOrderId)}
              </span>
            </li>
          ))}
          {recent.map((o) => (
            <li key={o.id} className={`order-row state-${o.state}`}>
              <span className="order-state">{o.state.toUpperCase()}</span>
              <button
                type="button"
                className="linkish"
                onClick={() => onPickSymbol(o.symbol)}
              >
                {o.symbol}
              </button>
              <span>
                {o.side} {o.filledQty || o.qty}
                {o.avgPrice != null ? ` @ ${formatMoney(o.avgPrice)}` : ''}
              </span>
              <span className="dim" title={o.rhOrderId}>
                id {shortId(o.rhOrderId)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
