import { describe, expect, it } from 'vitest'
import { encodeMovie } from '../../src/ml/encodeMovie'
import { buildEncodingContext } from '../../src/ml/context'
import { WEIGHTS } from '../../src/ml/weights'
import type { CatalogMeta } from '../../src/types/catalogMeta'
import type { Movie } from '../../src/types/movie'
import type { User } from '../../src/types/user'

const meta: CatalogMeta = {
  genreVocabulary: ['Action', 'Comedy', 'Drama'],
  decadeBuckets: [1990, 2000],
  releaseYearMin: 1990,
  releaseYearMax: 2000,
  seed: 1,
  sampleSize: 2,
  generatedAt: new Date().toISOString(),
}

const movie: Movie = {
  id: 1,
  title: 'Test Movie',
  overview: 'overview',
  genres: ['Action', 'Comedy'],
  poster: null,
  releaseYear: 1995,
  decade: 1990,
}

const users: User[] = [
  { id: 'u1', name: 'A', age: 20, watchedMovieIds: [1], createdAt: new Date().toISOString() },
  { id: 'u2', name: 'B', age: 40, watchedMovieIds: [1], createdAt: new Date().toISOString() },
]

describe('encodeMovie', () => {
  it('produces a vector of the expected dimension', () => {
    const context = buildEncodingContext([movie], meta, users)
    const vector = Array.from(encodeMovie(movie, context).dataSync())
    expect(vector.length).toBe(context.dimensions)
  })

  it('normalizes release year within [0, WEIGHTS.releaseYear]', () => {
    const context = buildEncodingContext([movie], meta, users)
    const vector = Array.from(encodeMovie(movie, context).dataSync())
    expect(vector[0]).toBeCloseTo(WEIGHTS.releaseYear * 0.5)
  })

  it('uses the movie\'s normalized avg viewer age', () => {
    const context = buildEncodingContext([movie], meta, users)
    const vector = Array.from(encodeMovie(movie, context).dataSync())
    expect(vector[1]).toBeCloseTo(WEIGHTS.avgViewerAge * 0.5)
  })

  it('falls back to 0.5 for avg viewer age when nobody watched the movie', () => {
    const context = buildEncodingContext([movie], meta, [])
    const vector = Array.from(encodeMovie(movie, context).dataSync())
    expect(vector[1]).toBeCloseTo(WEIGHTS.avgViewerAge * 0.5)
  })

  it('spreads genre weight evenly across active genre slots', () => {
    const context = buildEncodingContext([movie], meta, users)
    const vector = Array.from(encodeMovie(movie, context).dataSync())
    const genreSlots = vector.slice(2, 5)
    const activeSum = genreSlots.reduce((sum, v) => sum + v, 0)
    expect(activeSum).toBeCloseTo(WEIGHTS.genres)
  })

  it('sets the matching decade one-hot slot', () => {
    const context = buildEncodingContext([movie], meta, users)
    const vector = Array.from(encodeMovie(movie, context).dataSync())
    const decadeSlots = vector.slice(5, 7)
    expect(decadeSlots[0]).toBeCloseTo(WEIGHTS.decade)
    expect(decadeSlots[1]).toBe(0)
  })
})
