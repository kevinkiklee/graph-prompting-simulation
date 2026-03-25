import { describe, it, expect, vi } from 'vitest';
import { runNaiveAgent, runStructuredAgent } from '../src/agents/baseline';
import { runGraphAgent } from '../src/agents/graph';

let mockResponses = ['fixed code'];

vi.mock('../src/services/gemini', () => ({
  callModel: vi.fn().mockImplementation(async () => {
    return {
      text: mockResponses.length > 0 ? mockResponses.shift() : 'YES',
      tokens: 10,
      latencyMs: 100
    };
  })
}));

describe('Agents', () => {
  const mockTestCase = {
    id: 'test',
    description: 'test bug',
    buggyCode: 'bad code',
    expectedMatchRegex: /good/
  };

  it('runNaiveAgent should return correct format', async () => {
    mockResponses = ['fixed code'];
    const result = await runNaiveAgent('model', mockTestCase);
    expect(result.output).toBe('fixed code');
    expect(result.totalLatencyMs).toBe(100);
    expect(result.totalTokens).toBe(10);
    expect(result.turnCount).toBe(1);
  });

  it('runStructuredAgent should return correct format', async () => {
    mockResponses = ['fixed code'];
    const result = await runStructuredAgent('model', mockTestCase);
    expect(result.output).toBe('fixed code');
    expect(result.totalLatencyMs).toBe(100);
    expect(result.totalTokens).toBe(10);
    expect(result.turnCount).toBe(1);
  });

  it('runGraphAgent should return correct format and aggregate values', async () => {
    mockResponses = ['State: Analyze Request\n```javascript\nfinal fixed code\n```'];
    const result = await runGraphAgent('model', mockTestCase, 'low');
    expect(result.output).toBe('final fixed code');
    expect(result.totalLatencyMs).toBe(100); 
    expect(result.totalTokens).toBe(10); 
    expect(result.turnCount).toBe(1);
  });
});
