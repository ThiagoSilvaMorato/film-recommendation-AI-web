import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Movie } from '../types/movie'
import type { CatalogMeta } from '../types/catalogMeta'
import type { User } from '../types/user'
import { loadCatalog } from '../services/movieService'
import { createUser, getAllUsers, getCurrentUserId, setCurrentUserId, toggleWatched } from '../services/userService'
import { useMovieRecommender, type UseMovieRecommender } from '../hooks/useMovieRecommender'

type CatalogStatus = 'loading' | 'ready' | 'error'

export interface AppContextValue extends UseMovieRecommender {
  movies: Movie[]
  catalogMeta: CatalogMeta | null
  catalogStatus: CatalogStatus
  catalogError: string | null
  users: User[]
  currentUser: User | null
  selectUser: (userId: string) => void
  addUser: (name: string, age: number) => void
  toggleMovieWatched: (movieId: number) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta | null>(null)
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>('loading')
  const [catalogError, setCatalogError] = useState<string | null>(null)

  const [users, setUsers] = useState<User[]>(() => getAllUsers())
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(() => getCurrentUserId())

  useEffect(() => {
    let cancelled = false
    loadCatalog()
      .then(({ movies, meta }) => {
        if (cancelled) return
        setMovies(movies)
        setCatalogMeta(meta)
        setCatalogStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setCatalogError(err instanceof Error ? err.message : 'Failed to load catalog')
        setCatalogStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectUser = useCallback((userId: string) => {
    setCurrentUserId(userId)
    setCurrentUserIdState(userId)
  }, [])

  const addUser = useCallback((name: string, age: number) => {
    const user = createUser(name, age)
    setUsers(getAllUsers())
    setCurrentUserIdState(user.id)
  }, [])

  const toggleMovieWatched = useCallback(
    (movieId: number) => {
      if (!currentUserId) return
      const updated = toggleWatched(currentUserId, movieId)
      setUsers(updated)
    },
    [currentUserId]
  )

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId]
  )

  const recommender = useMovieRecommender(movies, catalogMeta, users)

  const value: AppContextValue = {
    movies,
    catalogMeta,
    catalogStatus,
    catalogError,
    users,
    currentUser,
    selectUser,
    addUser,
    toggleMovieWatched,
    ...recommender,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
