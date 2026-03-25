import { AgentStrategy, ModelVersion, SimulationRun } from '../types';
import { testCases } from '../data/test-cases';
import { runNaiveAgent, runStructuredAgent } from '../agents/baseline';
import { runGraphAgent } from '../agents/graph';
import { evaluateRemediation, validateSyntax } from './evaluator';
import { evaluateProcessAdherence } from './processEvaluator';
import { appendLog, readLogs } from '../utils/logger';
import { randomUUID } from 'crypto';

export async function runSimulationMatrix(runsPerCombo = 5, targetModel?: ModelVersion, concurrency = 3) {
  const models = targetModel ? [targetModel] : Object.values(ModelVersion);
  const strategies = Object.values(AgentStrategy);
  const existingLogs = readLogs();
  
  const runCounts = new Map<string, number>();
  for (const log of existingLogs) {
    const key = `${log.model}:${log.strategy}:${log.testCaseId}`;
    runCounts.set(key, (runCounts.get(key) || 0) + 1);
  }

  // Create a flat list of tasks to execute
  const tasks: Array<{ model: ModelVersion, strategy: AgentStrategy, testCase: any, runIndex: number }> = [];

  for (const model of models) {
    for (const strategy of strategies) {
      for (const testCase of testCases) {
        const key = `${model}:${strategy}:${testCase.id}`;
        const completed = runCounts.get(key) || 0;

        for (let i = completed; i < runsPerCombo; i++) {
          tasks.push({ model, strategy, testCase, runIndex: i });
        }
      }
    }
  }

  console.log(`Total tasks to execute: ${tasks.length} (Concurrency: ${concurrency})`);

  let completedCount = 0;
  const activePromises = new Set<Promise<void>>();

  for (const task of tasks) {
    // If we've reached the concurrency limit, wait for one to finish
    if (activePromises.size >= concurrency) {
      await Promise.race(activePromises);
    }

    const promise = (async () => {
      const { model, strategy, testCase, runIndex } = task;
      console.log(`[START] ${model} | ${strategy} | ${testCase.id} | Run ${runIndex + 1}/${runsPerCombo}`);
      
      try {
        let result;
        if (strategy === AgentStrategy.Naive) {
          result = await runNaiveAgent(model, testCase);
        } else if (strategy === AgentStrategy.Structured) {
          result = await runStructuredAgent(model, testCase);
        } else if (strategy === AgentStrategy.Graph) {
          result = await runGraphAgent(model, testCase);
        }

        if (result) {
          const success = evaluateRemediation(testCase, result.output);
          const syntaxValid = validateSyntax(testCase, result.output);
          const processEval = evaluateProcessAdherence(strategy, result.rawAgentTrace || '');
          
          const logEntry: SimulationRun = {
            runId: randomUUID(),
            timestamp: new Date().toISOString(),
            model,
            strategy,
            testCaseId: testCase.id,
            success,
            syntaxValid,
            processAdherence: strategy === AgentStrategy.Naive ? false : processEval.followed,
            processAdherenceScore: strategy === AgentStrategy.Naive ? 0 : processEval.score,
            latencyMs: result.totalLatencyMs,
            totalTokens: result.totalTokens,
            tokensPerSecond: result.totalTokens / (result.totalLatencyMs / 1000),
            turnCount: result.turnCount,
            rawOutput: result.output,
            rawAgentTrace: result.rawAgentTrace || result.output,
            stateTrace: processEval.trace,
            pathId: processEval.pathId,
            errors: processEval.errors
          };

          appendLog(logEntry);
          completedCount++;
          console.log(`[DONE] (${completedCount}/${tasks.length}) ${model} | ${strategy} | ${testCase.id}`);
        }
      } catch (error) {
        console.error(`Error during run:`, error);
      }
    })();

    activePromises.add(promise);
    promise.finally(() => activePromises.delete(promise));
  }

  // Wait for all remaining tasks to complete
  await Promise.all(activePromises);
}
