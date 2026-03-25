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
  'Refine Code': ['Code Review', 'Compile'],
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
  '9a. Refine Code': ['8a. Code Review', '10a. Compile'],
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

export function evaluateProcessAdherence(strategy: AgentStrategy, traceText: string): { followed: boolean, trace: string[], score: number, pathId?: string, errors?: string[] } {
  if (strategy === AgentStrategy.Naive) return { followed: false, trace: [], score: 0 };

  const stateRegex = /(?:\[|\()?STATE:\s*([^\]\)\n\r]+)(?:\]|\))?/gi;
  let match;
  const trace: string[] = [];
  const errors: string[] = [];

  while ((match = stateRegex.exec(traceText)) !== null) {
    const stateName = match[1].trim();
    if (stateName) trace.push(stateName);
  }

  if (trace.length === 0) {
    errors.push('TraceEmpty');
    return { followed: false, trace: [], score: 0, errors };
  }

  const transitions = strategy === AgentStrategy.Graph ? graphTransitions : structuredTransitions;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const isMatch = (actual: string, expected: string) => norm(actual) === norm(expected);

  // Identify Path ID based on the first unique branching state or first state
  let pathId: string | undefined;
  if (trace.some(s => isMatch(s, 'Threat Modeling') || isMatch(s, '4a. Threat Modeling'))) pathId = 'Engineering';
  else if (trace.some(s => isMatch(s, 'Sentiment Analysis') || isMatch(s, '4b. Sentiment Analysis'))) pathId = 'Sentiment';
  else if (trace.some(s => isMatch(s, 'Identify Schema') || isMatch(s, '4c. Identify Schema'))) pathId = 'SQL';

  const initialState = strategy === AgentStrategy.Graph ? 'Analyze Input' : '1. Analyze Input';
  const terminalState = strategy === AgentStrategy.Graph ? 'Format Output' : '11. Format Output';

  if (!isMatch(trace[0], initialState)) {
    errors.push('InvalidInitialState');
    return { followed: false, trace, score: 0, pathId, errors };
  }

  let validSteps = 1;
  let followed = true;
  for (let i = 0; i < trace.length - 1; i++) {
    const current = trace[i];
    const next = trace[i + 1];
    
    const expectedCurrentKey = Object.keys(transitions).find(key => isMatch(current, key));
    if (!expectedCurrentKey) {
      followed = false;
      errors.push(`UnknownState:${current}`);
      break;
    }

    const validNextStates = transitions[expectedCurrentKey];
    const matchesAnyValidNext = validNextStates.some(expectedNext => isMatch(next, expectedNext));

    if (validNextStates.length > 0 && !matchesAnyValidNext) {
      followed = false;
      errors.push(`InvalidTransition:${current}->${next}`);
      break;
    }
    validSteps++;
  }

  if (followed && !isMatch(trace[trace.length - 1], terminalState)) {
    followed = false;
    errors.push('InvalidTerminalState');
  }

  // Path-specific benchmark lengths
  const benchmarks: Record<string, number> = {
    'Engineering': 11,
    'Sentiment': 9,
    'SQL': 6
  };
  const benchmarkLength = (pathId && benchmarks[pathId]) || 11;
  let score = followed ? 1 : Math.min(0.95, validSteps / benchmarkLength);
  
  return { followed, trace, score, pathId, errors };
}
