import { useState } from 'react'
import { Link } from 'react-router-dom'
import { store } from '../data'
import { useQuery } from '../lib/hooks'
import { names } from '../content'
import { todayNameId } from '../logic/names'
import { todayStr } from '../logic/dates'

export default function Names() {
  const settings = useQuery(() => store.getSettings())
  const progress = useQuery(() => store.getNameProgress())
  const notes = useQuery(() => store.getNotes())
  const [q, setQ] = useState('')
  if (!settings || !progress || !notes) return <p className="text-muted">Loading…</p>
  const todayId = todayNameId(settings.namesStartDate, todayStr())
  const withNotes = new Set(notes.map((n) => n.nameId))
  const prog = new Map(progress.map((p) => [p.nameId, p]))
  const needle = q.trim().toLowerCase()
  const list = names.filter((n) => !needle || n.tr.toLowerCase().includes(needle) || n.meaning.toLowerCase().includes(needle) || n.ar.includes(needle) || String(n.id) === needle)
  const reflected = progress.filter((p) => p.reflected).length
  const t = names[todayId - 1]
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-3xl">The 99 Names</h1>
          <p className="m-0 text-muted">{reflected} of 99 reflected on</p>
        </div>
      </header>
      <Link to={`/names/${t.id}`} className="card no-underline text-inherit flex items-center justify-between gap-4 !bg-accent-soft">
        <div><p className="m-0 text-sm text-muted">Today’s Name · {t.id} of 99</p><p className="m-0 text-xl font-semibold">{t.tr}</p><p className="m-0 text-muted">{t.meaning}</p></div>
        <p className="arabic m-0 text-5xl !leading-[2]">{t.ar}</p>
      </Link>
      <input className="input" type="search" aria-label="Filter the Names" placeholder="Filter by name, meaning, or number" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="list-none p-0 m-0 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {list.map((n) => {
          const p = prog.get(n.id)
          return (
            <li key={n.id}>
              <Link to={`/names/${n.id}`} aria-label={`${n.id}. ${n.tr}${p?.reflected ? ', reflected on' : ''}${n.id === todayId ? ', today' : ''}`}
                className={`card !p-3 block no-underline text-inherit text-center min-h-28 ${n.id === todayId ? '!border-gold' : ''}`}>
                <span className="text-xs text-muted flex justify-between"><span>{n.id}</span><span>{withNotes.has(n.id) ? '✎ ' : ''}{p?.reflected ? '✓' : ''}</span></span>
                <span className="arabic block text-3xl !leading-[2]">{n.ar}</span>
                <span className="block text-sm font-semibold">{n.tr}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
