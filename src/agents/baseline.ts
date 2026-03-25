import { TestCase } from '../types';
import { callModel } from '../services/gemini';

export async function runNaiveAgent(model: string, testCase: TestCase) {
  const prompt = `Task: ${testCase.description}\n\nFix the security and logic issues in this code:\n\n${testCase.buggyCode}\n\nOutput only the fixed code.`;
  const result = await callModel(model, prompt);
  
  return {
    output: result.text,
    totalLatencyMs: result.latencyMs,
    totalTokens: result.tokens,
    turnCount: 1,
    rawAgentTrace: result.text
  };
}

export async function runStructuredAgent(model: string, testCase: TestCase) {
  const prompt = `You are an expert secure code reviewer.\n\nTask: ${testCase.description}\n\nProcess:\n1. Analyze Constraints\n2. Identify Flaws\n3. Plan Remediation\n4. Draft Code\n5. Self-Critique against constraints\n6. Refine Code\n7. Output final fixed code.\n\nCode to review:\n${testCase.buggyCode}`;
  const result = await callModel(model, prompt);
  
  return {
    output: result.text,
    totalLatencyMs: result.latencyMs,
    totalTokens: result.tokens,
    turnCount: 1,
    rawAgentTrace: result.text
  };
}
