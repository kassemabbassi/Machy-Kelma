"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { GameConfig, Difficulty } from "@/types/game"

interface GameControlsProps {
  gameConfig: GameConfig
  onConfigChange: (config: GameConfig) => void
  disabled: boolean
}

export function GameControls({ gameConfig, onConfigChange, disabled }: GameControlsProps) {
  const themes = ["Animals", "Science", "Geography", "Famous Cities", "Human Body", "History", "Sports", "Tech Terms"]

  const difficulties: { label: string; value: Difficulty }[] = [
    { label: "Easy", value: "easy" },
    { label: "Medium", value: "medium" },
    { label: "Hard", value: "hard" },
  ]

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      <div className="flex-1">
        <Label htmlFor="theme-select">Theme</Label>
        <Select
          value={gameConfig.theme}
          onValueChange={(value) => onConfigChange({ ...gameConfig, theme: value })}
          disabled={disabled}
        >
          <SelectTrigger id="theme-select" className="w-full">
            <SelectValue placeholder="Select a theme" />
          </SelectTrigger>
          <SelectContent>
            {themes.map((theme) => (
              <SelectItem key={theme} value={theme}>
                {theme}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Label htmlFor="difficulty-select">Difficulty</Label>
        <Select
          value={gameConfig.difficulty}
          onValueChange={(value) => onConfigChange({ ...gameConfig, difficulty: value as Difficulty })}
          disabled={disabled}
        >
          <SelectTrigger id="difficulty-select" className="w-full">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            {difficulties.map((diff) => (
              <SelectItem key={diff.value} value={diff.value}>
                {diff.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
