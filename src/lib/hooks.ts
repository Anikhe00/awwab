import { useEffect, useRef, useState } from 'react'
import { store } from '../data'

/** Re-runs `fn` whenever the store changes. Returns undefined until first load. */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []): T | undefined {
  const [val, setVal] = useState<T>()
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    let alive = true
    const run = () => fnRef.current().then((v) => alive && setVal(v))
    run()
    const off = store.subscribe(run)
    return () => { alive = false; off() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return val
}

export const useSettings = () => useQuery(() => store.getSettings())
