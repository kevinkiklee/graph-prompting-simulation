import { TestCase } from '../types';
import { callModel } from '../services/gemini';

const PROCESS_GRAPH = `
## Process Flow

\`\`\`dot
digraph remediation {
  "Analyze Request" [shape=box];
  "Threat Modeling" [shape=box];
  "Draft Architecture" [shape=box];
  "Review Architecture" [shape=diamond];
  "Implement Core Logic" [shape=box];
  "Add Security Controls" [shape=box];
  "Run Self-Test" [shape=diamond];
  "Finalize Code" [shape=doublecircle];

  "Analyze Request" -> "Threat Modeling";
  "Threat Modeling" -> "Draft Architecture";
  "Draft Architecture" -> "Review Architecture";
  "Review Architecture" -> "Draft Architecture" [label="Flaws found"];
  "Review Architecture" -> "Implement Core Logic" [label="Approved"];
  "Implement Core Logic" -> "Add Security Controls";
  "Add Security Controls" -> "Run Self-Test";
  "Run Self-Test" -> "Implement Core Logic" [label="Bugs found"];
  "Run Self-Test" -> "Finalize Code" [label="All tests pass"];
}
\`\`\`
`;

export async function runGraphAgent(model: string, testCase: TestCase) {
  const systemBase = `You are an expert secure code reviewer following a strict process graph.\n${PROCESS_GRAPH}`;

  const graphPrompt = `${systemBase}

Task: ${testCase.description}

Execute the process graph from start to finish for the following buggy code.
INSTRUCTIONS: You MUST output your reasoning step-by-step. When you transition to a new node in the graph, you MUST explicitly output a marker with the exact node name wrapped in brackets like this: [STATE: Analyze Request]. Do not omit any steps!

When you reach the "Finalize Code" terminal state, output the final fully fixed code enclosed in \`\`\`javascript ... \`\`\` code blocks.

Code to review:
${testCase.buggyCode}
`;

  const result = await callModel(model, graphPrompt);
  
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
    rawAgentTrace: result.text
  };
}
