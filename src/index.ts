import { runSimulationMatrix } from './engine/runner';
import { ModelVersion } from './types';
import { archiveLogs } from './utils/logger';

async function main() {
  const args = process.argv.slice(2);
  let runs = 5;
  let targetModel: ModelVersion | undefined = undefined;
  let concurrency = 3;

  const isNewRun = args.includes('--new');
  if (isNewRun) {
    archiveLogs();
  }

  const runIndex = args.indexOf('--runs');
  if (runIndex !== -1 && args[runIndex + 1]) {
    runs = parseInt(args[runIndex + 1], 10);
  }

  const modelIndex = args.indexOf('--model');
  if (modelIndex !== -1 && args[modelIndex + 1]) {
    const modelInput = args[modelIndex + 1];
    if (Object.values(ModelVersion).includes(modelInput as ModelVersion)) {
      targetModel = modelInput as ModelVersion;
    } else {
      console.error(`Invalid model: ${modelInput}`);
      console.error(`Available models: ${Object.values(ModelVersion).join(', ')}`);
      process.exit(1);
    }
  }

  const concurrencyIndex = args.indexOf('--concurrency') !== -1 ? args.indexOf('--concurrency') : args.indexOf('-c');
  if (concurrencyIndex !== -1 && args[concurrencyIndex + 1]) {
    concurrency = parseInt(args[concurrencyIndex + 1], 10);
  }

  console.log(`Starting Simulation Engine...`);
  if (targetModel) {
    console.log(`Targeting model: ${targetModel}`);
  }
  console.log(`Targeting ${runs} runs per Model/Strategy/TestCase combination.`);
  console.log(`Parallel concurrency: ${concurrency}`);
  
  await runSimulationMatrix(runs, targetModel, concurrency);
  
  console.log('Simulation complete! Results saved to results.jsonl');
}

main().catch(console.error);
