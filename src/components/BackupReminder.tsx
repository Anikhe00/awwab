import { Link } from 'react-router-dom'
import { store } from '../data'
import { backupDue } from '../data/backup'
import { addDays, todayStr } from '../logic/dates'
import type { Settings } from '../types'

export default function BackupReminder({ settings }: { settings: Settings }) {
  const today = todayStr()
  if (!backupDue(settings.lastBackupAt, settings.installedAt, settings.backupSnoozeUntil, today)) return null
  return (
    <div role="status" className="card mb-5 flex flex-wrap items-center gap-3 !bg-gold-soft">
      <p className="m-0 flex-1 min-w-56">
        A gentle reminder: your data lives only on this device. Saving a backup file takes a moment and keeps your notes and progress safe.
      </p>
      <Link to="/settings" className="btn btn-primary no-underline">Back up now</Link>
      <button className="btn btn-ghost" onClick={() => store.updateSettings({ backupSnoozeUntil: addDays(today, 7) })}>Remind me later</button>
    </div>
  )
}
