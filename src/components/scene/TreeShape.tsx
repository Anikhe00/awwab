import { useMemo } from 'react'

interface Seg { x1: number; y1: number; x2: number; y2: number; w: number }
interface Tip { x: number; y: number }

/** Deterministic branching tree in a 400x420 box, trunk base at (200, 372). */
function grow(stage: number) {
  const segs: Seg[] = []
  const tips: Tip[] = []
  const maxDepth = Math.min(6, 1 + Math.ceil(stage / 1.6))
  const trunk = 46 + stage * 13
  const rec = (x: number, y: number, ang: number, len: number, w: number, d: number, k: number) => {
    const x2 = x + Math.sin(ang) * len
    const y2 = y - Math.cos(ang) * len
    segs.push({ x1: x, y1: y, x2, y2, w })
    if (d >= maxDepth) { tips.push({ x: x2, y: y2 }); return }
    const spread = 0.42 + d * 0.035
    const wob = Math.sin(k * 12.9898 + d * 4.1) * 0.12
    rec(x2, y2, ang - spread + wob, len * 0.74, w * 0.68, d + 1, k * 2)
    rec(x2, y2, ang + spread - wob, len * 0.74, w * 0.68, d + 1, k * 2 + 1)
    if (d === 1 || (d === 2 && stage >= 6)) rec(x2, y2, ang + wob * 2, len * 0.6, w * 0.6, d + 1, k * 3 + 7)
  }
  if (stage >= 1) rec(200, 372, 0, trunk, 5 + stage * 1.7, 0, 1)
  return { segs, tips }
}

export interface TreeLook { leaf: string; trunk: string; blossom?: string; gold?: string }

/** Draws a tree. Caller positions it with a transform. Never dies: `dim` only softens it. */
export default function TreeShape({ stage, dim = false, bloom = false, look, droop = false }: { stage: number; dim?: boolean; bloom?: boolean; look: TreeLook; droop?: boolean }) {
  const { segs, tips } = useMemo(() => grow(stage), [stage])
  const op = dim ? 0.55 : 0.92
  return (
    <g style={{ transform: droop ? 'skewX(3deg)' : undefined, transformOrigin: '200px 372px' }}>
      {stage === 0 ? (
        <g opacity={op}>
          <path d="M200 376v-34" stroke={look.leaf} strokeWidth="5" strokeLinecap="round" />
          <path d="M200 350c-26 0-38-14-38-34 24 0 38 12 38 34z" fill={look.leaf} />
          <path d="M200 344c22 0 34-12 34-30-22 0-34 10-34 30z" fill={look.leaf} />
        </g>
      ) : (
        <g className={dim ? '' : 'sway'}>
          {segs.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={look.trunk} strokeOpacity={dim ? 0.7 : 1}
              strokeWidth={Math.max(1.6, s.w)} strokeLinecap="round" />
          ))}
          {tips.map((t, i) => (
            <g key={i}>
              <circle cx={t.x} cy={t.y} r={7 + stage * 1.7} fill={look.leaf} opacity={op * 0.75} />
              <circle cx={t.x + 7} cy={t.y - 6} r={4 + stage * 1.1} fill={look.leaf} opacity={op} />
              {(stage >= 6 || bloom) && i % 3 === 0 && <circle cx={t.x - 6} cy={t.y + 4} r="4" fill={look.gold ?? '#d9b969'} opacity={dim ? 0.6 : 1} />}
              {bloom && look.blossom && <circle cx={t.x + 3} cy={t.y - 10} r={6 + stage * 0.6} fill={look.blossom} />}
            </g>
          ))}
        </g>
      )}
    </g>
  )
}
