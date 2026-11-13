#!/usr/bin/env node
/**
 * Push a scrubbed RH book to the published private app (or local Vite).
 *
 * Reads book JSON from stdin. Never places trades.
 *
 * Auth:
 *   BOOK_INGEST_SECRET  — required by POST /api/book
 *   CURSOR_APP_TOKEN    — optional; private apps gate needs x-cursor-app-token
 *
 * Usage:
 *   cat book.json | node scripts/push-live-book.mjs
 *   NEMESIS_APP_URL=https://project-nemesis.apps.grok.bot \
 *     BOOK_INGEST_SECRET=… CURSOR_APP_TOKEN=… \
 *     node scripts/push-live-book.mjs < book.json
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const defaultUrl =
  process.env.NEMESIS_APP_URL?.replace(/\/$/, '') ||
  'https://project-nemesis.apps.grok.bot'

async function readStdin() {
  if (process.stdin.isTTY) {
    const fallback = join(root, 'public/data/book.json')
    if (!existsSync(fallback)) {
      console.error('[push-live-book] pipe a book JSON or ensure public/data/book.json exists')
      process.exit(1)
    }
    return readFileSync(fallback, 'utf8')
  }
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

function scrub(book) {
  const masked = '••••0788'
  const text = JSON.stringify(book)
  // Strip accidental full account numbers (9+ digit runs near account fields).
  const cleaned = JSON.parse(
    text.replace(/856290788/g, masked).replace(/"account_number"\s*:\s*"\d+"/gi, `"account_number":"${masked}"`),
  )
  cleaned.accountMasked = masked
  if (cleaned.portfolio) cleaned.portfolio.accountMasked = masked
  return cleaned
}

async function main() {
  const secret = process.env.BOOK_INGEST_SECRET?.trim() ?? ''
  const appToken = process.env.CURSOR_APP_TOKEN?.trim() ?? ''
  const raw = JSON.parse(await readStdin())
  const book = scrub(raw)

  const headers = {
    'content-type': 'application/json',
    'cache-control': 'no-store',
  }
  if (secret) {
    headers.authorization = `Bearer ${secret}`
    headers['x-nemesis-book-secret'] = secret
  }
  if (appToken) {
    headers['x-cursor-app-token'] = appToken
  }

  const url = `${defaultUrl}/api/book`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(book),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`[push-live-book] ${res.status} ${url}`)
    console.error(text.slice(0, 500))
    process.exit(1)
  }
  console.log(`[push-live-book] ok ${url} asOf=${book.asOf} body=${text.slice(0, 200)}`)
}

main().catch((err) => {
  console.error(`[push-live-book] ${err?.message ?? err}`)
  process.exit(1)
})
