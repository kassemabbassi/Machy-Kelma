import type { GridCell } from "@/types/game"

// Helper to generate an empty grid
export function generateGrid(rows: number, cols: number): GridCell[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      char: "",
      row: r,
      col: c,
      selected: false,
      found: false,
    })),
  )
}

// Helper to place words in the grid
export function placeWordsInGrid(grid: GridCell[][], words: string[]): string[] {
  const rows = grid.length
  const cols = grid[0].length
  const placedWords: string[] = []

  const directions = [
    { dr: 0, dc: 1 }, // Horizontal
    { dr: 1, dc: 0 }, // Vertical
    { dr: 1, dc: 1 }, // Diagonal (down-right)
    { dr: 1, dc: -1 }, // Diagonal (down-left)
    { dr: 0, dc: -1 }, // Horizontal (reverse)
    { dr: -1, dc: 0 }, // Vertical (reverse)
    { dr: -1, dc: -1 }, // Diagonal (up-left)
    { dr: -1, dc: 1 }, // Diagonal (up-right)
  ]

  // Sort words by length descending to place longer words first
  const sortedWords = [...words].sort((a, b) => b.length - a.length)

  for (const word of sortedWords) {
    let placed = false
    const maxAttempts = 100 // Prevent infinite loops
    let attempts = 0

    while (!placed && attempts < maxAttempts) {
      attempts++

      const startRow = Math.floor(Math.random() * rows)
      const startCol = Math.floor(Math.random() * cols)
      const dir = directions[Math.floor(Math.random() * directions.length)]

      let canPlace = true
      const cellsToOccupy: { r: number; c: number }[] = []

      for (let i = 0; i < word.length; i++) {
        const r = startRow + i * dir.dr
        const c = startCol + i * dir.dc

        if (r < 0 || r >= rows || c < 0 || c >= cols) {
          canPlace = false
          break
        }
        // Check if cell is empty or matches the letter
        if (grid[r][c].char !== "" && grid[r][c].char !== word[i]) {
          canPlace = false
          break
        }
        cellsToOccupy.push({ r, c })
      }

      if (canPlace) {
        for (let i = 0; i < word.length; i++) {
          const { r, c } = cellsToOccupy[i]
          grid[r][c].char = word[i]
        }
        placedWords.push(word)
        placed = true
      }
    }
  }
  return placedWords
}

// This function is not strictly needed if selection logic is in GameBoard,
// but useful for conceptual understanding or if validation moves here.
export function checkWordInGrid(selectedCells: GridCell[], wordsToFind: string[]): string | null {
  if (selectedCells.length === 0) return null

  const selectedWord = selectedCells.map((c) => c.char).join("")
  const reversedSelectedWord = selectedCells
    .map((c) => c.char)
    .reverse()
    .join("")

  for (const word of wordsToFind) {
    if (word === selectedWord || word === reversedSelectedWord) {
      return word
    }
  }
  return null
}
