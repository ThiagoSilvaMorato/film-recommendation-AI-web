import type { TrainingStatus } from '../../hooks/useMovieRecommender'

interface TrainingControlsProps {
  status: TrainingStatus
  modelRestored: boolean
  epoch: number
  totalEpochs: number
  onTrain: () => void
  onReset: () => void
}

export function TrainingControls({ status, modelRestored, epoch, totalEpochs, onTrain, onReset }: TrainingControlsProps) {
  const progressPct = totalEpochs > 0 ? Math.round((epoch / totalEpochs) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onTrain}
          disabled={status === 'training'}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'training' ? 'Training...' : 'Train model'}
        </button>
        <button
          onClick={onReset}
          disabled={status === 'training'}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset model
        </button>
        {modelRestored && status === 'idle' && (
          <span className="text-xs text-emerald-400">Previously trained model loaded from this browser</span>
        )}
      </div>

      {status === 'training' && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Epoch {epoch} / {totalEpochs}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
