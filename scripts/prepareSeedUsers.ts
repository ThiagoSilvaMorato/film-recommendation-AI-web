// Run after prepareMovies.ts. npx tsx scripts/prepareSeedUsers.ts [--seed 7]
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'
import { mulberry32, seededShuffle } from './lib/seededRandom'
import type { Movie } from '../src/types/movie'
import type { User } from '../src/types/user'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const moviesPath = path.join(rootDir, 'public', 'data', 'movies.json')
const outPath = path.join(rootDir, 'data', 'seedUsers.json')

interface Persona {
  name: string
  age: number
  primaryGenres: string[]
  watchCount: number
  noiseRatio: number
}

const PERSONAS: Persona[] = [
  { name: 'Horror Hank', age: 24, primaryGenres: ['Horror', 'Thriller'], watchCount: 26, noiseRatio: 0.15 },
  { name: 'Rom-Com Rita', age: 31, primaryGenres: ['Romance', 'Comedy'], watchCount: 18, noiseRatio: 0.1 },
  { name: 'Grandpa Joe', age: 68, primaryGenres: ['Drama', 'War'], watchCount: 9, noiseRatio: 0.1 },
  { name: 'Teen Tara', age: 16, primaryGenres: ['Animation', 'Family'], watchCount: 14, noiseRatio: 0.2 },
  { name: 'Sci-Fi Sam', age: 29, primaryGenres: ['Science Fiction', 'Adventure'], watchCount: 22, noiseRatio: 0.15 },
  { name: 'Mystery Mia', age: 41, primaryGenres: ['Mystery', 'Crime'], watchCount: 16, noiseRatio: 0.1 },
  { name: 'Action Alex', age: 22, primaryGenres: ['Action', 'Adventure'], watchCount: 30, noiseRatio: 0.2 },
  { name: 'Doc Dana', age: 55, primaryGenres: ['Documentary', 'History'], watchCount: 7, noiseRatio: 0.05 },
  { name: 'Fantasy Finn', age: 19, primaryGenres: ['Fantasy', 'Animation'], watchCount: 20, noiseRatio: 0.15 },
  { name: 'Classic Carla', age: 63, primaryGenres: ['Drama', 'Romance'], watchCount: 12, noiseRatio: 0.1 },
  { name: 'Western Walt', age: 71, primaryGenres: ['Western', 'War'], watchCount: 6, noiseRatio: 0.1 },
  { name: 'Music Mona', age: 34, primaryGenres: ['Music', 'Comedy'], watchCount: 11, noiseRatio: 0.15 },
]

async function main() {
  const { values } = parseArgs({ options: { seed: { type: 'string', default: '7' } } })
  const seed = Number(values.seed)
  const random = mulberry32(seed)

  const movies: Movie[] = JSON.parse(await readFile(moviesPath, 'utf-8'))

  const users: User[] = PERSONAS.map((persona) => {
    const primaryPool = movies.filter((m) => m.genres.some((g) => persona.primaryGenres.includes(g)))
    const restPool = movies.filter((m) => !primaryPool.includes(m))

    const primaryCount = Math.round(persona.watchCount * (1 - persona.noiseRatio))
    const noiseCount = persona.watchCount - primaryCount

    const watched = [
      ...seededShuffle(primaryPool, random).slice(0, primaryCount),
      ...seededShuffle(restPool, random).slice(0, noiseCount),
    ]

    return {
      id: crypto.randomUUID(),
      name: persona.name,
      age: persona.age,
      watchedMovieIds: watched.map((m) => m.id).sort((a, b) => a - b),
      createdAt: new Date().toISOString(),
      isSeedUser: true,
    }
  })

  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(users, null, 2))

  console.log(`Wrote ${users.length} seed users to ${path.relative(rootDir, outPath)}`)
  for (const [i, persona] of PERSONAS.entries()) {
    console.log(`  ${persona.name} (age ${persona.age}): ${users[i].watchedMovieIds.length} movies watched`)
  }

  const overlapCounts = new Map<number, number>()
  for (const user of users) {
    for (const id of user.watchedMovieIds) {
      overlapCounts.set(id, (overlapCounts.get(id) ?? 0) + 1)
    }
  }
  const sharedMovies = [...overlapCounts.values()].filter((count) => count > 1).length
  console.log(`\n${sharedMovies} movies are watched by more than one seed user`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
