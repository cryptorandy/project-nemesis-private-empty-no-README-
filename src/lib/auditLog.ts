import type { AuditAction, AuditEntry } from '../types'
import { nowTime } from '../data/mock'

/** Append-only audit: never mutate or delete prior crumbs. */
export function appendAudit(
  prev: readonly AuditEntry[],
  entity: string,
  action: AuditAction,
  details: string,
): AuditEntry[] {
  const nextSeq =
    prev.reduce((max, e) => Math.max(max, e.seq ?? 0), 0) + 1
  const entry: AuditEntry = Object.freeze({
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    seq: nextSeq,
    time: nowTime(),
    entity,
    action,
    details,
    immutable: true as const,
  })
  // Newest first for desk UI; prior rows untouched.
  return [entry, ...prev]
}

export function sealAudit(entries: AuditEntry[]): AuditEntry[] {
  return entries.map((e, i) =>
    Object.freeze({
      ...e,
      seq: e.seq ?? entries.length - i,
      immutable: true as const,
    }),
  )
}
