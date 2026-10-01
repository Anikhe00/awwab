import type { HabitLog } from '../types'
import { addDays } from './dates'

const STAGES = [0, 1, 3, 7, 14, 30, 60, 100, 200, 365]
/** 0 (seed) .. 9 (great tree), grows with total reading days. */
export const treeStage = (totalDays: number) =>
  STAGES.reduce((s, t, i) => (totalDays >= t ? i : s), 0)

export interface PlantState {
  level: number // 0..4 growth from last-30-day consistency
  thirsty: boolean // missed the last couple of days (never dies)
  doneToday: boolean
}

export function plantState(doneDates: Set<string>, today: string): PlantState {
  let count = 0
  for (let i = 0; i < 30; i++) if (doneDates.has(addDays(today, -i))) count++
  const level = count === 0 ? 0 : count < 4 ? 1 : count < 10 ? 2 : count < 20 ? 3 : 4
  const doneToday = doneDates.has(today)
  const recent = doneToday || doneDates.has(addDays(today, -1))
  return { level, thirsty: count > 0 && !recent, doneToday }
}

export const doneSet = (logs: HabitLog[], habit: string) =>
  new Set(logs.filter((l) => l.habit === habit && l.done).map((l) => l.date))
