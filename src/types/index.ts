export enum AgentStrategy {
  Naive = "naive",
  Structured = "structured",
  Graph = "graph"
}

export enum ModelVersion {
  Gemini31ProPreview = "gemini-3.1-pro-preview",
  Gemini3FlashPreview = "gemini-3-flash-preview",
  Gemini25Pro = "gemini-2.5-pro",
  Gemini25Flash = "gemini-2.5-flash"
}

export interface TestCase {
  id: string;
  description: string;
  buggyCode: string;
  expectedMatchRegex: RegExp | string;
}

export interface SimulationRun {
  runId: string;
  timestamp: string;
  model: ModelVersion;
  strategy: AgentStrategy;
  testCaseId: string;
  success: boolean;
  processAdherence: boolean;
  latencyMs: number;
  totalTokens: number;
  turnCount: number;
  rawOutput: string;
  rawAgentTrace?: string;
  stateTrace?: string[];
}
