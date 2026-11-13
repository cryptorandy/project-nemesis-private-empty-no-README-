#!/usr/bin/env node
/**
 * Build a scrubbed book.json object from RH MCP tool payloads (stdin JSON).
 *
 * Input shape:
 * {
 *   "asOf": "ISO",
 *   "portfolio": { total_value, equity_value, options_value, cash, buying_power },
 *   "positions": [{ symbol, quantity, average_buy_price }],
 *   "quotes": { "SOXL": { last, prevClose }, ... }
 * }
 *
 * Never places trades. Masks account ids.
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

async function main() {
  const input = JSON.parse(await readStdin())
  const quotes = input.quotes ?? {}
  const positions = (input.positions ?? []).map((p) => {
    const symbol = String(p.symbol)
    const qty = num(p.quantity ?? p.qty)
    const avgCost = num(p.average_buy_price ?? p.avgCost)
    const q = quotes[symbol] ?? {}
    const mark = num(q.last ?? q.mark ?? p.mark, avgCost)
    const value = round(mark * qty)
    const cost = avgCost * qty
    const pnl = round(value - cost)
    const pnlPct = cost === 0 ? 0 : round((pnl / cost) * 100)
    return { symbol, qty, avgCost, mark, value, pnl, pnlPct }
  })

  const port = input.portfolio ?? {}
  const buyingPower = num(
    port.buying_power?.buying_power ?? port.buyingPower ?? port.buying_power,
  )
  const book = {
    schemaVersion: 1,
    asOf: input.asOf ?? new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    refreshedBy: input.refreshedBy ?? 'agent-mcp',
    accountMasked: '••••0788',
    sourceNote:
      input.sourceNote ??
      'RH MCP live book · agent push · desk polls /api/book ~30s',
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
