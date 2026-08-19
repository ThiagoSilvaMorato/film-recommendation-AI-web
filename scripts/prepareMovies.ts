/**
 * One-time preprocessing script: downloads the public meilisearch movies
 * dataset, filters + deterministically samples it down to a small local
 * catalog, and writes public/data/movies.json + public/data/catalogMeta.json.
 *
 * The app never fetches the raw dataset at runtime — only these two
 * generated files. Re-run this script (with different flags) any time you
 * want to regenerate the sample; see README for usage.
 *
 * Usage:
 *   npx tsx scripts/prepareMovies.ts [--seed 42] [--size 500] [--minYear 1950] [--refresh]
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'
import { mulberry32, seededShuffle } from './lib/seededRandom'
import type { Movie } from '../src/types/movie'
import type { CatalogMeta } from '../src/types/catalogMeta'

const RAW_DATASET_URL =
  'https://raw.githubusercontent.com/meilisearch/datasets/main/datasets/movies/movies.json'

interface RawMovie {
  id: number
  title?: string
  overview?: string
  genres?: string[]
  poster?: string | null
  release_date?: number
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cachePath = path.join(rootDir, 'scripts', '.cache', 'movies-raw.json')
const outMoviesPath = path.join(rootDir, 'public', 'data', 'movies.json')
const outMetaPath = path.join(rootDir, 'public', 'data', 'catalogMeta.json')

async function loadRawMovies(refresh: boolean): Promise<RawMovie[]> {
  if (!refresh && existsSync(cachePath)) {
    console.log(`Using cached raw dataset at ${path.relative(rootDir, cachePath)}`)
    return JSON.parse(await readFile(cachePath, 'utf-8'))
  }

  console.log(`Fetching raw dataset from ${RAW_DATASET_URL} ...`)
  const response = await fetch(RAW_DATASET_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`)
  }
  const raw = (await response.json()) as RawMovie[]

  await mkdir(path.dirname(cachePath), { recursive: true })
  await writeFile(cachePath, JSON.stringify(raw))
  console.log(`Cached ${raw.length} raw entries at ${path.relative(rootDir, cachePath)}`)
  return raw
}

function yearOf(unixSeconds: number): number {
  return new Date(unixSeconds * 1000).getUTCFullYear()
}

function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10
}

async function main() {
  const { values } = parseArgs({
    options: {
      seed: { type: 'string', default: '42' },
      size: { type: 'string', default: '500' },
      minYear: { type: 'string', default: '1950' },
      refresh: { type: 'boolean', default: false },
    },
  })

  const seed = Number(values.seed)
  const requestedSize = Number(values.size)
  const size = Math.min(1000, Math.max(200, requestedSize))
  const minYear = Number(values.minYear)

  if (size !== requestedSize) {
    console.warn(`--size clamped from ${requestedSize} to ${size} (allowed range: 200-1000)`)
  }

  const raw = await loadRawMovies(values.refresh)
  console.log(`Loaded ${raw.length} raw movies`)

  const filtered = raw.filter((m): m is Required<RawMovie> => {
    if (!m.title || !m.title.trim()) return false
    if (!m.overview || !m.overview.trim()) return false
    if (!m.genres || m.genres.length === 0) return false
    if (typeof m.release_date !== 'number') return false
    const year = yearOf(m.release_date)
    if (year < minYear || year > new Date().getUTCFullYear()) return false
    return true
  })
  console.log(`${filtered.length} movies passed filters (title, overview, genres, releaseYear >= ${minYear})`)

  if (filtered.length < size) {
    throw new Error(
      `Only ${filtered.length} movies passed filters, cannot sample ${size}. Lower --size or --minYear.`
    )
  }

  const random = mulberry32(seed)
  const sampled = seededShuffle(filtered, random).slice(0, size)

  const movies: Movie[] = sampled
    .map((m) => {
      const releaseYear = yearOf(m.release_date)
      return {
        id: m.id,
        title: m.title.trim(),
        overview: m.overview.trim(),
        genres: [...m.genres].sort(),
        poster: m.poster ?? null,
        releaseYear,
        decade: decadeOf(releaseYear),
      }
    })
    .sort((a, b) => a.id - b.id)

  const genreVocabulary = [...new Set(movies.flatMap((m) => m.genres))].sort()
  const decadeBuckets = [...new Set(movies.map((m) => m.decade))].sort((a, b) => a - b)
  const releaseYears = movies.map((m) => m.releaseYear)

  const meta: CatalogMeta = {
    genreVocabulary,
    decadeBuckets,
    releaseYearMin: Math.min(...releaseYears),
    releaseYearMax: Math.max(...releaseYears),
    seed,
    sampleSize: movies.length,
    generatedAt: new Date().toISOString(),
  }

  await mkdir(path.dirname(outMoviesPath), { recursive: true })
  await writeFile(outMoviesPath, JSON.stringify(movies, null, 2))
  await writeFile(outMetaPath, JSON.stringify(meta, null, 2))

  console.log(`\nWrote ${movies.length} movies to ${path.relative(rootDir, outMoviesPath)}`)
  console.log(`Wrote catalog meta to ${path.relative(rootDir, outMetaPath)}`)
  console.log(`\nGenres (${genreVocabulary.length}): ${genreVocabulary.join(', ')}`)
  console.log(`Decades (${decadeBuckets.length}): ${decadeBuckets.join(', ')}`)
  console.log(`Release year range: ${meta.releaseYearMin}-${meta.releaseYearMax}`)
  console.log(`\nSample titles: ${movies.slice(0, 5).map((m) => m.title).join(' | ')}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
