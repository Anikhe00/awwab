import type { ReadingLog } from '../types'
import { addDays, daysBetween } from './dates'

/** Missing this many whole days or more counts as a gap; coming back ends it. */
export const GAP_DAYS = 2

export const didRead = (l: ReadingLog) => l.pages > 0 || l.ayat > 0

export interface ReadingSummary {
  currentStreak: number
  totalDays: number
  returns: number
  lastDate?: string
  daysSince?: number
  readToday: boolean
  welcomeBack: boolean
}

export function summarize(logs: ReadingLog[], today: string): ReadingSummary {
  const days = [...new Set(logs.filter(didRead).map((l) => l.date))].sort()
  const set = new Set(days)
  const last = days[days.length - 1]
  const readToday = set.has(today)
  let streak = 0
  if (last) {
    let cursor = readToday ? today : set.has(addDays(today, -1)) ? addDays(today, -1) : ''
    while (cursor && set.has(cursor)) {
      streak++
      cursor = addDays(cursor, -1)
    }
  }
  let returns = 0
  for (let i = 1; i < days.length; i++) if (daysBetween(days[i - 1], days[i]) > GAP_DAYS) returns++
  const daysSince = last ? daysBetween(last, today) : undefined
  return {
    currentStreak: streak,
    totalDays: days.length,
    returns,
    lastDate: last,
    daysSince,
    readToday,
    welcomeBack: !!last && !readToday && (daysSince ?? 0) > GAP_DAYS,
  }
}

export const pagesInRange = (logs: ReadingLog[], from: string, to: string) =>
  logs.filter((l) => l.date >= from && l.date <= to).reduce((s, l) => s + l.pages, 0)
