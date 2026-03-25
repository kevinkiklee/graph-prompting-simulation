import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface SimulationRun {
  runId: string;
  timestamp: string;
  model: string;
  strategy: string;
  testCaseId: string;
  success: boolean;
  latencyMs: number;
  totalTokens: number;
  turnCount: number;
  rawOutput: string;
}

export function Dashboard() {
  const [data, setData] = useState<SimulationRun[]>([]);

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

  const strategies = Array.from(new Set(data.map(d => d.strategy)));
  
  const successRateData = strategies.map(strategy => {
    const strategyRuns = data.filter(d => d.strategy === strategy);
    const successes = strategyRuns.filter(d => d.success).length;
    return {
      strategy,
      successRate: Math.round((successes / strategyRuns.length) * 100)
    };
  });

  const latencyData = strategies.map(strategy => {
    const strategyRuns = data.filter(d => d.strategy === strategy);
    const avgLatency = strategyRuns.reduce((sum, run) => sum + run.latencyMs, 0) / strategyRuns.length;
    return {
      strategy,
      avgLatencyMs: Math.round(avgLatency)
    };
  });

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-8">Graph Prompting Simulation Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Success Rate by Strategy (%)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={successRateData}>
                <XAxis dataKey="strategy" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="successRate" fill="#4f46e5" name="Success Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Avg Latency by Strategy (ms)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData}>
                <XAxis dataKey="strategy" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgLatencyMs" fill="#0ea5e9" name="Latency (ms)" />
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
                <tr key={i} className="hover:bg-gray-50">
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
                  <td className="px-6 py-4">{run.turnCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
