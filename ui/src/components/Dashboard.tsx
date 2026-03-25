import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface SimulationRun {
  runId: string;
  timestamp: string;
  model: string;
  strategy: string;
  testCaseId: string;
  success: boolean;
  syntaxValid?: boolean;
  processAdherence?: boolean;
  processAdherenceScore?: number;
  latencyMs: number;
  totalTokens: number;
  tokensPerSecond?: number;
  turnCount: number;
  rawOutput: string;
  rawAgentTrace?: string;
  stateTrace?: string[];
  pathId?: string;
  errors?: string[];
}

export function Dashboard() {
  const [data, setData] = useState<SimulationRun[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetch('/results.jsonl')
      .then(res => res.text())
      .then(text => {
        if (!text) return;
        const lines = text.split('\n').filter(Boolean);
        const runs = lines.map(line => JSON.parse(line));
        setData(runs);
      })
      .catch(err => console.error('Failed to fetch logs:', err));
  }, []);

  if (!data.length) return <div className="p-8 text-center">Loading simulation results...</div>;

  // Group data by Model, then by Strategy
  const rawModels = Array.from(new Set(data.map(d => d.model)));
  
  // Custom sort order for models and strategies
  const modelOrder = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3-flash',
    'gemini-3.1-pro'
  ];
  
  const models = rawModels.sort((a, b) => {
    const displayA = a.replace('-preview', '');
    const displayB = b.replace('-preview', '');
    const indexA = modelOrder.indexOf(displayA);
    const indexB = modelOrder.indexOf(displayB);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const rawStrategies = Array.from(new Set(data.map(d => d.strategy)));
  const strategyOrder = ['naive', 'structured', 'graph'];
  const strategies = rawStrategies.sort((a, b) => {
    const indexA = strategyOrder.indexOf(a);
    const indexB = strategyOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Colors for different strategies
  const strategyColors: Record<string, string> = {
    'naive': '#94a3b8',      // slate-400
    'structured': '#3b82f6', // blue-500
    'graph': '#10b981'       // emerald-500
  };

  const modelChartData = models.map(model => {
    const modelRuns = data.filter(d => d.model === model);
    const displayModel = model.replace('-preview', '');
    const entry: any = { model: displayModel };

    strategies.forEach(strategy => {
      const strategyRuns = modelRuns.filter(d => d.strategy === strategy);
      if (strategyRuns.length === 0) return;

      const successes = strategyRuns.filter(d => d.success).length;
      entry[`${strategy}_successRate`] = Math.round((successes / strategyRuns.length) * 100);

      const syntaxes = strategyRuns.filter(d => d.syntaxValid !== false).length;
      entry[`${strategy}_syntaxRate`] = Math.round((syntaxes / strategyRuns.length) * 100);

      const adherence = strategyRuns.filter(d => d.processAdherence).length;
      entry[`${strategy}_processAdherence`] = strategy === 'naive' ? 0 : Math.round((adherence / strategyRuns.length) * 100);
      
      const adherenceScoreSum = strategyRuns.reduce((sum, run) => sum + (run.processAdherenceScore || 0), 0);
      entry[`${strategy}_processAdherenceScore`] = strategy === 'naive' ? 0 : Math.round((adherenceScoreSum / strategyRuns.length) * 100);
      
      const avgLatency = strategyRuns.reduce((sum, run) => sum + run.latencyMs, 0) / strategyRuns.length;
      entry[`${strategy}_avgLatencyMs`] = Math.round(avgLatency);

      const avgTPS = strategyRuns.reduce((sum, run) => sum + (run.tokensPerSecond || 0), 0) / strategyRuns.length;
      entry[`${strategy}_avgTPS`] = Math.round(avgTPS * 100) / 100;
    });

    return entry;
  });

  const renderHighlightedTrace = (run: SimulationRun) => {
    const text = run.rawAgentTrace || run.rawOutput || 'N/A';
    if (run.strategy === 'naive') {
      return text;
    }

    // Extract problematic states from errors to highlight them
    const errorStates = new Set<string>();
    if (run.errors) {
      run.errors.forEach(err => {
        if (err.startsWith('UnknownState:')) {
          errorStates.add(err.replace('UnknownState:', '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        } else if (err.startsWith('InvalidTransition:')) {
          const parts = err.replace('InvalidTransition:', '').split('->');
          if (parts.length === 2) {
            errorStates.add(parts[1].trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
          }
        } else if (err === 'InvalidInitialState' && run.stateTrace && run.stateTrace.length > 0) {
          errorStates.add(run.stateTrace[0].toLowerCase().replace(/[^a-z0-9]/g, ''));
        } else if (err === 'InvalidTerminalState' && run.stateTrace && run.stateTrace.length > 0) {
          errorStates.add(run.stateTrace[run.stateTrace.length - 1].toLowerCase().replace(/[^a-z0-9]/g, ''));
        }
      });
    }

    // Split text keeping the matched state tags
    const stateRegex = /((?:\[|\()?STATE:\s*[^\]\)\n\r]+(?:\]|\))?)/gi;
    const parts = text.split(stateRegex);
    
    return parts.map((part, index) => {
      const match = part.match(/(?:\[|\()?STATE:\s*([^\]\)\n\r]+)(?:\]|\))?/i);
      // split with regex containing capturing groups will include the matches and non-matches.
      // However, we used a capturing group for the whole thing `((?:\[|\()?STATE...`.
      // The split array will alternate: text, match, text, match.
      // We check if this part is actually a state tag match.
      if (match && part.toUpperCase().includes('STATE:')) {
        const stateName = match[1].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const isError = errorStates.has(stateName);
        
        return (
          <span 
            key={index} 
            className={`font-bold px-1.5 py-0.5 rounded text-xs ${isError ? 'bg-red-800 text-red-50' : 'bg-green-800 text-green-50'}`}
          >
            {part}
          </span>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-8">Graph Prompting Simulation Dashboard</h1>
      
      <div className="flex flex-col gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Success Rate (%)</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData}>
                <XAxis dataKey="model" tick={{ fontSize: 12 }} interval={0} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar key="naive_success" dataKey="naive_successRate" name="naive" fill={strategyColors['naive']} />
                <Bar key="structured_success" dataKey="structured_successRate" name="structured" fill={strategyColors['structured']} />
                <Bar key="graph_success" dataKey="graph_successRate" name="graph" fill={strategyColors['graph']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Process Adherence (%)</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData}>
                <XAxis dataKey="model" tick={{ fontSize: 12 }} interval={0} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar key="structured_adherence" dataKey="structured_processAdherenceScore" name="structured" fill={strategyColors['structured']} />
                <Bar key="graph_adherence" dataKey="graph_processAdherenceScore" name="graph" fill={strategyColors['graph']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Syntax Validity (%)</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData}>
                <XAxis dataKey="model" tick={{ fontSize: 12 }} interval={0} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar key="naive_syntax" dataKey="naive_syntaxRate" name="naive" fill={strategyColors['naive']} />
                <Bar key="structured_syntax" dataKey="structured_syntaxRate" name="structured" fill={strategyColors['structured']} />
                <Bar key="graph_syntax" dataKey="graph_syntaxRate" name="graph" fill={strategyColors['graph']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Tokens Per Second (TPS)</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData}>
                <XAxis dataKey="model" tick={{ fontSize: 12 }} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar key="naive_tps" dataKey="naive_avgTPS" name="naive" fill={strategyColors['naive']} />
                <Bar key="structured_tps" dataKey="structured_avgTPS" name="structured" fill={strategyColors['structured']} />
                <Bar key="graph_tps" dataKey="graph_avgTPS" name="graph" fill={strategyColors['graph']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Avg Latency (ms)</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData}>
                <XAxis dataKey="model" tick={{ fontSize: 12 }} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar key="naive_latency" dataKey="naive_avgLatencyMs" name="naive" fill={strategyColors['naive']} />
                <Bar key="structured_latency" dataKey="structured_avgLatencyMs" name="structured" fill={strategyColors['structured']} />
                <Bar key="graph_latency" dataKey="graph_avgLatencyMs" name="graph" fill={strategyColors['graph']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <h2 className="text-xl font-semibold p-6 bg-gray-50 border-b border-gray-200 text-gray-800">Raw Runs ({data.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-6 py-3">Model</th>
                <th className="px-6 py-3">Strategy</th>
                <th className="px-6 py-3">Test Case</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Adherence</th>
                <th className="px-6 py-3">TPS / Latency</th>
                <th className="px-6 py-3">Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((run, i) => (
                <React.Fragment key={run.runId || i}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === (run.runId || String(i)) ? null : (run.runId || String(i)))}
                  >
                    <td className="px-6 py-4">{run.model.replace('-preview', '')}</td>
                    <td className="px-6 py-4">
                      <div>
                        {run.strategy}
                        {run.pathId && (
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">{run.pathId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{run.testCaseId}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-center ${run.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {run.success ? 'CORRECT' : 'WRONG'}
                        </span>
                        {run.syntaxValid === false && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-center bg-orange-100 text-orange-800">
                            BAD SYNTAX
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {run.strategy === 'naive' ? (
                        <span className="text-xs text-gray-400 italic">Not applicable</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs ${run.processAdherenceScore && run.processAdherenceScore > 0.8 ? 'text-green-600' : 'text-orange-600'}`}>
                            {Math.round((run.processAdherenceScore || 0) * 100)}%
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${run.processAdherenceScore && run.processAdherenceScore > 0.8 ? 'bg-green-500' : 'bg-orange-500'}`} 
                              style={{ width: `${Math.round((run.processAdherenceScore || 0) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <div>{Math.round(run.tokensPerSecond || 0)} TPS</div>
                        <div className="text-gray-400">{run.latencyMs}ms</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-blue-600 underline">View</td>
                  </tr>
                  {expandedRow === (run.runId || String(i)) && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-700 mb-1">Process Errors</h4>
                          <div className="flex flex-wrap gap-2">
                            {run.errors && run.errors.length > 0 ? (
                              run.errors.map((err, i) => (
                                <span key={i} className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
                                  {err}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">None detected</span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Final Extracted Code</h4>
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                              {run.rawOutput || 'No output'}
                            </pre>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Agent Trace / Thinking Process</h4>
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap border border-gray-700">
                              {renderHighlightedTrace(run)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
