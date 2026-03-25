import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function callModel(model: string, prompt: string): Promise<{ text: string, tokens: number, latencyMs: number }> {
  const startTime = performance.now();
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    const latencyMs = Math.round(performance.now() - startTime);
    const text = response.text || '';
    
    // GenAI SDK returns token count, fallback to 0 if not present
    const tokens = response.usageMetadata?.totalTokenCount || 0;
    
    return { text, tokens, latencyMs };
  } catch (error) {
    console.error(`Error calling Gemini API:`, error);
    throw error;
  }
}
