import { store } from '../data'
import { useQuery } from '../lib/hooks'
import { addDays, todayStr, weekStart } from '../logic/dates'
import { pagesInRange, summarize } from '../logic/streak'
import { TOTAL_PAGES } from '../content'
import Heatmap from '../components/Heatmap'

const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="card !p-4">
    <p className="m-0 text-muted text-sm">{label}</p>
    <p className="m-0 text-3xl font-semibold">{value}</p>
    {sub && <p className="m-0 text-muted text-sm">{sub}</p>}
  </div>
)

export function ProgressContent() {
  const today = todayStr()
  const logs = useQuery(() => store.getReadingLogs())
  const pagesRead = useQuery(() => store.getPagesRead())
  const settings = useQuery(() => store.getSettings())
  if (!logs || !pagesRead || !settings) return <p className="text-muted">Loading…</p>
  const sum = summarize(logs, today)
  const read = pagesRead.length
  const pct = Math.round((read / TOTAL_PAGES) * 100)
  const week = pagesInRange(logs, weekStart(today), today)
  const last7 = pagesInRange(logs, addDays(today, -6), today)
  const total = logs.reduce((s, l) => s + l.pages, 0)
  return (
    <div className="flex flex-col gap-6">
      <section className="card" aria-label="Khatm progress">
        <div className="flex justify-between items-baseline flex-wrap gap-2">
          <h2 className="m-0 text-xl">Khatm {settings.khatmCycle}</h2>
          <p className="m-0 text-muted">{read} of {TOTAL_PAGES} pages · {pct}%</p>
        </div>
        <div className="mt-3 h-4 rounded-full bg-accent-soft overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL_PAGES} aria-valuenow={read} aria-label="Pages read in this khatm">
          <div className="h-full bg-accent rounded-full transition-[width] duration-700" style={{ width: `${(read / TOTAL_PAGES) * 100}%` }} />
        </div>
        {settings.khatmsCompleted > 0 && <p className="mb-0 mt-3 text-muted">Khatms completed: {settings.khatmsCompleted}</p>}
        {read >= TOTAL_PAGES && (
          <div className="mt-4 p-4 rounded-2xl bg-gold-soft">
            <p className="m-0 font-semibold">You have completed the Qur’an. May Allah accept it from you.</p>
            <button className="btn btn-primary mt-3" onClick={() => store.startNewKhatm()}>Begin a new khatm</button>
          </div>
        )}
      </section>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Pages this week" value={week} sub={`${last7} in the last 7 days`} />
        <Stat label="Current streak" value={sum.currentStreak} sub="consecutive days" />
        <Stat label="Returns" value={sum.returns} sub="times you came back" />
        <Stat label="Reading days" value={sum.totalDays} sub={`${total} pages logged`} />
      </div>
      <section className="card">
        <h2 className="m-0 mb-3 text-xl">Calendar</h2>
        <Heatmap logs={logs} today={today} />
      </section>
    </div>
  )
}

export default function Progress() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-3xl">Progress</h1>
      <ProgressContent />
    </div>
  )
}
