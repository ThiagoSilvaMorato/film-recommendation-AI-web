import type { CatalogMeta } from '../types/catalogMeta'

/** Fixed normalization ceiling for ages — stable across catalog resamples. */
export const MAX_AGE = 100

/** Per-block scaling applied before concatenating the movie feature vector. */
export const WEIGHTS = {
  releaseYear: 1.0,
  avgViewerAge: 1.0,
  genres: 1.5,
  decade: 0.5,
} as const

/** Movie vector dimension: releaseYear(1) + avgViewerAge(1) + genres(G) + decade(D). */
export function vectorDim(meta: CatalogMeta): number {
  return 1 + 1 + meta.genreVocabulary.length + meta.decadeBuckets.length
}
