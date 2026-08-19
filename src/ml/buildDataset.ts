import type { Movie } from '../types/movie'
import type { CatalogMeta } from '../types/catalogMeta'
import type { User } from '../types/user'
import { vectorDim } from './weights'
import { encodeMovie } from './encodeMovie'
import { encodeUser } from './encodeUser'
import { computeAvgViewerAge } from './avgViewerAge'

export interface TrainingDataset {
  inputs: Float32Array[] // concat(userVector, movieVector) per row
  labels: number[] // 1 if watched, 0 otherwise
  inputDim: number
}

/**
 * For every user with a non-empty watch history, builds one (userVector,
 * movieVector) pair for every movie in the catalog, labeled 1 if the user
 * watched it and 0 otherwise.
 */
export function buildDataset(users: User[], movies: Movie[], meta: CatalogMeta): TrainingDataset {
  const dim = vectorDim(meta)
  const { byMovieId, fallback } = computeAvgViewerAge(users)

  const movieVectorsById = new Map<number, Float32Array>()
  for (const movie of movies) {
    const avgAge = byMovieId.get(movie.id) ?? fallback
    movieVectorsById.set(movie.id, encodeMovie(movie, avgAge, meta))
  }

  const inputs: Float32Array[] = []
  const labels: number[] = []

  for (const user of users) {
    if (user.watchedMovieIds.length === 0) continue
    const userVector = encodeUser(user, movieVectorsById, dim)
    const watchedSet = new Set(user.watchedMovieIds)

    for (const movie of movies) {
      const movieVector = movieVectorsById.get(movie.id)!
      const row = new Float32Array(dim * 2)
      row.set(userVector, 0)
      row.set(movieVector, dim)
      inputs.push(row)
      labels.push(watchedSet.has(movie.id) ? 1 : 0)
    }
  }

  return { inputs, labels, inputDim: dim * 2 }
}

/** Builds movie vectors + a single user's vector, for prediction (no labels needed). */
export function buildPredictionInputs(
  user: User,
  movies: Movie[],
  users: User[],
  meta: CatalogMeta
): { movieIds: number[]; inputs: Float32Array[]; inputDim: number } {
  const dim = vectorDim(meta)
  const { byMovieId, fallback } = computeAvgViewerAge(users)

  const movieVectorsById = new Map<number, Float32Array>()
  for (const movie of movies) {
    const avgAge = byMovieId.get(movie.id) ?? fallback
    movieVectorsById.set(movie.id, encodeMovie(movie, avgAge, meta))
  }

  const userVector = encodeUser(user, movieVectorsById, dim)

  const movieIds: number[] = []
  const inputs: Float32Array[] = []
  for (const movie of movies) {
    const movieVector = movieVectorsById.get(movie.id)!
    const row = new Float32Array(dim * 2)
    row.set(userVector, 0)
    row.set(movieVector, dim)
    movieIds.push(movie.id)
    inputs.push(row)
  }

  return { movieIds, inputs, inputDim: dim * 2 }
}
