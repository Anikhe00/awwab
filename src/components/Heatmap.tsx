import type { ReadingLog } from '../types'
import { addDays, parse, weekStart } from '../logic/dates'

const WEEKS = 26
const level = (l?: ReadingLog) => {
  if (!l || (l.pages === 0 && l.ayat === 0)) return 0
  const p = l.pages || Math.ceil(l.ayat / 10)
  return p >= 7 ? 4 : p >= 4 ? 3 : p >= 2 ? 2 : 1
}
const color = ['var(--line)', 'color-mix(in srgb, var(--accent) 30%, var(--card))', 'color-mix(in srgb, var(--accent) 55%, var(--card))', 'color-mix(in srgb, var(--accent) 80%, var(--card))', 'var(--accent)']

/** Calendar heatmap. Empty days are a quiet neutral, never a warning colour. */
export default function Heatmap({ logs, today }: { logs: ReadingLog[]; today: string }) {
  const by = new Map(logs.map((l) => [l.date, l]))
  const start = addDays(weekStart(today), -(WEEKS - 1) * 7)
  const cols = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1 w-max" role="group" aria-label="Reading calendar, last 26 weeks">
          {cols.map((col, w) => (
            <div key={w} className="flex flex-col gap-1">
              {col.map((d) => {
                const future = d > today
                const l = by.get(d)
                const lv = level(l)
                const label = `${parse(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${l && lv ? `${l.pages} pages, ${l.ayat} ayat` : 'no reading'}`
                return <div key={d} title={label} aria-label={label} role="img"
                  className="w-5 h-5 rounded-md" style={{ background: future ? 'transparent' : color[lv], outline: d === today ? '2px solid var(--gold)' : undefined }} />
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted mt-2">less {color.map((c, i) => <span key={i} className="w-4 h-4 rounded inline-block" style={{ background: c }} />)} more</div>
    </div>
  )
}
