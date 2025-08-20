"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DIFFICULTIES } from "@/types/game"
import { cn } from "@/lib/utils"
import { Trophy, Clock, Target } from "lucide-react"

interface DifficultySelectionProps {
  selectedDifficulty: string
  onDifficultySelect: (difficultyId: string) => void
  disabled?: boolean
}

export function DifficultySelection({ selectedDifficulty, onDifficultySelect, disabled }: DifficultySelectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Select Challenge Level</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DIFFICULTIES.map((difficulty) => (
          <Card
            key={difficulty.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg",
              selectedDifficulty === difficulty.id
                ? "ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
                : "hover:bg-blue-50/50 dark:hover:bg-blue-950/50",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            onClick={() => !disabled && onDifficultySelect(difficulty.id)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="text-center">
                <div className="text-2xl mb-2">{difficulty.icon}</div>
                <h4 className="font-semibold">{difficulty.name}</h4>
                <p className="text-sm text-muted-foreground">{difficulty.description}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Grid Size
                  </span>
                  <span className="font-medium">
                    {difficulty.gridSize.rows}×{difficulty.gridSize.cols}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Words
                  </span>
                  <span className="font-medium">{difficulty.wordCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Score Bonus
                  </span>
                  <span className="font-medium">{difficulty.scoreMultiplier}x</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center p-4 bg-blue-50/50 dark:bg-blue-950/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Score Calculation:</strong> Base points (word length × 10) × difficulty multiplier × time bonus
        </p>
      </div>
    </div>
  )
}
