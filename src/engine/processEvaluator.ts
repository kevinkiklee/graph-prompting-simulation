import { AgentStrategy } from '../types';

// Define the valid transitions for the Graph approach with branching paths
const graphTransitions: Record<string, string[]> = {
  'Analyze Request': ['Categorize Domain'],
  'Categorize Domain': ['Threat Modeling', 'Draft Communication'], // Branching point!
  
  // Code Engineering Path
  'Threat Modeling': ['Draft Architecture'],
  'Draft Architecture': ['Review Architecture'],
  'Review Architecture': ['Draft Architecture', 'Implement Core Logic'], // Loop point!
  'Implement Core Logic': ['Add Security Controls'],
  'Add Security Controls': ['Run Self-Test'],
  'Run Self-Test': ['Implement Core Logic', 'Finalize Output'], // Loop point!
  
  // Customer Support Path
  'Draft Communication': ['Review Tone'],
  'Review Tone': ['Draft Communication', 'Finalize Output'], // Loop point!

  'Finalize Output': []
};

// Define the valid transitions for the Structured list approach
const structuredTransitions: Record<string, string[]> = {
  '1. Analyze Constraints': ['2. Identify Flaws'],
  '2. Identify Flaws': ['3. Plan Remediation'],
  '3. Plan Remediation': ['4. Draft Code'],
  '4. Draft Code': ['5. Self-Critique against constraints'],
  '5. Self-Critique against constraints': ['6. Refine Code'],
  '6. Refine Code': ['7. Output final fixed code'],
  '7. Output final fixed code': []
};

export function evaluateProcessAdherence(strategy: AgentStrategy, traceText: string): { followed: boolean, trace: string[] } {
  if (strategy === AgentStrategy.Naive) return { followed: false, trace: [] };

  // Improved regex: Matches [STATE: Name], (STATE: Name), or STATE: Name
  // Non-greedy capture and lookahead to stop at closing brackets
  const stateRegex = /(?:\[|\()?STATE:\s*([^\]\)\n\r]+)(?:\]|\))?/gi;
  let match;
  const trace: string[] = [];

  while ((match = stateRegex.exec(traceText)) !== null) {
    const stateName = match[1].trim();
    if (stateName) {
      trace.push(stateName);
    }
  }

  if (trace.length === 0) return { followed: false, trace: [] };

  const transitions = strategy === AgentStrategy.Graph ? graphTransitions : structuredTransitions;
  const initialState = strategy === AgentStrategy.Graph ? 'Analyze Request' : '1. Analyze Constraints';
  const terminalState = strategy === AgentStrategy.Graph ? 'Finalize Output' : '7. Output final fixed code';

  // Helper for fuzzy string matching (case insensitive, stripped of non-alphanumeric)
  const isMatch = (actual: string, expected: string) => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return norm(actual) === norm(expected);
  };

  if (!isMatch(trace[0], initialState)) return { followed: false, trace };

  let followed = true;
  for (let i = 0; i < trace.length - 1; i++) {
    const current = trace[i];
    const next = trace[i + 1];
    
    // Find which expected state 'current' matches
    const expectedCurrentKey = Object.keys(transitions).find(key => isMatch(current, key));
    
    if (!expectedCurrentKey) {
      followed = false;
      break;
    }

    const validNextStates = transitions[expectedCurrentKey];
    const matchesAnyValidNext = validNextStates.some(expectedNext => isMatch(next, expectedNext));

    // If there are valid next states defined and we didn't match any, it's a failure
    if (validNextStates.length > 0 && !matchesAnyValidNext) {
      followed = false;
      break;
    }
  }

  if (!isMatch(trace[trace.length - 1], terminalState)) {
    followed = false;
  }

  return { followed, trace };
}
