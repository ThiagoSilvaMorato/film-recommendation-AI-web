import type { Movie } from '../types/movie'
import type { CatalogMeta } from '../types/catalogMeta'
import { MAX_AGE, WEIGHTS, vectorDim } from './weights'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Encodes a movie into a fixed-length feature vector:
 * [releaseYear(1) | avgViewerAge(1) | genres multi-hot(G) | decade one-hot(D)]
 *
 * `avgViewerAgeForMovie` must be computed by the caller from the live users
 * array (see avgViewerAge.ts) — it is not a static movie property.
 */
export function encodeMovie(movie: Movie, avgViewerAgeForMovie: number, meta: CatalogMeta): Float32Array {
  const vector = new Float32Array(vectorDim(meta))

  const { releaseYearMin, releaseYearMax, genreVocabulary, decadeBuckets } = meta
  const yearRange = releaseYearMax - releaseYearMin || 1
  vector[0] = WEIGHTS.releaseYear * ((movie.releaseYear - releaseYearMin) / yearRange)

  vector[1] = WEIGHTS.avgViewerAge * (clamp(avgViewerAgeForMovie, 0, MAX_AGE) / MAX_AGE)

  const genreOffset = 2
  if (movie.genres.length > 0) {
    const perGenreWeight = WEIGHTS.genres / movie.genres.length
    for (const genre of movie.genres) {
      const index = genreVocabulary.indexOf(genre)
      if (index >= 0) vector[genreOffset + index] = perGenreWeight
    }
  }

  const decadeOffset = genreOffset + genreVocabulary.length
  const decadeIndex = decadeBuckets.indexOf(movie.decade)
  if (decadeIndex >= 0) vector[decadeOffset + decadeIndex] = WEIGHTS.decade

  return vector
}
