import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ResultsTable } from './ResultsTable';

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
  const [datasets, setDatasets] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('results.jsonl');

  useEffect(() => {
    const isDev = import.meta.env.DEV;
    const fetchUrl = isDev ? '/api/datasets' : './datasets.json';

    fetch(fetchUrl)
      .then(res => {
        if (!res.ok) throw new Error('API/JSON not available');
        return res.json();
      })
      .then(files => {
        if (files && files.length > 0) {
          setDatasets(files);
          setSelectedDataset(files[0]);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch datasets. Using default results.jsonl:', err);
      });
  }, []);

  useEffect(() => {
    if (!selectedDataset) return;
    
    const isDev = import.meta.env.DEV;
    const fetchPath = isDev && datasets.length > 0 ? `/api/dataset/${selectedDataset}` : `./${selectedDataset}`;
    
    fetch(fetchPath)
      .then(res => res.text())
      .then(text => {
        if (!text) {
          setData([]);
          return;
        }
        const lines = text.split('\n').filter(Boolean);
        const runs = lines.map(line => JSON.parse(line));
        setData(runs);
      })
      .catch(err => console.error('Failed to fetch logs:', err));
  }, [selectedDataset, datasets]);

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

      const calcRate = (num: number, den: number) => Number(((num / den) * 100).toFixed(2));

      const successes = strategyRuns.filter(d => d.success).length;
      entry[`${strategy}_successRate`] = calcRate(successes, strategyRuns.length);

      const syntaxes = strategyRuns.filter(d => d.syntaxValid !== false).length;
      entry[`${strategy}_syntaxRate`] = calcRate(syntaxes, strategyRuns.length);

      const adherence = strategyRuns.filter(d => d.processAdherence).length;
      entry[`${strategy}_processAdherence`] = strategy === 'naive' ? 0 : calcRate(adherence, strategyRuns.length);
      
      const adherenceScoreSum = strategyRuns.reduce((sum, run) => sum + (run.processAdherenceScore || 0), 0);
      entry[`${strategy}_processAdherenceScore`] = strategy === 'naive' ? 0 : calcRate(adherenceScoreSum, strategyRuns.length);
      
      const avgLatency = strategyRuns.reduce((sum, run) => sum + run.latencyMs, 0) / strategyRuns.length;
      entry[`${strategy}_avgLatencyMs`] = Math.round(avgLatency);

      const avgTPS = strategyRuns.reduce((sum, run) => sum + (run.tokensPerSecond || 0), 0) / strategyRuns.length;
      entry[`${strategy}_avgTPS`] = Math.round(avgTPS * 100) / 100;
    });

    return entry;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Graph Prompting Simulation Dashboard</h1>
        <div className="flex gap-4 items-center">
          {datasets.length > 0 && (
            <select 
              value={selectedDataset} 
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="p-2 border border-gray-300 rounded shadow-sm bg-white text-gray-700 text-sm font-medium"
            >
              {datasets.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Success Rate (%)</h2>
          <p className="text-sm text-gray-600 mb-4">Percentage of runs that produced a functionally correct output according to the evaluator.</p>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData} margin={{ top: 20 }}>
                <XAxis dataKey="model" tick={{ fontSize: 12 }} interval={0} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#6b7280' }} key="naive_success" dataKey="naive_successRate" name="naive" fill={strategyColors['naive']} />
                <Bar radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#6b7280' }} key="structured_success" dataKey="structured_successRate" name="structured" fill={strategyColors['structured']} />
                <Bar radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#6b7280' }} key="graph_success" dataKey="graph_successRate" name="graph" fill={strategyColors['graph']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Process Adherence (%)</h2>
          <p className="text-sm text-gray-600 mb-4">How closely the model followed the requested process steps or graph execution paths.</p>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData} margin={{ top: 20 }}>
                <XAxis dataKey="model" tick={{ fontSize: 12 }} interval={0} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#6b7280' }} key="structured_adherence" dataKey="structured_processAdherenceScore" name="structured" fill={strategyColors['structured']} />
                <Bar radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#6b7280' }} key="graph_adherence" dataKey="graph_processAdherenceScore" name="graph" fill={strategyColors['graph']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Tokens Per Second (TPS)</h2>
          <p className="text-sm text-gray-600 mb-4">Generation speed of the model, measured in output tokens per second.</p>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData} margin={{ top: 20 }}>
                <XAxis dataKey="model" tick={{ fontSize: 12 }} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#6b7280' }} key="naive_tps" dataKey="naive_avgTPS" name="naive" fill={strategyColors['naive']} />
                <Bar radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#6b7280' }} key="structured_tps" dataKey="structured_avgTPS" name="structured" fill={strategyColors['structured']} />
                <Bar radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#6b7280' }} key="graph_tps" dataKey="graph_avgTPS" name="graph" fill={strategyColors['graph']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Avg Latency (ms)</h2>
          <p className="text-sm text-gray-600 mb-4">Average end-to-end response time for the API calls across all runs.</p>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData} margin={{ top: 20 }}>
                <XAxis dataKey="model" tick={{ fontSize: 12 }} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#6b7280' }} key="naive_latency" dataKey="naive_avgLatencyMs" name="naive" fill={strategyColors['naive']} />
                <Bar radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#6b7280' }} key="structured_latency" dataKey="structured_avgLatencyMs" name="structured" fill={strategyColors['structured']} />
                <Bar radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#6b7280' }} key="graph_latency" dataKey="graph_avgLatencyMs" name="graph" fill={strategyColors['graph']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ResultsTable data={data} />
    </div>
  );
}
