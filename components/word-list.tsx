import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Word } from "@/types/game"
import { cn } from "@/lib/utils"
import { CheckCircle, Circle, Lightbulb } from "lucide-react"

interface WordListProps {
  words: Word[]
}

export function WordList({ words }: WordListProps) {
  const foundCount = words.filter((w) => w.found).length
  const totalCount = words.length

  return (
    <Card className="h-full bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-500" />
            Word Clues
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            {foundCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {words.map((wordItem, index) => (
          <div
            key={wordItem.word}
            className={cn(
              "p-3 rounded-lg transition-all duration-300 border",
              wordItem.found
                ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 shadow-sm"
                : "bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900 border-gray-200 dark:border-gray-700 hover:shadow-md",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {wordItem.found ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
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
                </div>
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    wordItem.found ? "text-green-700 dark:text-green-300" : "text-gray-700 dark:text-gray-300",
                  )}
                >
                  {wordItem.definition}
                </p>
                {wordItem.found && (
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">✓ {wordItem.word}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
