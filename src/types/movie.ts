export interface Movie {
  id: number
  title: string
  overview: string
  genres: string[]
  poster: string | null
  releaseYear: number
  decade: number
}
