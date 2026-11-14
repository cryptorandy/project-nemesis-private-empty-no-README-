#!/usr/bin/env node
/**
 * Always-on book pusher cycle for Project Nemesis (private app).
 *
 * Agents run this after RH MCP reads — never from the browser.
 * Does NOT place trades. Read-only RH → scrubbed book → POST /api/book.
 *
 * Cycle (timer / cloud agent, every ~60–90s while desk is open):
 *   1. get_portfolio / get_equity_positions / get_option_positions(nonzero)
 *      / get_crypto_positions / get_equity_quotes (+ option quotes for opens)
 *   2. Pipe structured JSON into this script (or build-book → push-live-book)
 *   3. Desk polls GET /api/book ~30s → positions stay fresh without republish
 *
 * Auth (env — never paste values in chat):
 *   BOOK_INGEST_SECRET  — required by POST /api/book
 *   CURSOR_APP_TOKEN    — private app gate (x-cursor-app-token)
 *   NEMESIS_APP_URL     — default https://project-nemesis.apps.grok.bot
 *
 * Usage:
 *   cat rh-dump.json | node scripts/run-book-pusher.mjs
 *   node scripts/run-book-pusher.mjs --dry-run < rh-dump.json
 *
 * rh-dump.json shape: same as scripts/build-book-from-rh.mjs stdin.
 */
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dryRun = process.argv.includes('--dry-run')

async function readStdin() {
  if (process.stdin.isTTY) {
    console.error(
      '[run-book-pusher] pipe RH dump JSON (portfolio + positions + optionPositions + quotes)',
    )
    console.error(
      '[run-book-pusher] Agent loop: MCP reads → this script → desk /api/book poll',
    )
    process.exit(1)
  }
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

function runNode(script, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: root,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => {
      out += d
    })
    child.stderr.on('data', (d) => {
      err += d
    })
    child.on('close', (code) => {
      if (code === 0) resolve(out)
      else reject(new Error(err.trim() || `exit ${code}`))
    })
    child.stdin.write(input)
    child.stdin.end()
  })
}

async function main() {
  const raw = await readStdin()
  // Validate JSON early
  JSON.parse(raw)

  const bookJson = await runNode(join(root, 'scripts/build-book-from-rh.mjs'), raw)
  const book = JSON.parse(bookJson)
  const eq = book.positions.filter((p) => (p.asset ?? 'equity') === 'equity').length
  const opt = book.positions.filter((p) => p.asset === 'option').length
  const cry = book.positions.filter((p) => p.asset === 'crypto').length
  console.log(
    `[run-book-pusher] built schema v${book.schemaVersion} asOf=${book.asOf} rows eq=${eq} opt=${opt} cry=${cry}`,
  )

  if (dryRun) {
    process.stdout.write(bookJson)
    return
  }

  const secret = process.env.BOOK_INGEST_SECRET?.trim() ?? ''
  if (!secret) {
    console.error(
      '[run-book-pusher] BOOK_INGEST_SECRET missing — wrote nothing. Set secret in Cursor Secrets, then re-run.',
    )
    console.error(
      '[run-book-pusher] Fallback: commit public/data/book.json + republish (stale until secret lands).',
    )
    // Still emit book on stdout so agents can bake without push.
    process.stdout.write(bookJson)
    process.exit(2)
  }

  await runNode(join(root, 'scripts/push-live-book.mjs'), bookJson)
  console.log('[run-book-pusher] push ok · desk should show fresh within ~30s')
}

main().catch((err) => {
  console.error(`[run-book-pusher] ${err?.message ?? err}`)
  process.exit(1)
})
