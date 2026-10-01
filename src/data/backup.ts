import type { Store } from './store'
import type { BackupFile } from '../types'
import { fmt } from '../logic/dates'

export async function downloadBackup(store: Store) {
  const data = await store.exportAll()
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `awwab-backup-${fmt(new Date())}.json`
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
  await store.updateSettings({ lastBackupAt: new Date().toISOString() })
}

export async function restoreBackup(store: Store, file: File) {
  const parsed = JSON.parse(await file.text()) as BackupFile
  await store.importAll(parsed)
}

export const BACKUP_EVERY_DAYS = 30
export function backupDue(lastBackupAt: string | undefined, installedAt: string, snoozeUntil: string | undefined, today: string) {
  if (snoozeUntil && today < snoozeUntil) return false
  const since = lastBackupAt ? lastBackupAt.slice(0, 10) : installedAt
  return (new Date(today).getTime() - new Date(since).getTime()) / 86400000 >= BACKUP_EVERY_DAYS
}
