import { AgentStrategy } from '../types';

const graphLowTransitions: Record<string, string[]> = {
  'Analyze Request': ['Plan Fix'],
  'Plan Fix': ['Write Code'],
  'Write Code': ['Finalize Output'],
  'Finalize Output': []
};

const graphMediumTransitions: Record<string, string[]> = {
  'Analyze Request': ['Plan Fix'],
  'Plan Fix': ['Write Code'],
  'Write Code': ['Run Tests'],
  'Run Tests': ['Plan Fix', 'Finalize Output'],
  'Finalize Output': []
};

const graphHighTransitions: Record<string, string[]> = {
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

  const stateRegex = /(?:\[|\()?STATE:\s*([^\]\)\n\r]+)(?:\]|\))?/gi;
  let match;
  const trace: string[] = [];

  while ((match = stateRegex.exec(traceText)) !== null) {
    const stateName = match[1].trim();
    if (stateName) trace.push(stateName);
  }

  if (trace.length === 0) return { followed: false, trace: [] };

  let transitions: Record<string, string[]> = structuredTransitions;
  let initialState = '1. Analyze Constraints';
  let terminalState = '7. Output final fixed code';

  if (strategy === AgentStrategy.GraphLow) {
    transitions = graphLowTransitions;
    initialState = 'Analyze Request';
    terminalState = 'Finalize Output';
  } else if (strategy === AgentStrategy.GraphMedium) {
    transitions = graphMediumTransitions;
    initialState = 'Analyze Request';
    terminalState = 'Finalize Output';
  } else if (strategy === AgentStrategy.GraphHigh) {
    transitions = graphHighTransitions;
    initialState = 'Analyze Request';
    terminalState = 'Finalize Output';
  }

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
