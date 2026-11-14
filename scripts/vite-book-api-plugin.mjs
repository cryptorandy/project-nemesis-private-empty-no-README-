/**
 * Local Vite middleware mirroring /api/book so desk polling works in `npm run dev`.
 * Published host uses api/book.ts + Postgres instead.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const bakePath = join(root, 'public/data/book.json')
const livePath = join(root, '.local/live-book.json')

function loadBook() {
  if (existsSync(livePath)) {
    return JSON.parse(readFileSync(livePath, 'utf8'))
  }
  if (existsSync(bakePath)) {
    return JSON.parse(readFileSync(bakePath, 'utf8'))
  }
  return null
}

function saveBook(book) {
  mkdirSync(dirname(livePath), { recursive: true })
  writeFileSync(livePath, `${JSON.stringify(book, null, 2)}\n`)
}

export function bookApiPlugin() {
  return {
    name: 'nemesis-book-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (url !== '/api/book') return next()

        res.setHeader('cache-control', 'private, no-store')
        res.setHeader('content-type', 'application/json; charset=utf-8')

        if (req.method === 'GET') {
          const book = loadBook()
          if (!book) {
            res.statusCode = 503
            res.end(JSON.stringify({ error: 'book_unavailable' }))
            return
          }
          res.statusCode = 200
          res.end(JSON.stringify(book))
          return
        }

        if (req.method === 'POST') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          try {
            const raw = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            if (raw?.refresh === true || raw?.mode === 'refresh') {
              const current = loadBook()
              if (!current) {
                res.statusCode = 503
                res.end(JSON.stringify({ error: 'book_unavailable' }))
                return
              }
              const book = {
                ...current,
                asOf: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
                refreshedBy: raw.refreshedBy ?? 'local-refresh',
                sourceNote: String(current.sourceNote || '').includes(
                  'refresh ping',
                )
                  ? current.sourceNote
                  : `${current.sourceNote || 'RH bake'} · refresh ping`,
              }
              saveBook(book)
              res.statusCode = 200
              res.end(
                JSON.stringify({ ok: true, asOf: book.asOf, mode: 'refresh' }),
              )
              return
            }
            if (!raw?.asOf || !raw?.portfolio || !Array.isArray(raw?.positions)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'invalid_book' }))
              return
            }
            const book = {
              schemaVersion: Number(raw.schemaVersion) || 2,
              asOf: raw.asOf,
              refreshedBy: raw.refreshedBy ?? 'local-ingest',
              accountMasked: raw.accountMasked ?? '••••0788',
              sourceNote:
                raw.sourceNote ??
                'RH MCP live book · local ingest · desk polls /api/book',
              degraded: Boolean(raw.degraded),
              portfolio: {
                ...raw.portfolio,
                accountMasked: raw.portfolio.accountMasked ?? '••••0788',
              },
              positions: raw.positions,
            }
            saveBook(book)
            res.statusCode = 200
            res.end(JSON.stringify({ ok: true, asOf: book.asOf }))
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'invalid_json' }))
          }
          return
        }

        res.statusCode = 405
        res.end(JSON.stringify({ error: 'method_not_allowed' }))
      })
    },
  }
}
