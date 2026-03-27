# Enhancing LLM Process Adherence via Graph Prompting

*An analysis of 5,000+ simulation runs evaluating process adherence in Gemini models using structured checklists versus formal graph-based prompts.*

As large language models (LLMs) scale in capability, ensuring strict adherence to multi-step procedural constraints becomes increasingly challenging.

LLMs are frequently utilized to execute complex, multi-step workflows such as code review, data analysis, and support triage. To ensure reliability and predictability, industry practice often relies on structured, numbered checklists (e.g., *1. Analyze Input, 2. Threat Modeling, 3. Design Architecture, 4. Implement*).

However, highly capable models may bypass intermediate planning steps when they can readily deduce the final solution.

To investigate this behavior, we developed a simulation engine to evaluate four Gemini models (2.5 Flash, 2.5 Pro, 3.0 Flash, and 3.1 Pro) across a series of complex engineering and support tasks. We compared three prompting strategies:

1. **Naive Prompting:** Direct instruction without a mandated process.
2. **Structured Prompting:** A detailed, numbered checklist including branching conditional paths.
3. **Graph Prompting:** A formal state machine definition utilizing DOT `digraph` syntax, requiring the model to trace a directed graph.

The results indicate that graph-based prompting offers significant advantages in both process adherence and token generation speed.

---

## TL;DR & Preliminary Findings

**Findings:** When prompted with traditional numbered checklists, highly advanced models (like Gemini 3.1 Pro) frequently skip mandatory planning steps, dropping to a 48% adherence rate. By reframing the exact same instructions as a formal state machine using DOT `digraph` syntax (Graph Prompting), adherence is restored to 100% and token generation speed (TPS) increases by up to 34%.

**Preliminary Nature of Findings:** These results are preliminary. While all models achieved a near 100% success rate on the current test cases, this indicates the tasks may not be complex enough to measure the upper bounds of model capability or the limits of Graph Prompting. Future research is required to evaluate these prompting strategies against significantly more complex scenarios, such as autonomously building or refactoring multi-application systems.

---

## Prompting Strategies Explained

To illustrate the differences between the three approaches, consider an example task where the model must implement a `deepMerge` function that prevents prototype pollution and handles circular references.

### 1. Naive Strategy
The baseline approach provides simple, direct instructions.

```text
Task: Implement `deepMerge(target, source)`. It MUST prevent Prototype Pollution...

Input to process:
function deepMerge(target, source) { ... }

Output only the final required result.
```

### 2. Structured Strategy
The industry-standard approach uses a numbered checklist with branching conditional paths, enforcing "Agent Traceability" by requiring the model to output its current state.

```text
You are an expert agent following a strict process checklist.

Task: Implement `deepMerge(target, source)`. It MUST prevent Prototype Pollution...

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
11. Format Output

Input to process:
function deepMerge(target, source) { ... }

INSTRUCTIONS: You MUST output your reasoning step-by-step. When you start a step, you MUST prefix it with exactly [STATE: <step name>], for example: "[STATE: 1. Analyze Input]".
Output the final result wrapped in ``` ... ``` code blocks during step 11.
```

### 3. Graph Strategy
The experimental approach defines the exact same workflow as a formal state machine using a DOT `digraph`.

```text
You are an expert agent following a strict process graph.

## Process Flow
### Node Descriptions
**Core Nodes:**
- `Analyze Input`: Read the initial request and identify the main goal.
...
**Terminal Node:**
- `Format Output`: Present the final code, SQL, or response text to the user.

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

Task: Implement `deepMerge(target, source)`. It MUST prevent Prototype Pollution...

Execute the process graph from start to finish for the following input.
INSTRUCTIONS: 
1. You MUST output your reasoning step-by-step.
2. When you transition to a new node in the graph, you MUST explicitly output a marker with the exact node name wrapped in brackets like this: [STATE: Analyze Input]. Do not omit any steps!
3. The terminal state of this graph is EXACTLY "Format Output". You MUST reach this state and output the [STATE: Format Output] marker to complete the task.
4. When you reach the "Format Output" terminal state, output the final result enclosed in ``` ... ``` blocks.

Input to process:
function deepMerge(target, source) { ... }
```

---

## Methodology

We built a custom Node.js simulation engine to evaluate models across three dimensions: **Success Rate**, **Process Adherence**, and **Token Generation Speed**. 

A standard evaluation run consists of the following steps:

1. **Test Case Selection:** The engine assigns a multi-step scenario. These range from engineering tasks (e.g., implementing a `deepMerge` function while preventing prototype pollution) to support triage tasks.
2. **Prompt Injection:** The scenario is presented using one of the three prompting strategies. For the Structured and Graph tests, the prompt enforces "Agent Traceability" by requiring the model to prefix its reasoning with a state marker (e.g., `[STATE: Threat Modeling]`).
3. **Validation & Syntax Checking:** The engine extracts the final output and utilizes regular expressions to verify functional requirements. For coding tasks, the extracted JavaScript is validated using Node's `vm.Script` to ensure syntactical correctness.
4. **Process Adherence Evaluation:** A state-machine evaluator parses the LLM's response to extract `[STATE: ...]` tags. It verifies these transitions against the defined process graph. Models are penalized for skipping mandatory steps, fabricating undefined states, or failing to reach the designated terminal state.

The dataset comprises over 5,000 recorded runs across 84 unique combinations (4 models × 3 strategies × 7 test cases).

---

## Process Adherence in Advanced Models

When evaluating final code output, all four models achieved a **100% success rate**, demonstrating their fundamental capacity to solve the assigned problems.

However, the primary objective of structured prompting is to enforce explicit, step-by-step reasoning to ensure outputs are verifiable and safe. We measured **Strict Adherence Rate**—the percentage of runs where a model executed all mandated steps without skipping or hallucinating states. 

The adherence rates for the Structured Checklist strategy were as follows:

| Model | Strict Adherence (Structured Checklist) |
| :--- | :--- |
| Gemini 2.5 Flash | 100% |
| Gemini 2.5 Pro | 99% |
| Gemini 3.0 Flash | 98% |
| **Gemini 3.1 Pro** | **48%** |

### Analysis of Adherence Failures

Error log analysis revealed a recurring pattern for Gemini 3.1 Pro: `InvalidTransition: 1. Analyze Input -> 7a. Implement Code`.

While earlier or smaller models consistently followed the prescribed planning phases, Gemini 3.1 Pro frequently bypassed intermediate steps to immediately generate the final code. It treated the numbered checklist as a heuristic rather than a strict constraint. In production environments where compliance steps are mandatory, this reduced adherence rate poses a reliability issue.

---

## Improving Adherence with Graph Prompting

To address checklist circumvention, we tested whether representing the process as a formal state machine would improve compliance.

We replaced the checklist with identical instructions formatted as a DOT `digraph`, defining explicit nodes and directed edges (e.g., `"Analyze Input" -> "Threat Modeling"`). 

The Graph Prompting strategy yielded the following adherence rates:

| Model | Strict Adherence (Graph Prompt) |
| :--- | :--- |
| Gemini 2.5 Flash | 99% |
| Gemini 2.5 Pro | 100% |
| Gemini 3.0 Flash | 100% |
| **Gemini 3.1 Pro** | **100%** |

By providing a formal mathematical structure, the prompt explicitly defines the necessary transition paths. Consequently, Gemini 3.1 Pro's strict process adherence increased from 48% to 100%, effectively eliminating skipped steps and hallucinated workflows.

---

## Token Generation Speed and Efficiency

In addition to improved reliability, Graph Prompting demonstrated an effect on performance metrics. 

Tracking Tokens Per Second (TPS), the models generated text at a faster rate when using a Graph prompt compared to a Structured prompt:

| Model | TPS (Structured) | TPS (Graph) | Speed Increase |
| :--- | :--- | :--- | :--- |
| Gemini 2.5 Flash | 253 TPS | 327 TPS | **+29%** |
| Gemini 2.5 Pro | 132 TPS | 177 TPS | **+34%** |
| Gemini 3.0 Flash | 231 TPS | 306 TPS | **+32%** |
| Gemini 3.1 Pro | 88 TPS | 111 TPS | **+26%** |

### Output Volume vs. Generation Speed

The data for Gemini 3.1 Pro revealed that while the Graph strategy achieved higher TPS (111 vs. 88), it also recorded higher average latency (60.7s vs. 39.4s). This is attributed to the difference between total output volume and token generation efficiency.

1. **Output Volume (Impact on Latency):** The Graph strategy results in higher latency because the model generates significantly more text. Under the Structured checklist, Gemini 3.1 Pro often skips planning steps, resulting in shorter outputs (averaging ~1,800 characters). Under the Graph strategy, the model is forced to document its reasoning for every required node, increasing output size to approximately 4,600 characters. The increased text generation directly increases total latency.
2. **Generation Efficiency (Impact on TPS):** Despite generating more text, the Graph strategy increases the rate of generation. Checklists can introduce ambiguity, requiring the model to evaluate whether to follow or skip steps, which may reduce token generation speed. A formal DOT graph removes this ambiguity by explicitly defining the valid transition paths, reducing hesitation during inference and increasing TPS.

*(Note: The Naive strategy for Gemini 3.1 Pro exhibited higher average latency than the Structured strategy—47.7s vs. 39.4s—despite producing less text. This suggests that without structural constraints, advanced models may allocate more compute to internal reasoning to determine the correct approach, thereby increasing latency.)*

---

## Conclusion

As frontier models continue to advance, standard prompting techniques such as numbered checklists may become less effective at enforcing strict procedural compliance. 

Graph Prompting provides a robust alternative for reliable AI engineering. By structuring operational workflows as formal state machine definitions like DOT, the prompt acts as a programmatic constraint rather than a set of guidelines. 

This approach ensures strict adherence to mandatory compliance steps while simultaneously increasing the rate of token generation during execution. 

*The source code for the simulation engine and the dataset of 5,000+ runs are available on GitHub.*
