import { evaluateProcessAdherence } from './src/engine/processEvaluator';
import { AgentStrategy } from './src/types';
import fs from 'fs';

const lines = fs.readFileSync('results.jsonl', 'utf-8').split('\n').filter(Boolean);
const graphRun = JSON.parse(lines.find(l => JSON.parse(l).strategy === 'graph') || '{}');

console.log("Strategy:", graphRun.strategy);
console.log("Trace Text snippet:", graphRun.rawAgentTrace?.substring(0, 500));

const result = evaluateProcessAdherence(graphRun.strategy as AgentStrategy, graphRun.rawAgentTrace || '');
console.log("Evaluator Result:", result);
