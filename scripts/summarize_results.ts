import fs from 'fs';

interface Run {
  model: string;
  strategy: string;
  success: boolean;
  processAdherence: boolean;
  latencyMs: number;
}

const lines = fs.readFileSync('results/results.jsonl', 'utf-8').split('\n').filter(Boolean);
const runs: Run[] = lines.map(l => JSON.parse(l));

const stats: Record<string, any> = {};

runs.forEach(run => {
  const key = `${run.model} | ${run.strategy}`;
  if (!stats[key]) {
    stats[key] = { count: 0, adherence: 0 };
  }
  stats[key].count++;
  if (run.processAdherence) stats[key].adherence++;
});

console.log("=== Dataset Summary ===");
Object.entries(stats).sort((a, b) => a[0].localeCompare(b[0])).forEach(([key, data]) => {
  const adherenceRate = ((data.adherence / data.count) * 100).toFixed(1) + "%";
  console.log(`${key.padEnd(35)} | Count: ${data.count.toString().padStart(3)} | Adherence: ${adherenceRate.padStart(6)}`);
});
