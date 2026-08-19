import { describe, expect, it } from 'vitest'
import { computeAvgViewerAge } from '../../src/ml/avgViewerAge'
import type { User } from '../../src/types/user'

function user(overrides: Partial<User>): User {
  return {
    id: crypto.randomUUID(),
    name: 'Test',
    age: 30,
    watchedMovieIds: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('computeAvgViewerAge', () => {
  it('averages ages of users who watched a movie', () => {
    const users = [user({ age: 20, watchedMovieIds: [1] }), user({ age: 40, watchedMovieIds: [1] })]
    const { byMovieId } = computeAvgViewerAge(users)
    expect(byMovieId.get(1)).toBe(30)
  })

  it('falls back to the mean age across all users for unwatched movies', () => {
    const users = [user({ age: 20, watchedMovieIds: [1] }), user({ age: 40, watchedMovieIds: [] })]
    const { byMovieId, fallback } = computeAvgViewerAge(users)
    expect(byMovieId.has(2)).toBe(false)
    expect(fallback).toBe(30)
  })

  it('keeps per-movie averages independent', () => {
    const users = [
      user({ age: 10, watchedMovieIds: [1] }),
      user({ age: 50, watchedMovieIds: [2] }),
    ]
    const { byMovieId } = computeAvgViewerAge(users)
    expect(byMovieId.get(1)).toBe(10)
    expect(byMovieId.get(2)).toBe(50)
  })
})
