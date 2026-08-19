import { describe, expect, it } from 'vitest'
import { buildDataset, buildPredictionInputs } from '../../src/ml/buildDataset'
import { vectorDim } from '../../src/ml/weights'
import type { CatalogMeta } from '../../src/types/catalogMeta'
import type { Movie } from '../../src/types/movie'
import type { User } from '../../src/types/user'

const meta: CatalogMeta = {
  genreVocabulary: ['Action', 'Drama'],
  decadeBuckets: [1990, 2000],
  releaseYearMin: 1990,
  releaseYearMax: 2000,
  seed: 1,
  sampleSize: 3,
  generatedAt: new Date().toISOString(),
}

const movies: Movie[] = [
  { id: 1, title: 'A', overview: '', genres: ['Action'], poster: null, releaseYear: 1990, decade: 1990 },
  { id: 2, title: 'B', overview: '', genres: ['Drama'], poster: null, releaseYear: 2000, decade: 2000 },
  { id: 3, title: 'C', overview: '', genres: ['Action', 'Drama'], poster: null, releaseYear: 1995, decade: 1990 },
]

const users: User[] = [
  { id: 'u1', name: 'Alice', age: 25, watchedMovieIds: [1, 3], createdAt: new Date().toISOString() },
  { id: 'u2', name: 'Bob', age: 40, watchedMovieIds: [], createdAt: new Date().toISOString() },
]

describe('buildDataset', () => {
  it('creates one row per (user with history) x (catalog movie)', () => {
    const dataset = buildDataset(users, movies, meta)
    // only u1 has a non-empty history -> 1 user x 3 movies = 3 rows
    expect(dataset.inputs.length).toBe(3)
    expect(dataset.labels.length).toBe(3)
  })

  it('labels watched movies as 1 and others as 0', () => {
    const dataset = buildDataset(users, movies, meta)
    expect(dataset.labels).toEqual([1, 0, 1])
  })

  it('input dim is twice the movie vector dim', () => {
    const dataset = buildDataset(users, movies, meta)
    expect(dataset.inputDim).toBe(vectorDim(meta) * 2)
  })
})

describe('buildPredictionInputs', () => {
  it('creates one row per catalog movie for the target user', () => {
    const { movieIds, inputs, inputDim } = buildPredictionInputs(users[0], movies, users, meta)
    expect(movieIds).toEqual([1, 2, 3])
    expect(inputs.length).toBe(3)
    expect(inputDim).toBe(vectorDim(meta) * 2)
  })
})
