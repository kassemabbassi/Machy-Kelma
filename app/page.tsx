"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AuthForm } from "@/components/auth-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Play, Trophy, Timer, Target, Sparkles, Volume2, VolumeX } from "lucide-react"
import type { User, Word, GameConfig, Difficulty, GameStats } from "@/types/game"
import { THEMES, DIFFICULTIES } from "@/types/game"
import { generateGameContent } from "@/lib/ai"
import { ThemeSelection } from "@/components/theme-selection"
import { DifficultySelection } from "@/components/difficulty-selection"
import { EnhancedWordList } from "@/components/enhanced-word-list"
import { EnhancedGameBoard } from "@/components/enhanced-game-board"
import { Leaderboard } from "@/components/leaderboard"
import { EnhancedGameOverModal } from "@/components/enhanced-game-over-modal"
import { InGameControls } from "@/components/in-game-controls"
import { AchievementNotification } from "@/components/achievement-notification"
import { generateGrid, placeWordsInGrid } from "@/lib/game-utils"
import { supabase } from "@/lib/supabase"
import { WordHistoryManager } from "@/lib/word-history"
import { soundManager } from "@/lib/sound-manager"
import { AchievementSystem, type Achievement } from "@/lib/achievement-system"

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [gameConfig, setGameConfig] = useState<GameConfig>({ theme: "technology", difficulty: "easy" })
  const [wordsToFind, setWordsToFind] = useState<Word[]>([])
  const [grid, setGrid] = useState<any[][]>([])
  const [loadingGame, setLoadingGame] = useState(false)
  const [gameError, setGameError] = useState<string | null>(null)
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const [gameTime, setGameTime] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)
  const [gameStats, setGameStats] = useState<GameStats | null>(null)
  const [isVictory, setIsVictory] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [activeHint, setActiveHint] = useState<{ word: string; firstLetter: string; length: number } | null>(null)

  // Enhanced game features
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [hintsRemaining, setHintsRemaining] = useState(3)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [showAchievementNotification, setShowAchievementNotification] = useState(false)

  const scoreSavedRef = useRef(false)
  const gameStateRef = useRef({
    foundWords: [] as string[],
    score: 0,
    wordsToFind: [] as Word[],
    gameTime: 0,
    combo: 0,
    maxCombo: 0,
  })

  // Update ref whenever state changes
  useEffect(() => {
    gameStateRef.current = {
      foundWords: [...foundWords],
      score,
      wordsToFind: [...wordsToFind],
      gameTime,
      combo,
      maxCombo,
    }
  }, [foundWords, score, wordsToFind, gameTime, combo, maxCombo])

  // Initialize sound system
  useEffect(() => {
    soundManager.initialize()
    soundManager.setEnabled(soundEnabled)
  }, [soundEnabled])

  // REMOVED: Body scroll prevention - allow normal scrolling

  const handleLogin = useCallback((user: User | null) => {
    setCurrentUser(user)
  }, [])

  // Enhanced timer effect with sound
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameStarted && !gameFinished && !isPaused) {
      interval = setInterval(() => {
        const now = Date.now()
        const elapsed = now - gameStartTime
        const selectedDifficulty = DIFFICULTIES.find((d) => d.id === gameConfig.difficulty)

        if (selectedDifficulty) {
          const remaining = selectedDifficulty.timeLimit - elapsed

          if (remaining <= 0) {
            setGameTime(selectedDifficulty.timeLimit)
            handleGameEnd(false)
          } else {
            setGameTime(elapsed)
            setTimeRemaining(remaining)

            // Play warning sound when time is running out
            if (remaining <= 10000 && remaining > 9000) {
              soundManager.play("tick", 0.8)
            }
          }
        }
      }, 100)
    }
    return () => clearInterval(interval)
  }, [gameStarted, gameFinished, gameStartTime, gameConfig.difficulty, isPaused])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const calculateWordScore = (word: string, difficulty: Difficulty, comboMultiplier = 1) => {
    const selectedDifficulty = DIFFICULTIES.find((d) => d.id === difficulty)
    if (!selectedDifficulty) return 0

    const baseScore = word.length * 10
    const difficultyBonus = Math.floor(baseScore * selectedDifficulty.scoreMultiplier)
    const comboBonus = Math.floor(difficultyBonus * (comboMultiplier - 1) * 0.5)

    return difficultyBonus + comboBonus
  }

  const handleGameEnd = useCallback(
    (victory: boolean) => {
      if (gameFinished) return

      // Use ref to get the most current state
      const currentFoundWords = [...gameStateRef.current.foundWords]
      const currentScore = gameStateRef.current.score
      const currentWordsToFind = [...gameStateRef.current.wordsToFind]
      const currentGameTime = gameStateRef.current.gameTime || Date.now() - gameStartTime
      const currentMaxCombo = gameStateRef.current.maxCombo

      setGameFinished(true)
      setIsVictory(victory)

      const selectedDifficulty = DIFFICULTIES.find((d) => d.id === gameConfig.difficulty)
      if (!selectedDifficulty) return

      // Calculate final score with bonuses
      let finalScore = currentScore
      if (victory && currentFoundWords.length === currentWordsToFind.length) {
        finalScore += 200 // Perfect game bonus
      }

      // Time bonus for fast completion
      if (victory) {
        const timeBonus = Math.max(0, Math.floor((selectedDifficulty.timeLimit - currentGameTime) / 1000))
        finalScore += timeBonus
      }

      const stats: GameStats & { maxCombo: number } = {
        wordsFound: currentFoundWords.length,
        totalWords: currentWordsToFind.length,
        timeUsed: currentGameTime,
        timeLimit: selectedDifficulty.timeLimit,
        score: finalScore,
        foundWordsList: currentFoundWords,
        missedWordsList: currentWordsToFind.filter((w) => !w.found),
        maxCombo: currentMaxCombo,
      }

      setGameStats(stats)
      setScore(finalScore)

      // Check for achievements
      const achievementResult = AchievementSystem.updateStats({
        wordsFound: currentFoundWords.length,
        totalWords: currentWordsToFind.length,
        score: finalScore,
        timeUsed: currentGameTime,
        difficulty: gameConfig.difficulty,
        isVictory: victory,
        maxCombo: currentMaxCombo,
      })

      if (achievementResult.length > 0) {
        setNewAchievements(achievementResult)
        setShowAchievementNotification(true)
      }

      // Play end game sound
      if (victory) {
        soundManager.play("victory", 0.8)
      } else {
        soundManager.play("gameOver", 0.6)
      }

      setShowGameOver(true)

      // Save score logic
      const isGuestUser =
        currentUser &&
        (currentUser.username.toLowerCase().includes("guest") ||
          currentUser.id.startsWith("guest-") ||
          currentUser.username === "Guest Player")

      if (currentUser && !isGuestUser && !scoreSavedRef.current && finalScore > 0) {
        scoreSavedRef.current = true

        const saveScore = async () => {
          try {
            const { data: existingScore, error: fetchError } = await supabase
              .from("scores")
              .select("id, score")
              .eq("user_id", currentUser.id)
              .eq("difficulty", gameConfig.difficulty)
              .order("score", { ascending: false })
              .limit(1)
              .single()

            if (fetchError && fetchError.code !== "PGRST116") {
              throw fetchError
            }

            if (existingScore && existingScore.score >= finalScore) {
              return
            }

            if (existingScore) {
              const { error: updateError } = await supabase
                .from("scores")
                .update({
                  score: finalScore,
                  created_at: new Date().toISOString(),
                })
                .eq("id", existingScore.id)

              if (updateError) throw updateError
            } else {
              const { error: insertError } = await supabase.from("scores").insert({
                user_id: currentUser.id,
                score: finalScore,
                difficulty: gameConfig.difficulty,
              })

              if (insertError) throw insertError
            }
          } catch (err) {
            console.error("Unexpected error saving score:", err)
          }
        }
        saveScore()
      }
    },
    [gameConfig.difficulty, currentUser, gameFinished, gameStartTime],
  )

  const handleStartGame = useCallback(async () => {
    setLoadingGame(true)
    setGameError(null)
    setWordsToFind([])
    setGrid([])
    setFoundWords([])
    setScore(0)
    setGameFinished(false)
    setGameTime(0)
    setShowGameOver(false)
    setGameStats(null)
    setIsPaused(false)
    setCombo(0)
    setMaxCombo(0)
    setHintsRemaining(3)
    setNewAchievements([])
    setActiveHint(null)
    scoreSavedRef.current = false

    // Reset ref
    gameStateRef.current = {
      foundWords: [],
      score: 0,
      wordsToFind: [],
      gameTime: 0,
      combo: 0,
      maxCombo: 0,
    }

    try {
      const selectedTheme = THEMES.find((t) => t.id === gameConfig.theme)
      const selectedDifficulty = DIFFICULTIES.find((d) => d.id === gameConfig.difficulty)

      if (!selectedTheme || !selectedDifficulty) {
        setGameError("Invalid theme or difficulty selected.")
        return
      }

      const recentWords = WordHistoryManager.getRecentWords(selectedTheme.name, 30)

      const { words, error } = await generateGameContent(
        selectedTheme.name,
        gameConfig.difficulty as Difficulty,
        recentWords,
      )

      if (error) {
        setGameError(error)
        return
      }

      if (!words || words.length === 0) {
        setGameError("AI did not generate any words. Please try a different theme/difficulty.")
        return
      }

      const shuffledWords = words.sort(() => Math.random() - 0.5)
      const limitedWords = shuffledWords.slice(0, selectedDifficulty.wordCount)

      WordHistoryManager.addWords(
        limitedWords.map((w) => w.word),
        selectedTheme.name,
      )

      let newGrid = generateGrid(selectedDifficulty.gridSize.rows, selectedDifficulty.gridSize.cols)
      placeWordsInGrid(
        newGrid,
        limitedWords.map((w) => w.word),
      )

      newGrid = newGrid.map((row, rIdx) =>
        row.map((cell, cIdx) => ({
          char: cell.char || String.fromCharCode(65 + Math.floor(Math.random() * 26)),
          row: rIdx,
          col: cIdx,
          selected: false,
          found: false,
        })),
      )

      const initialWords = limitedWords.map((w) => ({ ...w, found: false }))
      setWordsToFind(initialWords)
      setGrid(newGrid)
      setGameStarted(true)
      setGameStartTime(Date.now())
      setTimeRemaining(selectedDifficulty.timeLimit)

      gameStateRef.current = {
        foundWords: [],
        score: 0,
        wordsToFind: initialWords,
        gameTime: 0,
        combo: 0,
        maxCombo: 0,
      }
    } catch (error) {
      console.error("Failed to generate game content:", error)
      setGameError("Failed to generate game. Please try again.")
    } finally {
      setLoadingGame(false)
    }
  }, [gameConfig])

  const handleWordFound = useCallback(
    (word: string, wordScore: number, currentCombo: number) => {
      if (foundWords.includes(word) || gameFinished) return

      const newFoundWords = [...foundWords, word]
      const newScore = score + wordScore
      const newMaxCombo = Math.max(maxCombo, currentCombo)

      setFoundWords(newFoundWords)
      setScore(newScore)
      setMaxCombo(newMaxCombo)

      // Mark word as found in wordsToFind
      setWordsToFind((prev) => prev.map((w) => (w.word === word ? { ...w, found: true } : w)))

      // Check if all words are found
      if (newFoundWords.length === wordsToFind.length) {
        setTimeout(() => handleGameEnd(true), 500) // Small delay for animation
      }
    },
    [foundWords, gameFinished, score, maxCombo, wordsToFind.length, handleGameEnd],
  )

  const handleComboIncrease = useCallback(() => {
    setCombo((prev) => {
      const newCombo = prev + 1
      setMaxCombo((prevMax) => Math.max(prevMax, newCombo))
      return newCombo
    })
  }, [])

  const handleComboReset = useCallback(() => {
    setCombo(0)
  }, [])

  const handleHintRequest = useCallback(
    (word: string) => {
      if (hintsRemaining <= 0) return

      setHintsRemaining((prev) => prev - 1)

      // Play hint sound
      soundManager.play("tick", 0.5)
    },
    [hintsRemaining],
  )

  const handleThemeChange = (theme: string) => {
    setGameConfig((prev) => ({ ...prev, theme }))
    handleStartGame()
  }

  const handleDifficultyChange = (difficulty: string) => {
    setGameConfig((prev) => ({ ...prev, difficulty }))
    handleStartGame()
  }

  const handleBackToSetup = () => {
    setGameStarted(false)
    setGameFinished(false)
    setShowGameOver(false)
    setGameStats(null)
    setWordsToFind([])
    setGrid([])
    setFoundWords([])
    setScore(0)
    setGameTime(0)
    setIsPaused(false)
    setCombo(0)
    setMaxCombo(0)
    setHintsRemaining(3)
    setNewAchievements([])
    setActiveHint(null)
    scoreSavedRef.current = false

    gameStateRef.current = {
      foundWords: [],
      score: 0,
      wordsToFind: [],
      gameTime: 0,
      combo: 0,
      maxCombo: 0,
    }
  }

  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} />
  }

  const selectedTheme = THEMES.find((t) => t.id === gameConfig.theme)
  const selectedDifficulty = DIFFICULTIES.find((d) => d.id === gameConfig.difficulty)
  const timeProgress = selectedDifficulty
    ? ((selectedDifficulty.timeLimit - timeRemaining) / selectedDifficulty.timeLimit) * 100
    : 0
  const isTimeRunningOut = timeRemaining < 60000

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 relative overflow-hidden">
      {/* Enhanced floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-indigo-200/20 dark:bg-indigo-800/20 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-xl animate-pulse delay-500" />
        <div className="absolute top-10 right-1/3 w-28 h-28 bg-pink-200/20 dark:bg-pink-800/20 rounded-full blur-xl animate-pulse delay-700" />
        <div className="absolute bottom-1/3 left-1/4 w-20 h-20 bg-yellow-200/20 dark:bg-yellow-800/20 rounded-full blur-xl animate-pulse delay-300" />
      </div>

      {/* MOBILE-OPTIMIZED Header */}
      <header className="sticky top-0 z-40 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-b border-blue-200 dark:border-blue-800 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Wordoria
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Hello, {currentUser.username}! 🎮</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {gameStarted && !gameFinished && (
              <div className="flex items-center gap-1 sm:gap-3">
                {/* Compact Timer for Mobile */}
                <div className="flex items-center gap-1">
                  <Timer
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${isTimeRunningOut ? "text-red-500 animate-bounce" : "text-blue-500"}`}
                  />
                  <Badge
                    variant="secondary"
                    className={`text-xs sm:text-sm font-bold px-1 sm:px-2 ${isTimeRunningOut ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 animate-pulse" : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"}`}
                  >
                    {formatTime(timeRemaining)}
                  </Badge>
                </div>

                {/* Compact Score */}
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  <Badge
                    variant="secondary"
                    className="text-xs sm:text-sm font-bold px-1 sm:px-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                  >
                    {score.toLocaleString()}
                  </Badge>
                </div>

                {/* Compact Combo */}
                {combo > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-bold px-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 animate-pulse"
                  >
                    {combo + 1}x
                  </Badge>
                )}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSoundEnabled(!soundEnabled)
                soundManager.setEnabled(!soundEnabled)
              }}
              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
            >
              {soundEnabled ? (
                <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLeaderboard(true)}
              className="h-6 sm:h-8 px-1 sm:px-2 text-xs border bg-transparent"
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* SCROLLABLE MAIN CONTENT - Normal scrolling allowed */}
      <main className="container mx-auto px-1 sm:px-4 py-2 sm:py-4 relative z-10">
        {!gameStarted ? (
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6">
            {/* Compact Game Setup for Mobile */}
            <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-blue-200 dark:border-blue-800 shadow-xl">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-center text-xl sm:text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  🎯 Choose Your Challenge
                </CardTitle>
                <p className="text-center text-muted-foreground text-sm">Select theme and difficulty to start!</p>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-6">
                <ThemeSelection
                  selectedTheme={gameConfig.theme}
                  onThemeSelect={(theme) => setGameConfig((prev) => ({ ...prev, theme }))}
                  disabled={loadingGame}
                />

                <DifficultySelection
                  selectedDifficulty={gameConfig.difficulty}
                  onDifficultySelect={(difficulty) => setGameConfig((prev) => ({ ...prev, difficulty }))}
                  disabled={loadingGame}
                />

                {/* Compact Sound Settings */}
                <div className="flex items-center justify-center gap-3 p-2 sm:p-3 bg-blue-50/50 dark:bg-blue-950/50 rounded-lg">
                  <Label htmlFor="sound-toggle" className="flex items-center gap-2 text-sm">
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    Sound Effects
                  </Label>
                  <Switch
                    id="sound-toggle"
                    checked={soundEnabled}
                    onCheckedChange={(checked) => {
                      setSoundEnabled(checked)
                      soundManager.setEnabled(checked)
                    }}
                  />
                </div>

                {gameError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 font-medium text-sm">{gameError}</p>
                  </div>
                )}

                <div className="flex justify-center">
                  <Button
                    onClick={handleStartGame}
                    disabled={loadingGame}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    {loadingGame ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-5 w-5" />
                    )}
                    {loadingGame ? "🎲 Generating..." : "🚀 Start Game"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
            {/* SCROLLABLE Game Board - Can scroll to see full grid */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-blue-200 dark:border-blue-800 shadow-xl">
                <CardHeader className="pb-1 sm:pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1 text-base sm:text-lg">
                      {selectedTheme?.icon}
                      <span className="hidden sm:inline">
                        {selectedTheme?.name} - {selectedDifficulty?.name}
                      </span>
                      <span className="sm:hidden">{selectedDifficulty?.icon}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-sm font-bold">
                        {foundWords.length}/{wordsToFind.length}
                      </Badge>
                      {isPaused && (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 animate-pulse text-xs"
                        >
                          ⏸️ PAUSED
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-1 sm:p-4">
                  <EnhancedGameBoard
                    grid={grid}
                    setGrid={setGrid}
                    wordsToFind={wordsToFind}
                    onWordFound={handleWordFound}
                    combo={combo}
                    onComboIncrease={handleComboIncrease}
                    onComboReset={handleComboReset}
                    isPaused={isPaused}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Compact Word List */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <EnhancedWordList
                words={wordsToFind}
                onHintRequest={handleHintRequest}
                hintsRemaining={hintsRemaining}
                combo={combo}
              />
            </div>
          </div>
        )}
      </main>

      {/* In-Game Controls - Hidden on mobile to save space */}
      {gameStarted && !gameFinished && (
        <div className="hidden lg:block">
          <InGameControls
            gameConfig={gameConfig}
            onThemeChange={handleThemeChange}
            onDifficultyChange={handleDifficultyChange}
            onRestart={handleStartGame}
            isPaused={isPaused}
            onPauseToggle={() => setIsPaused(!isPaused)}
          />
        </div>
      )}

      {/* Enhanced Game Over Modal */}
      {showGameOver && gameStats && (
        <EnhancedGameOverModal
          isOpen={showGameOver}
          gameStats={gameStats}
          isVictory={isVictory}
          onPlayAgain={handleStartGame}
          onChangeSettings={handleBackToSetup}
          onClose={() => setShowGameOver(false)}
          newAchievements={newAchievements}
        />
      )}

      {/* Achievement Notifications */}
      {showAchievementNotification && (
        <AchievementNotification
          achievements={newAchievements}
          onDismiss={() => {
            setShowAchievementNotification(false)
            setNewAchievements([])
          }}
        />
      )}

      {/* Enhanced Leaderboard */}
      <Leaderboard currentUser={currentUser} isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  )
}
