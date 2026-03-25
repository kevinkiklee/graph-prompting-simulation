# Graph Prompting Simulation Application

This application is designed to test a specific hypothesis: **Does defining a process graph (using DOT syntax) in an LLM prompt make AI agents perform complex workflows more reliably and/or faster compared to standard prompting techniques?**

## The Simulation

The application runs a "Code Review and Remediation" workflow against a set of predefined, buggy code snippets. It evaluates three different prompting strategies:

1.  **Naive Strategy:** The agent receives a simple, direct instruction (e.g., "Fix this code").
2.  **Structured Strategy:** The agent receives a detailed, numbered list of steps to follow.
3.  **Graph Strategy:** The agent receives a formal state machine definition (DOT `digraph`) and is instructed to mentally execute it from start to finish.

The engine records success rates, API latency, and token consumption to determine which strategy is truly superior.

## Prerequisites

- Node.js (v18 or higher)
- A Gemini API Key

## Setup

1.  Clone the repository and install dependencies:
    ```bash
    npm install
    ```
    ```bash
    cd ui && npm install
    ```

2.  Create a `.env` file in the root directory and add your API key:
    ```bash
    GEMINI_API_KEY="your-api-key-here"
    ```

## Running the Simulation Engine (CLI)

The CLI runner iterates through combinations of **Models**, **Strategies**, and **Test Cases**, executing the AI calls and saving the results to `results.jsonl`.

*Note: The runner is fault-tolerant. If you hit an API quota limit or cancel the process, simply run it again—it will scan `results.jsonl` and automatically resume where it left off.*

### Basic Run
Execute the full matrix (all models, all strategies, all test cases) with 5 iterations per combination:
```bash
npm start
```

### Configurable Runs
Specify the number of iterations per combination (e.g., to run a quick test with 2 iterations):
```bash
npm start -- --runs 2
```

### Run a Specific Model
To test models in parallel across different terminal windows, you can restrict the runner to a single model:
```bash
npm start -- --model gemini-3.1-pro-preview
npm start -- --model gemini-3-flash-preview
npm start -- --model gemini-2.5-pro
npm start -- --model gemini-2.5-flash
```

**Available Models:**
- `gemini-3.1-pro-preview`
- `gemini-3-flash-preview`
- `gemini-2.5-pro`
- `gemini-2.5-flash`

## Visualizing the Results (Web UI)

The project includes a React dashboard to visualize the data generated in `results.jsonl` in real-time.

1.  Start the UI development server:
    ```bash
    cd ui
    npm run dev
    ```
2.  Open your browser to `http://localhost:5174` (or the port specified in your terminal).

The dashboard displays:
- A bar chart of **Success Rate by Strategy**.
- A bar chart of **Average Latency by Strategy**.
- A table containing the raw logs of every individual agent run.
