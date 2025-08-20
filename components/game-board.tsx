"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import type { GridCell, Word } from "@/types/game"
import { cn } from "@/lib/utils"

interface GameBoardProps {
  grid: GridCell[][]
  setGrid: React.Dispatch<React.SetStateAction<GridCell[][]>>
  wordsToFind: Word[]
  onWordFound: (word: string) => void
}

interface Connection {
  from: { row: number; col: number }
  to: { row: number; col: number }
}

export function GameBoard({ grid, setGrid, wordsToFind, onWordFound }: GameBoardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedCells, setSelectedCells] = useState<GridCell[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const gridRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

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

  const handleMouseDown = useCallback(
    (cell: GridCell) => {
      setIsDragging(true)
      const newSelectedCells = [cell]
      setSelectedCells(newSelectedCells)
      setGrid((prevGrid) =>
        prevGrid.map((row) => row.map((c) => ({ ...c, selected: c.row === cell.row && c.col === cell.col }))),
      )
      updateConnections(newSelectedCells)
    },
    [setGrid, updateConnections],
  )

  const handleMouseEnter = useCallback(
    (cell: GridCell) => {
      if (!isDragging) return

      // Check if cell is adjacent to the last selected cell
      const lastCell = selectedCells[selectedCells.length - 1]
      if (lastCell) {
        const rowDiff = Math.abs(cell.row - lastCell.row)
        const colDiff = Math.abs(cell.col - lastCell.col)

        // Allow adjacent cells (including diagonals)
        if (rowDiff <= 1 && colDiff <= 1 && rowDiff + colDiff > 0) {
          // Avoid selecting the same cell twice
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
          }
        }
      }
    },
    [isDragging, selectedCells, setGrid, updateConnections],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (selectedCells.length === 0) return

    const selectedWord = selectedCells.map((c) => c.char).join("")
    const foundWord = wordsToFind.find(
      (w) => !w.found && (w.word === selectedWord || w.word === selectedWord.split("").reverse().join("")),
    )

    if (foundWord) {
      onWordFound(foundWord.word)
    } else {
      clearSelection()
    }
  }, [selectedCells, wordsToFind, onWordFound, clearSelection])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp()
      }
    }
    window.addEventListener("mouseup", handleGlobalMouseUp)
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [isDragging, handleMouseUp])

  if (!grid || grid.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl">
        <div className="text-center space-y-2">
          <div className="text-4xl">🎯</div>
          <p>Select theme and difficulty to start!</p>
        </div>
      </div>
    )
  }

  const cellSize = Math.min(40, Math.floor(400 / Math.max(grid.length, grid[0].length)))

  return (
    <div className="relative flex items-center justify-center p-6">
      <div className="relative">
        {/* SVG for connection lines */}
        <svg
          ref={svgRef}
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            width: grid[0].length * (cellSize + 4),
            height: grid.length * (cellSize + 4),
          }}
        >
          {connections.map((connection, index) => {
            const fromX = connection.from.col * (cellSize + 4) + cellSize / 2 + 2
            const fromY = connection.from.row * (cellSize + 4) + cellSize / 2 + 2
            const toX = connection.to.col * (cellSize + 4) + cellSize / 2 + 2
            const toY = connection.to.row * (cellSize + 4) + cellSize / 2 + 2

            return (
              <line
                key={index}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="rgb(59 130 246)"
                strokeWidth="3"
                strokeLinecap="round"
                className="animate-pulse"
              />
            )
          })}
        </svg>

        {/* Grid */}
        <div
          ref={gridRef}
          className="relative bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 p-2 rounded-xl shadow-2xl border border-blue-200 dark:border-blue-800"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${grid[0].length}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${grid.length}, ${cellSize}px)`,
            gap: "4px",
          }}
          onMouseLeave={() => isDragging && handleMouseUp()}
        >
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={cn(
                  "flex items-center justify-center font-bold text-lg cursor-pointer select-none transition-all duration-200 rounded-lg shadow-sm",
                  "hover:scale-110 hover:shadow-md",
                  cell.found
                    ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg scale-105"
                    : cell.selected
                      ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg scale-105"
                      : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900 dark:hover:to-indigo-900 text-gray-700 dark:text-gray-300",
                )}
                style={{ width: cellSize, height: cellSize }}
                onMouseDown={() => handleMouseDown(cell)}
                onMouseEnter={() => handleMouseEnter(cell)}
              >
                {cell.char}
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  )
}
