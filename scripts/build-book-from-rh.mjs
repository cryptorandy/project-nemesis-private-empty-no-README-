#!/usr/bin/env node
/**
 * Build a scrubbed book.json object from RH MCP tool payloads (stdin JSON).
 *
 * Input shape:
 * {
 *   "asOf": "ISO",
 *   "portfolio": { total_value, equity_value, options_value, cash, buying_power },
 *   "positions": [{ symbol, quantity, average_buy_price }],  // equities
 *   "optionPositions": [{
 *     option_id, chain_symbol, type|right, strike|strike_price,
 *     expiration_date, quantity, average_price|avgPremium,
 *     trade_value_multiplier, mark
 *   }],
 *   "cryptoPositions": [{
 *     symbol|asset|code, quantity, average_buy_price|avgCost,
 *     pair, mark
 *   }],
 *   "quotes": { "SOXL": { last, prevClose }, ... },
 *   "optionQuotes": { "<option_id>": { mark|adjusted_mark_price } },
 *   "cryptoQuotes": { "BTC-USD": { last|mark } }
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

function optionLabel(underlying, right, strike, expiry) {
  const r = right === 'Put' || right === 'put' ? 'P' : 'C'
  const exp =
    typeof expiry === 'string' && expiry.length >= 10
      ? `${expiry.slice(5, 7)}/${expiry.slice(8, 10)}`
      : expiry || ''
  return `${underlying} ${strike}${r} ${exp}`.trim()
}

function mapEquity(p, quotes) {
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
    symbol,
    qty,
    avgCost,
    mark,
    value,
    pnl,
    pnlPct,
    asset: 'equity',
  }
}

function mapOption(p, optionQuotes) {
  const optionId = String(p.option_id ?? p.optionId ?? '')
  const underlying = String(p.chain_symbol ?? p.symbol ?? p.underlying ?? '')
  // Prefer option_type/right; ignore position type long/short.
  const rawRight = String(
    p.right ??
      p.option_type ??
      (p.type === 'call' || p.type === 'put' ? p.type : 'call'),
  ).toLowerCase()
  const right = rawRight.startsWith('p') ? 'Put' : 'Call'
  const strike = num(p.strike ?? p.strike_price)
  const expiry = String(p.expiration_date ?? p.expiry ?? '')
  const qty = num(p.quantity ?? p.qty)
  // RH MCP average_price is often cents (52 → $0.52).
  let avgCost = num(p.avgPremium ?? p.avgCost ?? p.average_price)
  if (avgCost > 20 && avgCost === Math.round(avgCost)) {
    avgCost = avgCost / 100
  }
  const mult = num(p.trade_value_multiplier ?? p.multiplier, 100)
  const oq = optionQuotes[optionId] ?? {}
  const mark = num(
    oq.adjusted_mark_price ?? oq.mark_price ?? oq.mark ?? p.mark,
    avgCost,
  )
  const value = round(mark * mult * qty)
  const cost = avgCost * mult * qty
  const pnl = round(value - cost)
  const pnlPct = cost === 0 ? 0 : round((pnl / cost) * 100)
  const label = optionLabel(underlying, right, strike, expiry)
  return {
    symbol: underlying,
    qty,
    avgCost: round(avgCost, 4),
    mark: round(mark, 4),
    value,
    pnl,
    pnlPct,
    asset: 'option',
    right,
    strike,
    expiry,
    optionId: optionId || undefined,
    label,
  }
}

function mapCrypto(p, cryptoQuotes) {
  const code = String(
    p.symbol ?? p.asset ?? p.code ?? p.currency?.code ?? '',
  ).toUpperCase()
  const pair = String(p.pair ?? `${code}-USD`)
  const qty = num(p.quantity ?? p.qty)
  const avgCost = num(
    p.average_buy_price ??
      p.avgCost ??
      (num(p.direct_quantity) > 0
        ? num(p.direct_cost_basis) / num(p.direct_quantity)
        : 0),
  )
  const q = cryptoQuotes[pair] ?? cryptoQuotes[code] ?? {}
  const mark = num(q.last ?? q.mark ?? p.mark, avgCost)
  const value = round(mark * qty)
  const cost = avgCost * qty
  const pnl = round(value - cost)
  const pnlPct = cost === 0 ? 0 : round((pnl / cost) * 100)
  return {
    symbol: code || pair,
    qty,
    avgCost,
    mark,
    value,
    pnl,
    pnlPct,
    asset: 'crypto',
    pair,
    label: pair,
  }
}

async function main() {
  const input = JSON.parse(await readStdin())
  const quotes = input.quotes ?? {}
  const optionQuotes = input.optionQuotes ?? {}
  const cryptoQuotes = input.cryptoQuotes ?? {}

  const equities = (input.positions ?? []).map((p) => mapEquity(p, quotes))
  const options = (input.optionPositions ?? input.options ?? []).map((p) =>
    mapOption(p, optionQuotes),
  )
  const cryptos = (input.cryptoPositions ?? input.crypto ?? []).map((p) =>
    mapCrypto(p, cryptoQuotes),
  )

  const positions = [...equities, ...options, ...cryptos]

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
      'RH MCP live book · equity+option+crypto · desk polls /api/book ~30s',
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
