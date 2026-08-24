import type { Movie } from '../types/movie'
import type { CatalogMeta } from '../types/catalogMeta'
import type { User } from '../types/user'
import { normalize } from './weights'

/**
 * Everything needed to encode movies/users into feature vectors, built fresh
 * from the current user roster each time a model is (re)trained — mirrors
 * exemplo-01's makeContext(). Predictions must reuse the context produced by
 * the LAST training run rather than rebuilding it, since the model's
 * weights were fit against vectors on that specific normalization scale.
 */
export interface EncodingContext {
  meta: CatalogMeta
  genreIndex: Record<string, number>
  decadeIndex: Record<number, number>
  numGenres: number
  numDecades: number
  minAge: number
  maxAge: number
  /** Pre-normalized avg viewer age per movie id, like exemplo-01's productAvgAgeNorm. */
  movieAvgAgeNorm: Map<number, number>
  /** releaseYear(1) + avgViewerAge(1) + genres(G) + decade(D) */
  dimensions: number
}

export function buildEncodingContext(movies: Movie[], meta: CatalogMeta, users: User[]): EncodingContext {
  const ages = users.map((u) => u.age)
  const minAge = ages.length ? Math.min(...ages) : 0
  const maxAge = ages.length ? Math.max(...ages) : 0

  const genreIndex = Object.fromEntries(meta.genreVocabulary.map((genre, index) => [genre, index]))
  const decadeIndex = Object.fromEntries(meta.decadeBuckets.map((decade, index) => [decade, index]))

  // Average age of the viewers who watched each movie
  const ageSums = new Map<number, number>()
  const ageCounts = new Map<number, number>()
  for (const user of users) {
    for (const movieId of user.watchedMovieIds) {
      ageSums.set(movieId, (ageSums.get(movieId) ?? 0) + user.age)
      ageCounts.set(movieId, (ageCounts.get(movieId) ?? 0) + 1)
    }
  }

  // Unwatched movies fall back to the midpoint age, which always normalizes
  // to exactly 0.5
  const movieAvgAgeNorm = new Map<number, number>()
  for (const movie of movies) {
    const count = ageCounts.get(movie.id)
    if (!count) continue
    const avg = ageSums.get(movie.id)! / count
    movieAvgAgeNorm.set(movie.id, normalize(avg, minAge, maxAge))
  }

  const numGenres = meta.genreVocabulary.length
  const numDecades = meta.decadeBuckets.length

  return {
    meta,
    genreIndex,
    decadeIndex,
    numGenres,
    numDecades,
    minAge,
    maxAge,
    movieAvgAgeNorm,
    dimensions: 2 + numGenres + numDecades,
  }
}
