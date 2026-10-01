import { useEffect } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Icons } from './components/Icons'
import { useSettings } from './lib/hooks'
import BackupReminder from './components/BackupReminder'
import Garden from './pages/Garden'
import Read from './pages/Read'
import Progress from './pages/Progress'
import Hifz from './pages/Hifz'
import Names from './pages/Names'
import NameCard from './pages/NameCard'
import Notes from './pages/Notes'
import SettingsPage from './pages/Settings'
import { FEATURES } from './features'

const tabs = [
  ...(FEATURES.garden ? [{ to: '/', label: 'Garden', icon: Icons.garden, end: true }] : []),
  ...(FEATURES.read ? [{ to: '/read', label: 'Read', icon: Icons.read }] : []),
  ...(FEATURES.hifz ? [{ to: '/hifz', label: 'Hifz', icon: Icons.hifz }] : []),
  { to: '/names', label: 'Names', icon: Icons.names, end: false },
  { to: '/notes', label: 'Notes', icon: Icons.notes },
  { to: '/settings', label: 'Settings', icon: Icons.settings },
]

function useTheme(theme: 'system' | 'light' | 'dark' | undefined) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || ((theme ?? 'system') === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0d1716' : '#2f5d50')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

export default function App() {
  const settings = useSettings()
  const { pathname } = useLocation()
  const home = FEATURES.garden && pathname === '/'
  useTheme(settings?.theme)
  return (
    <div className="min-h-dvh lg:pl-28 pb-24 lg:pb-0">
      <nav aria-label="Main" className="fixed z-20 bottom-0 inset-x-0 lg:inset-y-0 lg:right-auto lg:w-28 border-t lg:border-t-0 lg:border-r border-line bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="flex lg:flex-col justify-around lg:justify-start lg:gap-2 lg:pt-6 m-0 p-0 list-none">
          {tabs.map((t) => (
            <li key={t.to} className="flex-1 lg:flex-none">
              <NavLink to={t.to} end={t.end}
                className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 min-h-16 py-1.5 text-[.78rem] no-underline ${isActive ? 'text-accent font-semibold' : 'text-muted'}`}>
                {t.icon}<span>{t.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className={home ? '' : 'mx-auto max-w-6xl px-4 sm:px-8 py-6'}>
        {settings && !home && <BackupReminder settings={settings} />}
        <Routes>
          <Route path="/" element={FEATURES.garden ? <Garden /> : <Navigate to="/names" replace />} />
          {FEATURES.read && <Route path="/read" element={<Read />} />}
          {FEATURES.read && <Route path="/read/:page" element={<Read />} />}
          {FEATURES.read && <Route path="/progress" element={<Progress />} />}
          {FEATURES.hifz && <Route path="/hifz" element={<Hifz />} />}
          <Route path="/names" element={<Names />} />
          <Route path="/names/:id" element={<NameCard />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}
