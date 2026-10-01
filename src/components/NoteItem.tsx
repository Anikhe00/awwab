import { useEffect, useState } from 'react'
import { store } from '../data'
import type { Note } from '../types'
import { transcribeWithWhisper, WHISPER_SIZE_HINT } from '../lib/whisper'
import { speechSupported } from '../lib/speech'

export default function NoteItem({ note, label }: { note: Note; label?: React.ReactNode }) {
  const [text, setText] = useState(note.text)
  const [tr, setTr] = useState(note.transcript ?? '')
  const [url, setUrl] = useState<string>()
  const [status, setStatus] = useState('')
  const dirty = text !== note.text || tr !== (note.transcript ?? '')

  useEffect(() => {
    let u: string | undefined
    let alive = true
    if (note.audioId) store.getAudio(note.audioId).then((a) => { if (a && alive) setUrl((u = URL.createObjectURL(a.blob))) })
    return () => { alive = false; if (u) URL.revokeObjectURL(u) }
  }, [note.audioId])

  const whisper = async () => {
    if (!note.audioId) return
    if (!(await store.getSettings()).whisperChosen &&
      !confirm(`Transcribe on this device with Whisper? This downloads a speech model (${WHISPER_SIZE_HINT}) once. It is free and private — nothing leaves your device.`)) return
    try {
      await store.updateSettings({ whisperChosen: true })
      const a = await store.getAudio(note.audioId)
      const t = await transcribeWithWhisper(a!.blob, setStatus)
      setTr(t); await store.updateNote(note.id!, { transcript: t }); setStatus('Done.')
    } catch (e) { setStatus('Could not transcribe: ' + (e as Error).message) }
  }

  return (
    <li className="rounded-2xl border border-line p-4 flex flex-col gap-3">
      <div className="flex justify-between gap-2 text-sm text-muted">
        <span>{label}{new Date(note.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
        <button className="btn btn-ghost !min-h-10" onClick={() => { if (confirm('Delete this note?')) store.removeNote(note.id!) }}>Delete</button>
      </div>
      {url && <audio controls src={url} className="w-full" aria-label="Voice note" />}
      {(note.text || !note.audioId) && (
        <textarea className="input !min-h-24" aria-label="Note text" value={text} onChange={(e) => setText(e.target.value)} />
      )}
      {note.audioId && (
        <div>
          <label className="text-sm text-muted block mb-1" htmlFor={`tr-${note.id}`}>Transcript (you can edit it)</label>
          <textarea id={`tr-${note.id}`} className="input !min-h-20" value={tr} placeholder={tr ? '' : 'No transcript yet.'} onChange={(e) => setTr(e.target.value)} />
          {!tr && (
            <button className="btn mt-2" onClick={whisper}>
              {speechSupported() ? 'Transcribe on this device (Whisper)' : 'Transcribe on this device — free, runs offline after a one-time download'}
            </button>
          )}
          {status && <p role="status" className="m-0 mt-1 text-sm text-muted">{status}</p>}
        </div>
      )}
      {dirty && <button className="btn btn-primary" onClick={() => store.updateNote(note.id!, { text, transcript: tr })}>Save changes</button>}
    </li>
  )
}
