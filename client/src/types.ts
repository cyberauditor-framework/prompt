export interface PromptPattern {
  id: number;
  pattern_name: string;
  category: string;
  template: string;
  best_for_llm: string;
  keywords: string;
}

export interface RoutingDecision {
  route: "DATA_FETCH" | "CODE_GEN" | "VALIDATION" | "ESCALATION";
  confidence: number;
  reason: string;
}

export interface ExecuteResult {
  hiddenReasoning: string;
  outputText: string;
  feedbackScore: number;
  trace: string[];
}
