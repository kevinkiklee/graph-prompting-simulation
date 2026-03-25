import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function callModel(model: string, prompt: string, maxRetries = 5): Promise<{ text: string, tokens: number, latencyMs: number }> {
  let retries = 0;
  let delayMs = 5000; // Start with a 5-second delay
  let totalNetworkTimeMs = 0;

  while (true) {
    const attemptStartTime = performance.now();
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      totalNetworkTimeMs += Math.round(performance.now() - attemptStartTime);
      const text = response.text || '';
      
      // GenAI SDK returns token count, fallback to 0 if not present
      const tokens = response.usageMetadata?.totalTokenCount || 0;
      
      return { text, tokens, latencyMs: totalNetworkTimeMs };
    } catch (error: any) {
      totalNetworkTimeMs += Math.round(performance.now() - attemptStartTime);
      retries++;
      
      if (retries > maxRetries) {
        console.error(`Error calling Gemini API after ${maxRetries} retries:`, error);
        throw error;
      }
      
      console.warn(`[Retry ${retries}/${maxRetries}] API Error (e.g. 503 High Demand). Waiting ${delayMs}ms before retrying...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff: 5s, 10s, 20s, 40s, 80s
    }
  }
}
