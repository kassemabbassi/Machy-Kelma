"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { RotateCcw, Palette, Zap, Pause, Play } from "lucide-react"
import { THEMES, DIFFICULTIES } from "@/types/game"
import type { GameConfig } from "@/types/game"

interface InGameControlsProps {
  gameConfig: GameConfig
  onThemeChange: (theme: string) => void
  onDifficultyChange: (difficulty: string) => void
  onRestart: () => void
  isPaused: boolean
  onPauseToggle: () => void
}

export function InGameControls({
  gameConfig,
  onThemeChange,
  onDifficultyChange,
  onRestart,
  isPaused,
  onPauseToggle,
}: InGameControlsProps) {
  const currentTheme = THEMES.find((t) => t.id === gameConfig.theme)
  const currentDifficulty = DIFFICULTIES.find((d) => d.id === gameConfig.difficulty)

  return (
    <Card className="fixed bottom-6 right-6 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-blue-200 dark:border-blue-800 shadow-xl">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {/* Pause/Resume */}
          <Button variant="outline" size="sm" onClick={onPauseToggle} className="bg-transparent">
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>

          {/* Theme Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Palette className="w-4 h-4 mr-1" />
                {currentTheme?.icon}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Change Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {THEMES.map((theme) => (
                <DropdownMenuItem
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className={gameConfig.theme === theme.id ? "bg-blue-50 dark:bg-blue-950" : ""}
                >
                  <span className="mr-2">{theme.icon}</span>
                  {theme.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Difficulty Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent">
                <Zap className="w-4 h-4 mr-1" />
                {currentDifficulty?.icon}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Change Difficulty</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {DIFFICULTIES.map((difficulty) => (
                <DropdownMenuItem
                  key={difficulty.id}
                  onClick={() => onDifficultyChange(difficulty.id)}
                  className={gameConfig.difficulty === difficulty.id ? "bg-blue-50 dark:bg-blue-950" : ""}
                >
                  <span className="mr-2">{difficulty.icon}</span>
                  {difficulty.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Restart */}
          <Button variant="outline" size="sm" onClick={onRestart} className="bg-transparent">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
