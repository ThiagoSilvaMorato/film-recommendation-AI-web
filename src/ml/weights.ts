import type { CatalogMeta } from '../types/catalogMeta'

export const WEIGHTS = {
  genres: 0.4,
  decade: 0.3,
  releaseYear: 0.2,
  avgViewerAge: 0.1,
} as const

export function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min || 1)
}

export function vectorDim(meta: CatalogMeta): number {
  return 1 + 1 + meta.genreVocabulary.length + meta.decadeBuckets.length
}
