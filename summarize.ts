import fs from 'fs';

interface Run {
  model: string;
  strategy: string;
  success: boolean;
  processAdherence: boolean;
  latencyMs: number;
}

const lines = fs.readFileSync('results.jsonl', 'utf-8').split('\n').filter(Boolean);
const runs: Run[] = lines.map(l => JSON.parse(l));

const stats: Record<string, any> = {};

runs.forEach(run => {
  const key = `${run.model} | ${run.strategy}`;
  if (!stats[key]) {
    stats[key] = { count: 0, success: 0, adherence: 0, totalLatency: 0 };
  }
  stats[key].count++;
  if (run.success) stats[key].success++;
  if (run.processAdherence) stats[key].adherence++;
  stats[key].totalLatency += run.latencyMs;
});

console.log("=== Graph Prompting Simulation Results ===");
console.log("Model | Strategy | Success Rate | Process Adherence | Avg Latency");
console.log("-----------------------------------------------------------------");

Object.entries(stats).sort((a, b) => a[0].localeCompare(b[0])).forEach(([key, data]) => {
  const successRate = ((data.success / data.count) * 100).toFixed(1) + "%";
  const adherenceRate = ((data.adherence / data.count) * 100).toFixed(1) + "%";
  const avgLatency = Math.round(data.totalLatency / data.count) + "ms";
  
  const [model, strategy] = key.split(" | ");
  console.log(`${model.padEnd(25)} | ${strategy.padEnd(10)} | ${successRate.padStart(12)} | ${adherenceRate.padStart(17)} | ${avgLatency.padStart(11)}`);
});
