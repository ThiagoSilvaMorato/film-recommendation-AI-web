import type { Movie } from '../../types/movie'
import type { RecommendationResult } from '../../types/workerMessages'
import { MovieGrid } from '../catalog/MovieGrid'

interface RecommendationListProps {
  recommendations: RecommendationResult[]
  moviesById: Map<number, Movie>
}

export function RecommendationList({ recommendations, moviesById }: RecommendationListProps) {
  const movies = recommendations.map((r) => moviesById.get(r.movieId)).filter((m): m is Movie => m !== undefined)
  const scoresById = new Map(recommendations.map((r) => [r.movieId, r.score]))

  return <MovieGrid movies={movies} scoresById={scoresById} />
}
