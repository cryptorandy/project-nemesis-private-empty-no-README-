#!/usr/bin/env node
/**
 * Always-on RH book pusher for Project Nemesis.
 *
 * Preferred path (needs secrets):
 *   1) Agent pulls RH MCP → write rh-input.json
 *   2) This loop builds + POSTs /api/book every INTERVAL_MS
 *
 * Bake fallback (no BOOK_INGEST_SECRET / CURSOR_APP_TOKEN yet):
 *   --mode refresh  → POST { refresh: true } when signed-in token available
 *   OR pipe nothing: re-push public/data/book.json with bumped asOf
 *
 * Never places trades. Never invents secrets.
 *
 * Usage:
 *   node scripts/book-pusher-loop.mjs --once
 *   node scripts/book-pusher-loop.mjs --mode live --input /tmp/rh-input.json
 *   node scripts/book-pusher-loop.mjs --mode refresh --interval 60000
 *
 * Env:
 *   NEMESIS_APP_URL, BOOK_INGEST_SECRET, CURSOR_APP_TOKEN, BOOK_PUSHER_INTERVAL_MS
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const bakePath = join(root, 'public/data/book.json')
const defaultUrl =
  process.env.NEMESIS_APP_URL?.replace(/\/$/, '') ||
  'https://project-nemesis.apps.grok.bot'

function parseArgs(argv) {
  const out = {
    once: false,
    mode: 'auto',
    input: '',
    interval: Number(process.env.BOOK_PUSHER_INTERVAL_MS) || 60_000,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--once') out.once = true
    else if (a === '--mode') out.mode = argv[++i] || 'auto'
    else if (a === '--input') out.input = argv[++i] || ''
    else if (a === '--interval') out.interval = Number(argv[++i]) || out.interval
  }
  return out
}

function log(msg) {
  console.log(`[book-pusher] ${msg}`)
}

function err(msg) {
  console.error(`[book-pusher] ${msg}`)
}

function runNode(script, stdinText) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: root,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (c) => {
      stdout += c
    })
    child.stderr.on('data', (c) => {
      stderr += c
    })
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `exit ${code}`))
        return
      }
      resolve(stdout)
    })
    if (stdinText != null) {
      child.stdin.write(stdinText)
      child.stdin.end()
    } else {
      child.stdin.end()
    }
  })
}

function headers() {
  const secret = process.env.BOOK_INGEST_SECRET?.trim() ?? ''
  const appToken = process.env.CURSOR_APP_TOKEN?.trim() ?? ''
  const h = {
    'content-type': 'application/json',
    'cache-control': 'no-store',
  }
  if (secret) {
    h.authorization = `Bearer ${secret}`
    h['x-nemesis-book-secret'] = secret
  }
  if (appToken) {
    h['x-cursor-app-token'] = appToken
  }
  return { headers: h, hasSecret: Boolean(secret), hasToken: Boolean(appToken) }
}

async function postBook(body) {
  const { headers: h, hasSecret, hasToken } = headers()
  const url = `${defaultUrl}/api/book`
  const res = await fetch(url, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(body),
  })
  const text = await res.text()
  return {
    ok: res.ok,
    status: res.status,
    text,
    url,
    hasSecret,
    hasToken,
  }
}

function bumpBakeAsOf() {
  if (!existsSync(bakePath)) {
    throw new Error(`missing bake ${bakePath}`)
  }
  const book = JSON.parse(readFileSync(bakePath, 'utf8'))
  book.asOf = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  book.refreshedBy = 'book-pusher-refresh'
  book.sourceNote =
    book.sourceNote?.includes('refresh ping')
      ? book.sourceNote
      : `${book.sourceNote ?? 'RH bake'} · refresh ping (awaiting live ingest secrets)`
  book.degraded = Boolean(book.degraded)
  return book
}

async function pushLiveFromInput(inputPath) {
  if (!inputPath || !existsSync(inputPath)) {
    throw new Error(`live input missing: ${inputPath || '(none)'}`)
  }
  const raw = readFileSync(inputPath, 'utf8')
  const built = await runNode(join(root, 'scripts/build-book-from-rh.mjs'), raw)
  const book = JSON.parse(built)
  const result = await postBook(book)
  if (!result.ok) {
    throw new Error(`POST ${result.status}: ${result.text.slice(0, 240)}`)
  }
  log(`live ok asOf=${book.asOf} status=${result.status}`)
  return book
}

async function pushRefreshPing() {
  // Prefer server-side refresh of whatever is already stored.
  const ping = await postBook({
    refresh: true,
    refreshedBy: 'book-pusher-refresh',
  })
  if (ping.ok) {
    log(`refresh ping ok ${ping.text.slice(0, 160)}`)
    return
  }

  // Fallback: re-post bake with bumped asOf (works with secret or signed-in token).
  const book = bumpBakeAsOf()
  const result = await postBook(book)
  if (!result.ok) {
    throw new Error(
      `refresh failed ${result.status}: ${result.text.slice(0, 240)} (secret=${result.hasSecret} token=${result.hasToken})`,
    )
  }
  // Keep local bake aligned so republish cold-start is less stale.
  try {
    mkdirSync(dirname(bakePath), { recursive: true })
    writeFileSync(bakePath, `${JSON.stringify(book, null, 2)}\n`)
  } catch {
    // non-fatal
  }
  log(`bake refresh ok asOf=${book.asOf}`)
}

async function cycle(opts) {
  const mode =
    opts.mode === 'auto'
      ? opts.input && existsSync(opts.input)
        ? 'live'
        : 'refresh'
      : opts.mode

  if (mode === 'live') {
    try {
      await pushLiveFromInput(opts.input)
      return
    } catch (e) {
      err(`live push failed: ${e.message}`)
      log('falling back to refresh ping')
      await pushRefreshPing()
      return
    }
  }

  if (mode === 'refresh') {
    await pushRefreshPing()
    return
  }

  throw new Error(`unknown mode ${mode}`)
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  log(
    `start mode=${opts.mode} once=${opts.once} interval=${opts.interval}ms url=${defaultUrl}`,
  )

  await cycle(opts)
  if (opts.once) return

  const timer = setInterval(() => {
    void cycle(opts).catch((e) => err(e.message))
  }, opts.interval)

  // Keep process alive; Ctrl+C / stdin end stops.
  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin })
    rl.on('line', (line) => {
      if (line.trim().toLowerCase() === 'q') {
        clearInterval(timer)
        rl.close()
        process.exit(0)
      }
    })
  }

  process.on('SIGINT', () => {
    clearInterval(timer)
    process.exit(0)
  })
}

main().catch((e) => {
  err(e.message ?? e)
  process.exit(1)
})
