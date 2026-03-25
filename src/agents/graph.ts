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

export async function runGraphAgent(model: string, testCase: TestCase) {
  const systemBase = `You are an expert secure code reviewer following a strict process graph.\n${PROCESS_GRAPH}`;

  const graphPrompt = `${systemBase}

Task: Execute the process graph from start to finish for the following buggy code.
Output your thought process as you move through each node in the graph (e.g., "State: Analyze code...").

When you reach the "Success" terminal state, output the final fully fixed code enclosed in \`\`\`javascript ... \`\`\` code blocks.

Code to review:
${testCase.buggyCode}
`;

  const result = await callModel(model, graphPrompt);
  
  // Extract just the code from the final output block to be parsed by the evaluator
  let extractedCode = result.text;
  const match = extractedCode.match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)```/);
  if (match && match[1]) {
    extractedCode = match[1].trim();
  }

  return {
    output: extractedCode,
    totalLatencyMs: result.latencyMs,
    totalTokens: result.tokens,
    turnCount: 1,
    rawAgentTrace: result.text // We keep the full trace for the logs if needed, but return the extracted code as output
  };
}
