-- Initial prompt catalog seed (8 high-impact patterns)
-- Run this after creating the schema.

INSERT INTO prompt_patterns (pattern_name, category, template, best_for_llm, keywords)
VALUES
(
  'Persona Adoption',
  'Context Control',
  'You are a Senior Agentic Workflow Engineer. Operate within professional, safety, and policy constraints. User goal: {{input}}. Output only actionable instructions and avoid unsupported claims.',
  'GPT-4o, Claude 3.5 Sonnet, Llama 3',
  'persona,role,boundaries,context,control'
),
(
  'Context Manager',
  'Input Customization',
  'Given user goal {{input}}, keep only relevant context for this task. Exclude stale history, duplicate facts, and unrelated messages. Return: retained_context, dropped_context_reasons, assumptions.',
  'GPT-4o, Claude 3.5 Sonnet',
  'context,history,token,filter,relevance'
),
(
  'ReAct Tool-Use',
  'Interaction Control',
  'Task: {{input}}. Use the following loop until solved:\nThought: reason about the next best step.\nAction: select one allowed tool and provide exact input.\nObservation: record tool output verbatim.\nFinal Answer: concise result with evidence from observations only.',
  'GPT-4o, Claude 3.5 Sonnet, Llama 3',
  'react,tool,use,action,observation,api'
),
(
  'Chain-of-Thought',
  'Reasoning Strategy',
  'Solve {{input}} by decomposing into sequential subproblems. Verify each sub-result before proceeding. In final output, provide only the conclusion and brief rationale summary.',
  'GPT-4o, Claude 3.5 Sonnet',
  'reasoning,cot,step-by-step,deliberative'
),
(
  'Dynamic Router',
  'Routing and Orchestration',
  'Classify user request {{input}} into one route: DATA_FETCH, CODE_GEN, VALIDATION, or ESCALATION. Output JSON with route, confidence (0-1), and trigger_conditions for downstream agent.',
  'GPT-4o, Claude 3.5 Sonnet, Llama 3',
  'router,dynamic,route,orchestration,dispatch'
),
(
  'Self-Critique Pass',
  'Validation and Reflection',
  'After drafting an answer for {{input}}, run a second-pass audit for hallucinations, logic gaps, policy violations, and missing constraints. Correct issues before finalizing. Return: revised_answer and critique_notes.',
  'GPT-4o, Claude 3.5 Sonnet',
  'self-critique,reflection,validation,hallucination,review'
),
(
  'Structured Schema JSON',
  'Output Control',
  'Respond to {{input}} strictly as JSON using schema: {"goal":"string","steps":["string"],"risks":["string"],"confidence":0.0}. Do not include markdown or extra keys.',
  'GPT-4o, Claude 3.5 Sonnet, Llama 3',
  'output,json,schema,format,structured'
),
(
  'Constraint Enforcement',
  'Safety and Governance',
  'For task {{input}}, enforce hard constraints first: policy, security, and execution limits. If any constraint is violated, refuse unsafe parts and provide a safe alternative plan.',
  'GPT-4o, Claude 3.5 Sonnet, Llama 3',
  'safety,constraints,governance,compliance,guardrails'
);
