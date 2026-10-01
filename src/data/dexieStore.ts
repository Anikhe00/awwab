import Dexie, { type Table } from 'dexie'
import type {
  AudioRow, BackupFile, HabitId, HabitLog, HifzItem, HifzReview, NameProgress,
  Note, PageRead, Position, ReadingLog, Settings, Strength,
} from '../types'
import type { Store } from './store'
import { goalMetFor } from '../logic/goal'
import { nextDueAfter } from '../logic/hifz'
import { todayStr } from '../logic/dates'

class AwwabDB extends Dexie {
  settings!: Table<Settings & { key: string }, string>
  position!: Table<Position & { key: string }, string>
  readingLogs!: Table<ReadingLog, string>
  habitLogs!: Table<HabitLog, [string, string]>
  hifz!: Table<HifzItem, number>
  hifzReviews!: Table<HifzReview, number>
  nameProgress!: Table<NameProgress, number>
  notes!: Table<Note, number>
  audio!: Table<AudioRow, number>
  pagesRead!: Table<PageRead, number>
  constructor(name = 'awwab') {
    super(name)
    this.version(1).stores({
      settings: 'key',
      position: 'key',
      readingLogs: 'date',
      habitLogs: '[date+habit], date, habit',
      hifz: '++id, surah, nextDue',
      hifzReviews: '++id, hifzId',
      nameProgress: 'nameId',
      notes: '++id, nameId, createdAt',
      audio: '++id',
      pagesRead: 'page',
    })
  }
}

const defaultSettings = (): Settings => ({
  dailyGoalPages: 1,
  installedAt: todayStr(),
  theme: 'system',
  arabicSize: 2.1,
  namesStartDate: todayStr(),
  khatmCycle: 1,
  khatmsCompleted: 0,
  speechLang: 'en-US',
  whisperChosen: false,
})

const blobToBase64 = async (b: Blob) => {
  const bytes = new Uint8Array(await new Response(b).arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}
const base64ToBlob = (b64: string, mime: string) => {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export class DexieStore implements Store {
  db: AwwabDB
  private subs = new Set<() => void>()
  constructor(name?: string) { this.db = new AwwabDB(name) }
  subscribe(cb: () => void) { this.subs.add(cb); return () => { this.subs.delete(cb) } }
  private emit() { this.subs.forEach((f) => f()) }

  async getSettings() {
    const row = await this.db.settings.get('main')
    if (row) {
      const { key: _k, ...rest } = row
      return { ...defaultSettings(), ...rest }
    }
    const s = defaultSettings()
    await this.db.settings.put({ key: 'main', ...s })
    return s
  }
  async updateSettings(patch: Partial<Settings>) {
    const cur = await this.getSettings()
    await this.db.settings.put({ key: 'main', ...cur, ...patch })
    this.emit()
  }

  async getPosition(): Promise<Position> {
    const row = await this.db.position.get('main')
    return row ? { surah: row.surah, ayah: row.ayah, page: row.page } : { surah: 1, ayah: 1, page: 1 }
  }
  async setPosition(p: Position) {
    await this.db.position.put({ key: 'main', ...p })
    this.emit()
  }

  getReadingLogs() { return this.db.readingLogs.toArray() }
  async addReading(date: string, add: { pages?: number; ayat?: number }) {
    const settings = await this.getSettings()
    const cur = await this.db.readingLogs.get(date)
    const goalAtTime = cur?.goalAtTime ?? settings.dailyGoalPages
    const pages = (cur?.pages ?? 0) + (add.pages ?? 0)
    const ayat = (cur?.ayat ?? 0) + (add.ayat ?? 0)
    await this.db.readingLogs.put({ date, pages, ayat, goalAtTime, goalMet: goalMetFor(pages, ayat, goalAtTime) })
    this.emit()
  }
  async getPagesRead() {
    const { khatmCycle } = await this.getSettings()
    return (await this.db.pagesRead.toArray()).filter((p) => p.cycle === khatmCycle).map((p) => p.page)
  }
  async markPageRead(page: number) {
    const { khatmCycle } = await this.getSettings()
    await this.db.pagesRead.put({ page, cycle: khatmCycle })
    this.emit()
  }
  async startNewKhatm() {
    const s = await this.getSettings()
    await this.db.settings.put({ key: 'main', ...s, khatmCycle: s.khatmCycle + 1, khatmsCompleted: s.khatmsCompleted + 1 })
    await this.db.pagesRead.clear()
    await this.setPosition({ surah: 1, ayah: 1, page: 1 })
  }

  getHabitLogs() { return this.db.habitLogs.toArray() }
  async setHabit(date: string, habit: HabitId, done: boolean, note?: string) {
    const cur = await this.db.habitLogs.get([date, habit])
    await this.db.habitLogs.put({ date, habit, done, note: note ?? cur?.note })
    this.emit()
  }

  getHifz() { return this.db.hifz.toArray() }
  async addHifz(item: Omit<HifzItem, 'id'>) {
    const id = await this.db.hifz.add(item as HifzItem)
    this.emit(); return id as number
  }
  async updateHifz(id: number, patch: Partial<HifzItem>) { await this.db.hifz.update(id, patch); this.emit() }
  async removeHifz(id: number) { await this.db.hifz.delete(id); this.emit() }
  async reviewHifz(id: number, rating: Strength, today: string) {
    await this.db.hifzReviews.add({ hifzId: id, date: today, rating })
    await this.db.hifz.update(id, { strength: rating, lastRevised: today, nextDue: nextDueAfter(today, rating) })
    this.emit()
  }
  getHifzReviews() { return this.db.hifzReviews.toArray() }

  getNameProgress() { return this.db.nameProgress.toArray() }
  async updateNameProgress(nameId: number, patch: Partial<NameProgress>) {
    const cur = (await this.db.nameProgress.get(nameId)) ?? { nameId, listened: false, read: false, reflected: false }
    await this.db.nameProgress.put({ ...cur, ...patch })
    this.emit()
  }

  getNotes() { return this.db.notes.toArray() }
  async addNote(n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const id = await this.db.notes.add({ ...n, createdAt: now, updatedAt: now })
    this.emit(); return id as number
  }
  async updateNote(id: number, patch: Partial<Note>) {
    await this.db.notes.update(id, { ...patch, updatedAt: new Date().toISOString() }); this.emit()
  }
  async removeNote(id: number) {
    const n = await this.db.notes.get(id)
    if (n?.audioId) await this.db.audio.delete(n.audioId)
    await this.db.notes.delete(id); this.emit()
  }
  async putAudio(a: Omit<AudioRow, 'id'>) { return (await this.db.audio.add(a as AudioRow)) as number }
  getAudio(id: number) { return this.db.audio.get(id) }

  async exportAll(): Promise<BackupFile> {
    const d = this.db
    const audioRows = await d.audio.toArray()
    const audio = await Promise.all(audioRows.map(async (a) => ({
      id: a.id!, mime: a.mime, durationMs: a.durationMs, dataBase64: await blobToBase64(a.blob),
    })))
    const s = await d.settings.get('main')
    const p = await d.position.get('main')
    return {
      app: 'awwab', version: 1, exportedAt: new Date().toISOString(),
      settings: s ? (({ key: _k, ...r }) => r)(s) as Settings : null,
      position: p ? { surah: p.surah, ayah: p.ayah, page: p.page } : null,
      readingLogs: await d.readingLogs.toArray(),
      habitLogs: await d.habitLogs.toArray(),
      hifz: await d.hifz.toArray(),
      hifzReviews: await d.hifzReviews.toArray(),
      nameProgress: await d.nameProgress.toArray(),
      notes: await d.notes.toArray(),
      pagesRead: await d.pagesRead.toArray(),
      audio,
    }
  }
  async importAll(f: BackupFile) {
    if (f?.app !== 'awwab' || f.version !== 1) throw new Error('This is not an Awwab backup file.')
    const d = this.db
    await d.transaction('rw', d.tables, async () => {
      await Promise.all(d.tables.map((t) => t.clear()))
      if (f.settings) await d.settings.put({ key: 'main', ...f.settings })
      if (f.position) await d.position.put({ key: 'main', ...f.position })
      await d.readingLogs.bulkPut(f.readingLogs)
      await d.habitLogs.bulkPut(f.habitLogs)
      await d.hifz.bulkPut(f.hifz)
      await d.hifzReviews.bulkPut(f.hifzReviews)
      await d.nameProgress.bulkPut(f.nameProgress)
      await d.notes.bulkPut(f.notes)
      await d.pagesRead.bulkPut(f.pagesRead)
      await d.audio.bulkPut(f.audio.map((a) => ({ id: a.id, mime: a.mime, durationMs: a.durationMs, blob: base64ToBlob(a.dataBase64, a.mime) })))
    })
    this.emit()
  }
}
