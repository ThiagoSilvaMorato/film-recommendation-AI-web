import * as tf from '@tensorflow/tfjs'
import type { Movie } from '../types/movie'
import type { User } from '../types/user'
import type { EncodingContext } from './context'
import { WEIGHTS, normalize } from './weights'
import { encodeMovie } from './encodeMovie'

export function encodeUser(user: User, moviesById: Map<number, Movie>, context: EncodingContext): tf.Tensor2D {
  const watchedMovies = user.watchedMovieIds
    .map((id) => moviesById.get(id))
    .filter((movie): movie is Movie => movie !== undefined)

  if (watchedMovies.length > 0) {
    return tf
      .stack(watchedMovies.map((movie) => encodeMovie(movie, context)))
      .mean(0)
      .reshape([1, context.dimensions]) as tf.Tensor2D
  }

  return tf
    .concat1d([
      tf.zeros([1]),
      tf.tensor1d([normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.avgViewerAge]),
      tf.zeros([context.numGenres]),
      tf.zeros([context.numDecades]),
    ])
    .reshape([1, context.dimensions]) as tf.Tensor2D
}
