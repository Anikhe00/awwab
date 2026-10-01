import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Bottom sheet: slides up over the screen so nothing forces you to scroll the page. */
export default function Sheet({ open, onClose, title, children, side = 'bottom' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; side?: 'bottom' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', key)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; prev?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  // portal to <body> so the sheet always sits above the nav bar, whatever screen opened it
  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${side === 'right' ? 'items-stretch justify-end' : 'items-end justify-center'}`}>
      <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" tabIndex={-1}
        className={`${side === 'right' ? 'sheet-right max-w-xl h-full rounded-l-3xl border-r-0' : 'sheet max-w-2xl max-h-[85dvh] rounded-t-3xl border-b-0'} relative w-full overflow-y-auto bg-card border border-line p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl outline-none`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="m-0 text-xl">{title}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
