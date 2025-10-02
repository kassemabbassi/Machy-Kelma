"use server"
import type { Word, Difficulty } from "@/types/game"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.")
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
    recentWords.length > 0 ? `\n\nIMPORTANT: Avoid using these recently used words: ${recentWords.join(", ")}` : ""

  const prompt = `Generate 15 unique words related to the theme "${theme}" with a difficulty level of "${difficulty}". 

IMPORTANT RULES:
1. Each word must be 5 characters or less
2. Provide only a professional clue/hint for each word - DO NOT include the actual word in the definition
3. The clue should be educational and help users learn while playing
4. Make clues challenging but fair for the difficulty level
5. Ensure variety in word types and avoid repetition${recentWordsText}

Difficulty Guidelines:
- Easy: Common, everyday words with straightforward clues
- Medium: Moderately challenging words with descriptive clues  
- Hard: Advanced vocabulary with sophisticated clues

Format as JSON array with "word" and "clue" properties:
[
  { "word": "CLOUD", "clue": "Fluffy white formation in the sky that brings rain" },
  { "word": "CODE", "clue": "Instructions written for computers to execute" }
]`

  try {
    // Using the AI SDK with a custom model endpoint for Gemini
    // Note: The AI SDK typically uses model names like 'gpt-4o'.
    // To use a custom endpoint like Gemini's, we'd usually configure a custom provider.
    // For this specific request, we'll simulate the fetch call directly as requested by the user,
    // but wrap it in a Server Action for security and ease of use.

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Client": "gemini-react-wordsearch",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1000, temperature: 0.9 },
        }),
        // signal: controller.signal, // controller.signal is for client-side aborting, not needed in server action
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Gemini API error:", errorData)
      return { words: [], error: `Failed to generate content: ${errorData.error?.message || response.statusText}` }
    }

    const data = await response.json()
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
      return { words: [], error: "No content received from AI." }
    }

    // Attempt to parse the JSON string
    let parsedWords: { word: string; clue: string }[] = []
    try {
      // Gemini might wrap JSON in markdown code block, so try to extract it
      const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/)
      const jsonString = jsonMatch ? jsonMatch[1] : textContent
      parsedWords = JSON.parse(jsonString)
    } catch (parseError) {
      console.error("Failed to parse AI response JSON:", parseError)
      return { words: [], error: "Failed to parse AI response. Please try again." }
    }

    const words: Word[] = parsedWords.map((item) => ({
      word: item.word.toUpperCase().replace(/[^A-Z]/g, ""),
      definition: item.clue, // Use clue instead of definition
      found: false,
    }))

    return { words }
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return { words: [], error: `An unexpected error occurred: ${(error as Error).message}` }
  }
}
