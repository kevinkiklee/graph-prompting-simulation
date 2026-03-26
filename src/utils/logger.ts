import fs from 'fs';
import path from 'path';
import { SimulationRun } from '../types';

const LOG_FILE = path.join(process.cwd(), 'results.jsonl');

export function appendLog(entry: SimulationRun) {
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
}

export function readLogs(): SimulationRun[] {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean);
  return lines.map(line => JSON.parse(line));
}

export function archiveLogs() {
  if (!fs.existsSync(LOG_FILE)) return;
  const resultsDir = path.join(process.cwd(), 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destFile = path.join(resultsDir, `results-${timestamp}.jsonl`);
  
  fs.renameSync(LOG_FILE, destFile);
  console.log(`Archived previous results to: ${destFile}`);
}

