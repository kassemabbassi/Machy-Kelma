import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(request) {
  try {
    const { action, domain, word, count } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set in environment variables' },
        { status: 500 }
      );
    }

    if (action === 'generateWords') {
      const prompt = `Generate exactly ${count} simple English words (3-12 letters) related to the domain "${domain}". 
      Respond ONLY with the words separated by commas, no explanations or numbering.
      Example format: WORD1,WORD2,WORD3,WORD4,WORD5,WORD6,WORD7,WORD8`;

      const result = await model.generateContent(prompt);
      const generatedText = result.response.text().trim();

      // Clean and extract words
      const words = generatedText
        .replace(/[^\w,]/g, '')
        .split(',')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 3 && word.length <= 12)
        .slice(0, count);

      // Ensure we have enough words
      if (words.length < count) {
        const fallbackWords = ['REACT', 'CODE', 'WEB', 'API', 'DATA', 'TECH', 'SMART', 'LEARN'];
        return NextResponse.json({
          words: words.concat(fallbackWords).slice(0, count)
        });
      }

      return NextResponse.json({ words });
    }

    if (action === 'explainWord') {
      const prompt = `Explain the word "${word}" in the context of the domain "${domain}" in French. 
      Provide a simple and short explanation (maximum 2 sentences) that aids learning.
      Be pedagogical and accessible.`;

      const result = await model.generateContent(prompt);
      const explanation = result.response.text().trim();

      return NextResponse.json({ explanation });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}