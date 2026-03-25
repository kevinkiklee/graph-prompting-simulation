import { TestCase } from '../types';
import { callModel } from '../services/gemini';

const GRAPH_LOW = `
## Process Flow

\`\`\`dot
digraph task_processing {
  "Analyze Request" [shape=box];
  "Plan Fix" [shape=box];
  "Write Code" [shape=box];
  "Finalize Output" [shape=doublecircle];

  "Analyze Request" -> "Plan Fix";
  "Plan Fix" -> "Write Code";
  "Write Code" -> "Finalize Output";
}
\`\`\`
`;

const GRAPH_MEDIUM = `
## Process Flow

\`\`\`dot
digraph task_processing {
  "Analyze Request" [shape=box];
  "Plan Fix" [shape=box];
  "Write Code" [shape=box];
  "Run Tests" [shape=diamond];
  "Finalize Output" [shape=doublecircle];

  "Analyze Request" -> "Plan Fix";
  "Plan Fix" -> "Write Code";
  "Write Code" -> "Run Tests";
  "Run Tests" -> "Plan Fix" [label="Tests failed"];
  "Run Tests" -> "Finalize Output" [label="Tests passed"];
}
\`\`\`
`;

const GRAPH_HIGH = `
## Process Flow

\`\`\`dot
digraph task_processing {
  "Analyze Request" [shape=box];
  "Categorize Domain" [shape=diamond];
  "Threat Modeling" [shape=box];
  "Draft Architecture" [shape=box];
  "Review Architecture" [shape=diamond];
  "Implement Core Logic" [shape=box];
  "Add Security Controls" [shape=box];
  "Run Self-Test" [shape=diamond];
  "Draft Communication" [shape=box];
  "Review Tone" [shape=diamond];
  "Finalize Output" [shape=doublecircle];

  "Analyze Request" -> "Categorize Domain";
  
  "Categorize Domain" -> "Threat Modeling" [label="Domain is Code/Engineering"];
  "Categorize Domain" -> "Draft Communication" [label="Domain is Customer Support"];

  "Threat Modeling" -> "Draft Architecture";
  "Draft Architecture" -> "Review Architecture";
  "Review Architecture" -> "Draft Architecture" [label="Flaws found"];
  "Review Architecture" -> "Implement Core Logic" [label="Approved"];
  "Implement Core Logic" -> "Add Security Controls";
  "Add Security Controls" -> "Run Self-Test";
  "Run Self-Test" -> "Implement Core Logic" [label="Bugs found"];
  "Run Self-Test" -> "Finalize Output" [label="All tests pass"];

  "Draft Communication" -> "Review Tone";
  "Review Tone" -> "Draft Communication" [label="Tone inappropriate"];
  "Review Tone" -> "Finalize Output" [label="Tone approved"];
}
\`\`\`
`;

export async function runGraphAgent(model: string, testCase: TestCase, level: 'low' | 'medium' | 'high') {
  let selectedGraph = GRAPH_LOW;
  if (level === 'medium') selectedGraph = GRAPH_MEDIUM;
  if (level === 'high') selectedGraph = GRAPH_HIGH;

  const systemBase = `You are an expert agent following a strict process graph.\n${selectedGraph}`;

  const graphPrompt = `${systemBase}

Task: ${testCase.description}

Execute the process graph from start to finish for the following input.
INSTRUCTIONS: You MUST output your reasoning step-by-step. When you transition to a new node in the graph, you MUST explicitly output a marker with the exact node name wrapped in brackets like this: [STATE: Analyze Request]. Do not omit any steps!

When you reach the "Finalize Output" terminal state, output the final result enclosed in \`\`\` ... \`\`\` blocks.

Input to process:
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
