import { TestCase } from '../types';
import { callModel } from '../services/gemini';

const PROCESS_GRAPH = `
## Process Flow

\`\`\`dot
digraph complex_task_processing {
  "Analyze Input" [shape=box];
  "Extract Context" [shape=box];
  "Determine Task Type" [shape=diamond];

  // Engineering
  "Threat Modeling" [shape=box];
  "Design Architecture" [shape=box];
  "Architecture Review" [shape=diamond];
  "Implement Code" [shape=box];
  "Code Review" [shape=diamond];
  "Refine Code" [shape=box];
  "Compile" [shape=box];

  // Support
  "Sentiment Analysis" [shape=box];
  "Fetch Guidelines" [shape=box];
  "Draft Response" [shape=box];
  "Tone Check" [shape=diamond];
  "Escalation Check" [shape=diamond];
  "Route to Manager" [shape=box];
  "Approve Response" [shape=box];

  // Data
  "Identify Schema" [shape=box];
  "Write SQL" [shape=box];
  "Optimize Query" [shape=box];

  "Format Output" [shape=doublecircle];

  "Analyze Input" -> "Extract Context";
  "Extract Context" -> "Determine Task Type";

  "Determine Task Type" -> "Threat Modeling" [label="Engineering"];
  "Determine Task Type" -> "Sentiment Analysis" [label="Support"];
  "Determine Task Type" -> "Identify Schema" [label="Data"];

  // Eng path
  "Threat Modeling" -> "Design Architecture";
  "Design Architecture" -> "Architecture Review";
  "Architecture Review" -> "Design Architecture" [label="Flaws Found"];
  "Architecture Review" -> "Implement Code" [label="Approved"];
  "Implement Code" -> "Code Review";
  "Code Review" -> "Refine Code" [label="Bugs Found"];
  "Refine Code" -> "Code Review";
  "Code Review" -> "Compile" [label="Tests Pass"];
  "Compile" -> "Format Output";

  // Support path
  "Sentiment Analysis" -> "Fetch Guidelines";
  "Fetch Guidelines" -> "Draft Response";
  "Draft Response" -> "Tone Check";
  "Tone Check" -> "Draft Response" [label="Inappropriate"];
  "Tone Check" -> "Escalation Check" [label="Appropriate"];
  "Escalation Check" -> "Route to Manager" [label="Needs Escalation"];
  "Escalation Check" -> "Approve Response" [label="Can Resolve"];
  "Route to Manager" -> "Format Output";
  "Approve Response" -> "Format Output";

  // Data path
  "Identify Schema" -> "Write SQL";
  "Write SQL" -> "Optimize Query";
  "Optimize Query" -> "Format Output";
}
\`\`\`
`;

export async function runGraphAgent(model: string, testCase: TestCase) {
  const systemBase = `You are an expert agent following a strict process graph.\n${PROCESS_GRAPH}`;

  const graphPrompt = `${systemBase}

Task: ${testCase.description}

Execute the process graph from start to finish for the following input.
INSTRUCTIONS: You MUST output your reasoning step-by-step. When you transition to a new node in the graph, you MUST explicitly output a marker with the exact node name wrapped in brackets like this: [STATE: Analyze Input]. Do not omit any steps!

When you reach the "Format Output" terminal state, output the final result enclosed in \`\`\` ... \`\`\` blocks.

Input to process:
${testCase.buggyCode}
`;

  const result = await callModel(model, graphPrompt);
  
  let extractedCode = result.text;
  const match = extractedCode.match(/```(?:javascript|js|typescript|ts|sql)?\n([\s\S]*?)```/);
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
