import type { User } from '../types/user'

/**
 * Average age of the users who watched each movie. Purely a function of the
 * live `users` array — never persisted to the catalog data, since it drifts
 * as users are created or mark movies watched. Movies nobody has watched yet
 * fall back to the mean age across all given users.
 */
export function computeAvgViewerAge(users: User[]): { byMovieId: Map<number, number>; fallback: number } {
  const agesByMovie = new Map<number, number[]>()
  for (const user of users) {
    for (const movieId of user.watchedMovieIds) {
      const ages = agesByMovie.get(movieId) ?? []
      ages.push(user.age)
      agesByMovie.set(movieId, ages)
    }
  }

  const byMovieId = new Map<number, number>()
  for (const [movieId, ages] of agesByMovie) {
    byMovieId.set(movieId, ages.reduce((sum, age) => sum + age, 0) / ages.length)
  }

  const fallback = users.length
    ? users.reduce((sum, u) => sum + u.age, 0) / users.length
    : MAX_AGE_FALLBACK

  return { byMovieId, fallback }
}

const MAX_AGE_FALLBACK = 35
