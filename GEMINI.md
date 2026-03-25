# Graph Prompting Simulation

## Project Overview

This is a TypeScript/Node.js software engineering research project designed to test a specific AI hypothesis: **Does defining a process graph (using DOT syntax) in an LLM prompt make AI agents perform complex workflows more reliably and/or faster compared to standard prompting techniques?**

The application functions as a multi-agent simulation engine. It runs highly complex, constraint-heavy coding tasks against different Gemini models using various prompting strategies. It records execution speed, success rates, and logic adherence, logging everything to a structured dataset (`results.jsonl`). 

A local React dashboard is included to visualize the simulation data in real-time.

### Key Components

*   **Core Engine (`src/engine/`):** Contains the simulation runner (`runner.ts`), regex-based output evaluator (`evaluator.ts`), and the process adherence tracker (`processEvaluator.ts`).
*   **AI Agents (`src/agents/`):** Implements the logic for different prompting strategies.
    *   `baseline.ts`: Contains the `Naive` (direct instruction) and `Structured` (numbered list) prompt strategies.
    *   `graph.ts`: Contains three complexity tiers (`graph_low`, `graph_medium`, `graph_high`) of DOT process graph definitions, allowing the model to trace its path through conditional logic and loops.
*   **Data & APIs (`src/`):** Contains the predefined test cases (`src/data/test-cases.ts`) and the Gemini API client wrapper with exponential backoff and timeout logic (`src/services/gemini.ts`).
*   **Web Dashboard (`ui/`):** A Vite + React application using Tailwind CSS and Recharts to render the `results.jsonl` data into interactive, comparative bar charts.

## Building and Running

### Prerequisites
*   Node.js (v18+)
*   A `.env` file in the root directory containing `GEMINI_API_KEY="your-api-key"`.

### Running the Simulation (Backend)
The simulation is executed via a CLI interface. The runner is fault-tolerant and will resume from existing `results.jsonl` data if interrupted.

```bash
# Run the full simulation matrix (all models, all strategies)
npm start

# Run a specific number of iterations per combination
npm start -- --runs 5

# Run the simulation for a specific model (useful for parallel execution in multiple terminals)
npm start -- --model gemini-3.1-pro-preview
```

### Running the Dashboard (Frontend)
The React dashboard reads the root `results.jsonl` file to visualize performance metrics.

```bash
# Install UI dependencies (only needed once)
cd ui && npm install

# Start the Vite development server
npm run dev
# The UI will typically be available at http://localhost:5174
```

## Development Conventions

*   **Testing:** The project uses `vitest` for unit testing. The test suite covers agent output formatting, API mocking, and the regex evaluator.
    *   Run tests: `npm test`
*   **Code Style:** TypeScript strict mode is enabled.
*   **Agent Traceability:** The application emphasizes "Agent Traceability." All structured and graph agents are required to output their thought process using `[STATE: <step>]` tags. This trace is heavily parsed by the `processEvaluator` to grade the agent on process adherence, not just final code output.