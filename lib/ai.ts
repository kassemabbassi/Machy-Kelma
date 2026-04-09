"use server"

import type { Word, Difficulty } from "@/types/game"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.")
}

// Stable model (don’t overthink it)
const GEMINI_MODEL = "models/gemini-2.5-flash"

/**
 * Fix partially truncated JSON returned by Gemini
 */
function fixTruncatedJson(input: string) {
  let cleaned = input.trim()

  const firstBracket = cleaned.indexOf("[")
  const lastBrace = cleaned.lastIndexOf("}")

  if (firstBracket === -1 || lastBrace === -1) {
    return cleaned
  }

  cleaned = cleaned.slice(firstBracket, lastBrace + 1)

  // Ensure closing array bracket exists
  if (!cleaned.endsWith("]")) {
    cleaned += "]"
  }

  return cleaned
}

export async function generateGameContent(
  theme: string,
  difficulty: Difficulty,
  recentWords: string[] = [],
): Promise<{ words: Word[]; error?: string }> {
  if (!GEMINI_API_KEY) {
    return { words: [], error: "AI API key is not configured." }
  }

  const recentWordsText =
    recentWords.length > 0
      ? `\nIMPORTANT: Avoid these words: ${recentWords.join(", ")}`
      : ""

  const prompt = `
Generate EXACTLY 15 unique words related to the theme "${theme}" with difficulty "${difficulty}".

STRICT RULES:
- Each word MUST be 5 characters or less
- Each clue MUST be max 8 words
- Return ONLY valid JSON
- No markdown, no explanation, no extra text
- Do NOT include the word inside the clue
- Output must be a JSON array with "word" and "clue"
${recentWordsText}

OUTPUT FORMAT ONLY:
[
  { "word": "CLOUD", "clue": "Fluffy sky formation" },
  { "word": "CODE", "clue": "Instructions for computers" }
]
`

  async function callGemini(retry = 2): Promise<string | null> {
    for (let i = 0; i <= retry; i++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.3,
              },
            }),
          },
        )

        const data = await response.json()

        console.log("🔥 Gemini raw response:", JSON.stringify(data, null, 2))

        if (!response.ok) {
          console.error("Gemini API error:", data)
          continue
        }

        if (data?.promptFeedback?.blockReason) {
          return null
        }

        const candidate = data?.candidates?.[0]
        const parts = candidate?.content?.parts

        if (!parts || parts.length === 0) continue

        return parts.map((p: any) => p.text ?? "").join("")
      } catch (err) {
        console.error("Gemini request failed:", err)
        if (i === retry) return null
      }
    }

    return null
  }

  try {
    const textContent = await callGemini()

    if (!textContent) {
      return {
        words: [],
        error: "No content received from AI.",
      }
    }

    let jsonString = textContent

    const match = textContent.match(/```json\s*([\s\S]*?)```/)
    if (match) {
      jsonString = match[1]
    }

    jsonString = fixTruncatedJson(jsonString)

    let parsed: { word: string; clue: string }[]

    try {
      parsed = JSON.parse(jsonString)
    } catch (err) {
      console.error("JSON parse failed:", jsonString)
      return {
        words: [],
        error: "AI returned invalid JSON (truncated or malformed).",
      }
    }

    const words: Word[] = parsed
      .filter(
        (w) =>
          w.word &&
          w.clue &&
          typeof w.word === "string" &&
          w.word.length <= 5,
      )
      .map((item) => ({
        word: item.word.toUpperCase().replace(/[^A-Z]/g, ""),
        definition: item.clue,
        found: false,
      }))

    return { words }
  } catch (error) {
    return {
      words: [],
      error: `Unexpected error: ${(error as Error).message}`,
    }
  }
}