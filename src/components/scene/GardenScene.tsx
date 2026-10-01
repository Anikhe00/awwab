import { useEffect, useMemo, useRef, useState } from 'react'
import type { HabitId } from '../../types'
import type { PlantState } from '../../logic/garden'
import TreeShape from './TreeShape'
import { currentHour, skyFor } from './sky'

export const HABIT_LABEL: Record<HabitId, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
  adhkar_am: 'Morning adhkar', adhkar_pm: 'Evening adhkar', sadaqah: 'Sadaqah',
}

type Kind = 'tree' | 'shrub'
const SPOTS: { id: HabitId; x: number; y: number; s: number; kind: Kind; bloom: string }[] = [
  { id: 'fajr', x: 150, y: 655, s: 0.66, kind: 'tree', bloom: '#f6c1d1' },
  { id: 'dhuhr', x: 290, y: 725, s: 0.72, kind: 'tree', bloom: '#f7e08a' },
  { id: 'asr', x: 710, y: 725, s: 0.72, kind: 'tree', bloom: '#f3a979' },
  { id: 'maghrib', x: 850, y: 655, s: 0.66, kind: 'tree', bloom: '#e9869a' },
  { id: 'isha', x: 610, y: 600, s: 0.46, kind: 'tree', bloom: '#b9b4f0' },
  { id: 'adhkar_am', x: 370, y: 795, s: 1, kind: 'shrub', bloom: '#f2c14e' },
  { id: 'adhkar_pm', x: 630, y: 795, s: 1, kind: 'shrub', bloom: '#9a8fe6' },
  { id: 'sadaqah', x: 150, y: 795, s: 1, kind: 'shrub', bloom: '#e58aa0' },
]
const TREE_STAGE = [0, 2, 3, 5, 6]

function Shrub({ level, done, thirsty, bloom, leaf }: { level: number; done: boolean; thirsty: boolean; bloom: string; leaf: string }) {
  const n = 2 + level * 2
  const op = thirsty ? 0.55 : 0.95
  return (
    <g style={{ transform: thirsty ? 'translateY(4px) skewX(4deg)' : undefined }}>
      <ellipse cx="0" cy="-14" rx={22 + level * 5} ry={14 + level * 4} fill={leaf} opacity={op} />
      <ellipse cx={-14 - level * 2} cy="-8" rx={16 + level * 3} ry={10 + level * 3} fill={leaf} opacity={op * 0.85} />
      <ellipse cx={14 + level * 2} cy="-8" rx={16 + level * 3} ry={10 + level * 3} fill={leaf} opacity={op * 0.85} />
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.6
        const r = 8 + (i % 3) * 7 + level * 2
        return <circle key={i} cx={Math.cos(a) * r * 1.6} cy={-16 + Math.sin(a) * r * 0.8} r={done ? 4.6 : 2.4} fill={bloom} opacity={done ? 1 : 0.45} />
      })}
    </g>
  )
}

export default function GardenScene({ stage, treeResting, states, onPlant, onTree }: {
  stage: number
  treeResting: boolean
  states: Record<HabitId, PlantState>
  onPlant: (h: HabitId) => void
  onTree: () => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 820, h: 900 })
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth || 820, h: el.clientHeight || 900 }))
    ro.observe(el); setSize({ w: el.clientWidth || 820, h: el.clientHeight || 900 })
    return () => ro.disconnect()
  }, [])
  const [hour, setHour] = useState(currentHour())
  useEffect(() => { const t = setInterval(() => setHour(currentHour()), 60_000); return () => clearInterval(t) }, [])
  const sky = useMemo(() => skyFor(hour), [hour])
  const look = { leaf: sky.leaf, trunk: sky.trunk, gold: '#e2bd6a' }
  const dimLook = { ...look, leaf: sky.leafDim }
  const night = sky.phase === 'night'
  const treeScale = 0.9 + stage * 0.045
  const rnd = (n: number) => { const x = Math.sin(n * 91.345) * 43758.5453; return x - Math.floor(x) }
  const stars = useMemo(() => Array.from({ length: 90 }, (_, i) => ({ x: -500 + rnd(i + 1) * 2000, y: -300 + rnd(i + 200) * 800, r: 0.7 + rnd(i + 400) * 1.4 })), [])
  const tufts = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    x: -300 + rnd(i + 900) * 1600, y: 600 + rnd(i + 1300) * 230, k: 0.8 + rnd(i + 1700) * 1.1,
    flower: rnd(i + 2100) > 0.72 ? ['#f7e08a', '#f6c1d1', '#ffffff', '#b9b4f0'][i % 4] : undefined,
  })), [])
  // the viewBox is 1000 wide; its height follows the screen so portrait tablets get a tall sky
  const H = Math.max(800, (1000 * size.h) / size.w)
  const scale = Math.min(size.w / 1000, size.h / H)
  const lift = Math.round(165 / scale) // keep the garden clear of the buttons overlaid at the bottom
  const ty = H - 800 - lift

  const hit = (label: string, pressed: boolean, fn: () => void, w: number, h: number, yTop: number) => ({
    role: 'button' as const, tabIndex: 0, 'aria-label': label, 'aria-pressed': pressed,
    onClick: fn, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() } },
    style: { cursor: 'pointer' },
    children: <rect className="hit" x={-w / 2} y={yTop} width={w} height={h} rx="18" fill="transparent" />,
  })

  return (
    <div ref={box} className="absolute inset-0" style={{ background: sky.top }}>
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 1000 ${H}`} preserveAspectRatio="xMidYMax meet" role="group" aria-label="Your garden">
        <defs>
          <linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1={-3000} x2="0" y2={H - 800 - lift + 540}><stop offset="0" stopColor={sky.top} /><stop offset="1" stopColor={sky.bottom} /></linearGradient>
          <radialGradient id="glow"><stop offset="0" stopColor={night ? '#fff6d0' : '#fff2b8'} stopOpacity=".9" /><stop offset="1" stopColor="#fff2b8" stopOpacity="0" /></radialGradient>
        </defs>
        <rect x="-3000" y="-3000" width="7000" height={3000 + H} fill="url(#sky)" />
        <g transform={`translate(0 ${ty})`}>
        {sky.stars && stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity=".8" />)}
        <circle cx={sky.celestialX} cy={sky.celestialY} r="110" fill="url(#glow)" />
        {sky.celestial === 'sun'
          ? <circle cx={sky.celestialX} cy={sky.celestialY} r="34" fill="#fff0a8" />
          : <path d={`M${sky.celestialX} ${sky.celestialY - 30} A30 30 0 1 0 ${sky.celestialX} ${sky.celestialY + 30} A23 23 0 1 1 ${sky.celestialX} ${sky.celestialY - 30}Z`} fill="#f4efd8" />}
        <path d="M-3000 520 C-300 470 50 500 300 505 S700 440 1000 500 S2200 470 4000 520 V1800 H-3000Z" fill={sky.hillFar} />
        <path d="M-3000 560 C-500 520 100 560 400 545 S800 520 1100 555 S2200 535 4000 560 V1800 H-3000Z" fill={sky.hillNear} />
        <rect x="-3000" y="575" width="7000" height="1400" fill={sky.ground} />
        <ellipse cx="500" cy="700" rx="620" ry="70" fill={sky.groundDark} opacity=".35" />
        {tufts.map((t, i) => (
          <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.k})`} opacity={night ? 0.6 : 0.9}>
            <path d="M0 0 L-5 -14 M0 0 L0 -18 M0 0 L5 -13" stroke={sky.groundDark} strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {t.flower && <circle cx="0" cy="-20" r="3.4" fill={t.flower} />}
          </g>
        ))}

        {/* salah trees behind the big tree first */}
        {SPOTS.filter((s) => s.kind === 'tree').sort((a, b) => a.y - b.y).map((s) => {
          const st = states[s.id]
          const label = `${HABIT_LABEL[s.id]}: ${st.doneToday ? 'done today' : 'not yet today'}${st.thirsty ? ', a little thirsty' : ''}. Open details`
          return (
            <g key={s.id} transform={`translate(${s.x} ${s.y}) scale(${s.s}) translate(-200 -372)`}>
              <g transform="translate(200 372)">
                <ellipse cx="0" cy="6" rx="110" ry="18" fill={sky.groundDark} opacity=".5" />
                {st.doneToday && <ellipse cx="0" cy="-90" rx="150" ry="150" fill={s.bloom} opacity=".12" />}
              </g>
              <TreeShape stage={TREE_STAGE[st.level]} dim={st.thirsty} droop={st.thirsty} bloom={st.doneToday} look={{ ...look, blossom: s.bloom }} />
              {st.thirsty && <path d="M300 120c-10 16-14 24-14 32a14 14 0 0028 0c0-8-4-16-14-32z" fill="#7db4e0" opacity=".85" />}
              <g transform="translate(200 372)" {...hit(label, st.doneToday, () => onPlant(s.id), 300, 420, -400)} />
              <text x="200" y="402" textAnchor="middle" fontSize="34" fill={night ? '#e9e3d2' : '#2d3b2e'} opacity=".75" style={{ fontFamily: 'var(--font-serif)' }}>{HABIT_LABEL[s.id]}</text>
            </g>
          )
        })}

        {/* the Qur'an tree */}
        <g transform={`translate(500 655) scale(${treeScale}) translate(-200 -372)`}>
          <ellipse cx="200" cy="378" rx="150" ry="20" fill={sky.groundDark} opacity=".55" />
          <TreeShape stage={stage} dim={treeResting} look={treeResting ? dimLook : look} />
          <g transform="translate(200 372)" {...hit(`The Qur'an tree, stage ${stage + 1} of 10${treeResting ? ', resting today' : ''}. Open progress`, false, onTree, 380, 470, -450)} />
        </g>

        {/* shrubs in front */}
        {SPOTS.filter((s) => s.kind === 'shrub').map((s) => {
          const st = states[s.id]
          const label = `${HABIT_LABEL[s.id]}: ${st.doneToday ? 'done today' : 'not yet today'}${st.thirsty ? ', a little thirsty' : ''}. Open details`
          return (
            <g key={s.id} transform={`translate(${s.x} ${s.y})`}>
              <ellipse cx="0" cy="4" rx="56" ry="10" fill={sky.groundDark} opacity=".5" />
              <Shrub level={st.level + 1} done={st.doneToday} thirsty={st.thirsty} bloom={s.bloom} leaf={sky.leaf} />
              {st.thirsty && <path d="M40 -52c-6 9-8 14-8 18a8 8 0 0016 0c0-4-2-9-8-18z" fill="#7db4e0" opacity=".85" />}
              <g {...hit(label, st.doneToday, () => onPlant(s.id), 130, 120, -100)} />
              <text x="0" y="34" textAnchor="middle" fontSize="20" fill={night ? '#e9e3d2' : '#2d3b2e'} opacity=".75" style={{ fontFamily: 'var(--font-serif)' }}>{HABIT_LABEL[s.id]}</text>
            </g>
          )
        })}
        </g>
      </svg>
    </div>
  )
}
