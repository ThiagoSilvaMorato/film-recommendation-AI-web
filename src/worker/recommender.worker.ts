import * as tf from '@tensorflow/tfjs'
import type { Movie } from '../types/movie'
import type { CatalogMeta } from '../types/catalogMeta'
import type { WorkerRequest, WorkerResponse } from '../types/workerMessages'
import { buildEncodingContext, type EncodingContext } from '../ml/context'
import { buildMovieVectors, buildPredictionInputs, createTrainingData, type MovieVectorEntry } from '../ml/buildDataset'
import { createModel, predictBatch, trainModel } from '../ml/model'
import { clearModel, isModelShapeCompatible, loadModel, saveModel } from '../ml/modelStorage'

const ctx = self as unknown as Worker

let movies: Movie[] = []
let meta: CatalogMeta | null = null
let moviesById = new Map<number, Movie>()
let model: tf.LayersModel | null = null

// context/movieVectors from the last training run; predictions reuse them, never rebuild
let context: EncodingContext | null = null
let movieVectors: MovieVectorEntry[] = []

function post(response: WorkerResponse): void {
  ctx.postMessage(response)
}

async function boot(): Promise<void> {
  const restored = await loadModel()
  if (restored) model = restored
  post({ type: 'WORKER_READY', modelRestored: restored !== null })
}

function handleCatalogLoad(request: Extract<WorkerRequest, { type: 'CATALOG_LOAD' }>): void {
  movies = request.movies
  meta = request.meta
  moviesById = new Map(movies.map((movie) => [movie.id, movie]))

  context = buildEncodingContext(movies, meta, request.users)
  movieVectors = buildMovieVectors(movies, context)

  if (model && !isModelShapeCompatible(model, context.dimensions * 2)) {
    console.warn('Restored model input shape does not match current catalog encoding; discarding it.')
    model.dispose()
    model = null
  }

  post({ type: 'CATALOG_READY' })
}

async function handleTrain(request: Extract<WorkerRequest, { type: 'TRAIN_REQUEST' }>): Promise<void> {
  if (!meta) {
    post({ type: 'TRAIN_ERROR', requestId: request.requestId, message: 'Catalog not loaded yet' })
    return
  }

  let xs: tf.Tensor2D | null = null
  let ys: tf.Tensor2D | null = null

  try {
    context = buildEncodingContext(movies, meta, request.users)
    movieVectors = buildMovieVectors(movies, context)

    const dataset = createTrainingData(request.users, moviesById, movieVectors, context)
    xs = dataset.xs
    ys = dataset.ys

    if (dataset.ys.shape[0] === 0) {
      throw new Error('No users with watch history to train on')
    }

    model?.dispose()
    model = createModel(dataset.inputDimension)

    const start = performance.now()
    const { finalLoss, finalAccuracy } = await trainModel(model, xs, ys, {
      epochs: request.epochs,
      batchSize: request.batchSize,
      onEpochEnd: (epoch, loss, accuracy) => {
        post({
          type: 'TRAIN_PROGRESS',
          requestId: request.requestId,
          epoch: epoch + 1,
          totalEpochs: request.epochs,
          loss,
          accuracy,
        })
      },
    })

    await saveModel(model)

    post({
      type: 'TRAIN_COMPLETE',
      requestId: request.requestId,
      finalLoss,
      finalAccuracy,
      durationMs: performance.now() - start,
    })
  } catch (err) {
    post({
      type: 'TRAIN_ERROR',
      requestId: request.requestId,
      message: err instanceof Error ? err.message : 'Training failed',
    })
  } finally {
    xs?.dispose()
    ys?.dispose()
  }
}

function handlePredict(request: Extract<WorkerRequest, { type: 'PREDICT_REQUEST' }>): void {
  if (!model || !context) {
    post({ type: 'PREDICT_ERROR', requestId: request.requestId, message: 'No trained model available yet' })
    return
  }

  try {
    const targetUser = request.users.find((u) => u.id === request.targetUserId)
    if (!targetUser) throw new Error('Target user not found')

    const { movieIds, inputs } = buildPredictionInputs(targetUser, moviesById, movieVectors, context)
    const scores = predictBatch(model, inputs)

    const ranked = movieIds
      .map((movieId, i) => ({ movieId, score: scores[i] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, request.topN ?? movieIds.length)

    post({ type: 'PREDICT_COMPLETE', requestId: request.requestId, recommendations: ranked })
  } catch (err) {
    post({
      type: 'PREDICT_ERROR',
      requestId: request.requestId,
      message: err instanceof Error ? err.message : 'Prediction failed',
    })
  }
}

async function handleResetModel(request: Extract<WorkerRequest, { type: 'RESET_MODEL_REQUEST' }>): Promise<void> {
  model?.dispose()
  model = null
  await clearModel()
  post({ type: 'RESET_MODEL_COMPLETE', requestId: request.requestId })
}

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  switch (request.type) {
    case 'CATALOG_LOAD':
      handleCatalogLoad(request)
      break
    case 'TRAIN_REQUEST':
      void handleTrain(request)
      break
    case 'PREDICT_REQUEST':
      handlePredict(request)
      break
    case 'RESET_MODEL_REQUEST':
      void handleResetModel(request)
      break
    default:
      post({ type: 'WORKER_ERROR', message: `Unknown request type` })
  }
}

void boot()
