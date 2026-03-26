import fs from 'fs';
import { evaluateProcessAdherence } from './src/engine/processEvaluator';
import { evaluateRemediation, validateSyntax } from './src/engine/evaluator';
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
    const regex = /```(?:javascript|js|typescript|ts|sql)?[ \t]*\r?\n([\s\S]*?)```/g;
    let match;
    let lastMatch = null;
    while ((match = regex.exec(run.rawAgentTrace)) !== null) {
      lastMatch = match;
    }
    if (lastMatch && lastMatch[1]) {
      fixedRawOutput = lastMatch[1].trim();
    } else {
      fixedRawOutput = run.rawAgentTrace.trim();
    }
  }

  const syntaxValid = testCase ? validateSyntax(testCase, fixedRawOutput) : undefined;
  const success = testCase ? evaluateRemediation(testCase, fixedRawOutput) : run.success;
  const tps = run.totalTokens / (run.latencyMs / 1000);

  return {
    ...run,
    rawOutput: fixedRawOutput,
    success,
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
