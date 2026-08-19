import { describe, expect, it } from 'vitest'
import { encodeMovie } from '../../src/ml/encodeMovie'
import { vectorDim, WEIGHTS, MAX_AGE } from '../../src/ml/weights'
import type { CatalogMeta } from '../../src/types/catalogMeta'
import type { Movie } from '../../src/types/movie'

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

describe('encodeMovie', () => {
  it('produces a vector of the expected dimension', () => {
    const vector = encodeMovie(movie, 30, meta)
    expect(vector.length).toBe(vectorDim(meta))
  })

  it('normalizes release year within [0, WEIGHTS.releaseYear]', () => {
    const vector = encodeMovie(movie, 30, meta)
    expect(vector[0]).toBeCloseTo(WEIGHTS.releaseYear * 0.5)
  })

  it('normalizes avg viewer age against MAX_AGE', () => {
    const vector = encodeMovie(movie, 50, meta)
    expect(vector[1]).toBeCloseTo(WEIGHTS.avgViewerAge * (50 / MAX_AGE))
  })

  it('spreads genre weight evenly across active genre slots', () => {
    const vector = encodeMovie(movie, 30, meta)
    const genreSlots = vector.slice(2, 5)
    const activeSum = genreSlots.reduce((sum, v) => sum + v, 0)
    expect(activeSum).toBeCloseTo(WEIGHTS.genres)
  })

  it('sets the matching decade one-hot slot', () => {
    const vector = encodeMovie(movie, 30, meta)
    const decadeSlots = vector.slice(5, 7)
    expect(decadeSlots[0]).toBeCloseTo(WEIGHTS.decade)
    expect(decadeSlots[1]).toBe(0)
  })
})
