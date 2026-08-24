import type { Movie } from '../types/movie'
import type { CatalogMeta } from '../types/catalogMeta'
import type { User } from '../types/user'
import { normalize } from './weights'

export interface EncodingContext {
  meta: CatalogMeta
  genreIndex: Record<string, number>
  decadeIndex: Record<number, number>
  numGenres: number
  numDecades: number
  minAge: number
  maxAge: number
  movieAvgAgeNorm: Map<number, number>
  dimensions: number
}

export function buildEncodingContext(movies: Movie[], meta: CatalogMeta, users: User[]): EncodingContext {
  const ages = users.map((u) => u.age)
  const minAge = ages.length ? Math.min(...ages) : 0
  const maxAge = ages.length ? Math.max(...ages) : 0

  const genreIndex = Object.fromEntries(meta.genreVocabulary.map((genre, index) => [genre, index]))
  const decadeIndex = Object.fromEntries(meta.decadeBuckets.map((decade, index) => [decade, index]))

  const ageSums = new Map<number, number>()
  const ageCounts = new Map<number, number>()
  for (const user of users) {
    for (const movieId of user.watchedMovieIds) {
      ageSums.set(movieId, (ageSums.get(movieId) ?? 0) + user.age)
      ageCounts.set(movieId, (ageCounts.get(movieId) ?? 0) + 1)
    }
  }

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
