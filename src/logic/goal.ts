import type { ReadingLog } from '../types'
import { addDays } from './dates'

export const AYAT_PER_PAGE = 10
export const goalMetFor = (pages: number, ayat: number, goal: number) =>
  pages >= goal || ayat >= goal * AYAT_PER_PAGE

/**
 * After 7 consecutive days of meeting the *current* goal, offer (never apply) a
 * raise. Returns the suggested new goal, or null.
 */
export function goalRaiseOffer(
  logs: ReadingLog[], goal: number, today: string, snoozeUntil?: string,
): number | null {
  if (snoozeUntil && today < snoozeUntil) return null
  const by = new Map(logs.map((l) => [l.date, l]))
  const ok = (d: string) => {
    const l = by.get(d)
    return !!l && l.goalMet && l.goalAtTime === goal
  }
  const end = ok(today) ? today : addDays(today, -1)
  for (let i = 0; i < 7; i++) if (!ok(addDays(end, -i))) return null
  return goal + 1
}
