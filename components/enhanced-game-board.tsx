"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import type { GridCell, Word } from "@/types/game"
import { cn } from "@/lib/utils"
import { ParticleSystem } from "@/lib/particle-system"
import { soundManager } from "@/lib/sound-manager"

interface EnhancedGameBoardProps {
  grid: GridCell[][]
  setGrid: React.Dispatch<React.SetStateAction<GridCell[][]>>
  wordsToFind: Word[]
  onWordFound: (word: string, score: number, combo: number) => void
  combo: number
  onComboIncrease: () => void
  onComboReset: () => void
  isPaused: boolean
}

interface Connection {
  from: { row: number; col: number }
  to: { row: number; col: number }
}

export function EnhancedGameBoard({
  grid,
  setGrid,
  wordsToFind,
  onWordFound,
  combo,
  onComboIncrease,
  onComboReset,
  isPaused,
}: EnhancedGameBoardProps) {
  const [selectedCells, setSelectedCells] = useState<GridCell[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [foundWordAnimation, setFoundWordAnimation] = useState<string | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleSystemRef = useRef<ParticleSystem | null>(null)

  // Initialize particle system
  useEffect(() => {
    if (canvasRef.current && !particleSystemRef.current) {
      particleSystemRef.current = new ParticleSystem(canvasRef.current)
    }

    return () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.destroy()
      }
    }
  }, [])

  // Update canvas size
  useEffect(() => {
    if (canvasRef.current && gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect()
      canvasRef.current.width = rect.width
      canvasRef.current.height = rect.height
    }
  }, [grid])

  const clearSelection = useCallback(() => {
    setGrid((prevGrid) => prevGrid.map((row) => row.map((cell) => ({ ...cell, selected: false }))))
    setSelectedCells([])
    setConnections([])
  }, [setGrid])

  const updateConnections = useCallback((cells: GridCell[]) => {
    const newConnections: Connection[] = []
    for (let i = 0; i < cells.length - 1; i++) {
      newConnections.push({
        from: { row: cells[i].row, col: cells[i].col },
        to: { row: cells[i + 1].row, col: cells[i + 1].col },
      })
    }
    setConnections(newConnections)
  }, [])

  const calculateWordScore = useCallback((word: string, comboMultiplier: number) => {
    const baseScore = word.length * 10
    return Math.floor(baseScore * comboMultiplier)
  }, [])

  const isAdjacent = useCallback((cell1: GridCell, cell2: GridCell) => {
    const rowDiff = Math.abs(cell1.row - cell2.row)
    const colDiff = Math.abs(cell1.col - cell2.col)
    return rowDiff <= 1 && colDiff <= 1 && rowDiff + colDiff > 0
  }, [])

  const handleCellClick = useCallback(
    (cell: GridCell) => {
      if (isPaused) return

      // Check if cell is already selected
      const cellIndex = selectedCells.findIndex((sc) => sc.row === cell.row && sc.col === cell.col)

      if (cellIndex !== -1) {
        // If clicking the last selected cell, submit the word
        if (cellIndex === selectedCells.length - 1) {
          handleWordSubmit()
          return
        }
        // If clicking any other selected cell, clear selection
        clearSelection()
        return
      }

      // If no cells selected, start new selection
      if (selectedCells.length === 0) {
        const newSelectedCells = [cell]
        setSelectedCells(newSelectedCells)
        setGrid((prevGrid) =>
          prevGrid.map((row) =>
            row.map((c) => ({
              ...c,
              selected: c.row === cell.row && c.col === cell.col,
            })),
          ),
        )
        updateConnections(newSelectedCells)
        soundManager.play("tick", 0.3)
        return
      }

      // Check if cell is adjacent to the last selected cell
      const lastCell = selectedCells[selectedCells.length - 1]
      if (!isAdjacent(cell, lastCell)) {
        // If not adjacent, start new selection with this cell
        const newSelectedCells = [cell]
        setSelectedCells(newSelectedCells)
        setGrid((prevGrid) =>
          prevGrid.map((row) =>
            row.map((c) => ({
              ...c,
              selected: c.row === cell.row && c.col === cell.col,
            })),
          ),
        )
        updateConnections(newSelectedCells)
        soundManager.play("tick", 0.3)
        return
      }

      // Add cell to selection
      const newSelectedCells = [...selectedCells, cell]
      setSelectedCells(newSelectedCells)
      setGrid((prevGrid) =>
        prevGrid.map((row) =>
          row.map((c) => ({
            ...c,
            selected: newSelectedCells.some((sc) => sc.row === c.row && sc.col === c.col),
          })),
        ),
      )
      updateConnections(newSelectedCells)
      soundManager.play("tick", 0.2)
    },
    [selectedCells, setGrid, updateConnections, isPaused, isAdjacent, clearSelection],
  )

  const handleWordSubmit = useCallback(() => {
    if (selectedCells.length === 0) return

    const selectedWord = selectedCells.map((c) => c.char).join("")
    const foundWord = wordsToFind.find(
      (w) => !w.found && (w.word === selectedWord || w.word === selectedWord.split("").reverse().join("")),
    )

    if (foundWord) {
      const comboMultiplier = Math.max(1, combo * 0.5 + 1)
      const wordScore = calculateWordScore(foundWord.word, comboMultiplier)

      // Create particle explosion
      if (particleSystemRef.current && gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect()
        const cellSize = getCellSize()
        const centerCell = selectedCells[Math.floor(selectedCells.length / 2)]
        const x = centerCell.col * (cellSize + getCellGap()) + cellSize / 2
        const y = centerCell.row * (cellSize + getCellGap()) + cellSize / 2

        particleSystemRef.current.createWordFoundExplosion(x, y, foundWord.word, wordScore)

        if (combo > 0) {
          particleSystemRef.current.createComboExplosion(x, y, combo + 1)
        }
      }

      // Play sound effects
      soundManager.play("wordFound", 0.7)
      if (combo > 0) {
        soundManager.play("combo", 0.5)
      }

      // Trigger word found animation
      setFoundWordAnimation(foundWord.word)
      setTimeout(() => setFoundWordAnimation(null), 1000)

      onWordFound(foundWord.word, wordScore, combo + 1)
      onComboIncrease()

      // Mark cells as found with animation
      setGrid((prevGrid) =>
        prevGrid.map((row) =>
          row.map((cell) =>
            selectedCells.some((sc) => sc.row === cell.row && sc.col === cell.col)
              ? { ...cell, found: true, selected: false }
              : { ...cell, selected: false },
          ),
        ),
      )

      setSelectedCells([])
      setConnections([])
    } else {
      onComboReset()
      clearSelection()
    }
  }, [
    selectedCells,
    wordsToFind,
    onWordFound,
    combo,
    onComboIncrease,
    onComboReset,
    clearSelection,
    calculateWordScore,
    grid,
  ])

  // Auto-submit when clicking outside the grid
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(event.target as Node) && selectedCells.length > 0) {
        handleWordSubmit()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [selectedCells, handleWordSubmit])

  // Responsive cell size calculation
  const getCellSize = () => {
    if (typeof window === "undefined") return 50

    const screenWidth = window.innerWidth
    const gridCols = grid[0]?.length || 8

    // Mobile phones
    if (screenWidth < 640) {
      const availableWidth = screenWidth - 32
      const maxCellFromWidth = Math.floor((availableWidth - gridCols * 3) / gridCols)
      return Math.max(35, Math.min(50, maxCellFromWidth))
    }

    // Tablets
    if (screenWidth < 1024) {
      const availableWidth = screenWidth * 0.7
      const maxCellFromWidth = Math.floor((availableWidth - gridCols * 4) / gridCols)
      return Math.max(45, Math.min(60, maxCellFromWidth))
    }

    // Desktop
    const availableWidth = Math.min(600, screenWidth * 0.5)
    const maxCellFromWidth = Math.floor((availableWidth - gridCols * 6) / gridCols)
    return Math.max(50, Math.min(70, maxCellFromWidth))
  }

  const getCellGap = () => {
    if (typeof window === "undefined") return 4
    const screenWidth = window.innerWidth
    if (screenWidth < 640) return 3
    if (screenWidth < 1024) return 4
    return 5
  }

  const getFontSize = () => {
    if (typeof window === "undefined") return "text-xl"
    const screenWidth = window.innerWidth
    if (screenWidth < 640) return "text-lg"
    if (screenWidth < 1024) return "text-xl"
    return "text-2xl"
  }

  const getPadding = () => {
    if (typeof window === "undefined") return "p-4"
    const screenWidth = window.innerWidth
    if (screenWidth < 640) return "p-3"
    if (screenWidth < 1024) return "p-4"
    return "p-6"
  }

  if (!grid || grid.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl">
        <div className="text-center space-y-2">
          <div className="text-4xl animate-bounce">🎯</div>
          <p className="text-sm sm:text-base">Select theme and difficulty to start!</p>
        </div>
      </div>
    )
  }

  const cellSize = getCellSize()
  const cellGap = getCellGap()
  const fontSize = getFontSize()
  const padding = getPadding()

  return (
    <div className={cn("relative flex flex-col items-center justify-center w-full", padding)}>
      {/* Instructions */}
      <div className="mb-4 text-center">
        <p className="text-sm text-muted-foreground">
          🖱️ Click letters to select • Click last letter again to submit • Click anywhere to clear
        </p>
        {selectedCells.length > 0 && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {selectedCells.map((c) => c.char).join("")}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {selectedCells.length} letter{selectedCells.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        )}
      </div>

      {/* Combo Display */}
      {combo > 0 && (
        <div className="absolute -top-2 sm:-top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-sm sm:text-lg shadow-lg animate-pulse">
            🔥 {combo + 1}x COMBO!
          </div>
        </div>
      )}

      {/* Found Word Animation */}
      {foundWordAnimation && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="text-2xl sm:text-4xl font-bold text-green-500 animate-ping">✨ {foundWordAnimation} ✨</div>
        </div>
      )}

      <div className="relative w-full max-w-full overflow-visible flex justify-center">
        {/* Particle Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            width: grid[0].length * (cellSize + cellGap),
            height: grid.length * (cellSize + cellGap),
          }}
        />

        {/* SVG for connection lines */}
        <svg
          ref={svgRef}
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            width: grid[0].length * (cellSize + cellGap),
            height: grid.length * (cellSize + cellGap),
          }}
        >
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1.0" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {connections.map((connection, index) => {
            const fromX = connection.from.col * (cellSize + cellGap) + cellSize / 2 + cellGap / 2
            const fromY = connection.from.row * (cellSize + cellGap) + cellSize / 2 + cellGap / 2
            const toX = connection.to.col * (cellSize + cellGap) + cellSize / 2 + cellGap / 2
            const toY = connection.to.row * (cellSize + cellGap) + cellSize / 2 + cellGap / 2

            return (
              <line
                key={index}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="url(#connectionGradient)"
                strokeWidth={cellSize < 40 ? "3" : "5"}
                strokeLinecap="round"
                className="drop-shadow-lg"
              />
            )
          })}
        </svg>

        {/* CLICK-BASED GRID - No scroll issues! */}
        <div
          ref={gridRef}
          className={cn(
            "relative bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-950 rounded-lg sm:rounded-xl shadow-xl border border-blue-200 dark:border-blue-700 transition-all duration-200",
            isPaused && "opacity-50 grayscale",
            padding,
          )}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${grid[0].length}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${grid.length}, ${cellSize}px)`,
            gap: `${cellGap}px`,
            width: "fit-content",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
          }}
        >
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isSelected = selectedCells.some((sc) => sc.row === cell.row && sc.col === cell.col)
              const selectionIndex = selectedCells.findIndex((sc) => sc.row === cell.row && sc.col === cell.col)
              const isLastSelected = selectionIndex === selectedCells.length - 1 && selectedCells.length > 0

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={cn(
                    "flex items-center justify-center font-bold cursor-pointer select-none transition-all duration-150 rounded-md sm:rounded-lg shadow-sm border relative",
                    fontSize,
                    "hover:scale-110 hover:shadow-lg hover:z-10",
                    "active:scale-95",
                    cell.found
                      ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg scale-105 border-green-400"
                      : isSelected
                        ? isLastSelected
                          ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg scale-110 border-purple-400 ring-2 ring-purple-300"
                          : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-105 border-blue-400"
                        : "bg-gradient-to-br from-white to-slate-100 dark:from-slate-700 dark:to-slate-800 text-slate-800 dark:text-slate-100 hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900 dark:hover:to-blue-800 hover:border-blue-300 dark:hover:border-blue-600 border-slate-300 dark:border-slate-600",
                  )}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    minHeight: cellSize,
                    minWidth: cellSize,
                  }}
                  onClick={() => handleCellClick(cell)}
                >
                  {/* Selection order number */}
                  {isSelected && selectionIndex >= 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
                      {selectionIndex + 1}
                    </div>
                  )}

                  {/* Last selected indicator */}
                  {isLastSelected && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    </div>
                  )}

                  <span className="relative z-10 font-bold tracking-wide drop-shadow-sm leading-none pointer-events-none">
                    {cell.char}
                  </span>
                </div>
              )
            }),
          )}
        </div>
      </div>

      {/* Submit Button */}
      {selectedCells.length > 0 && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleWordSubmit}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            ✓ Submit Word
          </button>
          <button
            onClick={clearSelection}
            className="px-4 py-2 bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            ✕ Clear
          </button>
        </div>
      )}
    </div>
  )
}
