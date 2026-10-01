import type { HifzItem, Strength } from '../types'
import { addDays } from './dates'

export const INTERVAL_DAYS: Record<Strength, number> = { weak: 2, okay: 7, strong: 21 }
export const nextDueAfter = (today: string, s: Strength) => addDays(today, INTERVAL_DAYS[s])

export const dueItems = (items: HifzItem[], today: string) =>
  items.filter((i) => i.nextDue <= today).sort((a, b) => (a.nextDue > b.nextDue ? 1 : -1))

const rank: Record<Strength, number> = { weak: 0, okay: 1, strong: 2 }

/** Per-surah summary for the mushaf map: weakest strength + whether fully covered. */
export function surahCoverage(items: HifzItem[], surah: number, ayatCount: number) {
  const mine = items.filter((i) => i.surah === surah)
  if (!mine.length) return null
  const covered = new Set<number>()
  mine.forEach((i) => { for (let a = i.fromAyah; a <= i.toAyah; a++) covered.add(a) })
  const weakest = mine.reduce((w, i) => (rank[i.strength] < rank[w] ? i.strength : w), mine[0].strength)
  return { strength: weakest, complete: covered.size >= ayatCount, covered: covered.size }
}
