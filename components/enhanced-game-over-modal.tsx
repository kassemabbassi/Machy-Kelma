"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { GameStats } from "@/types/game"
import type { Achievement } from "@/lib/achievement-system"
import { Trophy, Clock, Target, RotateCcw, Settings, CheckCircle, XCircle, Star, X, Zap, Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedGameOverModalProps {
  isOpen: boolean
  gameStats: GameStats & { maxCombo?: number }
  isVictory: boolean
  onPlayAgain: () => void
  onChangeSettings: () => void
  onClose: () => void
  newAchievements?: Achievement[]
}

export function EnhancedGameOverModal({
  isOpen,
  gameStats,
  isVictory,
  onPlayAgain,
  onChangeSettings,
  onClose,
  newAchievements = [],
}: EnhancedGameOverModalProps) {
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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <Card
        className={cn(
          "w-full max-w-2xl shadow-2xl border-2 animate-in zoom-in-95 duration-500 relative overflow-hidden",
          isVictory
            ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 border-green-300 dark:border-green-700"
            : "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950 border-orange-300 dark:border-orange-700",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
          <div
            className="absolute top-8 right-12 w-1 h-1 bg-blue-400 rounded-full animate-ping"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-4 right-4 w-1 h-1 bg-purple-400 rounded-full animate-ping"
            style={{ animationDelay: "1.5s" }}
          />
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 hover:bg-white/20 dark:hover:bg-gray-800/20 h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>

        <CardContent className="p-8 space-y-6 relative z-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="text-6xl animate-bounce">{isVictory ? "🎉" : "⏰"}</div>
            <div>
              <h2
                className={cn(
                  "text-3xl font-bold mb-2",
                  isVictory ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300",
                )}
              >
                {isVictory ? "Congratulations!" : "Time's Up!"}
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className={cn("text-xl font-semibold", performance.color)}>{performance.rating}</span>
                <div className="flex">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-5 h-5",
                        i < performance.stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* New Achievements */}
          {newAchievements.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700">
              <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                <Award className="w-5 h-5" />
                New Achievements Unlocked!
              </h3>
              <div className="space-y-2">
                {newAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <p className="font-semibold text-yellow-800 dark:text-yellow-200">{achievement.name}</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-white/20">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {gameStats.score.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Final Score</p>
            </div>

            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-white/20">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {gameStats.wordsFound}/{gameStats.totalWords}
              </p>
              <p className="text-xs text-muted-foreground">Words Found</p>
            </div>

            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-white/20">
              <Clock className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {timeUsedMinutes}:{timeUsedSeconds.toString().padStart(2, "0")}
              </p>
              <p className="text-xs text-muted-foreground">Time Used</p>
            </div>

            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-white/20">
              <Zap className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{gameStats.maxCombo || 0}x</p>
              <p className="text-xs text-muted-foreground">Max Combo</p>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Progress</span>
              <span className="font-bold">
                {gameStats.wordsFound} of {gameStats.totalWords} ({Math.round(completionPercentage)}%)
              </span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>

          {/* Words Summary - Enhanced */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Found Words */}
            {gameStats.foundWordsList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Found Words ({gameStats.foundWordsList.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {gameStats.foundWordsList.map((word) => (
                    <div
                      key={word}
                      className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800"
                    >
                      <span className="font-semibold text-green-700 dark:text-green-300">{word}</span>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs"
                      >
                        +{word.length * 10}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missed Words */}
            {gameStats.missedWordsList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Missed Words ({gameStats.missedWordsList.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {gameStats.missedWordsList.map((wordObj) => (
                    <div
                      key={wordObj.word}
                      className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                    >
                      <p className="font-semibold text-red-700 dark:text-red-300 mb-1">{wordObj.word}</p>
                      <p className="text-red-600 dark:text-red-400 text-sm">{wordObj.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onPlayAgain}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Play Again
            </Button>
            <Button
              onClick={onChangeSettings}
              variant="outline"
              className="flex-1 h-12 bg-transparent border-2 hover:bg-white/10 text-lg font-semibold"
            >
              <Settings className="mr-2 h-5 w-5" />
              New Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
