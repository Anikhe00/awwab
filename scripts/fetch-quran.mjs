// Downloads the Uthmani text + page mapping from the Quran.com API (v4) and
// writes compact JSON into src/content. Run: node scripts/fetch-quran.mjs
// No Qur'an text is written by hand anywhere in this project.
import { writeFileSync, mkdirSync } from 'node:fs'
const API = 'https://api.quran.com/api/v4'
const get = async (p) => {
  for (let i = 0; i < 4; i++) {
    try { const r = await fetch(API + p); if (r.ok) return r.json() } catch {}
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
  }
  throw new Error('failed ' + p)
}
mkdirSync('src/content', { recursive: true })
const { chapters } = await get('/chapters')
const surahs = chapters.map((c) => ({
  n: c.id, ar: c.name_arabic, en: c.name_simple, meaning: c.translated_name.name,
  ayat: c.verses_count, place: c.revelation_place, bismillah: c.bismillah_pre,
  pages: c.pages,
}))
// ayat rows: [surah, ayah, startPage, juz, uthmaniText]
const ayat = []
for (const s of surahs) {
  const d = await get(`/verses/by_chapter/${s.n}?fields=text_uthmani&per_page=300`)
  if (d.verses.length !== s.ayat) throw new Error(`count mismatch surah ${s.n}`)
  for (const v of d.verses) ayat.push([s.n, v.verse_number, v.page_number, v.juz_number, v.text_uthmani])
  process.stdout.write(`\r${s.n}/114`)
}
if (ayat.length !== 6236) throw new Error('expected 6236 ayat, got ' + ayat.length)
const pages = new Set(ayat.map((a) => a[2]))
if (pages.size !== 604) throw new Error('expected 604 pages, got ' + pages.size)
writeFileSync('src/content/surahs.json', JSON.stringify(surahs))
writeFileSync('src/content/quran.json', JSON.stringify(ayat))
console.log('\nok: 114 surahs, 6236 ayat, 604 pages')
