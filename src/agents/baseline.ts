import { TestCase } from '../types';
import { callModel } from '../services/gemini';

export async function runNaiveAgent(model: string, testCase: TestCase) {
  const prompt = `Task: ${testCase.description}\n\nInput to process:\n\n${testCase.buggyCode}\n\nOutput only the final required result.`;
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
  const prompt = `You are an expert agent following a strict process checklist.\n\nTask: ${testCase.description}\n\nProcess:\n1. Analyze Input\n2. Extract Context\n3. Determine Task Type\n   - If Engineering, proceed to 4a.\n   - If Support, proceed to 4b.\n   - If Data, proceed to 4c.\n\n[Engineering Path]\n4a. Threat Modeling\n5a. Design Architecture\n6a. Architecture Review (If flaws found, go back to 5a)\n7a. Implement Code\n8a. Code Review (If bugs found, go to 9a. If tests pass, go to 10a)\n9a. Refine Code (After refining, return to 8a)\n10a. Compile (Proceed to 11)\n\n[Support Path]\n4b. Sentiment Analysis\n5b. Fetch Guidelines\n6b. Draft Response\n7b. Tone Check (If inappropriate, go back to 6b)\n8b. Escalation Check (If needs escalation, go to 9b. If can resolve, go to 10b)\n9b. Route to Manager (Proceed to 11)\n10b. Approve Response (Proceed to 11)\n\n[Data Path]\n4c. Identify Schema\n5c. Write SQL\n6c. Optimize Query (Proceed to 11)\n\n11. Format Output\n\nInput to process:\n${testCase.buggyCode}\n\nINSTRUCTIONS: You MUST output your reasoning step-by-step. When you start a step, you MUST prefix it with exactly [STATE: <step name>], for example: "[STATE: 1. Analyze Input]".\nOutput the final result wrapped in \`\`\` ... \`\`\` code blocks during step 11.`;
  const result = await callModel(model, prompt);
  
  let extractedCode = result.text;
  const match = result.text.match(/```(?:javascript|js|typescript|ts|sql)?\s*([\s\S]*?)```/);
  if (match && match[1]) {
    extractedCode = match[1].trim();
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
