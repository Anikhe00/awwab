import { useEffect, useRef, useState } from 'react'
import { store } from '../data'
import { speechSupported, startLiveTranscription, type LiveTranscriber } from '../lib/speech'

const pickMime = () =>
  ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ?? ''

export default function VoiceRecorder({ nameId, lang }: { nameId: number; lang: string }) {
  const [state, setState] = useState<'idle' | 'recording' | 'saving'>('idle')
  const [secs, setSecs] = useState(0)
  const [live, setLive] = useState({ final: '', interim: '' })
  const [error, setError] = useState('')
  const rec = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const stream = useRef<MediaStream | null>(null)
  const sr = useRef<LiveTranscriber | null>(null)
  const started = useRef(0)
  const speech = speechSupported()

  useEffect(() => {
    if (state !== 'recording') return
    const t = setInterval(() => setSecs(Math.round((Date.now() - started.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [state])
  useEffect(() => () => { stream.current?.getTracks().forEach((t) => t.stop()); sr.current?.stop() }, [])

  const start = async () => {
    setError('')
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) { setError('Recording is not supported in this browser.'); return }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch { setError('Microphone access was not allowed. You can enable it in your browser settings.'); return }
    const mime = pickMime()
    const r = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined)
    chunks.current = []
    r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data) }
    r.onstop = async () => {
      setState('saving')
      const finalText = sr.current?.stop() ?? ''
      stream.current?.getTracks().forEach((t) => t.stop())
      const type = r.mimeType || mime || 'audio/webm'
      const blob = new Blob(chunks.current, { type })
      const audioId = await store.putAudio({ blob, mime: type, durationMs: Date.now() - started.current })
      await store.addNote({ nameId, text: '', audioId, transcript: finalText })
      setLive({ final: '', interim: '' }); setState('idle'); setSecs(0)
    }
    rec.current = r
    started.current = Date.now()
    setLive({ final: '', interim: '' })
    sr.current = speech ? startLiveTranscription(lang, (final, interim) => setLive({ final, interim })) : null
    r.start(1000)
    setState('recording')
  }

  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  return (
    <div className="rounded-2xl border border-line p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        {state !== 'recording'
          ? <button className="btn btn-primary" disabled={state === 'saving'} onClick={start}>● Record a voice note</button>
          : <button className="btn" style={{ background: '#b4432f', color: '#fff', borderColor: '#b4432f' }} onClick={() => rec.current?.stop()}>■ Stop and save · {mm}</button>}
        {state === 'recording' && <span role="status" className="text-muted">Recording…{speech ? ' transcribing live' : ''}</span>}
        {state === 'saving' && <span role="status" className="text-muted">Saving…</span>}
      </div>
      {!speech && <p className="m-0 text-sm text-muted">Live transcription isn’t available in this browser. Record anyway, then tap “Transcribe on this device” on the saved note (free, optional download).</p>}
      {state === 'recording' && speech && (
        <p className="m-0 min-h-12 p-3 rounded-xl bg-accent-soft" aria-live="polite">{live.final} <span className="text-muted">{live.interim}</span></p>
      )}
      {error && <p role="alert" className="m-0 text-[#b4432f]">{error}</p>}
    </div>
  )
}
