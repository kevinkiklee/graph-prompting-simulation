import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function callModel(model: string, prompt: string, maxRetries = 5, timeoutMs = 120000): Promise<{ text: string, tokens: number, latencyMs: number }> {
  let retries = 0;
  let delayMs = 5000; // Start with a 5-second delay
  let totalNetworkTimeMs = 0;

  while (true) {
    const attemptStartTime = performance.now();
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(new Error('API Timeout')), timeoutMs);

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: 'You are a helpful assistant.',
        }
      }, { signal: abortController.signal });

      clearTimeout(timeoutId);
      
      // Only count the successful attempt's time toward the agent's actual "thinking" latency
      const attemptLatencyMs = Math.round(performance.now() - attemptStartTime);
      
      const text = response.text || '';
      const tokens = response.usageMetadata?.totalTokenCount || 0;
      
      return { text, tokens, latencyMs: attemptLatencyMs };
    } catch (error: any) {
      clearTimeout(timeoutId);
      retries++;
      
      if (retries > maxRetries) {
        console.error(`Error calling Gemini API after ${maxRetries} retries:`, error);
        throw error;
      }
      
      console.warn(`[Retry ${retries}/${maxRetries}] API Error/Timeout. Waiting ${delayMs}ms before retrying...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff: 5s, 10s, 20s, 40s, 80s
    }
  }
}
