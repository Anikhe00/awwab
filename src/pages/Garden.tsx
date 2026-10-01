import { useState } from 'react'
import { Link } from 'react-router-dom'
import { store } from '../data'
import { useQuery } from '../lib/hooks'
import { addDays, todayStr } from '../logic/dates'
import { summarize } from '../logic/streak'
import { goalRaiseOffer } from '../logic/goal'
import { dueItems } from '../logic/hifz'
import { doneSet, plantState, treeStage, type PlantState } from '../logic/garden'
import { todayNameId } from '../logic/names'
import { backupDue } from '../data/backup'
import { names, surahOf } from '../content'
import { FEATURES } from '../features'
import type { HabitId } from '../types'
import GardenScene, { HABIT_LABEL } from '../components/scene/GardenScene'
import Sheet from '../components/Sheet'
import CheckIn from '../components/CheckIn'
import { ProgressContent } from './Progress'

const HABITS = Object.keys(HABIT_LABEL) as HabitId[]
const DESC: Record<HabitId, string> = {
  fajr: 'The dawn prayer', dhuhr: 'The midday prayer', asr: 'The afternoon prayer', maghrib: 'The sunset prayer', isha: 'The night prayer',
  adhkar_am: 'Remembrance after Fajr', adhkar_pm: 'Remembrance in the evening', sadaqah: 'Something given for Allah’s sake',
}

type SheetKind = null | { habit: HabitId } | 'progress' | 'checkin' | 'revision' | 'goal'

export default function Garden() {
  const today = todayStr()
  const settings = useQuery(() => store.getSettings())
  const pos = useQuery(() => store.getPosition())
  const logs = useQuery(() => store.getReadingLogs())
  const habits = useQuery(() => store.getHabitLogs())
  const hifz = useQuery(() => store.getHifz())
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [note, setNote] = useState('')
  if (!settings || !pos || !logs || !habits || !hifz) return <p className="text-muted">Loading…</p>

  const sum = summarize(logs, today)
  const offer = goalRaiseOffer(logs, settings.dailyGoalPages, today, settings.goalOfferSnoozeUntil)
  const due = FEATURES.hifz ? dueItems(hifz, today) : []
  const nameToday = names[todayNameId(settings.namesStartDate, today) - 1]
  const s = surahOf(pos.surah)
  const states = Object.fromEntries(HABITS.map((h) => [h, plantState(doneSet(habits, h), today)])) as Record<HabitId, PlantState>
  const close = () => setSheet(null)
  const habit = sheet && typeof sheet === 'object' ? sheet.habit : null
  const habitToday = habit ? habits.find((l) => l.date === today && l.habit === habit) : undefined
  const needsBackup = backupDue(settings.lastBackupAt, settings.installedAt, settings.backupSnoozeUntil, today)
  const pill = 'btn !min-h-12 !px-4 !text-[.95rem] bg-card/85 backdrop-blur'

  return (
    <div className="fixed top-0 right-0 left-0 lg:left-28 bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0 overflow-hidden">
      <GardenScene stage={treeStage(sum.totalDays)} treeResting={!sum.readToday} states={states}
        onPlant={(h) => { setNote(''); setSheet({ habit: h }) }} onTree={() => setSheet('progress')} />

      <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-3 pointer-events-none">
        <header className="pointer-events-auto rounded-2xl bg-card/80 backdrop-blur border border-line px-4 py-3 max-w-md">
          <h1 className="m-0 text-xl">{sum.welcomeBack ? 'Welcome back' : 'Assalamu alaykum'}</h1>
          <p className="m-0 text-sm text-muted">
            {sum.welcomeBack ? 'The tree was resting and is glad you’re here.' : sum.readToday ? 'You read today. The tree is growing.' : 'A small step is enough today.'}
          </p>
          <p className="m-0 mt-1 text-sm">
            <span className="font-semibold">{sum.currentStreak}</span> day streak · <span className="font-semibold">{sum.returns}</span> returns
          </p>
        </header>
        <button className={`${pill} pointer-events-auto`} onClick={() => setSheet('progress')}>Progress</button>
      </div>

      <div className="absolute bottom-3 inset-x-3 flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          {due.length > 0 && <button className={pill} onClick={() => setSheet('revision')}>Revision due · {due.length}</button>}
          {offer && <button className={pill} onClick={() => setSheet('goal')}>Raise your goal?</button>}
          <Link to={`/names/${nameToday.id}`} className={`${pill} no-underline`}><span className="arabic !leading-none text-xl">{nameToday.ar}</span> Name of the day</Link>
          {needsBackup && <Link to="/settings" className={`${pill} no-underline`}>Time for a backup</Link>}
        </div>
        <div className="flex gap-2 w-full max-w-xl">
          <Link to="/read" className="btn btn-primary no-underline flex-1 !min-h-16 !rounded-2xl flex-col !gap-0 shadow-lg">
            <span className="text-lg">Continue reading</span>
            <span className="text-sm font-normal opacity-90">{s.en} {pos.surah}:{pos.ayah} · page {pos.page}</span>
          </Link>
          <button className="btn !min-h-16 !rounded-2xl bg-card/90 backdrop-blur" onClick={() => setSheet('checkin')}>Check in</button>
        </div>
      </div>

      <Sheet open={!!habit} onClose={close} title={habit ? HABIT_LABEL[habit] : ''}>
        {habit && (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-muted">{DESC[habit]}</p>
            <button autoFocus className={`btn w-full !min-h-16 text-lg ${habitToday?.done ? '' : 'btn-primary'}`}
              onClick={async () => {
                const done = !habitToday?.done
                await store.setHabit(today, habit, done, habit === 'sadaqah' && done && note.trim() ? note.trim() : undefined)
                if (done && habit !== 'sadaqah') close()
              }}>
              {habitToday?.done ? 'Done today ✓ (tap to undo)' : 'Mark as done'}
            </button>
            {habit === 'sadaqah' && (
              <div>
                <label htmlFor="sq" className="block text-sm text-muted mb-1">Optional note</label>
                <input id="sq" className="input" maxLength={140} placeholder="What you gave" value={note || habitToday?.note || ''} onChange={(e) => setNote(e.target.value)} />
                <button className="btn mt-2" onClick={async () => { await store.setHabit(today, 'sadaqah', true, note.trim() || undefined); close() }}>Save note</button>
              </div>
            )}
            <div>
              <p className="m-0 mb-2 text-sm text-muted">Last 14 days</p>
              <div className="flex gap-1.5 flex-wrap" aria-label="Last 14 days">
                {Array.from({ length: 14 }, (_, i) => addDays(today, i - 13)).map((d) => {
                  const on = doneSet(habits, habit).has(d)
                  return <span key={d} title={d} className="w-6 h-6 rounded-full border border-line" style={{ background: on ? 'var(--accent)' : 'transparent' }} />
                })}
              </div>
              <p className="m-0 mt-2 text-sm text-muted">
                {states[habit].thirsty ? 'This plant is a little thirsty — it will perk up as soon as you mark today.' : 'It grows with every day you keep it, and it never dies.'}
              </p>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === 'progress'} onClose={close} title="Progress"><ProgressContent /></Sheet>
      <Sheet open={sheet === 'checkin'} onClose={close} title="Check in"><CheckIn goal={settings.dailyGoalPages} onDone={close} /></Sheet>

      <Sheet open={sheet === 'revision'} onClose={close} title="Revision due today">
        <ul className="list-none p-0 m-0 flex flex-col gap-3">
          {due.map((h) => (
            <li key={h.id} className="rounded-2xl border border-line p-3">
              <p className="m-0 font-semibold">{surahOf(h.surah).en} · ayat {h.fromAyah}–{h.toAyah} <span className="text-muted font-normal">({h.strength})</span></p>
              <p className="m-0 mt-1 mb-2 text-sm text-muted">Recite it, then rate how it went:</p>
              <div className="flex gap-2 flex-wrap">
                {(['strong', 'okay', 'weak'] as const).map((r) => <button key={r} className="btn" onClick={() => store.reviewHifz(h.id!, r, today)}>{r[0].toUpperCase() + r.slice(1)}</button>)}
              </div>
            </li>
          ))}
        </ul>
        {!due.length && <p className="m-0">All revised for today. 🌿</p>}
      </Sheet>

      <Sheet open={sheet === 'goal' && !!offer} onClose={close} title="A gentle suggestion">
        <p className="mt-0">You have met your goal 7 days in a row. Would you like to raise it to {offer} pages a day? It’s entirely optional — staying at {settings.dailyGoalPages} is just as good.</p>
        <div className="flex gap-3 flex-wrap">
          <button className="btn btn-primary" onClick={async () => { await store.updateSettings({ dailyGoalPages: offer! }); close() }}>Yes, raise to {offer}</button>
          <button className="btn" onClick={async () => { await store.updateSettings({ goalOfferSnoozeUntil: addDays(today, 7) }); close() }}>Not now</button>
        </div>
      </Sheet>
    </div>
  )
}
