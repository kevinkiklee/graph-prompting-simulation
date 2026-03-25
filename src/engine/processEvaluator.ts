import { AgentStrategy } from '../types';

const graphTransitions: Record<string, string[]> = {
  'Analyze Request': ['Categorize Domain'],
  'Categorize Domain': ['Threat Modeling', 'Draft Communication'],
  'Threat Modeling': ['Draft Architecture'],
  'Draft Architecture': ['Review Architecture'],
  'Review Architecture': ['Draft Architecture', 'Implement Core Logic'],
  'Implement Core Logic': ['Add Security Controls'],
  'Add Security Controls': ['Run Self-Test'],
  'Run Self-Test': ['Implement Core Logic', 'Finalize Output'],
  'Draft Communication': ['Review Tone'],
  'Review Tone': ['Draft Communication', 'Finalize Output'],
  'Finalize Output': []
};

const structuredTransitions: Record<string, string[]> = {
  '1. Analyze Request': ['2. Categorize Domain'],
  '2. Categorize Domain': ['3a. Threat Modeling', '3b. Draft Communication'],
  '3a. Threat Modeling': ['4a. Draft Architecture'],
  '4a. Draft Architecture': ['5a. Review Architecture'],
  '5a. Review Architecture': ['4a. Draft Architecture', '6a. Implement Core Logic'],
  '6a. Implement Core Logic': ['7a. Add Security Controls'],
  '7a. Add Security Controls': ['8a. Run Self-Test'],
  '8a. Run Self-Test': ['6a. Implement Core Logic', '9. Finalize Output'],
  '3b. Draft Communication': ['4b. Review Tone'],
  '4b. Review Tone': ['3b. Draft Communication', '9. Finalize Output'],
  '9. Finalize Output': []
};

export function evaluateProcessAdherence(strategy: AgentStrategy, traceText: string): { followed: boolean, trace: string[] } {
  if (strategy === AgentStrategy.Naive) return { followed: false, trace: [] };

  const stateRegex = /(?:\[|\()?STATE:\s*([^\]\)\n\r]+)(?:\]|\))?/gi;
  let match;
  const trace: string[] = [];

  while ((match = stateRegex.exec(traceText)) !== null) {
    const stateName = match[1].trim();
    if (stateName) trace.push(stateName);
  }

  if (trace.length === 0) return { followed: false, trace: [] };

  const transitions = strategy === AgentStrategy.Graph ? graphTransitions : structuredTransitions;
  const initialState = strategy === AgentStrategy.Graph ? 'Analyze Request' : '1. Analyze Request';
  const terminalState = strategy === AgentStrategy.Graph ? 'Finalize Output' : '9. Finalize Output';

  const isMatch = (actual: string, expected: string) => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return norm(actual) === norm(expected);
  };

  if (!isMatch(trace[0], initialState)) return { followed: false, trace };

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
  }

  if (!isMatch(trace[trace.length - 1], terminalState)) followed = false;

  return { followed, trace };
}
