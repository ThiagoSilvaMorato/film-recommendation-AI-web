import * as tf from "@tensorflow/tfjs";
import type { Movie } from "../types/movie";
import type { EncodingContext } from "./context";
import { WEIGHTS, normalize } from "./weights";

function oneHotWeighted(index: number, length: number, weight: number): tf.Tensor1D {
  return tf.oneHot(index, length).cast("float32").mul(weight) as tf.Tensor1D;
}

function multiHotWeighted(indices: number[], length: number, weight: number): tf.Tensor1D {
  if (indices.length === 0) return tf.zeros([length]);
  const perGenreWeight = weight / indices.length;
  return tf.oneHot(tf.tensor1d(indices, "int32"), length).sum(0).mul(perGenreWeight) as tf.Tensor1D;
}

export function encodeMovie(movie: Movie, context: EncodingContext): tf.Tensor1D {
  const { meta } = context;

  const releaseYear = tf.tensor1d([
    normalize(movie.releaseYear, meta.releaseYearMin, meta.releaseYearMax) * WEIGHTS.releaseYear,
  ]);

  const avgViewerAge = tf.tensor1d([
    (context.movieAvgAgeNorm.get(movie.id) ?? 0.5) * WEIGHTS.avgViewerAge,
  ]);

  const genreIndices = movie.genres
    .map((genre) => context.genreIndex[genre])
    .filter((index): index is number => index !== undefined);
  const genres = multiHotWeighted(genreIndices, context.numGenres, WEIGHTS.genres);

  const decade = oneHotWeighted(
    context.decadeIndex[movie.decade],
    context.numDecades,
    WEIGHTS.decade,
  );

  return tf.concat1d([releaseYear, avgViewerAge, genres, decade]);
}
