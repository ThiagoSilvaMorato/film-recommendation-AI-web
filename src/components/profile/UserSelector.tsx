import type { User } from '../../types/user'

interface UserSelectorProps {
  users: User[]
  currentUserId: string | null
  onSelect: (userId: string) => void
}

export function UserSelector({ users, currentUserId, onSelect }: UserSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelect(user.id)}
          className={`rounded-xl border p-3 text-left transition-colors ${
            user.id === currentUserId
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-800 bg-slate-900 hover:border-slate-700'
          }`}
        >
          <p className="font-medium text-slate-100">{user.name}</p>
          <p className="text-xs text-slate-400">
            {user.age} yrs · {user.watchedMovieIds.length} watched
          </p>
          {user.isSeedUser && <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">Example user</p>}
        </button>
      ))}
    </div>
  )
}
