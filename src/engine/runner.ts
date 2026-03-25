import { AgentStrategy, ModelVersion, SimulationRun } from '../types';
import { testCases } from '../data/test-cases';
import { runNaiveAgent, runStructuredAgent } from '../agents/baseline';
import { runGraphAgent } from '../agents/graph';
import { evaluateRemediation } from './evaluator';
import { appendLog, readLogs } from '../utils/logger';
import { randomUUID } from 'crypto';

export async function runSimulationMatrix(runsPerCombo = 5) {
  const models = Object.values(ModelVersion);
  const strategies = Object.values(AgentStrategy);
  const existingLogs = readLogs();
  
  const runCounts = new Map<string, number>();
  for (const log of existingLogs) {
    const key = `${log.model}:${log.strategy}:${log.testCaseId}`;
    runCounts.set(key, (runCounts.get(key) || 0) + 1);
  }

  for (const model of models) {
    for (const strategy of strategies) {
      for (const testCase of testCases) {
        const key = `${model}:${strategy}:${testCase.id}`;
        const completed = runCounts.get(key) || 0;

        for (let i = completed; i < runsPerCombo; i++) {
          console.log(`Running ${model} | ${strategy} | ${testCase.id} | Run ${i + 1}/${runsPerCombo}`);
          
          let result;
          try {
            if (strategy === AgentStrategy.Naive) {
              result = await runNaiveAgent(model, testCase);
            } else if (strategy === AgentStrategy.Structured) {
              result = await runStructuredAgent(model, testCase);
            } else if (strategy === AgentStrategy.Graph) {
              result = await runGraphAgent(model, testCase);
            }

            if (!result) continue;

            const success = evaluateRemediation(testCase, result.output);
            
            const logEntry: SimulationRun = {
              runId: randomUUID(),
              timestamp: new Date().toISOString(),
              model,
              strategy,
              testCaseId: testCase.id,
              success,
              latencyMs: result.totalLatencyMs,
              totalTokens: result.totalTokens,
              turnCount: result.turnCount,
              rawOutput: result.output
            };

            appendLog(logEntry);
          } catch (error) {
            console.error(`Error during run:`, error);
          }
        }
      }
    }
  }
}
