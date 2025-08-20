"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Word } from "@/types/game"
import { cn } from "@/lib/utils"
import { CheckCircle, Circle, Lightbulb, Eye, EyeOff, Zap, Target, X } from "lucide-react"
import { useState } from "react"

interface EnhancedWordListProps {
  words: Word[]
  onHintRequest?: (word: string) => void
  hintsRemaining: number
  combo: number
  // Remove this line: onHintDisplay?: (hint: { word: string; firstLetter: string; length: number }) => void
}

export function EnhancedWordList({
  words,
  onHintRequest,
  hintsRemaining,
  combo,
  // Remove this line: onHintDisplay,
}: EnhancedWordListProps) {
  const [showDefinitions, setShowDefinitions] = useState(true)
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [activeHint, setActiveHint] = useState<{ word: string; firstLetter: string; length: number } | null>(null)

  const foundCount = words.filter((w) => w.found).length
  const totalCount = words.length
  const progress = (foundCount / totalCount) * 100

  const handleHintRequest = (word: string) => {
    if (onHintRequest) {
      onHintRequest(word)
    }

    // Always show the hint display regardless of onHintDisplay prop
    const hint = {
      word: word,
      firstLetter: word.charAt(0),
      length: word.length,
    }
    setActiveHint(hint)

    // Auto-hide hint after 10 seconds
    setTimeout(() => {
      setActiveHint(null)
    }, 10000)
  }

  return (
    <Card className="h-full bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 border-blue-200 dark:border-blue-800 shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-500" />
            Word Clues
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDefinitions(!showDefinitions)}
              className="h-8 w-8 p-0"
            >
              {showDefinitions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              {foundCount}/{totalCount}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          {combo > 0 && (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <Zap className="w-3 h-3" />
              <span className="font-bold">{combo + 1}x Combo</span>
            </div>
          )}
          {hintsRemaining > 0 && (
            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
              <Target className="w-3 h-3" />
              <span>{hintsRemaining} hints left</span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Active Hint Display */}
      {activeHint && (
        <div className="mx-6 mb-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 border border-purple-200 dark:border-purple-700 rounded-lg animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg animate-pulse">
                {activeHint.firstLetter}
              </div>
              <div>
                <p className="font-semibold text-purple-700 dark:text-purple-300">💡 Hint Revealed!</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Look for a {activeHint.length}-letter word starting with "{activeHint.firstLetter}"
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveHint(null)}
              className="h-8 w-8 p-0 hover:bg-purple-200 dark:hover:bg-purple-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {words.map((wordItem, index) => (
          <div
            key={wordItem.word}
            className={cn(
              "p-3 rounded-lg transition-all duration-300 border relative overflow-hidden",
              wordItem.found
                ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 shadow-lg scale-105"
                : hoveredWord === wordItem.word
                  ? "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-800 dark:to-indigo-800 border-blue-300 dark:border-blue-600 shadow-md scale-102"
                  : "bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900 border-gray-200 dark:border-gray-700 hover:shadow-md hover:scale-102",
            )}
            onMouseEnter={() => setHoveredWord(wordItem.word)}
            onMouseLeave={() => setHoveredWord(null)}
          >
            {/* Shimmer effect for found words */}
            {wordItem.found && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}

            <div className="flex items-start gap-3 relative z-10">
              <div className="flex-shrink-0 mt-1">
                {wordItem.found ? (
                  <CheckCircle className="w-5 h-5 text-green-500 animate-pulse" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-mono">
                    {index + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{wordItem.word.length} letters</span>
                  {!wordItem.found && onHintRequest && hintsRemaining > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHintRequest(wordItem.word)}
                      className="h-6 px-2 text-xs bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Hint
                    </Button>
                  )}
                </div>

                {showDefinitions && (
                  <p
                    className={cn(
                      "text-sm leading-relaxed transition-all duration-300",
                      wordItem.found ? "text-green-700 dark:text-green-300" : "text-gray-700 dark:text-gray-300",
                    )}
                  >
                    {wordItem.definition}
                  </p>
                )}

                {wordItem.found && (
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400">✓ {wordItem.word}</p>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs"
                    >
                      +{wordItem.word.length * 10} pts
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
