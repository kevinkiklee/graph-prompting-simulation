import { useEffect, useRef } from 'react';
import { graphviz } from 'd3-graphviz';

interface ProcessGraphProps {
  strategy: string;
  pathId?: string;
  trace?: string[];
  errors?: string[];
  
}

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

export function ProcessGraph({ strategy, pathId, trace = [], errors = [] }: ProcessGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isGraph = strategy === 'graph';
    const transitions = isGraph ? graphTransitions : structuredTransitions;
    
    // Normalize strings for matching
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Extract error states
    const errorStates = new Set<string>();
    errors.forEach(err => {
      if (err.startsWith('UnknownState:')) {
        errorStates.add(norm(err.replace('UnknownState:', '').trim()));
      } else if (err.startsWith('InvalidTransition:')) {
        const parts = err.replace('InvalidTransition:', '').split('->');
        if (parts.length === 2) {
          errorStates.add(norm(parts[1].trim()));
        }
      } else if (err === 'InvalidInitialState' && trace.length > 0) {
        errorStates.add(norm(trace[0]));
      } else if (err === 'InvalidTerminalState' && trace.length > 0) {
        errorStates.add(norm(trace[trace.length - 1]));
      }
    });

    const normTrace = trace.map(norm);
    
    // Build DOT string
    let dot = 'digraph G {\n';
    dot += '  rankdir="TB";\n';
    dot += `  bgcolor="transparent";\n`;
    dot += `  node [shape="box", style="filled", fontname="sans-serif", fontsize=10, fillcolor="#f9fafb", color="#d1d5db", fontcolor="#111827"];\n`;
    dot += `  edge [color="#9ca3af", penwidth=1.5];\n`;

    // Gather all nodes that are part of the base graph (filter by pathId if necessary, but showing whole graph is okay)
    // Actually, maybe show the whole graph for the path, or the entire graph
    const allNodes = new Set<string>();
    const edges: [string, string][] = [];

    // To prevent the graph from being too huge, we can filter nodes by the identified pathId, plus common start nodes
    let includePaths: string[] = [];
    if (pathId === 'Engineering') {
      includePaths = isGraph 
        ? ['Threat Modeling', 'Design Architecture', 'Architecture Review', 'Implement Code', 'Code Review', 'Refine Code', 'Compile']
        : ['4a. Threat Modeling', '5a. Design Architecture', '6a. Architecture Review', '7a. Implement Code', '8a. Code Review', '9a. Refine Code', '10a. Compile'];
    } else if (pathId === 'Sentiment') {
      includePaths = isGraph
        ? ['Sentiment Analysis', 'Fetch Guidelines', 'Draft Response', 'Tone Check', 'Escalation Check', 'Route to Manager', 'Approve Response']
        : ['4b. Sentiment Analysis', '5b. Fetch Guidelines', '6b. Draft Response', '7b. Tone Check', '8b. Escalation Check', '9b. Route to Manager', '10b. Approve Response'];
    } else if (pathId === 'SQL') {
      includePaths = isGraph
        ? ['Identify Schema', 'Write SQL', 'Optimize Query']
        : ['4c. Identify Schema', '5c. Write SQL', '6c. Optimize Query'];
    }

    const commonNodes = isGraph 
      ? ['Analyze Input', 'Extract Context', 'Determine Task Type', 'Format Output']
      : ['1. Analyze Input', '2. Extract Context', '3. Determine Task Type', '11. Format Output'];
    
    const allowedNodes = new Set([...commonNodes, ...includePaths]);

    Object.entries(transitions).forEach(([from, tos]) => {
      if (allowedNodes.has(from)) {
        allNodes.add(from);
        tos.forEach(to => {
          if (allowedNodes.has(to)) {
            allNodes.add(to);
            edges.push([from, to]);
          }
        });
      }
    });

    // Also add any hallucinated nodes from the trace that aren't in allowedNodes
    trace.forEach(t => {
      if (!Array.from(allNodes).some(n => norm(n) === norm(t))) {
        allNodes.add(t); // Add hallucinated node
      }
    });

    // Define nodes
    allNodes.forEach(node => {
      const nNode = norm(node);
      const isVisited = normTrace.includes(nNode);
      const isError = errorStates.has(nNode);
      
      let fillcolor = '#f9fafb';
      let fontcolor = '#111827';
      let color = '#d1d5db';
      let penwidth = 1;

      if (isError) {
        fillcolor = '#991b1b'; // red-800
        fontcolor = '#fef2f2'; // red-50
        color = '#dc2626'; // red-600
        penwidth = 2;
      } else if (isVisited) {
        fillcolor = '#166534'; // green-800
        fontcolor = '#f0fdf4'; // green-50
        color = '#16a34a'; // green-600
        penwidth = 2;
      }

      dot += `  "${node}" [fillcolor="${fillcolor}", fontcolor="${fontcolor}", color="${color}", penwidth=${penwidth}];\n`;
    });

    // Define standard edges
    edges.forEach(([from, to]) => {
      // Check if this exact edge was traversed in the trace
      let edgeColor = '#9ca3af';
      let penwidth = 1.5;

      const nFrom = norm(from);
      const nTo = norm(to);
      
      let traversed = false;
      for (let i = 0; i < normTrace.length - 1; i++) {
        if (normTrace[i] === nFrom && normTrace[i+1] === nTo) {
          traversed = true;
          break;
        }
      }

      if (traversed) {
        edgeColor = '#16a34a'; // green-600
        penwidth = 2.5;
      }
      
      dot += `  "${from}" -> "${to}" [color="${edgeColor}", penwidth=${penwidth}];\n`;
    });

    // Define hallucinated/invalid edges from the trace
    for (let i = 0; i < trace.length - 1; i++) {
      const from = trace[i];
      const to = trace[i+1];
      const nFrom = norm(from);
      const nTo = norm(to);
      
      // Find if this is a standard edge
      let isStandard = false;
      Object.entries(transitions).forEach(([stdFrom, stdTos]) => {
        if (norm(stdFrom) === nFrom) {
          stdTos.forEach(stdTo => {
            if (norm(stdTo) === nTo) isStandard = true;
          });
        }
      });

      if (!isStandard) {
        // Draw an invalid edge
        dot += `  "${from}" -> "${to}" [color="#dc2626", penwidth=2.5, style="dashed"];\n`;
      }
    }

    dot += '}';

    // Render with d3-graphviz
    try {
      graphviz(containerRef.current)
        .options({ fit: true, zoom: true })
        .renderDot(dot);
    } catch (e) {
      console.error('Failed to render graphviz:', e);
      if (containerRef.current) {
        containerRef.current.innerHTML = '<div class="text-red-500 p-4">Failed to render graph visualization. Ensure WebAssembly is supported.</div>';
      }
    }

  }, [strategy, pathId, trace, errors]);

  if (strategy === 'naive') {
    return <div className="text-gray-500 text-sm p-4 italic">No process graph available for naive strategy.</div>;
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-96 overflow-hidden rounded bg-gray-50 border border-gray-200" 
    />
  );
}
