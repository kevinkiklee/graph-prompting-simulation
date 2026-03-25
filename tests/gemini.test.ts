import { describe, it, expect, vi } from 'vitest';
import { callModel } from '../src/services/gemini';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockResolvedValue({
          text: 'mocked response',
          usageMetadata: { totalTokenCount: 42 }
        })
      };
    }
  };
});

describe('Gemini Service', () => {
  it('should call model and return text, tokens, and latency', async () => {
    const result = await callModel('test-model', 'hello');
    expect(result.text).toBe('mocked response');
    expect(result.tokens).toBe(42);
    expect(typeof result.latencyMs).toBe('number');
  });
});
