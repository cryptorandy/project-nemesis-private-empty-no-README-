#!/usr/bin/env node
/**
 * Build a scrubbed book.json object from RH MCP tool payloads (stdin JSON).
 *
 * Input shape (equity + optional option/crypto legs):
 * {
 *   "asOf": "ISO",
 *   "portfolio": { total_value, equity_value, options_value, cash, buying_power },
 *   "positions": [{ symbol, quantity, average_buy_price, asset?: "equity" }],
 *   "optionPositions": [{
 *     option_id, chain_symbol, quantity, average_price,
 *     strike_price|strike, type|right ("call"|"put"), expiration_date|expiry,
 *     mark|mark_price, trade_value_multiplier?
 *   }],
 *   "cryptoPositions": [{
 *     symbol ("BTC"|"BTC-USD"), quantity, average_buy_price|avgCost, mark
 *   }],
 *   "quotes": { "SOXL": { last, prevClose }, ... }
 * }
 *
 * Never places trades. Masks account ids. schemaVersion 2 adds asset-typed rows.
 */
async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

function num(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function round(n, d = 2) {
  const f = 10 ** d
  return Math.round(n * f) / f
}

function equityRows(input) {
  const quotes = input.quotes ?? {}
  return (input.positions ?? []).map((p) => {
    const symbol = String(p.symbol)
    const qty = num(p.quantity ?? p.qty)
    const avgCost = num(p.average_buy_price ?? p.avgCost)
    const q = quotes[symbol] ?? {}
    const mark = num(q.last ?? q.mark ?? p.mark, avgCost)
    const value = round(mark * qty)
    const cost = avgCost * qty
    const pnl = round(value - cost)
    const pnlPct = cost === 0 ? 0 : round((pnl / cost) * 100)
    return {
      id: `eq-${symbol}`,
      asset: 'equity',
      symbol,
      display: symbol,
      qty,
      avgCost,
      mark,
      value,
      pnl,
      pnlPct,
    }
  })
}

function optionRows(input) {
  return (input.optionPositions ?? input.options ?? []).map((p, i) => {
    const underlying = String(p.chain_symbol ?? p.underlying ?? p.symbol)
    const rightRaw = String(p.type ?? p.right ?? p.option_type ?? 'call').toLowerCase()
    const right = rightRaw.startsWith('p') ? 'Put' : 'Call'
    const strike = num(p.strike_price ?? p.strike)
    const expiry = String(p.expiration_date ?? p.expiry ?? '')
    const qty = num(p.quantity ?? p.qty)
    const mult = num(p.trade_value_multiplier ?? p.multiplier, 100)
    // RH average_price is dollars per contract; desk stores per-share premium.
    const avgContract = num(p.average_price ?? p.avgCost)
    const avgCost =
      avgContract > 5 && mult >= 100 ? round(avgContract / mult, 4) : avgContract
    const mark = num(p.mark ?? p.mark_price ?? p.adjusted_mark_price, avgCost)
    const value = round(mark * qty * mult)
    const cost = avgCost * qty * mult
    const pnl = round(value - cost)
    const pnlPct = cost === 0 ? 0 : round((pnl / cost) * 100)
    const optionId = p.option_id ?? p.optionId ?? ''
    const shortExp = expiry.slice(5).replace('-', '/')
    const display = `${underlying} ${strike}${right === 'Call' ? 'c' : 'p'} ${shortExp}`
    return {
      id: optionId ? `opt-${optionId}` : `opt-${underlying}-${strike}-${expiry}-${i}`,
      asset: 'option',
      symbol: underlying,
      display,
      qty,
      avgCost,
      mark,
      value,
      pnl,
      pnlPct,
      optionRight: right,
      optionStrike: strike,
      optionExpiry: expiry,
      optionId: optionId || undefined,
    }
  })
}

function cryptoRows(input) {
  const quotes = input.quotes ?? {}
  return (input.cryptoPositions ?? input.crypto ?? []).map((p, i) => {
    const raw = String(p.symbol ?? p.currency?.code ?? '')
    const symbol = raw.replace(/-USD$/i, '').replace(/USD$/i, '') || `CRYPTO${i}`
    const qty = num(p.quantity ?? p.qty)
    const avgCost = num(
      p.average_buy_price ??
        p.avgCost ??
        (p.direct_quantity > 0 ? num(p.direct_cost_basis) / num(p.direct_quantity) : 0),
    )
    const q = quotes[symbol] ?? quotes[`${symbol}-USD`] ?? quotes[`${symbol}USD`] ?? {}
    const mark = num(q.last ?? q.mark ?? p.mark, avgCost)
    const value = round(mark * qty, 4)
    const cost = avgCost * qty
    const pnl = round(value - cost, 4)
    const pnlPct = cost === 0 ? 0 : round((pnl / cost) * 100)
    return {
      id: `cry-${symbol}`,
      asset: 'crypto',
      symbol,
      display: symbol,
      qty,
      avgCost,
      mark,
      value,
      pnl,
      pnlPct,
    }
  })
}

async function main() {
  const input = JSON.parse(await readStdin())
  const positions = [...equityRows(input), ...optionRows(input), ...cryptoRows(input)]

  const port = input.portfolio ?? {}
  const buyingPower = num(
    port.buying_power?.buying_power ?? port.buyingPower ?? port.buying_power,
  )
  const book = {
    schemaVersion: 2,
    asOf: input.asOf ?? new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    refreshedBy: input.refreshedBy ?? 'agent-mcp',
    accountMasked: '••••0788',
    sourceNote:
      input.sourceNote ??
      'RH MCP live book · equity+option+crypto · agent push · desk polls /api/book ~30s',
    degraded: false,
    portfolio: {
      totalValue: round(num(port.total_value ?? port.totalValue)),
      equityValue: round(num(port.equity_value ?? port.equityValue)),
      optionsValue: round(num(port.options_value ?? port.optionsValue)),
      cash: round(num(port.cash)),
      buyingPower: round(buyingPower),
      accountMasked: '••••0788',
    },
    positions,
  }

  process.stdout.write(`${JSON.stringify(book, null, 2)}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
