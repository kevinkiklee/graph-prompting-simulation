import { TestCase } from '../types';
import { Script } from 'vm';

export function evaluateRemediation(testCase: TestCase, agentOutput: string): boolean {
  if (typeof testCase.expectedMatchRegex === 'string') {
    return agentOutput.includes(testCase.expectedMatchRegex);
  }
  return testCase.expectedMatchRegex.test(agentOutput);
}

export function validateSyntax(testCase: TestCase, agentOutput: string): boolean | undefined {
  if (testCase.id.startsWith('support-triage')) {
    return undefined;
  }

  const codeBlockRegex = /```(?:javascript|js)?\s*([\s\S]*?)```/gi;
  let match;
  let codeFound = false;
  
  while ((match = codeBlockRegex.exec(agentOutput)) !== null) {
    const code = match[1].trim();
    if (!code) continue;
    codeFound = true;
    try {
      new Script(code);
    } catch (e) {
      return false;
    }
  }

  // If no code blocks found, try to parse the whole output as a fallback
  if (!codeFound) {
    try {
      new Script(agentOutput);
      return true;
    } catch (e) {
      return false;
    }
  }

  return true;
}
