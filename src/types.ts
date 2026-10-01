export type Strength = 'strong' | 'okay' | 'weak'

export type HabitId =
  | 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
  | 'adhkar_am' | 'adhkar_pm' | 'sadaqah'

export interface Settings {
  dailyGoalPages: number
  goalOfferSnoozeUntil?: string // YYYY-MM-DD; don't re-offer a raise before this
  installedAt: string // YYYY-MM-DD
  lastBackupAt?: string // ISO
  backupSnoozeUntil?: string // YYYY-MM-DD
  theme: 'system' | 'light' | 'dark'
  arabicSize: number // rem
  namesStartDate: string // the day Name #1 was shown
  khatmCycle: number // current khatm (1-based)
  khatmsCompleted: number
  speechLang: string
  whisperChosen: boolean
}

export interface Position { surah: number; ayah: number; page: number }

export interface ReadingLog {
  date: string // YYYY-MM-DD (primary key)
  pages: number
  ayat: number
  goalAtTime: number
  goalMet: boolean
}

export interface HabitLog { date: string; habit: HabitId; done: boolean; note?: string }

export interface HifzItem {
  id?: number
  surah: number
  fromAyah: number
  toAyah: number
  strength: Strength
  addedAt: string
  lastRevised?: string
  nextDue: string
}

export interface HifzReview { id?: number; hifzId: number; date: string; rating: Strength }

export interface NameProgress {
  nameId: number
  episodeUrl?: string
  listened: boolean
  read: boolean
  reflected: boolean
}

export interface Note {
  id?: number
  nameId: number
  text: string
  audioId?: number
  transcript?: string
  createdAt: string // ISO
  updatedAt: string
}

export interface AudioRow { id?: number; blob: Blob; mime: string; durationMs: number }

export interface PageRead { page: number; cycle: number }

export interface BackupFile {
  app: 'awwab'
  version: 1
  exportedAt: string
  settings: Settings | null
  position: Position | null
  readingLogs: ReadingLog[]
  habitLogs: HabitLog[]
  hifz: HifzItem[]
  hifzReviews: HifzReview[]
  nameProgress: NameProgress[]
  notes: Note[]
  pagesRead: PageRead[]
  audio: { id: number; mime: string; durationMs: number; dataBase64: string }[]
}
