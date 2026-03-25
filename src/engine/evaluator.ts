import { TestCase } from '../types';

export function evaluateRemediation(testCase: TestCase, agentOutput: string): boolean {
  if (typeof testCase.expectedMatchRegex === 'string') {
    return agentOutput.includes(testCase.expectedMatchRegex);
  }
  return testCase.expectedMatchRegex.test(agentOutput);
}
