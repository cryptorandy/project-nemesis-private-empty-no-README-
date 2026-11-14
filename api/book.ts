/**
 * Live Robinhood book API for Project Nemesis (private Cursor app).
 *
 * GET  /api/book  — signed-in viewer reads latest positions/portfolio
 * POST /api/book  — agent ingest with BOOK_INGEST_SECRET (no place-order)
 *
 * Hosted browser cannot call RH MCP; agents push scrubbed books here so the
 * desk stays current without a full republish.
 */
import { requireIdentity } from '../cursor/identity.js'
import {
  ingestAuthorized,
  isRefreshPing,
  parseIngestBody,
  readLiveBook,
  refreshLiveBook,
  writeLiveBook,
} from './_lib/bookStore.js'

const NO_STORE = {
  'cache-control': 'private, no-store',
  'content-type': 'application/json; charset=utf-8',
} as const

export async function GET(request: Request): Promise<Response> {
  const identity = await requireIdentity(request)
  if (identity instanceof Response) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: NO_STORE,
    })
  }

  const book = await readLiveBook()
  if (!book) {
    return new Response(JSON.stringify({ error: 'book_unavailable' }), {
      status: 503,
      headers: NO_STORE,
    })
  }

  return new Response(JSON.stringify(book), {
    status: 200,
    headers: NO_STORE,
  })
}

export async function POST(request: Request): Promise<Response> {
  if (!ingestAuthorized(request)) {
    // Allow a signed-in owner to seed once from the browser during bring-up.
    const identity = await requireIdentity(request)
    if (identity instanceof Response) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: NO_STORE,
      })
    }
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: NO_STORE,
    })
  }

  // Soft keep-alive: bump asOf on existing book/bake (signed-in or secret).
  if (isRefreshPing(raw)) {
    const by =
      raw && typeof raw === 'object' && 'refreshedBy' in raw
        ? String((raw as { refreshedBy?: unknown }).refreshedBy ?? '')
        : 'refresh-ping'
    const saved = await refreshLiveBook(by)
    if (!saved) {
      return new Response(JSON.stringify({ error: 'book_unavailable' }), {
        status: 503,
        headers: NO_STORE,
      })
    }
    return new Response(
      JSON.stringify({ ok: true, asOf: saved.asOf, mode: 'refresh' }),
      { status: 200, headers: NO_STORE },
    )
  }

  const parsed = parseIngestBody(raw)
  if (!parsed) {
    return new Response(JSON.stringify({ error: 'invalid_book' }), {
      status: 400,
      headers: NO_STORE,
    })
  }

  const saved = await writeLiveBook({
    ...parsed,
    refreshedBy: parsed.refreshedBy || 'agent-ingest',
    sourceNote:
      parsed.sourceNote ||
      'RH MCP live book · agent ingest · desk polls /api/book',
  })

  return new Response(JSON.stringify({ ok: true, asOf: saved.asOf }), {
    status: 200,
    headers: NO_STORE,
  })
}
