import type { User } from '../types/user'
import seedUsers from '../../data/seedUsers.json'
import { getItem, setItem } from './storageService'

const USERS_KEY = 'users'
const CURRENT_USER_KEY = 'currentUserId'

function loadUsers(): User[] {
  return getItem<User[]>(USERS_KEY, seedUsers as User[])
}

function saveUsers(users: User[]): void {
  setItem(USERS_KEY, users)
}

export function getAllUsers(): User[] {
  return loadUsers()
}

export function getCurrentUserId(): string | null {
  const users = loadUsers()
  const storedId = getItem<string | null>(CURRENT_USER_KEY, null)
  if (storedId && users.some((u) => u.id === storedId)) return storedId
  return users[0]?.id ?? null
}

export function setCurrentUserId(userId: string): void {
  setItem(CURRENT_USER_KEY, userId)
}

export function createUser(name: string, age: number): User {
  const user: User = {
    id: crypto.randomUUID(),
    name,
    age,
    watchedMovieIds: [],
    createdAt: new Date().toISOString(),
  }
  const users = [...loadUsers(), user]
  saveUsers(users)
  setCurrentUserId(user.id)
  return user
}

export function toggleWatched(userId: string, movieId: number): User[] {
  const users = loadUsers().map((user) => {
    if (user.id !== userId) return user
    const watched = user.watchedMovieIds.includes(movieId)
      ? user.watchedMovieIds.filter((id) => id !== movieId)
      : [...user.watchedMovieIds, movieId].sort((a, b) => a - b)
    return { ...user, watchedMovieIds: watched }
  })
  saveUsers(users)
  return users
}
