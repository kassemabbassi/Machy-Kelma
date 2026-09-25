import type { ScoreEntry, User } from "@/types/game"

const USERS_KEY = "wordoria-users"
const SCORES_KEY = "wordoria-scores"
const CURRENT_USER_KEY = "wordoria-current-user"

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value))
}

export function getOrCreateUser(username: string): User {
  const users = read<User[]>(USERS_KEY, [])
  const normalized = username.trim().toLocaleLowerCase()
  const existing = users.find((user) => user.username.toLocaleLowerCase() === normalized)
  if (existing) return existing

  const user = { id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, username: username.trim() }
  write(USERS_KEY, [...users, user])
  return user
}

export function saveCurrentUser(user: User | null) {
  if (typeof window === "undefined") return
  if (user) write(CURRENT_USER_KEY, user)
  else window.localStorage.removeItem(CURRENT_USER_KEY)
}

export function getCurrentUser(): User | null {
  return read<User | null>(CURRENT_USER_KEY, null)
}

export function saveBestScore(user: User, score: number, difficulty: string) {
  const scores = read<ScoreEntry[]>(SCORES_KEY, [])
  const existing = scores.find((entry) => entry.id === `${user.id}-${difficulty}`)
  if (existing && existing.score >= score) return

  const entry: ScoreEntry = {
    id: `${user.id}-${difficulty}`,
    username: user.username,
    score,
    difficulty,
    created_at: new Date().toISOString(),
  }
  write(SCORES_KEY, [...scores.filter((item) => item.id !== entry.id), entry])
}

export function getLeaderboard(difficulty: string): ScoreEntry[] {
  return read<ScoreEntry[]>(SCORES_KEY, [])
    .filter((entry) => entry.difficulty === difficulty)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}
