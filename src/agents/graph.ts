import { TestCase } from '../types';
import { callModel } from '../services/gemini';

export async function runGraphAgent(model: string, testCase: TestCase, maxRetries = 2) {
  let totalLatencyMs = 0;
  let totalTokens = 0;
  let turnCount = 0;
  let currentOutput = "";

  // ANALYZE
  const analyzePrompt = `Analyze the security and logic issues in this code:\n\n${testCase.buggyCode}\n\nList the vulnerabilities.`;
  const analysis = await callModel(model, analyzePrompt);
  totalLatencyMs += analysis.latencyMs;
  totalTokens += analysis.tokens;
  turnCount++;

  let retries = 0;
  let planOutput = "";

  while (retries <= maxRetries) {
    // PLAN
    const planPrompt = `Based on this analysis:\n${analysis.text}\n\nPlan a fix for the code:\n${testCase.buggyCode}\n\nOutline the steps to fix it.`;
    const plan = await callModel(model, planPrompt);
    totalLatencyMs += plan.latencyMs;
    totalTokens += plan.tokens;
    turnCount++;
    planOutput = plan.text;

    // FIX
    const fixPrompt = `Based on this plan:\n${planOutput}\n\nOutput ONLY the fully fixed code. Do not include markdown blocks if possible, just the raw code.`;
    const fix = await callModel(model, fixPrompt);
    totalLatencyMs += fix.latencyMs;
    totalTokens += fix.tokens;
    turnCount++;
    currentOutput = fix.text;

    // VERIFY
    const verifyPrompt = `Original code:\n${testCase.buggyCode}\n\nFixed code:\n${currentOutput}\n\nDoes the fixed code resolve all original issues without introducing new ones? Reply with only YES or NO.`;
    const verify = await callModel(model, verifyPrompt);
    totalLatencyMs += verify.latencyMs;
    totalTokens += verify.tokens;
    turnCount++;

    if (verify.text.toUpperCase().includes('YES')) {
      break;
    }
    retries++;
  }

  return {
    output: currentOutput,
    totalLatencyMs,
    totalTokens,
    turnCount
  };
}
