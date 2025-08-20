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
  const [isDragging, setIsDragging] = useState(false)
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

  // MOBILE FIX: Only prevent scrolling DURING word selection
  useEffect(() => {
    const preventScrollDuringSelection = (e: TouchEvent) => {
      // Only prevent scrolling when actively selecting words
      if (isDragging) {
        e.preventDefault()
      }
    }

    if (isDragging) {
      // Prevent scrolling only when dragging
      document.addEventListener("touchmove", preventScrollDuringSelection, { passive: false })
      document.addEventListener("touchstart", preventScrollDuringSelection, { passive: false })
    }

    return () => {
      document.removeEventListener("touchmove", preventScrollDuringSelection)
      document.removeEventListener("touchstart", preventScrollDuringSelection)
    }
  }, [isDragging])

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

  const handleMouseDown = useCallback(
    (cell: GridCell) => {
      if (isPaused) return

      setIsDragging(true)
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
    },
    [setGrid, updateConnections, isPaused],
  )

  // IMPROVED TOUCH SUPPORT - Prevent scrolling only during selection
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, cell: GridCell) => {
      // Don't prevent default here - let normal scrolling work
      // Only prevent when we start dragging
      handleMouseDown(cell)
    },
    [handleMouseDown],
  )

  const handleMouseEnter = useCallback(
    (cell: GridCell) => {
      if (!isDragging || isPaused) return

      const lastCell = selectedCells[selectedCells.length - 1]
      if (lastCell) {
        const rowDiff = Math.abs(cell.row - lastCell.row)
        const colDiff = Math.abs(cell.col - lastCell.col)

        if (rowDiff <= 1 && colDiff <= 1 && rowDiff + colDiff > 0) {
          if (!selectedCells.some((sc) => sc.row === cell.row && sc.col === cell.col)) {
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
          }
        }
      }
    },
    [isDragging, selectedCells, setGrid, updateConnections, isPaused],
  )

  // IMPROVED TOUCH MOVE - Only prevent scrolling during active selection
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return

      // Prevent scrolling only when actively selecting
      e.preventDefault()
      e.stopPropagation()

      const touch = e.touches[0]
      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      const cellElement = element?.closest("[data-cell]") as HTMLElement

      if (cellElement) {
        const row = Number.parseInt(cellElement.dataset.row || "0")
        const col = Number.parseInt(cellElement.dataset.col || "0")
        const cell = grid[row]?.[col]
        if (cell) {
          handleMouseEnter(cell)
        }
      }
    },
    [isDragging, grid, handleMouseEnter],
  )

  const handleMouseUp = useCallback(() => {
    if (isPaused) return

    setIsDragging(false)
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
    isPaused,
  ])

  // IMPROVED TOUCH END - Allow normal scrolling to resume
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Don't prevent default here - allow normal scrolling to resume
      handleMouseUp()
    },
    [handleMouseUp],
  )

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp()
      }
    }
    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (isDragging) {
        // Only prevent default during active selection
        e.preventDefault()
        handleMouseUp()
      }
    }

    window.addEventListener("mouseup", handleGlobalMouseUp)
    window.addEventListener("touchend", handleGlobalTouchEnd, { passive: false })

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
      window.removeEventListener("touchend", handleGlobalTouchEnd)
    }
  }, [isDragging, handleMouseUp])

  // Responsive cell size calculation - OPTIMIZED FOR MOBILE SCROLLING
  const getCellSize = () => {
    if (typeof window === "undefined") return 50

    const screenWidth = window.innerWidth
    const gridCols = grid[0]?.length || 8
    const gridRows = grid.length || 8

    // Mobile phones - Allow larger grids that can be scrolled
    if (screenWidth < 640) {
      // Don't constrain by screen height - allow scrolling
      const availableWidth = screenWidth - 32 // padding
      const maxCellFromWidth = Math.floor((availableWidth - gridCols * 3) / gridCols)
      return Math.max(35, Math.min(50, maxCellFromWidth)) // Good size for mobile tapping
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
    if (screenWidth < 640) return 3 // Good spacing for mobile
    if (screenWidth < 1024) return 4
    return 5
  }

  const getFontSize = () => {
    if (typeof window === "undefined") return "text-xl"
    const screenWidth = window.innerWidth
    if (screenWidth < 640) return "text-lg" // Good readability on mobile
    if (screenWidth < 1024) return "text-xl"
    return "text-2xl"
  }

  const getPadding = () => {
    if (typeof window === "undefined") return "p-4"
    const screenWidth = window.innerWidth
    if (screenWidth < 640) return "p-3" // Some padding but not too much
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
    <div className={cn("relative flex items-center justify-center w-full", padding)}>
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

        {/* SCROLLABLE GRID - Normal scrolling allowed, selection prevents scrolling */}
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
            // Remove touchAction: "none" to allow normal scrolling
            userSelect: "none", // Prevents text selection
            WebkitUserSelect: "none", // Safari support
            WebkitTouchCallout: "none", // Prevents callout on iOS
          }}
          onMouseLeave={() => isDragging && handleMouseUp()}
          onTouchMove={handleTouchMove}
        >
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                data-cell="true"
                data-row={rIdx}
                data-col={cIdx}
                className={cn(
                  "flex items-center justify-center font-bold cursor-pointer select-none transition-all duration-150 rounded-md sm:rounded-lg shadow-sm border border-slate-300 dark:border-slate-600",
                  fontSize,
                  "active:scale-95", // Better mobile feedback
                  "hover:scale-105 hover:shadow-md hover:z-10",
                  cell.found
                    ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg scale-105 border-green-400"
                    : cell.selected
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-105 border-blue-400"
                      : "bg-gradient-to-br from-white to-slate-100 dark:from-slate-700 dark:to-slate-800 text-slate-800 dark:text-slate-100 hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900 dark:hover:to-blue-800 hover:border-blue-300 dark:hover:border-blue-600",
                )}
                style={{
                  width: cellSize,
                  height: cellSize,
                  minHeight: cellSize,
                  minWidth: cellSize,
                  // Remove touchAction: "none" to allow scrolling when not selecting
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
                }}
                onMouseDown={() => handleMouseDown(cell)}
                onMouseEnter={() => handleMouseEnter(cell)}
                onTouchStart={(e) => handleTouchStart(e, cell)}
                onTouchEnd={handleTouchEnd}
              >
                <span className="relative z-10 font-bold tracking-wide drop-shadow-sm leading-none pointer-events-none">
                  {cell.char}
                </span>
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  )
}
