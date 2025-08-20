"use client"

import { Card, CardContent } from "@/components/ui/card"
import { THEMES } from "@/types/game"
import { cn } from "@/lib/utils"

interface ThemeSelectionProps {
  selectedTheme: string
  onThemeSelect: (themeId: string) => void
  disabled?: boolean
}

export function ThemeSelection({ selectedTheme, onThemeSelect, disabled }: ThemeSelectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Choose Your Adventure</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {THEMES.map((theme) => (
          <Card
            key={theme.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg",
              selectedTheme === theme.id
                ? "ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
                : "hover:bg-blue-50/50 dark:hover:bg-blue-950/50",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            onClick={() => !disabled && onThemeSelect(theme.id)}
          >
            <CardContent className="p-4 text-center space-y-2">
              <div className="text-3xl">{theme.icon}</div>
              <h4 className="font-medium text-sm">{theme.name}</h4>
              <p className="text-xs text-muted-foreground leading-tight">{theme.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
