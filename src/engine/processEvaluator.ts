import { AgentStrategy } from '../types';

// Define the valid transitions for the Graph approach
const graphTransitions: Record<string, string[]> = {
  'Analyze Request': ['Threat Modeling'],
  'Threat Modeling': ['Draft Architecture'],
  'Draft Architecture': ['Review Architecture'],
  'Review Architecture': ['Draft Architecture', 'Implement Core Logic'],
  'Implement Core Logic': ['Add Security Controls'],
  'Add Security Controls': ['Run Self-Test'],
  'Run Self-Test': ['Implement Core Logic', 'Finalize Code'],
  'Finalize Code': []
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

  const stateRegex = /\[STATE:\s*(.*?)\]/g;
  let match;
  const trace: string[] = [];

  while ((match = stateRegex.exec(traceText)) !== null) {
    trace.push(match[1].trim());
  }

  if (trace.length === 0) return { followed: false, trace: [] };

  const transitions = strategy === AgentStrategy.Graph ? graphTransitions : structuredTransitions;
  const initialState = strategy === AgentStrategy.Graph ? 'Analyze Request' : '1. Analyze Constraints';
  const terminalState = strategy === AgentStrategy.Graph ? 'Finalize Code' : '7. Output final fixed code';

  if (trace[0] !== initialState) return { followed: false, trace };

  let followed = true;
  for (let i = 0; i < trace.length - 1; i++) {
    const current = trace[i];
    const next = trace[i + 1];
    
    const validNextStates = transitions[current];
    if (!validNextStates || !validNextStates.includes(next)) {
      followed = false;
      break;
    }
  }

  if (trace[trace.length - 1] !== terminalState) {
    followed = false;
  }

  return { followed, trace };
}
