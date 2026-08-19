import { NavLink } from 'react-router-dom'
import { useAppContext } from '../../context/useAppContext'

const links = [
  { to: '/', label: 'Catalog' },
  { to: '/profile', label: 'Profile' },
  { to: '/training', label: 'Training' },
  { to: '/recommendations', label: 'Recommendations' },
]

export function NavBar() {
  const { currentUser } = useAppContext()

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">CineMatch AI</span>
          <span className="hidden text-xs text-slate-500 sm:inline">on-device recommender</span>
        </div>
        <nav className="flex items-center gap-1 rounded-full bg-slate-900 p-1 text-sm">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 transition-colors ${
                  isActive ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="text-sm text-slate-400">
          {currentUser ? (
            <span>
              Signed in as <span className="font-medium text-slate-200">{currentUser.name}</span>
            </span>
          ) : (
            <span>No user selected</span>
          )}
        </div>
      </div>
    </header>
  )
}
