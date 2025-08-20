"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Achievement } from "@/lib/achievement-system"
import { cn } from "@/lib/utils"
import { Trophy, X } from "lucide-react"

interface AchievementNotificationProps {
  achievements: Achievement[]
  onDismiss: () => void
}

export function AchievementNotification({ achievements, onDismiss }: AchievementNotificationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (achievements.length > 0) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onDismiss, 300)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [achievements, onDismiss])

  if (achievements.length === 0) return null

  return (
    <div className="fixed top-20 right-6 z-50 space-y-2">
      {achievements.map((achievement, index) => (
        <Card
          key={achievement.id}
          className={cn(
            "bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950 dark:via-amber-950 dark:to-orange-950 border-yellow-300 dark:border-yellow-700 shadow-2xl transition-all duration-500 transform",
            visible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95",
          )}
          style={{ animationDelay: `${index * 200}ms` }}
        >
          <CardContent className="p-4 relative">
            <button
              onClick={() => {
                setVisible(false)
                setTimeout(onDismiss, 300)
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="text-3xl animate-bounce">{achievement.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                  >
                    Achievement Unlocked!
                  </Badge>
                </div>
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200">{achievement.name}</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">{achievement.description}</p>
              </div>
            </div>

            {/* Sparkle animation */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 left-2 w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
              <div
                className="absolute top-4 right-8 w-1 h-1 bg-amber-400 rounded-full animate-ping"
                style={{ animationDelay: "0.5s" }}
              />
              <div
                className="absolute bottom-3 left-8 w-1 h-1 bg-orange-400 rounded-full animate-ping"
                style={{ animationDelay: "1s" }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
