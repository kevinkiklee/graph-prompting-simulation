# Graph Prompting Simulation Application

This application is designed to test a specific hypothesis: **Does defining a process graph (using DOT syntax) in an LLM prompt make AI agents perform complex workflows more reliably and/or faster compared to standard prompting techniques?**

## The Simulation

The application runs a complex workflow against a set of predefined, tricky test cases. It evaluates three different prompting strategies:

1.  **Naive Strategy:** The agent receives a simple, direct instruction.
2.  **Structured Strategy:** The agent receives a detailed, numbered checklist of steps to follow with branching instructions.
3.  **Graph Strategy:** The agent receives a formal state machine definition (a DOT `digraph`) detailing the exact nodes, edges, and conditional branches of the process flow, along with descriptions of what each node means.

## Example Test Cases and Prompts

### Example Test Case: Secure Deep Merge
**Description:** Implement `deepMerge(target, source)`. It MUST prevent Prototype Pollution by strictly blocking keys "__proto__", "constructor", and "prototype". It MUST handle circular references using a `WeakMap`. It MUST NOT mutate the input objects (return a newly created object).
**Buggy Code Provided:**
```javascript
function deepMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = target[key] || {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
```

### Example Prompt: Naive Strategy
```text
Task: Implement `deepMerge(target, source)`. It MUST prevent Prototype Pollution...

Input to process:
function deepMerge(target, source) { ... }

Output only the final required result.
```

### Example Prompt: Structured Strategy
```text
You are an expert agent following a strict process checklist.

Task: Implement \`deepMerge(target, source)\`. It MUST prevent Prototype Pollution...

Process:
1. Analyze Input
2. Extract Context
3. Determine Task Type
   - If Engineering, proceed to 4a.
   - If Support, proceed to 4b.
   - If Data, proceed to 4c.

[Engineering Path]
4a. Threat Modeling
5a. Design Architecture
6a. Architecture Review (If flaws found, go back to 5a)
7a. Implement Code
8a. Code Review (If bugs found, go to 9a. If tests pass, go to 10a)
9a. Refine Code (After refining, return to 8a)
10a. Compile (Proceed to 11)
...
11. Format Output

Input to process:
function deepMerge(target, source) { ... }

INSTRUCTIONS: You MUST output your reasoning step-by-step. When you start a step, you MUST prefix it with exactly [STATE: <step name>], for example: "[STATE: 1. Analyze Input]".
Output the final result wrapped in \`\`\` ... \`\`\` code blocks during step 11.
```

### Example Prompt: Graph Strategy
```text
You are an expert agent following a strict process graph.

## Process Flow
### Node Descriptions
**Core Nodes:**
- \`Analyze Input\`: Read the initial request and identify the main goal.
...
**Terminal Node:**
- \`Format Output\`: Present the final code, SQL, or response text to the user.

```dot
digraph complex_task_processing {
  "Analyze Input" [shape=box];
  "Extract Context" [shape=box];
  "Determine Task Type" [shape=diamond];

  // Engineering
  "Threat Modeling" [shape=box];
  "Design Architecture" [shape=box];
  "Architecture Review" [shape=diamond];
  "Implement Code" [shape=box];
  "Code Review" [shape=diamond];
  "Refine Code" [shape=box];
  "Compile" [shape=box];

  // Support
  "Sentiment Analysis" [shape=box];
  "Fetch Guidelines" [shape=box];
  "Draft Response" [shape=box];
  "Tone Check" [shape=diamond];
  "Escalation Check" [shape=diamond];
  "Route to Manager" [shape=box];
  "Approve Response" [shape=box];

  // Data
  "Identify Schema" [shape=box];
  "Write SQL" [shape=box];
  "Optimize Query" [shape=box];

  "Format Output" [shape=doublecircle];

  "Analyze Input" -> "Extract Context";
  "Extract Context" -> "Determine Task Type";

  "Determine Task Type" -> "Threat Modeling" [label="Engineering"];
  "Determine Task Type" -> "Sentiment Analysis" [label="Support"];
  "Determine Task Type" -> "Identify Schema" [label="Data"];

  // Eng path
  "Threat Modeling" -> "Design Architecture";
  "Design Architecture" -> "Architecture Review";
  "Architecture Review" -> "Design Architecture" [label="Flaws Found"];
  "Architecture Review" -> "Implement Code" [label="Approved"];
  "Implement Code" -> "Code Review";
  "Code Review" -> "Refine Code" [label="Bugs Found"];
  "Refine Code" -> "Code Review";
  "Code Review" -> "Compile" [label="Tests Pass"];
  "Compile" -> "Format Output";

  // Support path
  "Sentiment Analysis" -> "Fetch Guidelines";
  "Fetch Guidelines" -> "Draft Response";
  "Draft Response" -> "Tone Check";
  "Tone Check" -> "Draft Response" [label="Inappropriate"];
  "Tone Check" -> "Escalation Check" [label="Appropriate"];
  "Escalation Check" -> "Route to Manager" [label="Needs Escalation"];
  "Escalation Check" -> "Approve Response" [label="Can Resolve"];
  "Route to Manager" -> "Format Output";
  "Approve Response" -> "Format Output";

  // Data path
  "Identify Schema" -> "Write SQL";
  "Write SQL" -> "Optimize Query";
  "Optimize Query" -> "Format Output";
}

Task: Implement \`deepMerge(target, source)\`. It MUST prevent Prototype Pollution...

Execute the process graph from start to finish for the following input.
INSTRUCTIONS: 
1. You MUST output your reasoning step-by-step.
2. When you transition to a new node in the graph, you MUST explicitly output a marker with the exact node name wrapped in brackets like this: [STATE: Analyze Input]. Do not omit any steps!
3. The terminal state of this graph is EXACTLY "Format Output". You MUST reach this state and output the [STATE: Format Output] marker to complete the task.
4. When you reach the "Format Output" terminal state, output the final result enclosed in \`\`\` ... \`\`\` blocks.

Input to process:
function deepMerge(target, source) { ... }
```

## How the Testing Process Works

The core engine (`src/engine/runner.ts`) automates the evaluation of these strategies across multiple LLM models. Here is a detailed breakdown of the testing lifecycle for a single simulation run:

### 1. Test Case Selection
The engine selects a test case from `src/data/test-cases.ts`. These test cases are designed to be tricky and require specific, multi-step reasoning. They fall into different categories, such as:

- **Engineering:** e.g., Fixing prototype pollution in a `deepMerge` function, or writing a concurrent task scheduler that preserves order.
- **Support Triage:** e.g., Handling an angry customer demanding a refund vs. a confused customer needing technical steps.

### 2. Prompt Generation & Agent Execution
Based on the selected strategy (`Naive`, `Structured`, or `Graph`), the engine wraps the test case in a specific prompt format. For the `Structured` and `Graph` strategies, the prompt heavily emphasizes "Agent Traceability"—forcing the model to output its thought process by prefixing every step it takes with a state marker (e.g., `[STATE: Threat Modeling]`).

The engine then calls the Gemini API (with exponential backoff for rate limits) and records the total tokens consumed and the latency (in milliseconds) for the response.

### 3. Output Extraction & Validation
Once the model responds, the engine performs two primary checks on the final output (which is extracted from the `javascript` code blocks if present):

- **Success Criteria (`evaluateRemediation`):** It runs a strict Regular Expression against the output to see if the core requirements of the test case were met. For example, for the `deepMerge` test, it checks if both `WeakMap` and the string `__proto__` are present in the final code.
- **Syntax Validation (`validateSyntax`):** It passes the extracted JavaScript code to Node's `vm.Script` parser to ensure the code is actually syntactically valid (i.e., no missing brackets or hallucinated syntax). *Note: Non-code support triage tasks bypass this check.*

### 4. Process Adherence Evaluation
This is the most critical metric for the hypothesis. For the `Structured` and `Graph` strategies, the `processEvaluator.ts` heavily scrutinizes the model's "Agent Trace" (the `[STATE: ...]` tags).

The evaluator enforces a strict state machine:

- It checks if the agent started at the correct initial state (`[STATE: Analyze Input]`).
- It verifies every transition against the defined graph (e.g., you cannot jump from `Threat Modeling` directly to `Format Output`).
- It checks if the agent hallucinated fake states (e.g., `[STATE: Run Self-Test]`) or skipped mandatory states.
- It ensures the agent successfully reached the designated terminal state (`[STATE: Format Output]`).

If the model deviates from the path, invents steps, or fails to reach the end, its Adherence Score is penalized or marked as a complete failure, and the specific `InvalidTransition` or `UnknownState` errors are logged.

### 5. Logging
The engine logs all of these metrics—Success, Syntax Validity, Adherence Score, Latency, Tokens Per Second (TPS), and the full raw text traces—into a structured dataset: `results.jsonl`.

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

## Visualizing the Results (Web UI)

The project includes a React dashboard to visualize the data generated in `results.jsonl` in real-time.

1.  Start the UI development server:
    ```bash
    cd ui
    npm run dev
    ```
2.  Open your browser to `http://localhost:5174` (or the port specified in your terminal).

The dashboard displays:

- Bar charts comparing **Success Rate**, **Syntax Validity**, **Process Adherence**, **Avg Latency**, and **Tokens Per Second** across models and strategies.
- An interactive table containing the raw logs of every individual agent run, complete with syntax highlighting that visually flags where an agent deviated from the process graph.