# Graph Prompting Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript/Node.js simulation engine to test Gemini models across Naive, Structured, and Graph prompting strategies, alongside a React UI to visualize the reliability and speed metrics.

**Architecture:** A monolithic TypeScript repository. The backend is a set of Node.js scripts executing the simulation logic, tracking state, and logging to a `.jsonl` file. The frontend is a static React application that reads the generated `.jsonl` file to render analytics.

**Tech Stack:** Node.js, TypeScript, Google Gen AI SDK (`@google/genai`), React (Vite), TailwindCSS, Recharts.

---

### Task 1: Project Initialization & Core Types

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/types/index.ts`
- Create: `tests/types.test.ts` (stub)

- [ ] **Step 1: Initialize the project**
Run `npm init -y` and install core dependencies.
```bash
npm install @google/genai dotenv
npm install --save-dev typescript @types/node vitest tsx
npx tsc --init
```

- [ ] **Step 2: Configure TypeScript**
Update `tsconfig.json` to target Node.js (ESNext/CommonJS) with strict mode enabled.

- [ ] **Step 3: Define core interfaces**
Create `src/types/index.ts`. Define the `SimulationRun` log structure, `TestCase` structure, and enums for `AgentStrategy` (Naive, Structured, Graph) and `ModelVersion` (gemini-3.1-pro-preview, gemini-3-flash-preview, gemini-2.5-pro, gemini-2.5-flash).

- [ ] **Step 4: Commit**
```bash
git add package.json package-lock.json tsconfig.json src/types/index.ts
git commit -m "chore: initialize TS project and core types"
```

### Task 2: Mock Dataset & Evaluator

**Files:**
- Create: `src/data/test-cases.ts`
- Create: `src/engine/evaluator.ts`
- Create: `tests/evaluator.test.ts`

- [ ] **Step 1: Write test case dataset**
Create `src/data/test-cases.ts` exporting an array of 10 `TestCase` objects containing a unique ID, a description of the bug, the buggy code string, and the exact string/regex expected in the correct remediation.

- [ ] **Step 2: Write evaluator tests**
Create `tests/evaluator.test.ts`. Write a test that passes a valid string and an invalid string to the evaluator function for a specific test case ID, expecting `true` and `false` respectively.

- [ ] **Step 3: Implement the evaluator**
Create `src/engine/evaluator.ts` that takes a `TestCase` and the agent's string output, returning a boolean indicating if the remediation was successful based on the `TestCase`'s expected regex/string match.

- [ ] **Step 4: Verify tests pass**
Run `npx vitest run tests/evaluator.test.ts`.

- [ ] **Step 5: Commit**
```bash
git add src/data/test-cases.ts src/engine/evaluator.ts tests/evaluator.test.ts
git commit -m "feat: add test cases and regex evaluator"
```

### Task 3: Model Orchestrator & API Integration

**Files:**
- Create: `src/services/gemini.ts`
- Create: `tests/gemini.test.ts` (using mocks)

- [ ] **Step 1: Write API wrapper tests**
Create `tests/gemini.test.ts`. Mock the `@google/genai` library. Write a test ensuring `generateContent` is called with the correct model string and prompt, and that it returns the expected text and token counts.

- [ ] **Step 2: Implement the Gemini Service**
Create `src/services/gemini.ts`. Initialize the `GoogleGenAI` client using `process.env.GEMINI_API_KEY`. Create a `callModel` function that accepts a model string and a prompt, handles the API request, measures latency using `performance.now()`, and returns an object containing `{ text, tokens, latencyMs }`.

- [ ] **Step 3: Verify tests pass**
Run `npx vitest run tests/gemini.test.ts`.

- [ ] **Step 4: Commit**
```bash
git add src/services/gemini.ts tests/gemini.test.ts
git commit -m "feat: implement Gemini API service with latency tracking"
```

### Task 4: Agent Implementations (Baselines)

**Files:**
- Create: `src/agents/baseline.ts`
- Create: `tests/agents.test.ts`

- [ ] **Step 1: Write baseline agent tests**
Create `tests/agents.test.ts`. Mock the `callModel` function. Write tests for `runNaiveAgent` and `runStructuredAgent` ensuring they construct the correct prompts based on the input `TestCase` and return the mocked output.

- [ ] **Step 2: Implement Naive and Structured Agents**
Create `src/agents/baseline.ts`.
- `runNaiveAgent`: Constructs a simple prompt: "Fix this code: [code]". Calls the model.
- `runStructuredAgent`: Constructs a detailed prompt: "1. Analyze the issue in [code]. 2. Plan a fix. 3. Output the exact fixed code. 4. Verify it works." Calls the model.
Both functions return `{ output, totalLatencyMs, totalTokens, turnCount: 1 }`.

- [ ] **Step 3: Verify tests pass**
Run `npx vitest run tests/agents.test.ts`.

- [ ] **Step 4: Commit**
```bash
git add src/agents/baseline.ts tests/agents.test.ts
git commit -m "feat: implement Naive and Structured baseline agents"
```

### Task 5: Agent Implementation (Graph State Machine)

**Files:**
- Create: `src/agents/graph.ts`
- Modify: `tests/agents.test.ts`

- [ ] **Step 1: Write Graph agent tests**
Update `tests/agents.test.ts` to test `runGraphAgent`. Mock `callModel` to return sequential responses (e.g., an analysis, then a plan, then a fix, then a verification success). Test that `turnCount` is > 1 and tokens/latency are aggregated.

- [ ] **Step 2: Implement the Graph Agent**
Create `src/agents/graph.ts`. Implement a custom state machine logic using a `while` loop or explicit state functions.
- State `ANALYZE`: Call model to analyze code.
- State `PLAN`: Call model with analysis to plan a fix.
- State `FIX`: Call model with plan to output code.
- State `VERIFY`: Call model to verify the fix against the original issue. If it fails, return to `PLAN`. If it passes (or max retries reached), exit.
Aggregate latency and tokens across all calls. Return `{ output, totalLatencyMs, totalTokens, turnCount }`.

- [ ] **Step 3: Verify tests pass**
Run `npx vitest run tests/agents.test.ts`.

- [ ] **Step 4: Commit**
```bash
git add src/agents/graph.ts tests/agents.test.ts
git commit -m "feat: implement Graph state machine agent"
```

### Task 6: Simulation Runner & JSONLines Logging

**Files:**
- Create: `src/engine/runner.ts`
- Create: `src/utils/logger.ts`

- [ ] **Step 1: Implement the Logger**
Create `src/utils/logger.ts` with an `appendLog(entry: SimulationRun)` function that writes JSON strings to `results.jsonl`, and a `readLogs(): SimulationRun[]` function to parse the file for resumability checks.

- [ ] **Step 2: Implement the Runner Core**
Create `src/engine/runner.ts`. Create a `runSimulationMatrix` function that:
1. Reads existing logs.
2. Iterates over `Models` × `Strategies` × `TestCases` × `Runs (e.g., 5)`.
3. Checks if the combination exists in logs; if so, skip.
4. Executes the corresponding agent function.
5. Evaluates the output using `evaluator.ts`.
6. Creates a `SimulationRun` record and appends it via the logger.

- [ ] **Step 3: Commit**
```bash
git add src/engine/runner.ts src/utils/logger.ts
git commit -m "feat: implement simulation runner matrix and JSONL logging"
```

### Task 7: CLI Interface

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Implement the CLI entrypoint**
Create `src/index.ts`. Use standard Node `process.argv` to parse commands (e.g., `--runs 5`). Instantiate and trigger the `runSimulationMatrix` from `runner.ts`. Add `console.log` statements for progress indication.

- [ ] **Step 2: Add npm script**
Update `package.json` to include `"start": "tsx src/index.ts"`.

- [ ] **Step 3: Commit**
```bash
git add src/index.ts package.json
git commit -m "feat: add CLI entrypoint for the simulation"
```

### Task 8: Web UI Initialization (Vite + React)

**Files:**
- Create directory: `ui/`

- [ ] **Step 1: Scaffold Vite App**
Run `npm create vite@latest ui -- --template react-ts`.
Run `cd ui && npm install` and install Tailwind/Recharts: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p && npm install recharts`.

- [ ] **Step 2: Configure Tailwind**
Configure `tailwind.config.js` to scan `./src/**/*.{js,ts,jsx,tsx}`. Add Tailwind directives to `ui/src/index.css`.

- [ ] **Step 3: Commit**
```bash
git add ui/
git commit -m "chore: initialize React UI with Vite and Tailwind"
```

### Task 9: Web UI Dashboard

**Files:**
- Modify: `ui/src/App.tsx`
- Create: `ui/src/components/Dashboard.tsx`

- [ ] **Step 1: Fetch and parse logs**
Since this is a local tool, the React app will fetch `results.jsonl` statically (assuming the UI is served from the root or the file is symlinked to `public/`). Write a `useEffect` in `App.tsx` to fetch `/results.jsonl`, split by newline, and parse into an array of objects.

- [ ] **Step 2: Implement Charts**
Create `ui/src/components/Dashboard.tsx`. Use Recharts to render:
- A BarChart showing average success rate grouped by Strategy (Naive, Structured, Graph).
- A BarChart showing average Latency grouped by Strategy.
- A basic table listing the raw runs.

- [ ] **Step 3: Commit**
```bash
git add ui/src/App.tsx ui/src/components/Dashboard.tsx
git commit -m "feat: build React dashboard to visualize simulation metrics"
```
