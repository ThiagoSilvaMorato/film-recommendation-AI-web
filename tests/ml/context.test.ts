import { describe, expect, it } from 'vitest'
import { buildEncodingContext } from '../../src/ml/context'
import type { CatalogMeta } from '../../src/types/catalogMeta'
import type { Movie } from '../../src/types/movie'
import type { User } from '../../src/types/user'

const meta: CatalogMeta = {
  genreVocabulary: ['Action', 'Drama'],
  decadeBuckets: [1990, 2000],
  releaseYearMin: 1990,
  releaseYearMax: 2000,
  seed: 1,
  sampleSize: 2,
  generatedAt: new Date().toISOString(),
}

const movie1: Movie = {
  id: 1,
  title: 'Movie 1',
  overview: '',
  genres: ['Action'],
  poster: null,
  releaseYear: 1995,
  decade: 1990,
}

function user(overrides: Partial<User>): User {
  return {
    id: crypto.randomUUID(),
    name: 'Test',
    age: 30,
    watchedMovieIds: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('buildEncodingContext', () => {
  it('computes min/max age across all given users', () => {
    const context = buildEncodingContext([], meta, [user({ age: 20 }), user({ age: 40 })])
    expect(context.minAge).toBe(20)
    expect(context.maxAge).toBe(40)
  })

  it('normalizes avg viewer age per movie from watch history', () => {
    const context = buildEncodingContext(
      [movie1],
      meta,
      [user({ age: 20, watchedMovieIds: [1] }), user({ age: 40, watchedMovieIds: [1] })]
    )
    // avg age for movie 1 is 30, normalized against [20,40] -> 0.5
    expect(context.movieAvgAgeNorm.get(1)).toBeCloseTo(0.5)
  })

  it('leaves unwatched movies out of movieAvgAgeNorm (callers fall back to 0.5)', () => {
    const context = buildEncodingContext([movie1], meta, [user({ age: 20, watchedMovieIds: [1] })])
    expect(context.movieAvgAgeNorm.has(2)).toBe(false)
  })

  it('builds genre and decade index maps from catalog meta', () => {
    const context = buildEncodingContext([], meta, [])
    expect(context.genreIndex).toEqual({ Action: 0, Drama: 1 })
    expect(context.decadeIndex).toEqual({ 1990: 0, 2000: 1 })
    expect(context.dimensions).toBe(2 + 2 + 2)
  })
})
