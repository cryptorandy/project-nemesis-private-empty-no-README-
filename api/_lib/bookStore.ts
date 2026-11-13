/**
 * Live RH book store for the published private app.
 * Postgres when DATABASE_URL is set; otherwise memory + static bake fallback.
 * Never places trades. Scrubs full account ids from payloads.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import pg from 'pg'

export type BookPosition = {
  symbol: string
  qty: number
  avgCost: number
  mark: number
  value: number
  pnl: number
  pnlPct: number
}

export type BookPortfolio = {
  totalValue: number
  equityValue: number
  optionsValue: number
  cash: number
  buyingPower: number
  accountMasked: string
}

export type LiveBook = {
  schemaVersion: number
  asOf: string
  refreshedBy: string
  accountMasked: string
  sourceNote: string
  degraded: boolean
  portfolio: BookPortfolio
  positions: BookPosition[]
}

const MASK = '••••0788'
const databaseUrl = process.env.DATABASE_URL?.trim() ?? ''

let pool: pg.Pool | undefined
let local: Promise<PGlite> | undefined
let memoryBook: LiveBook | null = null

function scrubBook(raw: LiveBook): LiveBook {
  const accountMasked =
    typeof raw.accountMasked === 'string' && raw.accountMasked.includes('•')
      ? raw.accountMasked
      : MASK
  return {
    schemaVersion: 1,
    asOf: raw.asOf,
    refreshedBy: raw.refreshedBy,
    accountMasked,
    sourceNote: raw.sourceNote,
    degraded: Boolean(raw.degraded),
    portfolio: {
      totalValue: Number(raw.portfolio.totalValue) || 0,
      equityValue: Number(raw.portfolio.equityValue) || 0,
      optionsValue: Number(raw.portfolio.optionsValue) || 0,
      cash: Number(raw.portfolio.cash) || 0,
      buyingPower: Number(raw.portfolio.buyingPower) || 0,
      accountMasked,
    },
    positions: (raw.positions ?? []).map((p) => ({
      symbol: String(p.symbol),
      qty: Number(p.qty) || 0,
      avgCost: Number(p.avgCost) || 0,
      mark: Number(p.mark) || 0,
      value: Number(p.value) || 0,
      pnl: Number(p.pnl) || 0,
      pnlPct: Number(p.pnlPct) || 0,
    })),
  }
}

function looksLikeBook(raw: unknown): raw is LiveBook {
  if (!raw || typeof raw !== 'object') return false
  const o = raw as Record<string, unknown>
  return (
    typeof o.asOf === 'string' &&
    o.portfolio !== null &&
    typeof o.portfolio === 'object' &&
    Array.isArray(o.positions)
  )
}

async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== '') {
    pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 })
    return (await pool.query(text, params)).rows as T[]
  }
  local ??= startLocal().catch((error: unknown) => {
    local = undefined
    throw error
  })
  return (await (await local).query<T>(text, params)).rows
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite()
  await db.exec(`
    create table if not exists live_book (
      id smallint primary key check (id = 1),
      as_of timestamptz not null,
      refreshed_by text not null,
      account_masked text not null,
      source_note text not null,
      degraded boolean not null default false,
      payload jsonb not null,
      updated_at timestamptz not null default now()
    );
  `)
  return db
}

async function loadStaticBake(): Promise<LiveBook | null> {
  try {
    const path = join(process.cwd(), 'public/data/book.json')
    const text = await readFile(path, 'utf8')
    const raw: unknown = JSON.parse(text)
    if (!looksLikeBook(raw)) return null
    return scrubBook(raw)
  } catch {
    return null
  }
}

export async function readLiveBook(): Promise<LiveBook | null> {
  try {
    const rows = await sql<{ payload: LiveBook }>(
      'select payload from live_book where id = 1 limit 1',
    )
    if (rows[0]?.payload && looksLikeBook(rows[0].payload)) {
      return scrubBook(rows[0].payload)
    }
  } catch {
    // fall through
  }
  if (memoryBook) return memoryBook
  return loadStaticBake()
}

export async function writeLiveBook(input: LiveBook): Promise<LiveBook> {
  const book = scrubBook(input)
  memoryBook = book
  try {
    await sql(
      `insert into live_book (id, as_of, refreshed_by, account_masked, source_note, degraded, payload, updated_at)
       values (1, $1::timestamptz, $2, $3, $4, $5, $6::jsonb, now())
       on conflict (id) do update set
         as_of = excluded.as_of,
         refreshed_by = excluded.refreshed_by,
         account_masked = excluded.account_masked,
         source_note = excluded.source_note,
         degraded = excluded.degraded,
         payload = excluded.payload,
         updated_at = now()`,
      [
        book.asOf,
        book.refreshedBy,
        book.accountMasked,
        book.sourceNote,
        book.degraded,
        JSON.stringify(book),
      ],
    )
  } catch {
    // Memory still holds the book for this instance.
  }
  return book
}

export function parseIngestBody(raw: unknown): LiveBook | null {
  if (!looksLikeBook(raw)) return null
  return scrubBook(raw)
}

export function ingestAuthorized(request: Request): boolean {
  const expected = process.env.BOOK_INGEST_SECRET?.trim() ?? ''
  if (!expected) return false
  const header = request.headers.get('authorization') ?? ''
  const bearer = header.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : ''
  const alt = request.headers.get('x-nemesis-book-secret')?.trim() ?? ''
  return (
    (bearer !== '' && bearer === expected) ||
    (alt !== '' && alt === expected)
  )
}
