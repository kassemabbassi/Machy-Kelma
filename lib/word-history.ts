"use client"

const WORD_HISTORY_KEY = "machy-kelma-word-history"
const MAX_HISTORY_SIZE = 100 // Keep last 100 words to prevent repetition

export interface WordHistoryEntry {
  word: string
  theme: string
  timestamp: number
}

export class WordHistoryManager {
  private static getHistory(): WordHistoryEntry[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(WORD_HISTORY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private static saveHistory(history: WordHistoryEntry[]): void {
    if (typeof window === "undefined") return

    try {
      // Keep only the most recent entries
      const trimmedHistory = history.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_HISTORY_SIZE)

      localStorage.setItem(WORD_HISTORY_KEY, JSON.stringify(trimmedHistory))
    } catch (error) {
      console.warn("Failed to save word history:", error)
    }
  }

  static addWords(words: string[], theme: string): void {
    const history = this.getHistory()
    const timestamp = Date.now()

    const newEntries: WordHistoryEntry[] = words.map((word) => ({
      word: word.toUpperCase(),
      theme,
      timestamp,
    }))

    this.saveHistory([...history, ...newEntries])
  }

  static getRecentWords(theme: string, limit = 50): string[] {
    const history = this.getHistory()
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days

    return history
      .filter((entry) => entry.theme === theme && entry.timestamp > cutoffTime)
      .map((entry) => entry.word)
      .slice(0, limit)
  }

  static clearHistory(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(WORD_HISTORY_KEY)
  }
}
