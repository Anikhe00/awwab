import { store } from '../data'
import { loadQuran, TOTAL_PAGES } from '../content'
import { todayStr } from '../logic/dates'

const positionAtPage = async (page: number) => {
  const q = await loadQuran()
  const first = q.byPage.get(page)?.[0] ?? q.ayat[0]
  return { surah: first.surah, ayah: first.ayah, page }
}

/** Check in N pages read from the saved position; moves the bookmark forward. */
export async function checkInPages(n: number) {
  const pos = await store.getPosition()
  const last = Math.min(TOTAL_PAGES, pos.page + n - 1)
  for (let p = pos.page; p <= last; p++) await store.markPageRead(p)
  await store.addReading(todayStr(), { pages: n })
  await store.setPosition(await positionAtPage(Math.min(TOTAL_PAGES, pos.page + n)))
}

/** Check in N ayat; advances the bookmark ayah-by-ayah and marks fully passed pages read. */
export async function checkInAyat(n: number) {
  const q = await loadQuran()
  const pos = await store.getPosition()
  const idx = q.ayat.findIndex((a) => a.surah === pos.surah && a.ayah === pos.ayah)
  const target = q.ayat[Math.min(q.ayat.length - 1, Math.max(0, idx) + n)]
  for (let p = pos.page; p < target.page; p++) await store.markPageRead(p)
  await store.addReading(todayStr(), { ayat: n })
  await store.setPosition({ surah: target.surah, ayah: target.ayah, page: target.page })
}

/** One-tap "I read this page" from the in-app reader. */
export async function readPageInApp(page: number) {
  await store.markPageRead(page)
  await store.addReading(todayStr(), { pages: 1 })
  await store.setPosition(await positionAtPage(Math.min(TOTAL_PAGES, page + 1)))
}

export async function bookmarkAyah(surah: number, ayah: number) {
  const q = await loadQuran()
  const a = q.byKey.get(`${surah}:${ayah}`)!
  await store.setPosition({ surah, ayah, page: a.page })
}
