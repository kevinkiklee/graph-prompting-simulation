# Graph Prompting Simulation Design Spec

## Objective
Develop a simulation application to test the hypothesis that defining a process graph (state machine) makes AI agents perform complex tasks more reliably and/or faster compared to standard prompting techniques.

## Scope
The application will execute a "Code Review and Remediation" workflow across multiple LLM models and prompting strategies. It must support both a Command Line Interface (CLI) for automated, long-running batch tests and a Web UI for visualizing results and demonstrating the concept.

## 1. System Architecture
- **Language:** TypeScript
- **Backend/CLI:** Node.js (handling API orchestration, file I/O, and test execution).
- **Frontend/UI:** React (Vite) + Tailwind CSS (reading static log files for visualization).
- **Agent Framework:** Custom lightweight state machine for the Graph implementation, with direct API calls for the baseline strategies.

## 2. Testing Matrix

### 2.1 Prompting Strategies
1. **Naive Baseline:** The agent receives the buggy code snippet and a single, direct instruction (e.g., "Fix the security and logic issues in this code").
2. **Structured Prompt Baseline:** The agent receives the buggy code and a detailed, multi-step system prompt outlining the desired process (e.g., "1. Analyze, 2. Plan, 3. Fix, 4. Verify").
3. **Graph (Hypothesis):** The agent's execution is controlled by a state machine. Each step (Analyze -> Plan -> Fix -> Verify) is a separate, context-aware LLM call. If verification fails, the graph loops back to the planning/fixing stage up to a maximum retry limit.

### 2.2 Models Tested
The simulation will test the following Gemini models individually to observe how the strategies affect different capability tiers:
- `gemini-3.1-pro-preview`
- `gemini-3-flash-preview`
- `gemini-2.5-pro`
- `gemini-2.5-flash`

### 2.3 Test Dataset
- **Size:** 10 distinct, predefined code snippets.
- **Categories:** A mix of Security Flaws (SQLi, XSS), Logic Bugs (off-by-one, improper state handling), and Maintainability issues.
- **Evaluation:** Each snippet will have an associated automated grading function or static analysis check to determine if the remediation was successful without breaking core functionality.

## 3. Execution Engine
- **Runner:** A script that iterates through the (Model × Strategy × Test Case) combinations.
- **Scale:** Configurable runs per combination (default: 5 runs to account for LLM stochasticity). Total expected runs per full test suite: 4 * 3 * 10 * 5 = 600 runs.
- **Concurrency:** Configurable parallel execution (e.g., running 3-5 tests simultaneously) to respect API rate limits while optimizing total runtime.

## 4. Logging and Metrics
All results will be logged to local files (e.g., JSONLines) for persistence and UI ingestion.

### 4.1 Tracked Metrics
- **Reliability (Success Rate):** Binary pass/fail based on the automated evaluation.
- **Speed (Latency):** Total time (ms) taken from the start of the first API call to the final output. For the Graph strategy, this includes the sum of all node execution times.
- **Cost (Tokens):** Total prompt and completion tokens used per run.
- **Turn Count:** Number of LLM calls made (always 1 for baselines, variable for Graph).

### 4.2 Data Structure (Example Log Entry)
```json
{
  "runId": "uuid",
  "timestamp": "2026-03-25T10:00:00Z",
  "model": "gemini-3.1-pro-preview",
  "strategy": "graph",
  "testCaseId": "sql-injection-01",
  "success": true,
  "latencyMs": 14500,
  "totalTokens": 4500,
  "turnCount": 3,
  "rawOutput": "..."
}
```

## 5. User Interfaces

### 5.1 CLI (Headless Runner)
- Commands to start a full suite, run specific combinations, or dry-run the evaluation logic.
- Real-time progress bars and summary statistics in the terminal.

### 5.2 Web UI (Visualization)
- A dashboard reading the `results.jsonl` file.
- **Key Views:**
  - Aggregate Success Rate by Strategy (Bar Chart).
  - Average Latency by Strategy and Model (Scatter/Line Plot).
  - Detailed run inspector to view the agent's step-by-step output (especially for the Graph strategy) and identify failure modes.
