"use server"

import { DIFFICULTIES, type Word, type Difficulty } from "@/types/game"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = "models/gemini-2.5-flash"

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.")
}

type GeneratedWord = { word?: unknown; clue?: unknown }

function parseGeneratedWords(text: string): GeneratedWord[] | null {
  const withoutFence = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "")
  const start = withoutFence.indexOf("[")
  const end = withoutFence.lastIndexOf("]")
  if (start < 0 || end < start) return null

  try {
    const parsed: unknown = JSON.parse(withoutFence.slice(start, end + 1))
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function generateGameContent(
  theme: string,
  difficulty: Difficulty,
  recentWords: string[] = [],
): Promise<{ words: Word[]; error?: string }> {
  if (!GEMINI_API_KEY) {
    return { words: [], error: "AI API key is not configured." }
  }

  const level = DIFFICULTIES.find((item) => item.id === difficulty)
  if (!level) return { words: [], error: "Invalid difficulty selected." }

  const wordCount = level.wordCount
  const recentWordsText = recentWords.length
    ? ` Avoid these recent words: ${recentWords.join(", ")}.`
    : ""
  const prompt = `Generate exactly ${wordCount} unique English words for a word search about ${JSON.stringify(theme)} at the ${difficulty} difficulty level. Each word must be 2 to 5 letters and use A-Z only. Give each word a short clue of at most 8 words that does not contain the answer. Return only a JSON array of objects with string fields \"word\" and \"clue\". Do not include markdown or other text.${recentWordsText}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      },
    )

    const data = await response.json()
    if (!response.ok) {
      console.error("Gemini API error:", data)
      return { words: [], error: "AI word generation failed. Please try again." }
    }
    if (data?.promptFeedback?.blockReason) {
      return { words: [], error: "AI could not generate words for this theme." }
    }

    const candidate = data?.candidates?.[0]
    if (candidate?.finishReason === "MAX_TOKENS") {
      return { words: [], error: "AI response was incomplete. Please try again." }
    }
    const text = candidate?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("")
    const generated = typeof text === "string" ? parseGeneratedWords(text) : null
    if (!generated) {
      return { words: [], error: "AI returned an invalid word list. Please try again." }
    }

    const seen = new Set<string>()
    const words: Word[] = []
    for (const item of generated) {
      if (typeof item?.word !== "string" || typeof item?.clue !== "string") continue
      const word = item.word.toUpperCase().replace(/[^A-Z]/g, "")
      const clue = item.clue.trim()
      if (word.length < 2 || word.length > 5 || !clue || seen.has(word)) continue
      seen.add(word)
      words.push({ word, definition: clue, found: false })
      if (words.length === wordCount) break
    }

    if (words.length !== wordCount) {
      return {
        words: [],
        error: `AI generated ${words.length} valid unique words; ${wordCount} are required for ${level.name}. Please try again.`,
      }
    }

    return { words }
  } catch (error) {
    console.error("Gemini request failed:", error)
    return { words: [], error: "Could not reach the AI service. Please try again." }
  }
}
