import { PromptPattern, RoutingDecision } from "../types.js";

function overlapScore(queryTokens: Set<string>, text: string): number {
  const candidate = new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9_]+/)
      .filter(Boolean)
  );

  let score = 0;
  for (const token of queryTokens) {
    if (candidate.has(token)) {
      score += 1;
    }
  }

  return score;
}

export function rankPatterns(query: string, patterns: PromptPattern[]): PromptPattern[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return patterns;
  }

  const queryTokens = new Set(q.split(/[^a-z0-9_]+/).filter(Boolean));

  return [...patterns]
    .map((pattern) => {
      const baseText = `${pattern.pattern_name} ${pattern.category} ${pattern.keywords} ${pattern.template}`;
      return { pattern, score: overlapScore(queryTokens, baseText) };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.pattern);
}

export function makeRoutingDecision(goal: string): RoutingDecision {
  const text = goal.toLowerCase();

  if (/(sql|database|query|fetch|api)/.test(text)) {
    return {
      route: "DATA_FETCH",
      confidence: 0.86,
      reason: "Goal includes data retrieval terms.",
    };
  }

  if (/(code|build|implement|refactor|typescript|node)/.test(text)) {
    return {
      route: "CODE_GEN",
      confidence: 0.84,
      reason: "Goal includes software implementation terms.",
    };
  }

  if (/(verify|validate|review|audit|check|test)/.test(text)) {
    return {
      route: "VALIDATION",
      confidence: 0.81,
      reason: "Goal emphasizes validation behavior.",
    };
  }

  return {
    route: "ESCALATION",
    confidence: 0.64,
    reason: "Insufficient intent signal; route to human-in-the-loop.",
  };
}
