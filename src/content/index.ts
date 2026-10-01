import surahsRaw from './surahs.json'
import namesRaw from './names.json'
import translationsRaw from './translations.json'

export interface Surah {
  n: number; ar: string; en: string; meaning: string; ayat: number
  place: string; bismillah: boolean; pages: [number, number]
}
export interface Ayah { surah: number; ayah: number; page: number; juz: number; text: string }
export interface NameEntry {
  id: number; ar: string; tr: string; meaning: string
  verses: { key: string; hl: number[] }[]
  check: boolean | 'none' // true = weak match, 'none' = no verse confirmed
}

export const surahs = surahsRaw as Surah[]
export const names = namesRaw as NameEntry[]
/** English translation (M. Pickthall, public domain) for the verses cited under each Name. */
export const translations = translationsRaw as Record<string, string>
export const TRANSLATION_CREDIT = 'Translation: M. M. Pickthall (public domain)'
export const TOTAL_PAGES = 604
export const surahOf = (n: number) => surahs[n - 1]

export interface Quran {
  ayat: Ayah[]
  byPage: Map<number, Ayah[]>
  byKey: Map<string, Ayah>
}

let cache: Promise<Quran> | null = null
/** The Qur'an text is a separate lazily-loaded (and precached) chunk. */
export function loadQuran(): Promise<Quran> {
  cache ??= import('./quran.json').then((m) => {
    const rows = m.default as unknown as [number, number, number, number, string][]
    const ayat = rows.map(([surah, ayah, page, juz, text]) => ({ surah, ayah, page, juz, text }))
    const byPage = new Map<number, Ayah[]>()
    const byKey = new Map<string, Ayah>()
    for (const a of ayat) {
      byKey.set(`${a.surah}:${a.ayah}`, a)
      const l = byPage.get(a.page)
      if (l) l.push(a); else byPage.set(a.page, [a])
    }
    return { ayat, byPage, byKey }
  })
  return cache
}

export const toArabicDigits = (n: number) =>
  String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])

export const nameSearchUrls = (tr: string) => {
  // plain ASCII transliteration searches better on YouTube/Spotify
  const plain = tr.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿ’‘']/g, '')
  const q = encodeURIComponent(`Qalam Institute The Names ${plain}`)
  return {
    youtube: `https://www.youtube.com/results?search_query=${q}`,
    spotify: `https://open.spotify.com/search/${q}`,
  }
}

export function classifyEpisodeUrl(raw: string): 'youtube' | 'spotify' | null {
  try {
    const u = new URL(raw.trim())
    const h = u.hostname.replace(/^www\./, '')
    if (['youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com'].includes(h)) return 'youtube'
    if (h === 'open.spotify.com' || h === 'spotify.link') return 'spotify'
  } catch { /* not a URL */ }
  return null
}
