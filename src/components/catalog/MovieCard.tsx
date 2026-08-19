import type { Movie } from "../../types/movie";

interface MovieCardProps {
  movie: Movie;
  watched?: boolean;
  onToggleWatched?: () => void;
  score?: number;
}

export function MovieCard({ movie, watched, onToggleWatched, score }: MovieCardProps) {
  return (
    <div className='group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-colors hover:border-slate-700'>
      <div className='relative aspect-2/3 w-full overflow-hidden bg-slate-800'>
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            loading='lazy'
            className='h-full w-full object-cover transition-transform group-hover:scale-105'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-center text-xs text-slate-500 p-2'>
            No poster available
          </div>
        )}
        {score !== undefined && (
          <div className='absolute right-2 top-2 rounded-full bg-indigo-500/90 px-2 py-0.5 text-xs font-semibold text-white'>
            {Math.round(score * 100)}% match
          </div>
        )}
      </div>
      <div className='flex flex-1 flex-col gap-2 p-3'>
        <h3 className='line-clamp-2 text-sm font-semibold text-slate-100'>{movie.title}</h3>
        <p className='text-xs text-slate-500'>{movie.releaseYear}</p>
        <div className='flex flex-wrap gap-1'>
          {movie.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className='rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300'
            >
              {genre}
            </span>
          ))}
        </div>
        {onToggleWatched && (
          <button
            onClick={onToggleWatched}
            className={`mt-auto rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              watched
                ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {watched ? "✓ Watched" : "Mark as watched"}
          </button>
        )}
      </div>
    </div>
  );
}
