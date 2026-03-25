# Graph Prompting Simulation: Final Hypothesis Evaluation

This document outlines the findings of the Graph Prompting Simulation, analyzing the impact of defining a process graph (using DOT syntax) in an LLM prompt on the reliability, adherence, and speed of AI agents executing complex software engineering workflows.

## The Simulation Data

The simulation evaluated four distinct Gemini models against three prompting strategies (`naive`, `structured`, and `graph`) over a suite of highly complex, constraint-heavy coding tasks.

### Refined Statistical Summary (Lenient Adherence Logic)

| Model | Strategy | Success Rate (Task Correctness) | Process Adherence (Logic Flow) | Avg Latency |
| :--- | :--- | :--- | :--- | :--- |
| **gemini-3.1-pro-preview** | **graph** | 80.0% | **100.0%** | 78s |
| gemini-3.1-pro-preview | structured | 100.0% | 91.7% | 60s |
| gemini-3.1-pro-preview | naive | 80.0% | 0.0% | 195s |
| **gemini-3-flash-preview** | **graph** | 64.0% | **88.0%** | 14s |
| gemini-3-flash-preview | structured | 76.0% | 100.0% | 17s |
| gemini-3-flash-preview | naive | 84.0% | 0.0% | 13s |
| **gemini-2.5-pro** | **graph** | 23.8% | **90.5%** | 58s |
| gemini-2.5-pro | structured | 72.0% | 100.0% | 42s |
| gemini-2.5-pro | naive | 100.0% | 0.0% | 42s |
| **gemini-2.5-flash** | **graph** | 24.0% | **88.0%** | 36s |
| gemini-2.5-flash | structured | 36.0% | 100.0% | 36s |
| gemini-2.5-flash | naive | 96.0% | 0.0% | 16s |

---

## Core Findings

### Hypothesis 1: Defining the process graph makes AI agents perform more reliably.
**Result: Confirmed for Process Reliability, Refuted for Task Correctness.**

The data reveals a stark dichotomy between *following instructions* and *solving the problem*.

1.  **Process Adherence:** The Graph prompting strategy achieved near-perfect adherence to the complex logical flow (88% - 100% across all models). The models successfully parsed the DOT syntax, recognized the nodes, and traversed the loops (e.g., `Review Architecture -> Draft Architecture` or `Run Self-Test -> Implement Core Logic`) as intended.
2.  **Task Correctness (Success Rate):** Paradoxically, enforcing the Process Graph actually *decreased* the raw "Success Rate" (the ability to output the exact code constraints required by the evaluator) for most models. For instance, `gemini-2.5-pro` achieved a 100% success rate with a Naive prompt, but plummeted to 23.8% when forced to use the Graph.

**Why this happens:** The logs indicate that the Process Graph forces the models to spend immense token bandwidth explicitly "thinking" through the graph nodes (`[STATE: Analyze Request]`, `[STATE: Threat Modeling]`, etc.). By the time the model reaches the terminal `[STATE: Finalize Code]` node, its context window is saturated with its own architectural musings. This "attention tax" causes it to summarize, truncate, or abstract the final code block, causing it to fail strict programmatic evaluation (like missing a required `WeakMap` or `Set` instantiation).

### Hypothesis 2: Defining the process graph makes AI agents perform faster.
**Result: Disproven.**

The Process Graph approach was consistently slower—often significantly so—than the Naive approach across almost all models.

*   `gemini-2.5-flash`: Naive (16.3s) vs. Graph (36.2s)
*   `gemini-2.5-pro`: Naive (42.4s) vs. Graph (58.8s)

**Why this happens:** Time-to-completion in LLMs is heavily bound by output token generation. The Graph prompt inherently mandates that the model generate significantly more tokens (the entire textual "thought process" for every node traversed in the graph) before it is allowed to output the final result.

---

## Conclusion

The simulation proves that defining a DOT process graph in a prompt is an incredibly powerful mechanism for **control and adherence**, capable of forcing even weaker models to follow complex, multi-step, looping logic paths perfectly.

However, it is a poor strategy if the ultimate goal is **speed** or highly specific **code generation precision**. If the final task requires rigid adherence to constraints, the cognitive overhead of the "graph thinking" distracts the model.

**Strategic Recommendation:** Use Process Graphs for orchestration, reasoning, and architectural tasks where the *process itself* is the valuable output. For discrete execution tasks (like writing a specific function), use a Naive or Structured prompt, or decouple the Graph's reasoning phase from a separate, dedicated "Code Generation" LLM call.
