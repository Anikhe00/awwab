import { useRef, useState } from 'react'
import { store } from '../data'
import { useQuery } from '../lib/hooks'
import { downloadBackup, restoreBackup } from '../data/backup'
import { FEATURES } from '../features'

export default function SettingsPage() {
  const s = useQuery(() => store.getSettings())
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  if (!s) return <p className="text-muted">Loading…</p>
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="m-0 text-3xl">Settings</h1>

      {FEATURES.read && <section className="card flex flex-col gap-3">
        <h2 className="m-0 text-xl">Reading</h2>
        <label className="flex items-center gap-3 flex-wrap">Daily goal (pages)
          <input className="input !w-24" type="number" min={1} max={60} value={s.dailyGoalPages}
            onChange={(e) => store.updateSettings({ dailyGoalPages: Math.max(1, Number(e.target.value) || 1) })} />
        </label>
        <p className="m-0 text-sm text-muted">It starts small on purpose. The app will only ever suggest raising it — never change it for you.</p>
      </section>}

      <section className="card flex flex-col gap-3">
        <h2 className="m-0 text-xl">Appearance</h2>
        <div role="radiogroup" aria-label="Theme" className="flex gap-2 flex-wrap">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button key={t} role="radio" aria-checked={s.theme === t} className={`btn ${s.theme === t ? 'btn-primary' : ''}`} onClick={() => store.updateSettings({ theme: t })}>
              {t === 'system' ? 'Match device' : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 flex-wrap">Live transcription language
          <select className="input !w-auto" value={s.speechLang} onChange={(e) => store.updateSettings({ speechLang: e.target.value })}>
            <option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="ar-SA">Arabic</option>
          </select>
        </label>
      </section>

      <section className="card flex flex-col gap-3" aria-label="Backup">
        <h2 className="m-0 text-xl">Backup &amp; restore</h2>
        <p className="m-0">Everything lives only on this device. Save a single backup file (includes voice notes) and keep it somewhere safe.</p>
        <p className="m-0 text-sm text-muted">Last backup: {s.lastBackupAt ? new Date(s.lastBackupAt).toLocaleDateString() : 'never'}</p>
        <div className="flex gap-3 flex-wrap">
          <button className="btn btn-primary" onClick={async () => { await downloadBackup(store); setMsg('Backup saved to your downloads.') }}>Export everything</button>
          <button className="btn" onClick={() => file.current?.click()}>Import from a backup</button>
          <input ref={file} type="file" accept="application/json,.json" hidden aria-label="Backup file"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              if (!confirm('Importing replaces everything currently in the app with the contents of this backup. Continue?')) return
              try { await restoreBackup(store, f); setMsg('Restored. Welcome back.') } catch (err) { setMsg('Could not import: ' + (err as Error).message) }
            }} />
        </div>
        {msg && <p role="status" className="m-0 text-accent">{msg}</p>}
      </section>
    </div>
  )
}
