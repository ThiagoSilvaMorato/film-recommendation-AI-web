import type { Movie } from './movie'
import type { CatalogMeta } from './catalogMeta'
import type { User } from './user'

export interface RecommendationResult {
  movieId: number
  score: number
}

/** Main thread -> Worker */
export type WorkerRequest =
  | { type: 'CATALOG_LOAD'; movies: Movie[]; meta: CatalogMeta }
  | { type: 'TRAIN_REQUEST'; requestId: string; users: User[]; epochs: number; batchSize?: number }
  | { type: 'PREDICT_REQUEST'; requestId: string; users: User[]; targetUserId: string; topN?: number }
  | { type: 'RESET_MODEL_REQUEST'; requestId: string }

/** Worker -> Main thread */
export type WorkerResponse =
  | { type: 'WORKER_READY'; modelRestored: boolean }
  | { type: 'CATALOG_READY' }
  | { type: 'TRAIN_PROGRESS'; requestId: string; epoch: number; totalEpochs: number; loss: number; accuracy: number }
  | { type: 'TRAIN_COMPLETE'; requestId: string; finalLoss: number; finalAccuracy: number; durationMs: number }
  | { type: 'TRAIN_ERROR'; requestId: string; message: string }
  | { type: 'PREDICT_COMPLETE'; requestId: string; recommendations: RecommendationResult[] }
  | { type: 'PREDICT_ERROR'; requestId: string; message: string }
  | { type: 'RESET_MODEL_COMPLETE'; requestId: string }
  | { type: 'WORKER_ERROR'; message: string }
