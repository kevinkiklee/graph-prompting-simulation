import { AgentStrategy } from '../types';

const graphTransitions: Record<string, string[]> = {
  'Analyze Input': ['Extract Context'],
  'Extract Context': ['Determine Task Type'],
  'Determine Task Type': ['Threat Modeling', 'Sentiment Analysis', 'Identify Schema'],
  
  'Threat Modeling': ['Design Architecture'],
  'Design Architecture': ['Architecture Review'],
  'Architecture Review': ['Design Architecture', 'Implement Code'],
  'Implement Code': ['Code Review'],
  'Code Review': ['Refine Code', 'Compile'],
  'Refine Code': ['Code Review'],
  'Compile': ['Format Output'],

  'Sentiment Analysis': ['Fetch Guidelines'],
  'Fetch Guidelines': ['Draft Response'],
  'Draft Response': ['Tone Check'],
  'Tone Check': ['Draft Response', 'Escalation Check'],
  'Escalation Check': ['Route to Manager', 'Approve Response'],
  'Route to Manager': ['Format Output'],
  'Approve Response': ['Format Output'],

  'Identify Schema': ['Write SQL'],
  'Write SQL': ['Optimize Query'],
  'Optimize Query': ['Format Output'],

  'Format Output': []
};

const structuredTransitions: Record<string, string[]> = {
  '1. Analyze Input': ['2. Extract Context'],
  '2. Extract Context': ['3. Determine Task Type'],
  '3. Determine Task Type': ['4a. Threat Modeling', '4b. Sentiment Analysis', '4c. Identify Schema'],

  '4a. Threat Modeling': ['5a. Design Architecture'],
  '5a. Design Architecture': ['6a. Architecture Review'],
  '6a. Architecture Review': ['5a. Design Architecture', '7a. Implement Code'],
  '7a. Implement Code': ['8a. Code Review'],
  '8a. Code Review': ['9a. Refine Code', '10a. Compile'],
  '9a. Refine Code': ['8a. Code Review'],
  '10a. Compile': ['11. Format Output'],

  '4b. Sentiment Analysis': ['5b. Fetch Guidelines'],
  '5b. Fetch Guidelines': ['6b. Draft Response'],
  '6b. Draft Response': ['7b. Tone Check'],
  '7b. Tone Check': ['6b. Draft Response', '8b. Escalation Check'],
  '8b. Escalation Check': ['9b. Route to Manager', '10b. Approve Response'],
  '9b. Route to Manager': ['11. Format Output'],
  '10b. Approve Response': ['11. Format Output'],

  '4c. Identify Schema': ['5c. Write SQL'],
  '5c. Write SQL': ['6c. Optimize Query'],
  '6c. Optimize Query': ['11. Format Output'],

  '11. Format Output': []
};

export function evaluateProcessAdherence(strategy: AgentStrategy, traceText: string): { followed: boolean, trace: string[], score: number } {
  if (strategy === AgentStrategy.Naive) return { followed: false, trace: [], score: 0 };

  const stateRegex = /(?:\[|\()?STATE:\s*([^\]\)\n\r]+)(?:\]|\))?/gi;
  let match;
  const trace: string[] = [];

  while ((match = stateRegex.exec(traceText)) !== null) {
    const stateName = match[1].trim();
    if (stateName) trace.push(stateName);
  }

  if (trace.length === 0) return { followed: false, trace: [], score: 0 };

  const transitions = strategy === AgentStrategy.Graph ? graphTransitions : structuredTransitions;
  const initialState = strategy === AgentStrategy.Graph ? 'Analyze Input' : '1. Analyze Input';
  const terminalState = strategy === AgentStrategy.Graph ? 'Format Output' : '11. Format Output';

  const isMatch = (actual: string, expected: string) => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return norm(actual) === norm(expected);
  };

  if (!isMatch(trace[0], initialState)) return { followed: false, trace, score: 0 };

  let validSteps = 1;
  let followed = true;
  for (let i = 0; i < trace.length - 1; i++) {
    const current = trace[i];
    const next = trace[i + 1];
    
    const expectedCurrentKey = Object.keys(transitions).find(key => isMatch(current, key));
    if (!expectedCurrentKey) {
      followed = false;
      break;
    }

    const validNextStates = transitions[expectedCurrentKey];
    const matchesAnyValidNext = validNextStates.some(expectedNext => isMatch(next, expectedNext));

    if (validNextStates.length > 0 && !matchesAnyValidNext) {
      followed = false;
      break;
    }
    validSteps++;
  }

  if (!isMatch(trace[trace.length - 1], terminalState)) {
    followed = false;
  }

  // Calculate score: (valid steps followed) / (typical path length)
  // For simplicity, we'll use 11 as the benchmark for a successful run
  const benchmarkLength = 11;
  let score = followed ? 1 : Math.min(0.95, validSteps / benchmarkLength);
  
  return { followed, trace, score };
}
