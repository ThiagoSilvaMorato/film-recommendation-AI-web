import { describe, expect, it } from 'vitest'
import { buildMovieVectors, buildPredictionInputs, createTrainingData } from '../../src/ml/buildDataset'
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

const moviesById = new Map(movies.map((m) => [m.id, m]))

describe('createTrainingData', () => {
  it('creates one row per (user with history) x (catalog movie)', () => {
    const context = buildEncodingContext(movies, meta, users)
    const movieVectors = buildMovieVectors(movies, context)
    const dataset = createTrainingData(users, moviesById, movieVectors, context)
    expect(dataset.ys.shape[0]).toBe(3)
  })

  it('labels watched movies as 1 and others as 0', () => {
    const context = buildEncodingContext(movies, meta, users)
    const movieVectors = buildMovieVectors(movies, context)
    const dataset = createTrainingData(users, moviesById, movieVectors, context)
    expect(Array.from(dataset.ys.dataSync())).toEqual([1, 0, 1])
  })

  it('input dim is twice the movie vector dim', () => {
    const context = buildEncodingContext(movies, meta, users)
    const movieVectors = buildMovieVectors(movies, context)
    const dataset = createTrainingData(users, moviesById, movieVectors, context)
    expect(dataset.inputDimension).toBe(context.dimensions * 2)
    expect(dataset.xs.shape[1]).toBe(context.dimensions * 2)
  })
})

describe('buildPredictionInputs', () => {
  it('creates one row per catalog movie for the target user', () => {
    const context = buildEncodingContext(movies, meta, users)
    const movieVectors = buildMovieVectors(movies, context)
    const { movieIds, inputs } = buildPredictionInputs(users[0], moviesById, movieVectors, context)
    expect(movieIds).toEqual([1, 2, 3])
    expect(inputs.length).toBe(3)
    expect(inputs[0].length).toBe(context.dimensions * 2)
  })
})
