import type { User } from '../types/user'
import { MAX_AGE, WEIGHTS } from './weights'

/**
 * Encodes a user as the mean of their watched movies' vectors. Users with no
 * watch history get a "neutral" vector carrying only their normalized age.
 */
export function encodeUser(
  user: User,
  movieVectorsById: Map<number, Float32Array>,
  dim: number
): Float32Array {
  const watchedVectors = user.watchedMovieIds
    .map((id) => movieVectorsById.get(id))
    .filter((v): v is Float32Array => v !== undefined)

  const vector = new Float32Array(dim)

  if (watchedVectors.length === 0) {
    vector[1] = WEIGHTS.avgViewerAge * (Math.min(user.age, MAX_AGE) / MAX_AGE)
    return vector
  }

  for (const movieVector of watchedVectors) {
    for (let i = 0; i < dim; i++) vector[i] += movieVector[i]
  }
  for (let i = 0; i < dim; i++) vector[i] /= watchedVectors.length

  return vector
}
