import type { Movie } from '../../types/movie'
import { MovieCard } from './MovieCard'

interface MovieGridProps {
  movies: Movie[]
  watchedIds?: Set<number>
  onToggleWatched?: (movieId: number) => void
  scoresById?: Map<number, number>
}

export function MovieGrid({ movies, watchedIds, onToggleWatched, scoresById }: MovieGridProps) {
  if (movies.length === 0) {
    return <p className="py-16 text-center text-slate-500">No movies match your filters.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          watched={watchedIds?.has(movie.id)}
          onToggleWatched={onToggleWatched ? () => onToggleWatched(movie.id) : undefined}
          score={scoresById?.get(movie.id)}
        />
      ))}
    </div>
  )
}
