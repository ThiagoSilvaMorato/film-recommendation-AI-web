import { useMemo, useState } from 'react'
import { useAppContext } from '../context/useAppContext'
import { filterMovies, type CatalogFilters as Filters } from '../services/movieService'
import { CatalogFilters } from '../components/catalog/CatalogFilters'
import { MovieGrid } from '../components/catalog/MovieGrid'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ErrorBanner } from '../components/common/ErrorBanner'

export function CatalogPage() {
  const { movies, catalogMeta, catalogStatus, catalogError, currentUser, toggleMovieWatched } = useAppContext()
  const [filters, setFilters] = useState<Filters>({})

  const filtered = useMemo(() => filterMovies(movies, filters), [movies, filters])
  const watchedIds = useMemo(() => new Set(currentUser?.watchedMovieIds ?? []), [currentUser])

  if (catalogStatus === 'loading') return <LoadingSpinner label="Loading movie catalog..." />
  if (catalogStatus === 'error') return <ErrorBanner message={catalogError ?? 'Failed to load catalog'} />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Catalog</h1>
        <p className="text-sm text-slate-400">
          {movies.length} movies · mark titles as watched to shape your recommendations
        </p>
      </div>
      <CatalogFilters
        filters={filters}
        onChange={setFilters}
        genres={catalogMeta?.genreVocabulary ?? []}
        decades={catalogMeta?.decadeBuckets ?? []}
      />
      <MovieGrid
        movies={filtered}
        watchedIds={watchedIds}
        onToggleWatched={currentUser ? toggleMovieWatched : undefined}
      />
    </div>
  )
}
