import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resultsDir = path.resolve(__dirname, '../../results');
const publicDir = path.resolve(__dirname, '../public');

if (fs.existsSync(resultsDir)) {
  const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.jsonl'));
  
  files.sort((a, b) => {
    if (a === 'results.jsonl') return -1;
    if (b === 'results.jsonl') return 1;
    return b.localeCompare(a);
  });
  
  fs.writeFileSync(path.join(publicDir, 'datasets.json'), JSON.stringify(files));
  
  files.forEach(file => {
    fs.copyFileSync(path.join(resultsDir, file), path.join(publicDir, file));
  });
  console.log(`Copied ${files.length} datasets to public directory for static hosting.`);
} else {
  console.warn('No results directory found to copy.');
}