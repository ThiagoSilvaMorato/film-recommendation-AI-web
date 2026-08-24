import * as tf from '@tensorflow/tfjs'
import type { Movie } from '../types/movie'
import type { User } from '../types/user'
import type { EncodingContext } from './context'
import { encodeMovie } from './encodeMovie'
import { encodeUser } from './encodeUser'

export interface MovieVectorEntry {
  id: number
  vector: Float32Array
}

/**
 * Precomputes every catalog movie's feature vector once. Mirrors exemplo-01's
 * context.productVectors, built once per training run in the worker and
 * reused by both createTrainingData and recommend() instead of re-encoding
 * the same movie repeatedly.
 */
export function buildMovieVectors(movies: Movie[], context: EncodingContext): MovieVectorEntry[] {
  return movies.map((movie) => {
    const tensor = encodeMovie(movie, context)
    const vector = tensor.dataSync() as Float32Array
    tensor.dispose()
    return { id: movie.id, vector }
  })
}

export interface TrainingData {
  xs: tf.Tensor2D
  ys: tf.Tensor2D
  inputDimension: number
}

/**
 * For every user with watch history, pairs their vector with every catalog
 * movie's vector, labeling `1` if watched and `0` otherwise. Mirrors
 * exemplo-01's createTrainingData.
 */
export function createTrainingData(
  users: User[],
  moviesById: Map<number, Movie>,
  movieVectors: MovieVectorEntry[],
  context: EncodingContext
): TrainingData {
  const inputs: number[][] = []
  const labels: number[] = []

  users
    .filter((user) => user.watchedMovieIds.length > 0)
    .forEach((user) => {
      const userTensor = encodeUser(user, moviesById, context)
      const userVector = userTensor.dataSync()
      userTensor.dispose()

      const watchedSet = new Set(user.watchedMovieIds)
      movieVectors.forEach(({ id, vector }) => {
        inputs.push([...userVector, ...vector])
        labels.push(watchedSet.has(id) ? 1 : 0)
      })
    })

  return {
    xs: tf.tensor2d(inputs),
    ys: tf.tensor2d(labels, [labels.length, 1]),
    inputDimension: context.dimensions * 2,
  }
}

/** Pairs one user's vector with every catalog movie's vector, for prediction. */
export function buildPredictionInputs(
  user: User,
  moviesById: Map<number, Movie>,
  movieVectors: MovieVectorEntry[],
  context: EncodingContext
): { movieIds: number[]; inputs: number[][] } {
  const userTensor = encodeUser(user, moviesById, context)
  const userVector = userTensor.dataSync()
  userTensor.dispose()

  const movieIds = movieVectors.map(({ id }) => id)
  const inputs = movieVectors.map(({ vector }) => [...userVector, ...vector])

  return { movieIds, inputs }
}
