import type {
  AudioRow, BackupFile, HabitId, HabitLog, HifzItem, HifzReview, NameProgress,
  Note, Position, ReadingLog, Settings, Strength,
} from '../types'

/**
 * Everything the UI needs from persistence. The app only ever talks to this
 * interface, so a cloud-sync implementation can replace DexieStore later
 * without touching any component.
 */
export interface Store {
  /** Called after any write so views can refresh. Returns unsubscribe. */
  subscribe(cb: () => void): () => void

  getSettings(): Promise<Settings>
  updateSettings(patch: Partial<Settings>): Promise<void>

  getPosition(): Promise<Position>
  setPosition(p: Position): Promise<void>

  getReadingLogs(): Promise<ReadingLog[]>
  /** Adds to today's log and (for pages) marks them read in the current khatm. */
  addReading(date: string, add: { pages?: number; ayat?: number }): Promise<void>
  getPagesRead(): Promise<number[]> // pages read in the current khatm cycle
  markPageRead(page: number): Promise<void>
  startNewKhatm(): Promise<void>

  getHabitLogs(): Promise<HabitLog[]>
  setHabit(date: string, habit: HabitId, done: boolean, note?: string): Promise<void>

  getHifz(): Promise<HifzItem[]>
  addHifz(item: Omit<HifzItem, 'id'>): Promise<number>
  updateHifz(id: number, patch: Partial<HifzItem>): Promise<void>
  removeHifz(id: number): Promise<void>
  reviewHifz(id: number, rating: Strength, today: string): Promise<void>
  getHifzReviews(): Promise<HifzReview[]>

  getNameProgress(): Promise<NameProgress[]>
  updateNameProgress(nameId: number, patch: Partial<NameProgress>): Promise<void>

  getNotes(): Promise<Note[]>
  addNote(n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<number>
  updateNote(id: number, patch: Partial<Note>): Promise<void>
  removeNote(id: number): Promise<void>
  putAudio(a: Omit<AudioRow, 'id'>): Promise<number>
  getAudio(id: number): Promise<AudioRow | undefined>

  exportAll(): Promise<BackupFile>
  importAll(file: BackupFile): Promise<void>
}
