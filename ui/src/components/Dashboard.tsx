import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface SimulationRun {
  runId: string;
  timestamp: string;
  model: string;
  strategy: string;
  testCaseId: string;
  success: boolean;
  processAdherence?: boolean;
  latencyMs: number;
  totalTokens: number;
  turnCount: number;
  rawOutput: string;
  rawAgentTrace?: string;
  stateTrace?: string[];
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
  const strategyOrder = ['naive', 'structured', 'graph_low', 'graph_medium', 'graph_high'];
  const strategies = rawStrategies.sort((a, b) => {
    const indexA = strategyOrder.indexOf(a);
    const indexB = strategyOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Colors for different strategies
  const strategyColors: Record<string, string> = {
    'naive': '#94a3b8',        // slate-400
    'structured': '#3b82f6',   // blue-500
    'graph_low': '#a7f3d0',    // emerald-200
    'graph_medium': '#34d399', // emerald-400
    'graph_high': '#059669'    // emerald-600
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

      const adherence = strategyRuns.filter(d => d.processAdherence).length;
      entry[`${strategy}_processAdherence`] = strategy === 'naive' ? 0 : Math.round((adherence / strategyRuns.length) * 100);
      
      const avgLatency = strategyRuns.reduce((sum, run) => sum + run.latencyMs, 0) / strategyRuns.length;
      entry[`${strategy}_avgLatencyMs`] = Math.round(avgLatency);
    });

    return entry;
  });

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
                <Bar key="graph_low_success" dataKey="graph_low_successRate" name="graph_low" fill={strategyColors['graph_low']} />
                <Bar key="graph_medium_success" dataKey="graph_medium_successRate" name="graph_medium" fill={strategyColors['graph_medium']} />
                <Bar key="graph_high_success" dataKey="graph_high_successRate" name="graph_high" fill={strategyColors['graph_high']} />
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
                <Bar key="structured_adherence" dataKey="structured_processAdherence" name="structured" fill={strategyColors['structured']} />
                <Bar key="graph_low_adherence" dataKey="graph_low_processAdherence" name="graph_low" fill={strategyColors['graph_low']} />
                <Bar key="graph_medium_adherence" dataKey="graph_medium_processAdherence" name="graph_medium" fill={strategyColors['graph_medium']} />
                <Bar key="graph_high_adherence" dataKey="graph_high_processAdherence" name="graph_high" fill={strategyColors['graph_high']} />
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
                <Bar key="graph_low_latency" dataKey="graph_low_avgLatencyMs" name="graph_low" fill={strategyColors['graph_low']} />
                <Bar key="graph_medium_latency" dataKey="graph_medium_avgLatencyMs" name="graph_medium" fill={strategyColors['graph_medium']} />
                <Bar key="graph_high_latency" dataKey="graph_high_avgLatencyMs" name="graph_high" fill={strategyColors['graph_high']} />
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
                <th className="px-6 py-3">Success</th>
                <th className="px-6 py-3">Latency (ms)</th>
                <th className="px-6 py-3">Tokens</th>
                <th className="px-6 py-3">Turns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((run, i) => (
                <React.Fragment key={run.runId || i}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === (run.runId || String(i)) ? null : (run.runId || String(i)))}
                  >
                    <td className="px-6 py-4">{run.model}</td>
                    <td className="px-6 py-4">{run.strategy}</td>
                    <td className="px-6 py-4">{run.testCaseId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${run.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {run.success ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{run.latencyMs}</td>
                    <td className="px-6 py-4">{run.totalTokens}</td>
                    <td className="px-6 py-4 text-blue-600 underline">View Log</td>
                  </tr>
                  {expandedRow === (run.runId || String(i)) && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50 border-t border-gray-200">
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
                              {run.rawAgentTrace || run.rawOutput || 'N/A'}
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
