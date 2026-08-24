import type { CatalogMeta } from '../types/catalogMeta'

/**
 * Mirrors exemplo-01's WEIGHTS: primary categorical > secondary categorical
 * > primary continuous > secondary continuous.
 *   category(0.4) -> genres(0.4)
 *   color(0.3)    -> decade(0.3)
 *   price(0.2)    -> releaseYear(0.2)
 *   age(0.1)      -> avgViewerAge(0.1)
 */
export const WEIGHTS = {
  genres: 0.4,
  decade: 0.3,
  releaseYear: 0.2,
  avgViewerAge: 0.1,
} as const

/**
 * Normalize a continuous value to 0-1. Same formula as exemplo-01:
 * (val - min) / (max - min), guarding against a zero-width range.
 */
export function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min || 1)
}

/** Movie vector dimension: releaseYear(1) + avgViewerAge(1) + genres(G) + decade(D). */
export function vectorDim(meta: CatalogMeta): number {
  return 1 + 1 + meta.genreVocabulary.length + meta.decadeBuckets.length
}
