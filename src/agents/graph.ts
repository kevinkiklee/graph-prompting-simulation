import { TestCase } from '../types';
import { callModel } from '../services/gemini';

const PROCESS_GRAPH = `
## Process Flow

### Node Descriptions

**Core Nodes:**
- \`Analyze Input\`: Read the initial request and identify the main goal.
- \`Extract Context\`: Gather all constraints, requirements, and the provided buggy code or input text.
- \`Determine Task Type\`: Decide whether the task is Engineering, Support, or Data.

**Engineering Path:**
- \`Threat Modeling\`: Identify potential security risks or edge cases in the requirements.
- \`Design Architecture\`: Plan the code structure and approach before writing.
- \`Architecture Review\`: Evaluate the design against constraints. If flaws exist, return to Design Architecture.
- \`Implement Code\`: Write the actual code based on the approved architecture.
- \`Code Review\`: Check the implemented code for bugs or missed requirements. If bugs are found, go to Refine Code.
- \`Refine Code\`: Fix any issues found during Code Review.
- \`Compile\`: Perform a final check to ensure the code is complete and syntactically valid.

**Support Path:**
- \`Sentiment Analysis\`: Determine the emotional tone of the customer (e.g., angry, confused).
- \`Fetch Guidelines\`: Recall or determine the appropriate company policy for this situation.
- \`Draft Response\`: Write the initial customer support reply.
- \`Tone Check\`: Ensure the response matches the required tone (e.g., apologetic, professional). If inappropriate, redraft.
- \`Escalation Check\`: Decide if this ticket requires manager intervention based on the customer's demands.
- \`Route to Manager\`: Pass the ticket to a higher tier if it cannot be resolved.
- \`Approve Response\`: Finalize the response if it can be sent directly to the customer.

**Data Path:**
- \`Identify Schema\`: Determine the table structures and relationships needed.
- \`Write SQL\`: Draft the database query.
- \`Optimize Query\`: Ensure the query is efficient and uses correct syntax.

**Terminal Node:**
- \`Format Output\`: Present the final code, SQL, or response text to the user.

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
INSTRUCTIONS: 
1. You MUST output your reasoning step-by-step.
2. When you transition to a new node in the graph, you MUST explicitly output a marker with the exact node name wrapped in brackets like this: [STATE: Analyze Input]. Do not omit any steps!
3. The terminal state of this graph is EXACTLY "Format Output". You MUST reach this state and output the [STATE: Format Output] marker to complete the task.
4. When you reach the "Format Output" terminal state, output the final result enclosed in \`\`\` ... \`\`\` blocks.

Input to process:
${testCase.buggyCode}
`;

  const result = await callModel(model, graphPrompt);
  
  let extractedCode = result.text;
  const regex = /```(?:javascript|js|typescript|ts|sql)?[ \t]*\r?\n([\s\S]*?)```/g;
  let match;
  let lastMatch = null;
  while ((match = regex.exec(result.text)) !== null) {
    lastMatch = match;
  }

  if (lastMatch && lastMatch[1]) {
    extractedCode = lastMatch[1].trim();
  } else {
    // If no code block is found, assume the entire output (or relevant parts) might be the answer.
    // For support tasks, this is often just plain text.
    extractedCode = result.text.trim();
  }

  return {
    output: extractedCode,
    totalLatencyMs: result.latencyMs,
    totalTokens: result.tokens,
    turnCount: 1,
    rawAgentTrace: result.text
  };
}
