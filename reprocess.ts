import fs from 'fs';
import { evaluateProcessAdherence } from './src/engine/processEvaluator';
import { validateSyntax } from './src/engine/evaluator';
import { AgentStrategy, SimulationRun } from './src/types';
import { testCases } from './src/data/test-cases';

const LOG_FILE = 'results.jsonl';
if (!fs.existsSync(LOG_FILE)) {
    console.log("No results file found.");
    process.exit(0);
}

const lines = fs.readFileSync(LOG_FILE, 'utf-8').split('\n').filter(Boolean);
const runs: SimulationRun[] = lines.map(l => JSON.parse(l));

const updatedRuns = runs.map(run => {
  const testCase = testCases.find(tc => tc.id === run.testCaseId);
  const processEval = evaluateProcessAdherence(run.strategy, run.rawAgentTrace || '');
  
  // Fix rawOutput extraction retroactively if rawAgentTrace exists
  let fixedRawOutput = run.rawOutput;
  if (run.rawAgentTrace) {
    const match = run.rawAgentTrace.match(/```(?:javascript|js|typescript|ts|sql)?\s*([\s\S]*?)```/);
    if (match && match[1]) {
      fixedRawOutput = match[1].trim();
    } else {
      fixedRawOutput = run.rawAgentTrace.trim();
    }
  }

  const syntaxValid = testCase ? validateSyntax(testCase, fixedRawOutput) : undefined;
  const tps = run.totalTokens / (run.latencyMs / 1000);

  return {
    ...run,
    rawOutput: fixedRawOutput,
    syntaxValid,
    tokensPerSecond: tps,
    processAdherence: run.strategy === AgentStrategy.Naive ? false : processEval.followed,
    processAdherenceScore: run.strategy === AgentStrategy.Naive ? 0 : processEval.score,
    stateTrace: processEval.trace,
    pathId: processEval.pathId,
    errors: processEval.errors
  };
});


fs.writeFileSync(LOG_FILE, updatedRuns.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log(`Successfully reprocessed ${updatedRuns.length} runs with all new metrics.`);
