export type Phase = 'dawn' | 'day' | 'dusk' | 'night'

export interface SkyTheme {
  phase: Phase
  top: string
  bottom: string
  hillFar: string
  hillNear: string
  ground: string
  groundDark: string
  leaf: string
  leafDim: string
  trunk: string
  celestial: 'sun' | 'moon'
  celestialX: number
  celestialY: number
  stars: boolean
}

export function phaseAt(hour: number): Phase {
  if (hour >= 5 && hour < 7.5) return 'dawn'
  if (hour >= 7.5 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}

const T: Record<Phase, Omit<SkyTheme, 'phase' | 'celestial' | 'celestialX' | 'celestialY' | 'stars'>> = {
  dawn: { top: '#6a78b4', bottom: '#f4c5a0', hillFar: '#9b9fbd', hillNear: '#7f9a78', ground: '#8aa670', groundDark: '#6f8b5a', leaf: '#6a9a62', leafDim: '#88a683', trunk: '#6f5a3f' },
  day: { top: '#8cc3e8', bottom: '#eaf4ee', hillFar: '#a9cfa4', hillNear: '#8dbb7b', ground: '#8fbb6d', groundDark: '#6e9b54', leaf: '#4d8b58', leafDim: '#7aa57c', trunk: '#6f5a3f' },
  dusk: { top: '#45457f', bottom: '#f0a26d', hillFar: '#7c6f97', hillNear: '#627b55', ground: '#6d8455', groundDark: '#55693f', leaf: '#4f7a54', leafDim: '#6c8b6a', trunk: '#5e4b36' },
  night: { top: '#0a1330', bottom: '#1f3150', hillFar: '#1d3048', hillNear: '#1a3a34', ground: '#1f3a30', groundDark: '#162c25', leaf: '#3a7a64', leafDim: '#3d5f55', trunk: '#4d3f31' },
}

export function skyFor(hour: number): SkyTheme {
  const phase = phaseAt(hour)
  const t = T[phase]
  const sunUp = hour >= 5.5 && hour < 19
  // sun travels an arc from left to right between 5.5h and 19h; moon otherwise
  const p = sunUp ? (hour - 5.5) / 13.5 : ((hour >= 19 ? hour - 19 : hour + 5) / 10.5)
  const x = 120 + p * 760
  const y = 330 - Math.sin(p * Math.PI) * 240
  return { phase, ...t, celestial: sunUp ? 'sun' : 'moon', celestialX: x, celestialY: y, stars: phase === 'night' }
}

export const currentHour = () => {
  if (import.meta.env.DEV) {
    const m = /[?&]hour=([\d.]+)/.exec(location.hash)
    if (m) return Number(m[1])
  }
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}
