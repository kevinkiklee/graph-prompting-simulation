import { describe, it, expect, vi } from 'vitest';
import { runNaiveAgent, runStructuredAgent } from '../src/agents/baseline';

vi.mock('../src/services/gemini', () => ({
  callModel: vi.fn().mockResolvedValue({
    text: 'fixed code',
    tokens: 10,
    latencyMs: 100
  })
}));

describe('Baseline Agents', () => {
  const mockTestCase = {
    id: 'test',
    description: 'test bug',
    buggyCode: 'bad code',
    expectedMatchRegex: /good/
  };

  it('runNaiveAgent should return correct format', async () => {
    const result = await runNaiveAgent('model', mockTestCase);
    expect(result.output).toBe('fixed code');
    expect(result.totalLatencyMs).toBe(100);
    expect(result.totalTokens).toBe(10);
    expect(result.turnCount).toBe(1);
  });

  it('runStructuredAgent should return correct format', async () => {
    const result = await runStructuredAgent('model', mockTestCase);
    expect(result.output).toBe('fixed code');
    expect(result.totalLatencyMs).toBe(100);
    expect(result.totalTokens).toBe(10);
    expect(result.turnCount).toBe(1);
  });
});
