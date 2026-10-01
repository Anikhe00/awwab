import { DexieStore } from './dexieStore'
import type { Store } from './store'
// Swap this line for a cloud-backed Store later; nothing else needs to change.
export const store: Store = new DexieStore()
// dev-only handle for manual testing in the console
if (import.meta.env.DEV) (window as unknown as { __store: Store }).__store = store
