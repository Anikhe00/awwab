import { useState } from 'react'
import { checkInAyat, checkInPages } from '../lib/reading'

export default function CheckIn({ goal, onDone }: { goal: number; onDone?: () => void }) {
  const [mode, setMode] = useState<'pages' | 'ayat'>('pages')
  const [n, setN] = useState(goal)
  const [saved, setSaved] = useState('')
  const go = async () => {
    if (n < 1) return
    await (mode === 'pages' ? checkInPages(n) : checkInAyat(n))
    if (onDone) { onDone(); return }
    setSaved(`Checked in: ${n} ${mode === 'pages' ? (n === 1 ? 'page' : 'pages') : n === 1 ? 'ayah' : 'ayat'}. May it be accepted.`)
  }
  return (
    <div className={onDone ? '' : 'card'}>
      {!onDone && <h2 className="m-0 text-xl">Check in</h2>}
      <p className="text-muted mt-1 mb-3">Read somewhere else? Log it here and your place moves forward.</p>
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Unit" className="flex rounded-2xl border border-line overflow-hidden">
          {(['pages', 'ayat'] as const).map((m) => (
            <button key={m} aria-pressed={mode === m} onClick={() => { setMode(m); setN(m === 'pages' ? goal : 5) }}
              className={`min-h-12 px-4 font-semibold ${mode === m ? 'bg-accent text-accent-ink' : 'bg-card'}`}>{m === 'pages' ? 'Pages' : 'Ayat'}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button className="btn" aria-label="Fewer" onClick={() => setN(Math.max(1, n - 1))}>−</button>
          <input aria-label="Amount" className="input !w-20 text-center" type="number" min={1} value={n} onChange={(e) => setN(Math.max(1, Number(e.target.value) || 1))} />
          <button className="btn" aria-label="More" onClick={() => setN(n + 1)}>+</button>
        </div>
        <button className="btn btn-primary" onClick={go}>I read today</button>
      </div>
      {saved && <p role="status" className="mt-3 mb-0 text-accent">{saved}</p>}
    </div>
  )
}
