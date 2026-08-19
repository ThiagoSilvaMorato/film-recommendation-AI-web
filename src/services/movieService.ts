import type { Movie } from '../types/movie'
import type { CatalogMeta } from '../types/catalogMeta'

export interface Catalog {
  movies: Movie[]
  meta: CatalogMeta
}

export async function loadCatalog(): Promise<Catalog> {
  const [moviesRes, metaRes] = await Promise.all([
    fetch('/data/movies.json'),
    fetch('/data/catalogMeta.json'),
  ])

  if (!moviesRes.ok || !metaRes.ok) {
    throw new Error('Failed to load movie catalog data')
  }

  const [movies, meta]: [Movie[], CatalogMeta] = await Promise.all([moviesRes.json(), metaRes.json()])
  return { movies, meta }
}

export interface CatalogFilters {
  query?: string
  genre?: string
  decade?: number
}

export function filterMovies(movies: Movie[], filters: CatalogFilters): Movie[] {
  const query = filters.query?.trim().toLowerCase()
  return movies.filter((movie) => {
    if (query && !movie.title.toLowerCase().includes(query)) return false
    if (filters.genre && !movie.genres.includes(filters.genre)) return false
    if (filters.decade !== undefined && movie.decade !== filters.decade) return false
    return true
  })
}
