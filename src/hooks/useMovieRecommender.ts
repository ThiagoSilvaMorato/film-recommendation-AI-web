import { useCallback, useEffect, useRef, useState } from 'react'
import type { Movie } from '../types/movie'
import type { CatalogMeta } from '../types/catalogMeta'
import type { User } from '../types/user'
import type { RecommendationResult, WorkerRequest, WorkerResponse } from '../types/workerMessages'

export type TrainingStatus = 'idle' | 'training' | 'complete' | 'error'
export type PredictionStatus = 'idle' | 'predicting' | 'complete' | 'error'

export interface TrainingProgress {
  epoch: number
  totalEpochs: number
  loss: number
  accuracy: number
}

export interface UseMovieRecommender {
  workerReady: boolean
  modelRestored: boolean
  trainingStatus: TrainingStatus
  trainingHistory: TrainingProgress[]
  trainingError: string | null
  predictionStatus: PredictionStatus
  recommendations: RecommendationResult[]
  predictionError: string | null
  train: (users: User[], epochs?: number) => void
  predict: (users: User[], targetUserId: string, topN?: number) => void
  resetModel: () => void
}

export function useMovieRecommender(movies: Movie[], meta: CatalogMeta | null, users: User[]): UseMovieRecommender {
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef<string | null>(null)
  const predictRequestIdRef = useRef<string | null>(null)

  const [workerReady, setWorkerReady] = useState(false)
  const [modelRestored, setModelRestored] = useState(false)
  const [catalogSent, setCatalogSent] = useState(false)

  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('idle')
  const [trainingHistory, setTrainingHistory] = useState<TrainingProgress[]>([])
  const [trainingError, setTrainingError] = useState<string | null>(null)

  const [predictionStatus, setPredictionStatus] = useState<PredictionStatus>('idle')
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  const [predictionError, setPredictionError] = useState<string | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('../worker/recommender.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data
      switch (response.type) {
        case 'WORKER_READY':
          setWorkerReady(true)
          setModelRestored(response.modelRestored)
          break
        case 'CATALOG_READY':
          setCatalogSent(true)
          break
        case 'TRAIN_PROGRESS':
          if (response.requestId !== requestIdRef.current) return
          setTrainingHistory((prev) => [
            ...prev,
            { epoch: response.epoch, totalEpochs: response.totalEpochs, loss: response.loss, accuracy: response.accuracy },
          ])
          break
        case 'TRAIN_COMPLETE':
          if (response.requestId !== requestIdRef.current) return
          setTrainingStatus('complete')
          break
        case 'TRAIN_ERROR':
          if (response.requestId !== requestIdRef.current) return
          setTrainingStatus('error')
          setTrainingError(response.message)
          break
        case 'PREDICT_COMPLETE':
          if (response.requestId !== predictRequestIdRef.current) return
          setRecommendations(response.recommendations)
          setPredictionStatus('complete')
          break
        case 'PREDICT_ERROR':
          if (response.requestId !== predictRequestIdRef.current) return
          setPredictionStatus('error')
          setPredictionError(response.message)
          break
        case 'RESET_MODEL_COMPLETE':
          setModelRestored(false)
          setTrainingStatus('idle')
          setTrainingHistory([])
          setRecommendations([])
          setPredictionStatus('idle')
          break
        case 'WORKER_ERROR':
          console.error('Worker error:', response.message)
          break
      }
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!workerReady || !meta || movies.length === 0 || catalogSent) return
    const request: WorkerRequest = { type: 'CATALOG_LOAD', movies, meta, users }
    workerRef.current?.postMessage(request)
  }, [workerReady, meta, movies, users, catalogSent])

  const train = useCallback((users: User[], epochs = 100) => {
    if (!workerRef.current) return
    const requestId = crypto.randomUUID()
    requestIdRef.current = requestId
    setTrainingStatus('training')
    setTrainingHistory([])
    setTrainingError(null)
    const request: WorkerRequest = { type: 'TRAIN_REQUEST', requestId, users, epochs }
    workerRef.current.postMessage(request)
  }, [])

  const predict = useCallback((users: User[], targetUserId: string, topN?: number) => {
    if (!workerRef.current) return
    const requestId = crypto.randomUUID()
    predictRequestIdRef.current = requestId
    setPredictionStatus('predicting')
    setPredictionError(null)
    const request: WorkerRequest = { type: 'PREDICT_REQUEST', requestId, users, targetUserId, topN }
    workerRef.current.postMessage(request)
  }, [])

  const resetModel = useCallback(() => {
    if (!workerRef.current) return
    const requestId = crypto.randomUUID()
    const request: WorkerRequest = { type: 'RESET_MODEL_REQUEST', requestId }
    workerRef.current.postMessage(request)
  }, [])

  return {
    workerReady,
    modelRestored,
    trainingStatus,
    trainingHistory,
    trainingError,
    predictionStatus,
    recommendations,
    predictionError,
    train,
    predict,
    resetModel,
  }
}
