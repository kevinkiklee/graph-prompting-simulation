import { TestCase } from '../types';
import { callModel } from '../services/gemini';

export async function runNaiveAgent(model: string, testCase: TestCase) {
  const prompt = `Fix the security and logic issues in this code:\n\n${testCase.buggyCode}\n\nOutput only the fixed code.`;
  const result = await callModel(model, prompt);
  
  return {
    output: result.text,
    totalLatencyMs: result.latencyMs,
    totalTokens: result.tokens,
    turnCount: 1
  };
}

export async function runStructuredAgent(model: string, testCase: TestCase) {
  const prompt = `You are an expert secure code reviewer.\n\nTask: Fix the issues in the provided code.\n\nProcess:\n1. Analyze the issue in the code.\n2. Plan a fix.\n3. Output the exact fixed code.\n4. Verify it works.\n\nCode to review:\n${testCase.buggyCode}`;
  const result = await callModel(model, prompt);
  
  return {
    output: result.text,
    totalLatencyMs: result.latencyMs,
    totalTokens: result.tokens,
    turnCount: 1
  };
}
