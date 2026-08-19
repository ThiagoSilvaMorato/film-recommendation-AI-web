import type { Movie } from '../../types/movie'

interface WatchedListProps {
  movies: Movie[]
  onToggleWatched: (movieId: number) => void
}

export function WatchedList({ movies, onToggleWatched }: WatchedListProps) {
  if (movies.length === 0) {
    return <p className="text-sm text-slate-500">No movies watched yet — mark some from the Catalog tab.</p>
  }

  return (
    <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
      {movies.map((movie) => (
        <li key={movie.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-100">{movie.title}</p>
            <p className="text-xs text-slate-500">
              {movie.releaseYear} · {movie.genres.join(', ')}
            </p>
          </div>
          <button
            onClick={() => onToggleWatched(movie.id)}
            className="shrink-0 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}
