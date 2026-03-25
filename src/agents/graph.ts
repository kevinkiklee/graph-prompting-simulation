import { TestCase } from '../types';
import { callModel } from '../services/gemini';

const PROCESS_GRAPH = `
## Process Flow

\`\`\`dot
digraph remediation {
    "Analyze code" [shape=box];
    "Plan remediation" [shape=box];
    "Apply fix" [shape=box];
    "Verify fix" [shape=box];
    "Success" [shape=doublecircle];

    "Analyze code" -> "Plan remediation";
    "Plan remediation" -> "Apply fix";
    "Apply fix" -> "Verify fix";
    "Verify fix" -> "Plan remediation" [label="issue remains"];
    "Verify fix" -> "Success" [label="verified"];
}
\`\`\`
`;

export async function runGraphAgent(model: string, testCase: TestCase, maxRetries = 2) {
  let totalLatencyMs = 0;
  let totalTokens = 0;
  let turnCount = 0;
  let currentOutput = "";

  const systemBase = `You are an expert secure code reviewer following a strict process graph.\n${PROCESS_GRAPH}`;

  // ANALYZE
  const analyzePrompt = `${systemBase}\n\nCURRENT STATE: "Analyze code"\n\nTask: Analyze the security and logic issues in this code:\n\n${testCase.buggyCode}\n\nList the vulnerabilities found.`;
  const analysis = await callModel(model, analyzePrompt);
  totalLatencyMs += analysis.latencyMs;
  totalTokens += analysis.tokens;
  turnCount++;

  let retries = 0;
  let planOutput = "";

  while (retries <= maxRetries) {
    // PLAN
    const planPrompt = `${systemBase}\n\nCURRENT STATE: "Plan remediation"\n\nAnalysis context:\n${analysis.text}\n\nTask: Plan a fix for the code:\n${testCase.buggyCode}\n\nOutline the specific steps to remediate the vulnerabilities.`;
    const plan = await callModel(model, planPrompt);
    totalLatencyMs += plan.latencyMs;
    totalTokens += plan.tokens;
    turnCount++;
    planOutput = plan.text;

    // FIX
    const fixPrompt = `${systemBase}\n\nCURRENT STATE: "Apply fix"\n\nRemediation Plan:\n${planOutput}\n\nTask: Output ONLY the fully fixed code. Do not include markdown blocks, just the raw code.`;
    const fix = await callModel(model, fixPrompt);
    totalLatencyMs += fix.latencyMs;
    totalTokens += fix.tokens;
    turnCount++;
    currentOutput = fix.text;

    // VERIFY
    const verifyPrompt = `${systemBase}\n\nCURRENT STATE: "Verify fix"\n\nOriginal code:\n${testCase.buggyCode}\n\nFixed code:\n${currentOutput}\n\nTask: Does the fixed code resolve all original issues without introducing new ones? Reply with only YES or NO.`;
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
