import { runSimulationMatrix } from './engine/runner';

async function main() {
  const args = process.argv.slice(2);
  let runs = 5;

  const runIndex = args.indexOf('--runs');
  if (runIndex !== -1 && args[runIndex + 1]) {
    runs = parseInt(args[runIndex + 1], 10);
  }

  console.log(`Starting Simulation Engine...`);
  console.log(`Targeting ${runs} runs per Model/Strategy/TestCase combination.`);
  
  await runSimulationMatrix(runs);
  
  console.log('Simulation complete! Results saved to results.jsonl');
}

main().catch(console.error);
