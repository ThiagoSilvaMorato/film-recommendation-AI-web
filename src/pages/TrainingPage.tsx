import { useAppContext } from '../context/useAppContext'
import { TrainingChart } from '../components/training/TrainingChart'
import { TrainingControls } from '../components/training/TrainingControls'
import { ErrorBanner } from '../components/common/ErrorBanner'

export function TrainingPage() {
  const { users, workerReady, modelRestored, trainingStatus, trainingHistory, trainingError, train, resetModel } =
    useAppContext()

  const lastProgress = trainingHistory[trainingHistory.length - 1]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Training</h1>
        <p className="text-sm text-slate-400">
          Trains a small neural net on all {users.length} mock users' watch histories, entirely in your browser via a
          Web Worker — the UI never freezes.
        </p>
      </div>

      {!workerReady && <p className="text-sm text-slate-500">Starting the recommender worker...</p>}

      {trainingStatus === 'error' && trainingError && <ErrorBanner message={trainingError} />}

      <TrainingControls
        status={trainingStatus}
        modelRestored={modelRestored}
        epoch={lastProgress?.epoch ?? 0}
        totalEpochs={lastProgress?.totalEpochs ?? 40}
        onTrain={() => train(users, 40)}
        onReset={resetModel}
      />

      <TrainingChart history={trainingHistory} />

      {trainingStatus === 'complete' && lastProgress && (
        <p className="text-sm text-emerald-400">
          Training complete — final loss {lastProgress.loss.toFixed(4)}, accuracy {(lastProgress.accuracy * 100).toFixed(1)}%.
          Head to Recommendations to see results.
        </p>
      )}
    </div>
  )
}
