"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { ScoreEntry, User } from "@/types/game"
import { DIFFICULTIES } from "@/types/game"
import { Loader2, Trophy, Medal, X, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface LeaderboardProps {
  currentUser: User | null
  isOpen: boolean
  onClose: () => void
}

interface DifficultyLeaderboard {
  [key: string]: ScoreEntry[]
}

export function Leaderboard({ currentUser, isOpen, onClose }: LeaderboardProps) {
  const [leaderboards, setLeaderboards] = useState<DifficultyLeaderboard>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("easy")

  const fetchLeaderboards = async () => {
    setLoading(true)
    setError(null)

    try {
      const difficultyLeaderboards: DifficultyLeaderboard = {}

      // Fetch leaderboard for each difficulty
      for (const difficulty of DIFFICULTIES) {
        // Get all scores for this difficulty, grouped by user with their highest score
        const { data, error: fetchError } = await supabase
          .from("scores")
          .select(`
          user_id,
          score,
          difficulty,
          created_at,
          users (
            username
          )
        `)
          .eq("difficulty", difficulty.id)
          .order("score", { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        // Group by user and keep only the highest score per user
        const userBestScores = new Map()
        data.forEach((item: any) => {
          const userId = item.user_id
          const username = item.users.username

          if (!userBestScores.has(userId) || userBestScores.get(userId).score < item.score) {
            userBestScores.set(userId, {
              id: `${userId}-${difficulty.id}`, // Unique ID for React key
              score: item.score,
              created_at: item.created_at,
              username: username,
              difficulty: item.difficulty,
            })
          }
        })

        // Convert back to array, sort by score, and limit to top 5
        const formattedData: ScoreEntry[] = Array.from(userBestScores.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)

        difficultyLeaderboards[difficulty.id] = formattedData
      }

      setLeaderboards(difficultyLeaderboards)
    } catch (err) {
      console.error("Error fetching leaderboards:", err)
      setError("Failed to load leaderboards.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboards()
    }
  }, [isOpen])

  if (!isOpen) return null

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 1:
        return <Trophy className="w-6 h-6 text-gray-400" />
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">
            #{index + 1}
          </span>
        )
    }
  }

  const getDifficultyColor = (difficultyId: string) => {
    switch (difficultyId) {
      case "easy":
        return "from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800"
      case "medium":
        return "from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800"
      case "hard":
        return "from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 border-red-200 dark:border-red-800"
      default:
        return "from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800"
    }
  }

  const renderLeaderboard = (difficultyId: string) => {
    const difficulty = DIFFICULTIES.find((d) => d.id === difficultyId)
    const leaderboard = leaderboards[difficultyId] || []

    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchLeaderboards} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      )
    }

    if (leaderboard.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">{difficulty?.icon}</div>
          <p className="text-muted-foreground">No scores yet for {difficulty?.name} level.</p>
          <p className="text-sm text-muted-foreground mt-2">Be the first champion!</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg transition-all duration-200 border",
              index === 0 &&
                "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800 shadow-lg",
              index === 1 &&
                "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border-gray-200 dark:border-gray-700 shadow-md",
              index === 2 &&
                "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800 shadow-md",
              index > 2 && `bg-gradient-to-r ${getDifficultyColor(difficultyId)} shadow-sm`,
              currentUser && currentUser.username === entry.username && "ring-2 ring-blue-500",
            )}
          >
            <div className="flex-shrink-0">{getRankIcon(index)}</div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-semibold truncate",
                  index === 0 && "text-yellow-700 dark:text-yellow-300",
                  index === 1 && "text-gray-700 dark:text-gray-300",
                  index === 2 && "text-amber-700 dark:text-amber-300",
                  index > 2 && "text-blue-700 dark:text-blue-300",
                )}
              >
                {entry.username}
                {currentUser && currentUser.username === entry.username && (
                  <span className="ml-2 text-xs text-blue-500 font-normal">(You)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "font-bold text-lg",
                  index === 0 && "text-yellow-600 dark:text-yellow-400",
                  index === 1 && "text-gray-600 dark:text-gray-400",
                  index === 2 && "text-amber-600 dark:text-amber-400",
                  index > 2 && "text-blue-600 dark:text-blue-400",
                )}
              >
                {entry.score.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 border-blue-200 dark:border-blue-800 shadow-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Hall of Fame
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              {DIFFICULTIES.map((difficulty) => (
                <TabsTrigger
                  key={difficulty.id}
                  value={difficulty.id}
                  className="flex items-center gap-2 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900"
                >
                  <span>{difficulty.icon}</span>
                  <span className="hidden sm:inline">{difficulty.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {DIFFICULTIES.map((difficulty) => (
              <TabsContent key={difficulty.id} value={difficulty.id} className="mt-0">
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                    {difficulty.icon} {difficulty.name} Champions
                  </h3>
                  <p className="text-sm text-muted-foreground">{difficulty.description}</p>
                </div>
                {renderLeaderboard(difficulty.id)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
