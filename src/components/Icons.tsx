import type { ReactNode } from 'react'
const I = ({ children }: { children: ReactNode }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)
export const Icons = {
  garden: <I><path d="M12 21v-9" /><path d="M12 12c-4 0-6-3-6-6 4 0 6 2 6 6z" /><path d="M12 14c3 0 5-2.5 5-5-3.500 0-5 2-5 5z" /></I>,
  read: <I><path d="M4 5.500C6.500 4.500 9.500 4.500 12 6c2.500-1.500 5.500-1.500 8-.5v13c-2.500-1-5.500-1-8 .5-2.500-1.500-5.500-1.500-8-.5z" /><path d="M12 6v13" /></I>,
  progress: <I><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></I>,
  hifz: <I><rect x="4" y="4" width="6" height="6" rx="1.500" /><rect x="14" y="4" width="6" height="6" rx="1.500" /><rect x="4" y="14" width="6" height="6" rx="1.500" /><rect x="14" y="14" width="6" height="6" rx="1.500" /></I>,
  names: <I><path d="M12 3l2.200 5.300 5.800.5-4.400 3.800 1.400 5.600L12 15.300 7 18.200l1.400-5.600L4 8.800l5.800-.5z" /></I>,
  notes: <I><path d="M5 4h11l3 3v13H5z" /><path d="M9 11h6M9 15h6" /></I>,
  settings: <I><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100" /></I>,
}
