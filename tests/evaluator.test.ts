import { describe, it, expect } from 'vitest';
import { evaluateRemediation } from '../src/engine/evaluator';
import { testCases } from '../src/data/test-cases';

describe('Evaluator', () => {
  it('should pass on valid remediation', () => {
    const testCase = testCases[0]; // Concurrent Task Scheduler
    const validOutput = `
      const running = new Set();
      try {
        await Promise.all();
      } catch (e) {
        console.error(e);
      }
    `;
    expect(evaluateRemediation(testCase, validOutput)).toBe(true);
  });

  it('should fail on invalid remediation', () => {
    const testCase = testCases[0];
    const invalidOutput = `
      // Did not use tracking and did not handle errors
      await Promise.all(tasks);
    `;
    expect(evaluateRemediation(testCase, invalidOutput)).toBe(false);
  });
});
