import { useState } from 'react'
import { Link } from 'react-router-dom'
import { store } from '../data'
import { useQuery } from '../lib/hooks'
import { todayStr } from '../logic/dates'
import { dueItems, nextDueAfter, surahCoverage, INTERVAL_DAYS } from '../logic/hifz'
import { surahOf, surahs } from '../content'
import { useQuran } from '../lib/useQuran'
import type { HifzItem, Strength } from '../types'

const STRENGTHS: Strength[] = ['strong', 'okay', 'weak']
const tone: Record<Strength, string> = {
  strong: 'var(--accent)',
  okay: 'var(--gold)',
  weak: '#c2785a',
}
const label: Record<Strength, string> = { strong: 'Strong', okay: 'Okay', weak: 'Weak' }

function StrengthPick({ value, onChange, name }: { value: Strength; onChange: (s: Strength) => void; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex gap-2 flex-wrap">
      {STRENGTHS.map((s) => (
        <button key={s} role="radio" aria-checked={value === s} onClick={() => onChange(s)}
          className="btn" style={value === s ? { background: tone[s], color: '#fff', borderColor: tone[s] } : undefined}>{label[s]}</button>
      ))}
    </div>
  )
}

export default function Hifz() {
  const today = todayStr()
  const items = useQuery(() => store.getHifz())
  const q = useQuran()
  const [surah, setSurah] = useState(0)
  const [from, setFrom] = useState(1)
  const [to, setTo] = useState(1)
  const [strength, setStrength] = useState<Strength>('okay')
  if (!items) return <p className="text-muted">Loading…</p>
  const due = dueItems(items, today)
  const pick = (n: number) => { setSurah(n); setFrom(1); setTo(surahOf(n).ayat); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const pageOf = (h: HifzItem) => q?.byKey.get(`${h.surah}:${h.fromAyah}`)?.page

  const add = async () => {
    if (!surah) return
    const f = Math.max(1, Math.min(from, to)), t = Math.min(surahOf(surah).ayat, Math.max(from, to))
    await store.addHifz({ surah, fromAyah: f, toAyah: t, strength, addedAt: today, nextDue: nextDueAfter(today, strength) })
    setSurah(0)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-3xl">Hifz revision</h1>

      <section className="card" aria-label="Due revisions">
        <h2 className="m-0 text-xl">Due today</h2>
        {!due.length && <p className="mb-0 mt-2 text-muted">{items.length ? 'Nothing due today. Revision finds its own rhythm.' : 'Add a surah you have memorized below to begin.'}</p>}
        <ul className="list-none p-0 m-0 mt-3 flex flex-col gap-3">
          {due.map((h) => (
            <li key={h.id} className="rounded-2xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 font-semibold">{surahOf(h.surah).en} <span className="arabic text-xl">{surahOf(h.surah).ar}</span> · ayat {h.fromAyah}–{h.toAyah}</p>
                {pageOf(h) && <Link className="btn no-underline" to={`/read/${pageOf(h)}`}>Open in mushaf</Link>}
              </div>
              <p className="mt-2 mb-2 text-muted">How was your revision?</p>
              <div className="flex gap-2 flex-wrap">
                {STRENGTHS.map((s) => (
                  <button key={s} className="btn" onClick={() => store.reviewHifz(h.id!, s, today)}>
                    {label[s]} <span className="text-muted font-normal">· again in {INTERVAL_DAYS[s]}d</span>
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-label="Mushaf map">
        <h2 className="m-0 text-xl">Mushaf map</h2>
        <p className="mt-1 mb-3 text-muted">Tap a surah to add what you have memorized. Dashed = partly memorized.</p>
        <div className="flex gap-4 flex-wrap text-sm mb-3">
          {STRENGTHS.map((s) => <span key={s} className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded" style={{ background: tone[s] }} />{label[s]}</span>)}
          <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded border border-line" />Not yet</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
          {surahs.map((s) => {
            const c = surahCoverage(items, s.n, s.ayat)
            return (
              <button key={s.n} onClick={() => pick(s.n)}
                aria-label={`${s.en}, ${c ? `${c.strength}${c.complete ? '' : ', partly memorized'}` : 'not memorized'}`}
                className="min-h-16 rounded-xl p-1 text-center cursor-pointer leading-tight"
                style={c ? { background: tone[c.strength], color: '#fff', border: c.complete ? '2px solid transparent' : '2px dashed rgba(255,255,255,.85)' }
                  : { background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
                <span className="block text-xs opacity-80">{s.n}</span>
                <span className="arabic block text-lg !leading-tight">{s.ar}</span>
              </button>
            )
          })}
        </div>
      </section>

      {surah > 0 && (
        <section className="card" aria-label="Add memorized">
          <h2 className="m-0 text-xl">Add: {surahOf(surah).en}</h2>
          <div className="mt-3 flex flex-wrap gap-4 items-end">
            <label className="block">Surah
              <select className="input mt-1" value={surah} onChange={(e) => pick(Number(e.target.value))}>
                {surahs.map((s) => <option key={s.n} value={s.n}>{s.n}. {s.en}</option>)}
              </select>
            </label>
            <label className="block">From ayah
              <input className="input mt-1 !w-28" type="number" min={1} max={surahOf(surah).ayat} value={from} onChange={(e) => setFrom(Number(e.target.value))} />
            </label>
            <label className="block">To ayah
              <input className="input mt-1 !w-28" type="number" min={1} max={surahOf(surah).ayat} value={to} onChange={(e) => setTo(Number(e.target.value))} />
            </label>
          </div>
          <p className="mb-2 mt-4">How strong is it?</p>
          <StrengthPick name="Strength" value={strength} onChange={setStrength} />
          <div className="mt-4 flex gap-3">
            <button className="btn btn-primary" onClick={add}>Add to my hifz</button>
            <button className="btn" onClick={() => setSurah(0)}>Cancel</button>
          </div>
        </section>
      )}

      <section className="card" aria-label="All memorized">
        <h2 className="m-0 text-xl">Memorized ({items.length})</h2>
        <ul className="list-none p-0 m-0 mt-3 divide-y divide-line">
          {[...items].sort((a, b) => a.surah - b.surah || a.fromAyah - b.fromAyah).map((h) => (
            <li key={h.id} className="py-3 flex flex-wrap items-center gap-3 justify-between">
              <div>
                <p className="m-0 font-semibold">{surahOf(h.surah).en} {h.fromAyah}–{h.toAyah}</p>
                <p className="m-0 text-sm text-muted">{h.lastRevised ? `Last revised ${h.lastRevised} · ` : ''}next {h.nextDue <= today ? 'due now' : h.nextDue}</p>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <StrengthPick name={`Strength of ${surahOf(h.surah).en}`} value={h.strength}
                  onChange={(s) => store.updateHifz(h.id!, { strength: s, nextDue: nextDueAfter(h.lastRevised ?? today, s) })} />
                <button className="btn btn-ghost" aria-label={`Remove ${surahOf(h.surah).en} ${h.fromAyah}-${h.toAyah}`}
                  onClick={() => { if (confirm('Remove this from your memorized list?')) store.removeHifz(h.id!) }}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
