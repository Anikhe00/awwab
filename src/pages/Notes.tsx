import { useState } from 'react'
import { Link } from 'react-router-dom'
import { store } from '../data'
import { useQuery } from '../lib/hooks'
import { names } from '../content'
import NoteItem from '../components/NoteItem'

export default function Notes() {
  const notes = useQuery(() => store.getNotes())
  const [q, setQ] = useState('')
  if (!notes) return <p className="text-muted">Loading…</p>
  const needle = q.trim().toLowerCase()
  const hits = notes
    .filter((n) => {
      if (!needle) return true
      const nm = names[n.nameId - 1]
      return [n.text, n.transcript ?? '', nm.tr, nm.meaning, nm.ar].some((s) => s.toLowerCase().includes(needle))
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return (
    <div className="flex flex-col gap-5">
      <h1 className="m-0 text-3xl">Notes</h1>
      <input className="input" type="search" aria-label="Search all notes" placeholder="Search typed notes, transcripts, and Names" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="m-0 text-muted">{hits.length} {hits.length === 1 ? 'note' : 'notes'}{needle ? ' found' : ''}</p>
      <ul className="list-none p-0 m-0 flex flex-col gap-3">
        {hits.map((n) => (
          <NoteItem key={n.id} note={n} label={<Link to={`/names/${n.nameId}`} className="font-semibold">{names[n.nameId - 1].tr} · </Link>} />
        ))}
      </ul>
      {!notes.length && <p className="text-muted">Notes you write or record on each Name’s card will appear here.</p>}
    </div>
  )
}
