"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { GameStats } from "@/types/game"
import { Trophy, Clock, Target, RotateCcw, Settings, CheckCircle, XCircle, Star, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface GameOverModalProps {
  isOpen: boolean
  gameStats: GameStats
  isVictory: boolean
  onPlayAgain: () => void
  onChangeSettings: () => void
  onClose: () => void
}

export function GameOverModal({
  isOpen,
  gameStats,
  isVictory,
  onPlayAgain,
  onChangeSettings,
  onClose,
}: GameOverModalProps) {
  if (!isOpen) return null

  const completionPercentage = (gameStats.wordsFound / gameStats.totalWords) * 100
  const timeUsedMinutes = Math.floor(gameStats.timeUsed / 60000)
  const timeUsedSeconds = Math.floor((gameStats.timeUsed % 60000) / 1000)

  const getPerformanceRating = () => {
    if (completionPercentage === 100) return { rating: "Perfect!", color: "text-yellow-500", stars: 3 }
    if (completionPercentage >= 80) return { rating: "Excellent!", color: "text-green-500", stars: 3 }
    if (completionPercentage >= 60) return { rating: "Good Job!", color: "text-blue-500", stars: 2 }
    if (completionPercentage >= 40) return { rating: "Keep Trying!", color: "text-orange-500", stars: 2 }
    return { rating: "Practice More!", color: "text-red-500", stars: 1 }
  }

  const performance = getPerformanceRating()

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card
        className={cn(
          "w-full max-w-lg shadow-2xl border-2 animate-in zoom-in-95 duration-300 relative",
          isVictory
            ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 border-green-300 dark:border-green-700"
            : "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950 border-orange-300 dark:border-orange-700",
        )}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClose()
          }}
          className="absolute top-2 right-2 z-10 hover:bg-white/20 dark:hover:bg-gray-800/20 h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>

        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="text-4xl">{isVictory ? "🎉" : "⏰"}</div>
            <div>
              <h2
                className={cn(
                  "text-2xl font-bold mb-1",
                  isVictory ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300",
                )}
              >
                {isVictory ? "Congratulations!" : "Time's Up!"}
              </h2>
              <div className="flex items-center justify-center gap-2">
                <span className={cn("text-lg font-semibold", performance.color)}>{performance.rating}</span>
                <div className="flex">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < performance.stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <Trophy className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {gameStats.score.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Final Score</p>
            </div>

            <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-1 text-blue-500" />
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {gameStats.wordsFound}/{gameStats.totalWords}
              </p>
              <p className="text-xs text-muted-foreground">Words Found</p>
            </div>

            <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-1 text-purple-500" />
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {timeUsedMinutes}:{timeUsedSeconds.toString().padStart(2, "0")}
              </p>
              <p className="text-xs text-muted-foreground">Time Used</p>
            </div>

            <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-6 h-6 mx-auto mb-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">%</span>
              </div>
              <p className="text-xl font-bold text-pink-600 dark:text-pink-400">{Math.round(completionPercentage)}%</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>
                {gameStats.wordsFound} of {gameStats.totalWords}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Words Summary - Compact */}
          <div className="space-y-3">
            {/* Found Words */}
            {gameStats.foundWordsList.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Found ({gameStats.foundWordsList.length})
                </h3>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {gameStats.foundWordsList.map((word) => (
                    <Badge
                      key={word}
                      variant="secondary"
                      className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs"
                    >
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Missed Words */}
            {gameStats.missedWordsList.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Missed ({gameStats.missedWordsList.length})
                </h3>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {gameStats.missedWordsList.map((wordObj) => (
                    <div
                      key={wordObj.word}
                      className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs border border-red-200 dark:border-red-800"
                    >
                      <p className="font-semibold text-red-700 dark:text-red-300">{wordObj.word}</p>
                      <p className="text-red-600 dark:text-red-400 text-xs">{wordObj.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onPlayAgain}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-10"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Play Again
            </Button>
            <Button onClick={onChangeSettings} variant="outline" className="flex-1 h-10 bg-transparent">
              <Settings className="mr-1 h-3 w-3" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
