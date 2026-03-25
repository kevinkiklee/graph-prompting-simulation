import fs from 'fs';

const LOG_FILE = 'results/results.jsonl';
const lines = fs.readFileSync(LOG_FILE, 'utf-8').split('\n').filter(Boolean);
const runs = lines.map(l => JSON.parse(l));

const updatedRuns = runs.map(run => {
  if (run.strategy === 'naive') return { ...run, processAdherenceScore: 0 };
  
  // Since the processEvaluator was updated, we'll manually set the score for historical data based on boolean adherence
  return {
    ...run,
    processAdherenceScore: run.processAdherence ? 1 : 0
  };
});

fs.writeFileSync(LOG_FILE, updatedRuns.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log(`Successfully reprocessed ${updatedRuns.length} runs with default scores.`);
