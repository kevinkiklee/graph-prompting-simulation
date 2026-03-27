import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'datasets-api',
      configureServer(server) {
        server.middlewares.use('/api/datasets', (_req, res) => {
          const resultsDir = path.resolve(__dirname, '../results');
          if (!fs.existsSync(resultsDir)) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify([]));
            return;
          }
          const files = fs.readdirSync(resultsDir)
            .filter(f => f.endsWith('.jsonl'))
            .sort((a, b) => {
              if (a === 'results.jsonl') return -1;
              if (b === 'results.jsonl') return 1;
              return b.localeCompare(a);
            });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(files));
        });
        
        server.middlewares.use('/api/dataset', (req, res, next) => {
          if (!req.url || req.url === '/') return next();
          const filename = req.url.split('?')[0].slice(1);
          if (!filename.endsWith('.jsonl') || filename.includes('..')) {
            return next();
          }
          const filepath = path.resolve(__dirname, '../results', filename);
          if (fs.existsSync(filepath)) {
            res.setHeader('Content-Type', 'text/plain');
            res.end(fs.readFileSync(filepath, 'utf8'));
          } else {
            res.statusCode = 404;
            res.end('Not found');
          }
        });
      }
    }
  ],
  server: {
    fs: {
      allow: ['..', '.']
    }
  }
})
