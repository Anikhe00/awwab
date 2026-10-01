import { useEffect, useState } from 'react'
import { loadQuran, type Quran } from '../content'

export function useQuran(): Quran | undefined {
  const [q, setQ] = useState<Quran>()
  useEffect(() => { loadQuran().then(setQ) }, [])
  return q
}
