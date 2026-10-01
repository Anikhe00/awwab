import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { store } from '../data'
import { useQuery } from '../lib/hooks'
import { useQuran } from '../lib/useQuran'
import { bookmarkAyah, readPageInApp } from '../lib/reading'
import { surahOf, toArabicDigits, TOTAL_PAGES } from '../content'
import CheckIn from '../components/CheckIn'

export default function Read() {
  const params = useParams()
  const nav = useNavigate()
  const q = useQuran()
  const pos = useQuery(() => store.getPosition())
  const settings = useQuery(() => store.getSettings())
  const pagesRead = useQuery(() => store.getPagesRead())
  const [msg, setMsg] = useState('')
  const page = params.page ? Math.min(TOTAL_PAGES, Math.max(1, Number(params.page) || 1)) : pos?.page
  useEffect(() => { setMsg(''); window.scrollTo({ top: 0 }) }, [page])
  if (!q || !pos || !settings || !page) return <p className="text-muted">Loading the mushaf…</p>

  const ayat = q.byPage.get(page) ?? []
  const size = settings.arabicSize
  const go = (p: number) => nav(`/read/${Math.min(TOTAL_PAGES, Math.max(1, p))}`)
  const isMarked = (a: { surah: number; ayah: number }) => a.surah === pos.surah && a.ayah === pos.ayah
  const alreadyRead = pagesRead?.includes(page)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl">Page {page} <span className="text-muted text-base font-normal">of {TOTAL_PAGES}</span></h1>
          <p className="m-0 text-muted">Juz {ayat[0]?.juz} · {ayat.length ? surahOf(ayat[0].surah).en : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" aria-label="Smaller text" onClick={() => store.updateSettings({ arabicSize: Math.max(1.3, size - 0.2) })}>A−</button>
          <button className="btn" aria-label="Larger text" onClick={() => store.updateSettings({ arabicSize: Math.min(4, size + 0.2) })}>A+</button>
          {page !== pos.page && <Link className="btn no-underline" to="/read" onClick={() => nav('/read')}>My place (p. {pos.page})</Link>}
        </div>
      </div>

      <article className="card !px-5 sm:!px-10 !py-8" aria-label={`Qur'an page ${page}`}>
        {ayat.length === 0 && <p>No ayat start on this page.</p>}
        <div className="arabic text-center" style={{ fontSize: `${size}rem` }} lang="ar">
          {ayat.map((a) => {
            const s = surahOf(a.surah)
            const first = a.ayah === 1
            return (
              <span key={`${a.surah}:${a.ayah}`}>
                {first && (
                  <span className="block my-6 rounded-2xl border border-gold py-1 text-gold" style={{ fontSize: '0.8em' }}>
                    سُورَةُ {s.ar}
                    {s.bismillah && <span className="block text-ink" style={{ fontSize: '0.9em' }}>{q.byKey.get('1:1')!.text}</span>}
                  </span>
                )}
                <button onClick={async () => { await bookmarkAyah(a.surah, a.ayah); setMsg(`Your place is now ${s.en} ${a.surah}:${a.ayah}.`) }}
                  aria-label={`Ayah ${a.ayah} of ${s.en}. Tap to set as where I stopped`}
                  className={`arabic border-0 p-0 m-0 text-inherit cursor-pointer rounded-lg ${isMarked(a) ? 'bg-gold-soft' : 'bg-transparent'}`}
                  style={{ font: 'inherit', lineHeight: 'inherit' }}>
                  {a.text}{' '}<span className="text-gold" style={{ fontSize: '0.75em' }}>۝{toArabicDigits(a.ayah)}</span>{' '}
                </button>
              </span>
            )
          })}
        </div>
      </article>
      <p className="text-center text-muted text-sm m-0">Tap an ayah to mark where you stopped. Ayat that continue onto the next page appear on the page where they begin.</p>
      {msg && <p role="status" className="text-center text-accent m-0">{msg}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 sticky bottom-20 lg:bottom-4 rounded-2xl bg-paper/90 backdrop-blur p-2 border border-line">
        <button className="btn" disabled={page <= 1} onClick={() => go(page - 1)}>← Previous</button>
        <button className="btn btn-primary" onClick={async () => { await readPageInApp(page); setMsg('Checked in. Page marked as read.'); if (page < TOTAL_PAGES) go(page + 1) }}>
          {alreadyRead ? 'I read this page again' : 'I read this page'} ✓
        </button>
        <button className="btn" disabled={page >= TOTAL_PAGES} onClick={() => go(page + 1)}>Next →</button>
      </div>
      <details className="card">
        <summary className="cursor-pointer min-h-12 flex items-center font-semibold">Go to a page or log reading from elsewhere</summary>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex items-center gap-3">Page
            <input className="input !w-28" type="number" min={1} max={TOTAL_PAGES} defaultValue={page}
              onKeyDown={(e) => { if (e.key === 'Enter') go(Number((e.target as HTMLInputElement).value)) }} />
            <span className="text-muted">press Enter</span>
          </label>
          <CheckIn goal={settings.dailyGoalPages} />
        </div>
      </details>
    </div>
  )
}
