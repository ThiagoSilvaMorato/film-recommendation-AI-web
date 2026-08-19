import { useMemo } from 'react'
import { useAppContext } from '../context/useAppContext'
import { UserSelector } from '../components/profile/UserSelector'
import { UserCreateForm } from '../components/profile/UserCreateForm'
import { WatchedList } from '../components/profile/WatchedList'

export function ProfilePage() {
  const { users, currentUser, movies, selectUser, addUser, toggleMovieWatched } = useAppContext()

  const watchedMovies = useMemo(() => {
    if (!currentUser) return []
    const watchedSet = new Set(currentUser.watchedMovieIds)
    return movies.filter((m) => watchedSet.has(m.id))
  }, [currentUser, movies])

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="mb-1 text-2xl font-semibold text-white">Profile</h1>
        <p className="mb-4 text-sm text-slate-400">Select a user or create your own to get personalized recommendations.</p>
        <UserSelector users={users} currentUserId={currentUser?.id ?? null} onSelect={selectUser} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-100">Create a new user</h2>
        <UserCreateForm onCreate={addUser} />
      </section>

      {currentUser && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-slate-100">
            {currentUser.name}'s watched movies ({watchedMovies.length})
          </h2>
          <WatchedList movies={watchedMovies} onToggleWatched={toggleMovieWatched} />
        </section>
      )}
    </div>
  )
}
