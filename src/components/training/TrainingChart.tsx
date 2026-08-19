import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrainingProgress } from '../../hooks/useMovieRecommender'

export function TrainingChart({ history }: { history: TrainingProgress[] }) {
  if (history.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-sm text-slate-500">
        Training metrics will appear here once training starts.
      </div>
    )
  }

  return (
    <div className="h-64 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="epoch" stroke="#64748b" fontSize={12} label={{ value: 'Epoch', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 12 }} />
          <YAxis stroke="#64748b" fontSize={12} domain={[0, 'auto']} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
          <Legend />
          <Line type="monotone" dataKey="loss" stroke="#f87171" strokeWidth={2} dot={false} name="Loss" />
          <Line type="monotone" dataKey="accuracy" stroke="#818cf8" strokeWidth={2} dot={false} name="Accuracy" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
