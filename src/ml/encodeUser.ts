import * as tf from '@tensorflow/tfjs'
import type { Movie } from '../types/movie'
import type { User } from '../types/user'
import type { EncodingContext } from './context'
import { WEIGHTS, normalize } from './weights'
import { encodeMovie } from './encodeMovie'

/**
 * Encodes a user as the mean of their watched movies' vectors — mirrors
 * exemplo-01's encodeUser: tf.stack(purchases).mean(0). Users with no watch
 * history get a neutral vector carrying only their normalized age, same as
 * exemplo-01's zero-filled fallback for price/category/color.
 */
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
      tf.zeros([1]), // release year ignored
      tf.tensor1d([normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.avgViewerAge]),
      tf.zeros([context.numGenres]), // genres ignored
      tf.zeros([context.numDecades]), // decade ignored
    ])
    .reshape([1, context.dimensions]) as tf.Tensor2D
}
