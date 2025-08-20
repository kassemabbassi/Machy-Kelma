export interface Word {
  word: string
  definition: string
  found: boolean
}

export type Difficulty = "easy" | "medium" | "hard"

export interface GameConfig {
  theme: string
  difficulty: Difficulty
}

export interface GridCell {
  char: string
  row: number
  col: number
  selected: boolean
  found: boolean
}

export interface User {
  id: string
  username: string
}

export interface ScoreEntry {
  id: string
  username: string
  score: number
  created_at: string
  difficulty?: string
}

export type GameUser = User

export const THEMES = [
  { id: "technology", name: "Technology", icon: "💻", description: "Digital world and innovation" },
  { id: "health", name: "Health", icon: "🏥", description: "Medical and wellness terms" },
  { id: "education", name: "Education", icon: "📚", description: "Learning and academic concepts" },
  { id: "science", name: "Science", icon: "🔬", description: "Scientific discoveries and terms" },
  { id: "business", name: "Business", icon: "💼", description: "Commerce and entrepreneurship" },
  { id: "environment", name: "Environment", icon: "🌱", description: "Nature and sustainability" },
]

export const DIFFICULTIES = [
  {
    id: "easy",
    name: "Beginner",
    icon: "🌟",
    description: "Simple words, relaxed pace",
    scoreMultiplier: 1,
    gridSize: { rows: 8, cols: 8 },
    wordCount: 6,
    timeLimit: 300000, // 5 minutes
  },
  {
    id: "medium",
    name: "Intermediate",
    icon: "⚡",
    description: "Moderate challenge, steady pace",
    scoreMultiplier: 1.5,
    gridSize: { rows: 10, cols: 10 },
    wordCount: 9,
    timeLimit: 480000, // 8 minutes
  },
  {
    id: "hard",
    name: "Expert",
    icon: "🔥",
    description: "Complex words, time pressure",
    scoreMultiplier: 2,
    gridSize: { rows: 12, cols: 12 },
    wordCount: 12,
    timeLimit: 600000, // 10 minutes
  },
]

export interface GameStats {
  wordsFound: number
  totalWords: number
  timeUsed: number
  timeLimit: number
  score: number
  foundWordsList: string[]
  missedWordsList: Word[]
}
