import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { store } from '../data'
import { useQuery } from '../lib/hooks'
import { useQuran } from '../lib/useQuran'
import { classifyEpisodeUrl, names, surahOf, translations, TRANSLATION_CREDIT } from '../content'
import VoiceRecorder from '../components/VoiceRecorder'
import NoteItem from '../components/NoteItem'
import Sheet from '../components/Sheet'

const Row = ({ title, hint, onClick, href }: { title: string; hint?: string; onClick?: () => void; href?: string }) => {
  const cls = 'card !p-4 flex items-center justify-between gap-3 w-full text-left min-h-16 cursor-pointer no-underline text-inherit'
  const inner = (<><span><span className="block font-semibold">{title}</span>{hint && <span className="block text-sm text-muted">{hint}</span>}</span><span aria-hidden="true" className="text-muted text-xl">›</span></>)
  return href
    ? <a className={cls} href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
    : <button className={cls} onClick={onClick}>{inner}</button>
}

export default function NameCard() {
  const id = Math.min(99, Math.max(1, Number(useParams().id) || 1))
  const n = names[id - 1]
  const quran = useQuran()
  const progress = useQuery(() => store.getNameProgress(), [id])
  const notes = useQuery(() => store.getNotes(), [id])
  const settings = useQuery(() => store.getSettings())
  const [panel, setPanel] = useState<null | 'notes' | 'link' | { verse: string }>(null)
  const [link, setLink] = useState('')
  const [linkErr, setLinkErr] = useState('')
  const [text, setText] = useState('')
  if (!progress || !notes || !settings) return <p className="text-muted">Loading…</p>

  const p = progress.find((x) => x.nameId === id) ?? { nameId: id, listened: false, read: false, reflected: false }
  const mine = notes.filter((x) => x.nameId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const close = () => setPanel(null)
  const verseKey = panel && typeof panel === 'object' ? panel.verse : null
  const verse = verseKey ? n.verses.find((v) => v.key === verseKey) : undefined
  const ayah = verseKey ? quran?.byKey.get(verseKey) : undefined

  const saveLink = async () => {
    if (!classifyEpisodeUrl(link)) { setLinkErr('Please paste a YouTube or Spotify link.'); return }
    setLinkErr('')
    await store.updateNameProgress(id, { episodeUrl: link.trim() })
    setLink(''); close()
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <nav className="flex justify-between items-center" aria-label="Names navigation">
        <Link className="btn no-underline" to="/names">← All Names</Link>
        <div className="flex gap-2">
          <Link className={`btn no-underline ${id <= 1 ? 'pointer-events-none opacity-50' : ''}`} aria-label="Previous Name" to={`/names/${Math.max(1, id - 1)}`}>←</Link>
          <Link className={`btn no-underline ${id >= 99 ? 'pointer-events-none opacity-50' : ''}`} aria-label="Next Name" to={`/names/${Math.min(99, id + 1)}`}>→</Link>
        </div>
      </nav>

      <header className="card text-center !py-8">
        <p className="m-0 text-muted">Name {id} of 99</p>
        <h1 className="arabic m-0 text-7xl !leading-[2] pb-2" lang="ar">{n.ar}</h1>
        <p className="m-0 text-2xl font-semibold">{n.tr}</p>
        <p className="m-0 mt-1 text-muted">{n.meaning}</p>
      </header>

      <section aria-label="In the Qur’an">
        <h2 className="m-0 mb-2 text-lg">In the Qur’an</h2>
        {n.check === 'none' && <p className="mt-0 text-sm p-3 rounded-xl bg-gold-soft">⚑ I couldn’t confirm this Name as a word in the Qur’anic text (it may come from hadith, or appear in a different form). Please check it yourself.</p>}
        {n.check === true && <p className="mt-0 text-sm p-3 rounded-xl bg-gold-soft">⚑ These matched the word, but I couldn’t confirm every one refers to this Name. Please verify.</p>}
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {n.verses.map((v) => {
            const [sn, an] = v.key.split(':').map(Number)
            return (
              <li key={v.key}>
                <button className="card !p-4 w-full flex items-center justify-between gap-3 text-left cursor-pointer min-h-14" onClick={() => setPanel({ verse: v.key })}>
                  <span><span className="font-semibold">{surahOf(sn).en}</span> <span className="text-muted">· verse {an}</span></span>
                  <span className="text-muted">{v.key} <span aria-hidden="true" className="text-xl">›</span></span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-label="Actions" className="flex flex-col gap-3">
        {p.episodeUrl
          ? <Row title="Listen to episode" hint={classifyEpisodeUrl(p.episodeUrl) === 'spotify' ? 'Opens Spotify' : 'Opens YouTube'} href={p.episodeUrl} />
          : <Row title="Add an episode link" hint="Paste a YouTube or Spotify link" onClick={() => setPanel('link')} />}
        <div className="flex gap-3 flex-wrap">
          {p.episodeUrl && <button className="btn" aria-pressed={p.listened} onClick={() => store.updateNameProgress(id, { listened: !p.listened })}>{p.listened ? '✓ Listened' : 'Mark as listened'}</button>}
          {p.episodeUrl && <button className="btn btn-ghost" onClick={() => setPanel('link')}>Change link</button>}
        </div>
        <Row title={`Notes${mine.length ? ` (${mine.length})` : ''}`} hint="Write or record your reflections" onClick={() => setPanel('notes')} />
        <button className="btn w-full !min-h-14" aria-pressed={p.reflected} onClick={() => store.updateNameProgress(id, { reflected: !p.reflected })}>
          {p.reflected ? '✓ Reflected on' : 'Mark as reflected on'}
        </button>
      </section>

      <Sheet open={!!verse} onClose={close} title={ayah ? `${surahOf(ayah.surah).en} ${verseKey}` : ''}>
        {ayah && verse && (
          <p className="arabic m-0 text-[2rem] text-center" lang="ar">
            {ayah.text.split(' ').map((w, i) => (
              <span key={i}>{verse.hl.includes(i) ? <mark className="bg-gold-soft text-inherit rounded px-1">{w}</mark> : w}{' '}</span>
            ))}
          </p>
        )}
        {verseKey && translations[verseKey] && (
          <>
            <p className="mt-5 mb-0 text-lg">{translations[verseKey]}</p>
            <p className="mt-2 mb-0 text-xs text-muted">{TRANSLATION_CREDIT}</p>
          </>
        )}
      </Sheet>

      <Sheet open={panel === 'link'} onClose={close} title="Episode link">
        <p className="mt-0 text-muted">Paste a link to the episode from YouTube or Spotify.</p>
        <input autoFocus className="input" inputMode="url" aria-label="Episode link" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} />
        {linkErr && <p role="alert" className="m-0 mt-1 text-[#b4432f]">{linkErr}</p>}
        <div className="mt-3 flex gap-3 flex-wrap">
          <button className="btn btn-primary" onClick={saveLink}>Save link</button>
          {p.episodeUrl && <button className="btn" onClick={() => { store.updateNameProgress(id, { episodeUrl: undefined, listened: false }); close() }}>Remove link</button>}
        </div>
      </Sheet>

      <Sheet open={panel === 'notes'} onClose={close} title={<>Notes · {n.tr}</>}>
        <div className="flex flex-col gap-4">
          <VoiceRecorder nameId={id} lang={settings.speechLang} />
          <div>
            <label htmlFor="newnote" className="sr-only">Write a note</label>
            <textarea id="newnote" className="input !min-h-28" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a note…" />
            <button className="btn btn-primary mt-2" disabled={!text.trim()} onClick={async () => { await store.addNote({ nameId: id, text: text.trim() }); setText('') }}>Save note</button>
          </div>
          <ul className="list-none p-0 m-0 flex flex-col gap-3">{mine.map((m) => <NoteItem key={m.id} note={m} />)}</ul>
          {!mine.length && <p className="m-0 text-muted">No notes yet.</p>}
        </div>
      </Sheet>
    </div>
  )
}
