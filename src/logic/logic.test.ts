import { describe, it, expect } from 'vitest'
import { summarize } from './streak'
import { goalRaiseOffer } from './goal'
import { nextDueAfter, dueItems, surahCoverage } from './hifz'
import { treeStage, plantState } from './garden'
import { todayNameId } from './names'
import type { ReadingLog } from '../types'

const log = (date: string, pages = 1, goal = 1): ReadingLog =>
  ({ date, pages, ayat: 0, goalAtTime: goal, goalMet: pages >= goal })

describe('streak & returns', () => {
  it('counts streak ending yesterday without punishing today', () => {
    const s = summarize([log('2026-03-01'), log('2026-03-02')], '2026-03-03')
    expect(s.currentStreak).toBe(2); expect(s.welcomeBack).toBe(false)
  })
  it('counts a return after a gap and shows welcome back', () => {
    const logs = [log('2026-03-01'), log('2026-03-02'), log('2026-03-10')]
    expect(summarize(logs, '2026-03-10').returns).toBe(1)
    expect(summarize(logs, '2026-03-10').currentStreak).toBe(1)
    const s = summarize([log('2026-03-01')], '2026-03-06')
    expect(s.welcomeBack).toBe(true); expect(s.currentStreak).toBe(0)
  })
  it('a single missed day is not a gap', () => {
    expect(summarize([log('2026-03-01'), log('2026-03-03')], '2026-03-03').returns).toBe(0)
  })
  it('new user is not welcomed back', () => expect(summarize([], '2026-03-03').welcomeBack).toBe(false))
})

describe('goal raise offer', () => {
  const week = ['01', '02', '03', '04', '05', '06', '07'].map((d) => log('2026-03-' + d))
  it('offers after 7 met days, never before', () => {
    expect(goalRaiseOffer(week, 1, '2026-03-07')).toBe(2)
    expect(goalRaiseOffer(week.slice(1), 1, '2026-03-07')).toBeNull()
  })
  it('respects snooze and requires same goal', () => {
    expect(goalRaiseOffer(week, 1, '2026-03-07', '2026-03-14')).toBeNull()
    expect(goalRaiseOffer(week, 2, '2026-03-07')).toBeNull()
  })
})

describe('hifz schedule', () => {
  it('uses 2/7/21 day intervals', () => {
    expect(nextDueAfter('2026-03-01', 'weak')).toBe('2026-03-03')
    expect(nextDueAfter('2026-03-01', 'okay')).toBe('2026-03-08')
    expect(nextDueAfter('2026-03-01', 'strong')).toBe('2026-03-22')
  })
  it('lists due items and coverage', () => {
    const items = [
      { id: 1, surah: 1, fromAyah: 1, toAyah: 4, strength: 'strong' as const, addedAt: '', nextDue: '2026-03-01' },
      { id: 2, surah: 1, fromAyah: 5, toAyah: 7, strength: 'weak' as const, addedAt: '', nextDue: '2026-04-01' },
    ]
    expect(dueItems(items, '2026-03-05').map((i) => i.id)).toEqual([1])
    expect(surahCoverage(items, 1, 7)).toEqual({ strength: 'weak', complete: true, covered: 7 })
  })
})

describe('garden & names', () => {
  it('tree grows with days and never shrinks to nothing', () => {
    expect(treeStage(0)).toBe(0); expect(treeStage(7)).toBe(3); expect(treeStage(1000)).toBe(9)
  })
  it('plants get thirsty but keep their growth', () => {
    const p = plantState(new Set(['2026-03-01', '2026-03-02']), '2026-03-09')
    expect(p.thirsty).toBe(true); expect(p.level).toBe(1)
  })
  it('one name per day in order', () => {
    expect(todayNameId('2026-03-01', '2026-03-01')).toBe(1)
    expect(todayNameId('2026-03-01', '2026-03-10')).toBe(10)
    expect(todayNameId('2026-03-01', '2026-06-08')).toBe(1)
  })
})
