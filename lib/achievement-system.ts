"use client"

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: (stats: GameStats) => boolean
  unlocked: boolean
  unlockedAt?: Date
}

export interface GameStats {
  totalGamesPlayed: number
  totalWordsFound: number
  totalScore: number
  bestScore: number
  perfectGames: number
  currentStreak: number
  bestStreak: number
  fastestGame: number
  comboRecord: number
  difficultiesCompleted: Set<string>
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_word",
    name: "First Discovery",
    description: "Find your first word",
    icon: "🎯",
    condition: (stats) => stats.totalWordsFound >= 1,
    unlocked: false,
  },
  {
    id: "perfect_game",
    name: "Perfectionist",
    description: "Complete a game with 100% words found",
    icon: "💎",
    condition: (stats) => stats.perfectGames >= 1,
    unlocked: false,
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete a game in under 2 minutes",
    icon: "⚡",
    condition: (stats) => stats.fastestGame > 0 && stats.fastestGame < 120000,
    unlocked: false,
  },
  {
    id: "combo_master",
    name: "Combo Master",
    description: "Achieve a 5x combo multiplier",
    icon: "🔥",
    condition: (stats) => stats.comboRecord >= 5,
    unlocked: false,
  },
  {
    id: "high_scorer",
    name: "High Scorer",
    description: "Score over 1000 points in a single game",
    icon: "🏆",
    condition: (stats) => stats.bestScore >= 1000,
    unlocked: false,
  },
  {
    id: "word_hunter",
    name: "Word Hunter",
    description: "Find 100 words total",
    icon: "🎪",
    condition: (stats) => stats.totalWordsFound >= 100,
    unlocked: false,
  },
  {
    id: "streak_master",
    name: "Streak Master",
    description: "Win 5 games in a row",
    icon: "🌟",
    condition: (stats) => stats.bestStreak >= 5,
    unlocked: false,
  },
  {
    id: "difficulty_conqueror",
    name: "Difficulty Conqueror",
    description: "Complete games on all difficulty levels",
    icon: "👑",
    condition: (stats) => stats.difficultiesCompleted.size >= 3,
    unlocked: false,
  },
]

export class AchievementSystem {
  private static readonly STORAGE_KEY = "machy-kelma-achievements"
  private static readonly STATS_KEY = "machy-kelma-stats"

  static getAchievements(): Achievement[] {
    if (typeof window === "undefined") return ACHIEVEMENTS

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const storedAchievements = JSON.parse(stored)
        return ACHIEVEMENTS.map((achievement) => {
          const stored = storedAchievements.find((a: Achievement) => a.id === achievement.id)
          return stored ? { ...achievement, ...stored } : achievement
        })
      }
    } catch (error) {
      console.warn("Failed to load achievements:", error)
    }

    return ACHIEVEMENTS
  }

  static getStats(): GameStats {
    if (typeof window === "undefined") {
      return {
        totalGamesPlayed: 0,
        totalWordsFound: 0,
        totalScore: 0,
        bestScore: 0,
        perfectGames: 0,
        currentStreak: 0,
        bestStreak: 0,
        fastestGame: 0,
        comboRecord: 0,
        difficultiesCompleted: new Set(),
      }
    }

    try {
      const stored = localStorage.getItem(this.STATS_KEY)
      if (stored) {
        const stats = JSON.parse(stored)
        return {
          ...stats,
          difficultiesCompleted: new Set(stats.difficultiesCompleted || []),
        }
      }
    } catch (error) {
      console.warn("Failed to load stats:", error)
    }

    return {
      totalGamesPlayed: 0,
      totalWordsFound: 0,
      totalScore: 0,
      bestScore: 0,
      perfectGames: 0,
      currentStreak: 0,
      bestStreak: 0,
      fastestGame: 0,
      comboRecord: 0,
      difficultiesCompleted: new Set(),
    }
  }

  static updateStats(gameResult: {
    wordsFound: number
    totalWords: number
    score: number
    timeUsed: number
    difficulty: string
    isVictory: boolean
    maxCombo: number
  }): Achievement[] {
    const stats = this.getStats()

    // Update stats
    stats.totalGamesPlayed++
    stats.totalWordsFound += gameResult.wordsFound
    stats.totalScore += gameResult.score
    stats.bestScore = Math.max(stats.bestScore, gameResult.score)
    stats.comboRecord = Math.max(stats.comboRecord, gameResult.maxCombo)
    stats.difficultiesCompleted.add(gameResult.difficulty)

    if (gameResult.wordsFound === gameResult.totalWords) {
      stats.perfectGames++
    }

    if (gameResult.isVictory) {
      stats.currentStreak++
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak)
    } else {
      stats.currentStreak = 0
    }

    if (stats.fastestGame === 0 || gameResult.timeUsed < stats.fastestGame) {
      stats.fastestGame = gameResult.timeUsed
    }

    // Save stats
    try {
      localStorage.setItem(
        this.STATS_KEY,
        JSON.stringify({
          ...stats,
          difficultiesCompleted: Array.from(stats.difficultiesCompleted),
        }),
      )
    } catch (error) {
      console.warn("Failed to save stats:", error)
    }

    // Check achievements
    const achievements = this.getAchievements()
    const newlyUnlocked: Achievement[] = []

    achievements.forEach((achievement) => {
      if (!achievement.unlocked && achievement.condition(stats)) {
        achievement.unlocked = true
        achievement.unlockedAt = new Date()
        newlyUnlocked.push(achievement)
      }
    })

    // Save achievements
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(achievements))
    } catch (error) {
      console.warn("Failed to save achievements:", error)
    }

    return newlyUnlocked
  }
}
