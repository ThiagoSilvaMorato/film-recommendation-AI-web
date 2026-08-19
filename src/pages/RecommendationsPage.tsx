import { useEffect, useMemo } from 'react'
import { useAppContext } from '../context/useAppContext'
import { RecommendationList } from '../components/recommendations/RecommendationList'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorBanner } from '../components/common/ErrorBanner'

export function RecommendationsPage() {
  const {
    movies,
    users,
    currentUser,
    trainingStatus,
    modelRestored,
    predictionStatus,
    recommendations,
    predictionError,
    predict,
  } = useAppContext()

  const moviesById = useMemo(() => new Map(movies.map((m) => [m.id, m])), [movies])
  const hasModel = trainingStatus === 'complete' || modelRestored

  useEffect(() => {
    if (currentUser && hasModel && movies.length > 0) {
      predict(users, currentUser.id, 24)
    }
  }, [currentUser?.id, hasModel, movies.length])

  if (!currentUser) {
    return <ErrorBanner message="Select a user on the Profile tab first." />
  }

  if (!hasModel) {
    return <ErrorBanner message="No trained model yet — visit the Training tab to train one." />
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Recommendations for {currentUser.name}</h1>
        <p className="text-sm text-slate-400">Ranked by predicted compatibility score from the trained model.</p>
      </div>

      {predictionStatus === 'predicting' && <LoadingSpinner label="Scoring the catalog..." />}
      {predictionStatus === 'error' && predictionError && <ErrorBanner message={predictionError} />}
      {predictionStatus === 'complete' && <RecommendationList recommendations={recommendations} moviesById={moviesById} />}
    </div>
  )
}
