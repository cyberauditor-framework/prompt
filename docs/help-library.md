# Help Library: Prompt Patterns and Agent Concepts

This reference describes the core pattern families and agent-system concepts used in Prompt Coach Mission Control.

## Purposes of Prompt Patterns

Prompt Patterns are reusable instruction blocks that improve consistency, reliability, safety, and observability across autonomous agents.

Their main purposes are to:
- reduce ambiguity in model behavior,
- enforce predictable structure,
- guide tool usage and routing,
- enable validation loops, and
- make prompts modular and maintainable.

## Input Customization Patterns

Input Customization Patterns shape what the model receives before reasoning starts.

Use these patterns to:
- filter irrelevant context,
- normalize user requirements,
- inject domain constraints, and
- map raw requests to structured intent.

## Output Customization Patterns

Output Customization Patterns constrain how responses are formatted and delivered.

Use these patterns to:
- force JSON or YAML schemas,
- include confidence fields,
- require citations or evidence blocks, and
- support downstream automation that depends on stable output formats.

## Interaction Control Patterns

Interaction Control Patterns define how an agent interacts with tools, APIs, users, and other agents during execution.

Use these patterns to:
- set tool-call protocols,
- gate risky actions,
- pause for approvals, and
- establish fallback or escalation behavior.

## Combining Prompt Patterns

Complex workflows usually require multiple patterns used together.

A practical combination flow is:
1. Input Customization for intent shaping,
2. Context Control for memory relevance,
3. Interaction Control for tool execution,
4. Output Customization for machine-readable results,
5. Feedback patterns for quality assurance.

## Context Control Patterns

Context Control Patterns manage what historical memory, references, and constraints are visible to the model at each step.

Use these patterns to:
- keep token usage efficient,
- prevent stale-context contamination,
- isolate task-relevant memory windows, and
- preserve policy and safety context consistently.

## SYSTEM AGENTS

System Agents are architectural roles in a multi-agent workflow. They are not just personas; they represent execution behaviors and decision policies.

## Reflex Agents

Reflex Agents prioritize speed and immediate reaction.

Characteristics:
- low deliberation,
- direct action on clear triggers,
- useful for classification, simple transforms, and fast tool calls.

Tradeoff: higher risk of shallow reasoning on complex tasks.

## Deliberative Agents

Deliberative Agents prioritize planning, decomposition, and verification before acting.

Characteristics:
- multi-step reasoning,
- explicit planning and checks,
- better for complex, high-stakes tasks.

Tradeoff: slower latency and higher token usage.

## Chain-of-Thought

Chain-of-Thought is a sequential reasoning style where the model solves a task step-by-step.

Best use cases:
- structured analysis,
- multi-step calculations,
- procedural decisions.

## Tree-of-Thought

Tree-of-Thought explores multiple candidate reasoning branches, evaluates them, and prunes weak paths.

Best use cases:
- planning with alternatives,
- strategy search,
- tasks requiring backtracking.

## React

ReAct (Reason + Act) alternates between reasoning and tool actions.

Cycle:
- Thought,
- Action,
- Observation,
- Final Answer.

Best use cases:
- retrieval-augmented workflows,
- API-driven tasks,
- dynamic evidence gathering.

## Static routing

Static routing uses fixed rules to map task types to predefined agents.

Best use cases:
- stable domains with predictable request patterns.

## Dynamic routing

Dynamic routing evaluates the request at runtime and chooses the best agent path based on confidence and context.

Best use cases:
- mixed workloads,
- evolving requirements,
- adaptive orchestration.

## Role-base-routing

Role-based routing (role-base-routing) directs requests according to agent role definitions such as Planner, Coder, Validator, or Safety Reviewer.

Best use cases:
- clear responsibility boundaries,
- auditable handoffs between specialized agents.

## External feedback

External feedback comes from sources outside the executing agent.

Examples:
- human approval,
- test harness results,
- monitoring alerts,
- downstream system validation.

## Internal feedback

Internal feedback is generated within the agent workflow itself.

Examples:
- self-check prompts,
- confidence scoring,
- internal validator sub-agent checks.

## explicit or implicit

Feedback can be explicit or implicit:
- Explicit feedback is directly stated (for example, a reviewer score or pass/fail signal).
- Implicit feedback is inferred from behavior (for example, repeated retries, low confidence, or tool error frequency).

## self-critique

Self-critique is a deliberate second pass where the agent audits its own draft for logic gaps, hallucinations, safety issues, and schema violations before finalizing output.

## Reflection

Reflection is post-action learning and adaptation.

Unlike self-critique (which improves the current answer), reflection updates future behavior by capturing lessons, improving pattern selection, and refining routing policies over time.

---

# ðŸ§  AI Comprehensive Learning Resource 2026
## AI Family Patterns Â· Agent Systems Â· RAG Â· LLMs Â· Prompting Â· Embeddings Â· Workflows

**Author:** Daniel Ausin â€” Presales Manager  
**Date:** May 2, 2026  
**Purpose:** A single, comprehensive resource for learning and mastering the modern AI technology stack.

---

## Table of Contents

1. [The AI Intelligence Stack: LLMs vs RAG vs Agents](#1-the-ai-intelligence-stack)
2. [AI Family Patterns Taxonomy](#2-ai-family-patterns-taxonomy)
3. [Agent Systems & Architecture Patterns](#3-agent-systems--architecture-patterns)
4. [Retrieval-Augmented Generation (RAG)](#4-retrieval-augmented-generation-rag)
5. [Large Language Models (LLMs)](#5-large-language-models-llms)
6. [Prompting Techniques (12 Research-Backed Methods)](#6-prompting-techniques)
7. [Embeddings Deep Dive](#7-embeddings-deep-dive)
8. [Agentic Workflows (9 Production Patterns)](#8-agentic-workflows)
9. [Templates & Prompt Examples](#9-templates--prompt-examples)
10. [Decision Frameworks](#10-decision-frameworks)
11. [Validated Learning Resources](#11-validated-learning-resources)

---

# 1. The AI Intelligence Stack

Understanding how LLMs, RAG, and Agents relate is the foundation for everything else.

| Layer | Role | Analogy | Strengths | Limitations |
|-------|------|---------|-----------|-------------|
| **LLM** | Reasoning engine | The brain | Language understanding, generation, reasoning, code | Static knowledge, hallucination, no real-time data |
| **RAG** | Knowledge connector | The library | Fresh data, private knowledge, source citations | Static retrieval, no action capability |
| **Agent** | Decision maker & executor | The worker | Planning, tool use, multi-step execution, autonomy | Coordination overhead, safety risks |

### How They Work Together
```
User Query â†’ Agent (decides what to do)
                â†’ RAG (retrieves relevant knowledge)
                    â†’ LLM (reasons over retrieved context)
                        â†’ Tool Call (takes action)
                            â†’ Agent (evaluates result, continues or returns)
```

### When to Use Each

| Scenario | Use LLM Alone | Use RAG | Use Agent |
|----------|---------------|---------|-----------|
| Simple Q&A, summarization | âœ… | âŒ | âŒ |
| Company-specific knowledge | âŒ | âœ… | âŒ |
| Real-time data lookups | âŒ | âœ… | âœ… |
| Multi-step workflows | âŒ | âŒ | âœ… |
| Tool integration (APIs, DBs) | âŒ | âŒ | âœ… |
| Creative writing | âœ… | âŒ | âŒ |
| Research with citations | âŒ | âœ… | âœ… |

---

# 2. AI Family Patterns Taxonomy

A comprehensive classification of all architectural patterns used in LLM systems, agentic systems, and multi-agent applications.

> **Key Distinction:**
> - **Pattern** = structure of coordination or execution
> - **Mechanism** = implementation vehicle used by a pattern
> - **Capability Package** = reusable specialized behavior or knowledge bundle

## A. Single-Agent Patterns

| # | Pattern | Description | When to Use |
|---|---------|-------------|-------------|
| 1 | **Tool-Calling Agent Loop** | Agent iteratively decides to answer directly or call a tool | Dynamic tool use needed; flow doesn't need many agents |
| 2 | **Skills Pattern** | Agent loads specialized instructions/knowledge on demand | Modular prompting; reusable expertise packs; reduce giant static prompts |
| 3 | **State Machine Agent** | Agent changes instructions/tools based on current task state | Behavior changes across phases; customer support; guided flows |

## B. Multi-Agent Coordination Patterns

| # | Pattern | Description | When to Use |
|---|---------|-------------|-------------|
| 4 | **Supervisor / Orchestrator** | Central agent coordinates specialized workers | Centralized control; aggregation and consistency matter |
| 5 | **Subagents** | Main agent delegates tasks to domain-specific subagents | Domains are clearly separable; specialists don't need user interaction |
| 6 | **Agent as Tool** | Subagent invoked exactly like a tool | Strict delegation contracts; clean I/O boundaries |
| 7 | **Handoffs** | Control moves from one agent to another | Responsibility should pass between agents; conversation ownership changes |
| 8 | **Router** | Routing layer decides which model/agent handles the request | Requests vary by category; cost/latency specialization |

## C. Workflow Patterns

| # | Pattern | Description | When to Use |
|---|---------|-------------|-------------|
| 9 | **Prompt Chaining** | One LLM step feeds the next in predefined sequence | Task splits into clean substeps; reliability > flexibility |
| 10 | **Parallelization** | Multiple workers process subtasks simultaneously | Tasks decomposable independently; speed matters |
| 11 | **Evaluator-Optimizer** | One component produces output, another evaluates/improves it | Quality control important; hallucination risk reduction |
| 12 | **Plan-and-Execute** | One module plans, executors perform steps | Complex tasks benefit from decomposition |

## D. Retrieval & Knowledge Patterns

| # | Pattern | Description | When to Use |
|---|---------|-------------|-------------|
| 13 | **RAG (Retrieval-Augmented Generation)** | Model retrieves external documents before answering | Answer depends on external knowledge; freshness matters |
| 14 | **Retrieval-Augmented Agent** | Agent iteratively rewrites queries, reranks, searches again | Static RAG too weak; multi-step search needed |
| 15 | **Knowledge Routing** | Routes queries to different knowledge sources/indexes | Multiple corpora exist; domain separation matters |

## E. Memory Patterns

| # | Pattern | Description | When to Use |
|---|---------|-------------|-------------|
| 16 | **Working Memory** | Short-lived context for current task | Temporary scratch context; multi-step task |
| 17 | **Episodic Memory** | Stores past interactions for reuse | Repeated tasks; prior outcomes matter |
| 18 | **Semantic / Long-Term Memory** | Stores stable facts and knowledge over time | Durable user/project knowledge; context windows insufficient |

## F. Control, Safety & Governance Patterns

| # | Pattern | Description | When to Use |
|---|---------|-------------|-------------|
| 19 | **Human-in-the-Loop** | Human reviews/approves specific steps | High-risk actions; legal/compliance concerns |
| 20 | **Guardrail / Policy Check** | Validation layer checks constraints before/after actions | Outputs must obey rules; tool calls constrained |
| 21 | **Critic / Reflection Loop** | System inspects its own output and improves it | Tasks benefit from self-review; first answer often incomplete |

### Minimal List Every AI Engineer Should Know
1. Tool-calling agent loop
2. Router
3. Orchestrator / Supervisor
4. Subagents
5. Handoffs
6. Skills
7. Prompt chaining
8. Parallelization
9. Evaluator-optimizer
10. Human-in-the-loop
11. Retrieval-augmented agent
12. Plan-and-execute

---

# 3. Agent Systems & Architecture Patterns

## The Complexity Spectrum

Before adopting any agent pattern, evaluate where your scenario falls:

| Level | Description | When to Use | Considerations |
|-------|-------------|-------------|----------------|
| **Direct Model Call** | Single LLM call with well-crafted prompt | Classification, summarization, translation | If prompt engineering solves it, you don't need an agent |
| **Single Agent + Tools** | One agent reasons and acts by selecting tools | Varied queries within single domain | Default for enterprise. Guard against infinite tool-call loops |
| **Multi-Agent Orchestration** | Multiple specialized agents coordinate | Cross-functional problems, distinct security boundaries | Adds overhead, latency, failure modes. Justify the complexity |

## Core Agent Design Patterns (6 Canonical Patterns)

### Pattern 1: Reflection (Self-Critique Loops)

**How it works:** Generate â†’ Evaluate â†’ Accept or Revise â†’ Loop

**Best for:** Code generation, long-form writing, structured data extraction

**Key guardrails:**
- Always set a maximum iteration cap (2-3 iterations is typical)
- Define clear quality thresholds for exit
- Track token budget per reflection cycle

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Generate  â”‚â”€â”€â”€>â”‚ Critique  â”‚â”€â”€â”€>â”‚ Score >= 8?  â”‚
â”‚  Draft    â”‚    â”‚  & Score  â”‚    â”‚ or iter >= 3?â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
      â–²                               â”‚
      â”‚           No                   â”‚ Yes
      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”€â”€â”€â”€â”€â”€> Result
```

### Pattern 2: Tool Use (Grounding in the Real World)

**Four-phase cycle:**
1. Define available tools with structured schemas
2. LLM selects and parameterizes a tool call
3. Tool is invoked
4. Results integrated back into conversation

**At scale (50+ tools):** Embed tool descriptions, retrieve top-k relevant tools per query.

### Pattern 3: Planning (Decompose, Then Execute)

**Plan-and-Execute vs. ReAct:**

| Aspect | ReAct | Plan-and-Execute |
|--------|-------|------------------|
| Approach | Interleave reasoning + action each step | Generate full plan first, then execute |
| Best for | Exploratory tasks | Well-defined multi-step tasks |
| LLM calls | More calls (per step) | Fewer total calls |
| Recovery | Adapts per step | Replans on failure |

### Pattern 4: Multi-Agent Collaboration

Multiple agents with distinct roles collaborate toward shared outcomes. Agents communicate through structured protocols.

**Orchestration sub-patterns:**
- **Sequential** â€” Agents execute in fixed order (pipeline)
- **Concurrent** â€” Agents run in parallel (fan-out/fan-in)
- **Group Chat** â€” Agents collaborate in shared conversation
- **Handoff** â€” Agents dynamically delegate to peers
- **Magentic** â€” Manager agent adapts task ledger dynamically

### Pattern 5: Orchestrator-Worker (Dynamic Task Decomposition)

A central orchestrator decomposes tasks dynamically and delegates to specialized workers. Combines planning with multi-agent execution.

### Pattern 6: Evaluator-Optimizer (Test-Driven Agents)

One agent generates output, another evaluates against defined criteria. If quality is insufficient, the generator is provided feedback to iterate.

**Pattern Comparison Table:**

| Pattern | Complexity | Primary Use Case | Key Risk |
|---------|-----------|------------------|----------|
| Reflection | Low | Self-correction | Infinite loops |
| Tool Use | Low-Medium | External integration | Tool misuse |
| Planning | Medium | Multi-step tasks | Plan drift |
| Multi-Agent | High | Complex workflows | Coordination overhead |
| Orchestrator-Worker | High | Dynamic subtasking | Bottleneck at orchestrator |
| Evaluator-Optimizer | Medium-High | Quality-critical output | Cost amplification |

---

# 4. Retrieval-Augmented Generation (RAG)

## RAG Architecture Evolution

| Generation | Description | Key Features |
|------------|-------------|--------------|
| **Naive RAG** | Embed â†’ Store â†’ Retrieve top-k â†’ Generate | Simple, good for demos, fails ~40% at retrieval in production |
| **Advanced RAG** | Hybrid search + Reranking + Semantic chunking | 10x quality improvement with reranking |
| **Agentic RAG** | Self-correcting retrieval with iterative query refinement | Agent evaluates retrieval quality, reformulates queries |
| **GraphRAG** | Knowledge graphs + entity/relation extraction | Solves relationship problems, multi-hop reasoning |

## Why Naive RAG Fails in Production

1. **Semantic gap:** User queries and document passages use different vocabulary
2. **Context window pollution:** Retrieving 10 chunks when only 2 are relevant dilutes signal
3. **Chunking artifacts:** Fixed-size chunks split sentences mid-thought, tables mid-row

> When RAG fails, the failure point is retrieval 73% of the time, not generation.

## The RAG Lifecycle (2026)

```
1. RETRIEVE: Query â†’ Embedding â†’ Vector Search + BM25 (hybrid) â†’ Top-K candidates
2. RERANK: Cross-encoder reranks candidates by relevance â†’ Top-N results
3. AUGMENT: Combine question + retrieved context into prompt
4. GENERATE: LLM reasons over context â†’ Grounded answer with citations
```

## Chunking Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| **Fixed-size** | Split at N tokens with overlap | Simple documents, baseline |
| **Recursive** | Split by paragraphs â†’ sentences â†’ words | General purpose |
| **Semantic** | Split at topic/meaning boundaries | Documents with clear sections |
| **Document-aware** | Respect headers, tables, code blocks | Technical documentation |
| **Agentic** | AI agent decides optimal chunk boundaries | Complex, mixed-format documents |

## Embedding Model Selection (2026)

| Model | Dimensions | Max Tokens | Cost/1M | Quality | Speed |
|-------|-----------|------------|---------|---------|-------|
| OpenAI text-embedding-3-small | 1536 | 8191 | $0.02 | Good | Fast |
| OpenAI text-embedding-3-large | 3072 | 8191 | $0.13 | Excellent | Medium |
| Cohere embed-english-v3.0 | 1024 | 512 | $0.10 | Excellent | Fast |
| BAAI/bge-large-en-v1.5 | 1024 | 512 | Free (self-hosted) | Excellent | Varies |
| all-MiniLM-L6-v2 | 384 | 256 | Free | Good | Very Fast |

## Hybrid Search: BM25 + Semantic

Combine keyword-based search (BM25) with semantic vector search for the best of both worlds:
- BM25 catches exact matches and rare terms
- Semantic search captures meaning and synonyms
- Reciprocal Rank Fusion (RRF) merges results

## Reranking: The 10x Quality Multiplier

After initial retrieval (top-50), a cross-encoder reranker scores each passage against the query individually, producing far more accurate relevance ranking than bi-encoder similarity alone.

## Evaluation with RAGAS

Key metrics:
- **Faithfulness:** Is the answer supported by the retrieved context?
- **Answer Relevance:** Does the answer address the question?
- **Context Relevance:** Are the retrieved documents relevant?
- **Context Recall:** Were all necessary documents retrieved?

---

# 5. Large Language Models (LLMs)

## What LLMs Do Well
- Natural language understanding and generation
- Complex reasoning and problem-solving
- Code generation and debugging
- Creative writing and content transformation
- Pattern recognition across domains

## Fundamental Limitations
1. **Training cutoff:** Knowledge frozen at training date
2. **No real-time access:** Cannot look up current information
3. **Hallucination:** Generates confident but incorrect answers when uncertain
4. **No source attribution:** Generates from parameters, not specific data sources
5. **Static knowledge:** Cannot access private or proprietary data

## RAG Addresses All Four Problems
- Retrieved context provides **current facts**
- Provides **private data** to work from
- Gives model **concrete grounding** to stay factual
- Enables clear **source citations** users can verify

---

# 6. Prompting Techniques

## 12 Research-Backed Techniques for 2026

### 1. Zero-Shot Prompting
Direct instructions without examples. Works for simple tasks.

```
Classify this customer email as: Complaint, Question, Feedback, or Request.
Email: [paste email]
Category:
```

### 2. Chain-of-Thought (CoT) Prompting
Ask the model to show reasoning step-by-step. Improves accuracy by **15-40%** on math/logic.

```
# Zero-shot CoT
"Think step by step before answering."

# Structured CoT
"Break this problem into steps:
1. Identify the key variables
2. State any assumptions
3. Work through the logic
4. Verify your answer
5. State your final answer clearly"
```

**When to use:** Math, code debugging, multi-step reasoning, decision-making  
**When to skip:** Simple factual lookups, creative writing, classification

> âš ï¸ **The CoT Paradox (2025+):** Modern reasoning models (o-series, Claude 4, Gemini 3) have internal reasoning loops. Explicitly prompting "think step-by-step" can be redundant, increasing latency by 20-80% for only ~3% gains.

### 3. Tree-of-Thought (ToT) Reasoning
Explores multiple reasoning paths simultaneously, then selects the best.

```
"Consider 3 different approaches to solve this:
Approach A: [describe]
Approach B: [describe]
Approach C: [describe]
Evaluate each on: correctness, efficiency, maintainability.
Select the best and implement it."
```

### 4. Few-Shot Learning Patterns
Provide 2-5 examples of desired input-output format. Most reliable way to control output structure.

**Best practices:**
- Use diverse examples covering edge cases
- Keep examples concise (model learns format, not content)
- Order matters: put most representative example last (recency bias)
- For classification: at least one example per category

### 5. Meta-Prompting & Self-Refinement
Ask the model to improve its own output. Improves quality by **10-25%**.

```
"Generate your best answer, then:
1. Critique: What could be wrong or incomplete?
2. Improve: Fix the issues you identified.
3. Final: Present your improved answer."
```

### 6. DSPy: Automated Prompt Optimization
Replaces hand-written prompts with auto-optimizing modules.

**Key concepts:**
- **Signatures:** Define input/output (like type annotations for prompts)
- **Modules:** Composable prompt components (ChainOfThought, ReAct, ProgramOfThought)
- **Teleprompters:** Optimizers that find best prompt configuration
- **Assertions:** Runtime constraints triggering automatic retry

### 7. Constitutional AI & Guardrails
Embed rules directly into prompts as hard constraints.

```
System prompt rules:
1. Never recommend specific financial investments.
2. Always cite sources when stating statistics.
3. Refuse to generate content about [restricted topics].
4. If uncertain, say "I'm not sure" rather than guessing.
5. Keep responses under 300 words unless asked otherwise.
```

### 8. Agentic Prompt Patterns
Give the model tools and decision-making authority.

- **ReAct:** Think â†’ Act â†’ Observe â†’ Repeat
- **Plan-and-Execute:** Full plan â†’ Execute sequentially â†’ Revise if needed
- **Reflection:** Complete task â†’ Evaluate quality â†’ Retry if below threshold

### 9. Prompt Compression & Token Efficiency
Every token costs money at scale.

| Technique | Description | Savings |
|-----------|-------------|---------|
| LLMLingua | Compresses prompts while maintaining performance | 2-5x reduction |
| Structured schemas | JSON schemas more efficient than natural language | Variable |
| Reference compression | "Follow format in Example 1" instead of repeating | Significant |
| Dynamic context | Include only relevant context per query | Variable |

### 10. Model-Specific Techniques

| Model | Best Techniques | Avoid |
|-------|----------------|-------|
| **GPT-5.5** | Structured JSON, tool schemas, concise system prompts | Overly verbose instructions |
| **Claude Opus 4.7** | XML tags, detailed constraints, thinking blocks | Ambiguous instructions |
| **Gemini 3.1 Pro** | Multimodal context, long documents, grounding | Short, vague prompts |

### 11. Evaluation & Testing Prompts

**Tools:**
- **PromptFoo:** Open-source prompt testing framework
- **LangSmith:** Tracing and evaluation for LLM applications
- **Braintrust:** A/B testing with statistical significance

**Minimum viable testing:** 20 diverse test cases covering happy path, edge cases, and adversarial inputs.

### 12. The 6-Band Framework (sinc-LLM)

Every prompt should address 6 specification dimensions:

| Band | Description | Impact |
|------|-------------|--------|
| **PERSONA** | Expert identity (not "be helpful") | Shapes vocabulary, depth, perspective |
| **CONTEXT** | Situational background, audience, project | Prevents conflicting assumptions |
| **DATA** | Specific inputs, examples, references | Prevents invented/hallucinated examples |
| **CONSTRAINTS** | Rules, boundaries, requirements | **42.7% of reconstruction quality** |
| **FORMAT** | Exact output structure | Prevents default verbose prose |
| **GOAL** | Clear success criteria | Focuses the response |

---

# 7. Embeddings Deep Dive

## What Are Embeddings?
Dense vector representations of text that capture semantic meaning in a continuous vector space.

```
Text                          â†’ Embedding Vector
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
"I love pizza"                â†’ [0.12, -0.34, 0.87, ..., 0.23]
"Pizza is my favorite"        â†’ [0.11, -0.32, 0.85, ..., 0.21]  â† Similar!
"Python programming"          â†’ [-0.45, 0.12, -0.33, ..., 0.67] â† Different
```

## Key Properties
- Fixed dimensionality (384, 768, 1024, 1536 dimensions typical)
- Semantic similarity preserved as cosine similarity
- Dense vectors (vs sparse like TF-IDF)
- Task-agnostic representations (transfer across tasks)

## Evolution Timeline
| Year | Model | Innovation |
|------|-------|------------|
| 2013 | Word2Vec | Word embeddings (Skip-gram, CBOW) |
| 2014 | GloVe | Global vectors for word representation |
| 2018 | ELMo | Contextualized word embeddings |
| 2018 | BERT | Bidirectional transformers |
| 2019 | SBERT | Sentence-level embeddings via Siamese networks |
| 2024 | text-embedding-3 | OpenAI's latest with variable dimensions |

## Use Cases
| Use Case | Description |
|----------|-------------|
| **Semantic Search** | Find documents by meaning, not keywords |
| **RAG** | Retrieve relevant context for LLMs |
| **Clustering** | Group similar content automatically |
| **Recommendations** | Find similar items/users |
| **Deduplication** | Detect near-duplicate content |
| **Classification** | Text categorization via nearest neighbors |

## Code Example: Cosine Similarity

```python
import numpy as np

def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Two similar texts will have cosine similarity close to 1.0
# Two dissimilar texts will have cosine similarity close to 0.0
```

## Embedding Model Comparison (2026)

| Model | Dims | Max Tokens | Cost/1M tokens | Quality | Speed |
|-------|------|------------|----------------|---------|-------|
| text-embedding-3-small (OpenAI) | 1536 | 8191 | $0.02 | Good | Fast |
| text-embedding-3-large (OpenAI) | 3072 | 8191 | $0.13 | Excellent | Medium |
| embed-english-v3.0 (Cohere) | 1024 | 512 | $0.10 | Excellent | Fast |
| bge-large-en-v1.5 (BAAI) | 1024 | 512 | Free | Excellent | Varies |
| all-MiniLM-L6-v2 | 384 | 256 | Free | Good | Very Fast |

**Selection guidance:**
- **Prototyping / low budget:** all-MiniLM-L6-v2 (free, fast)
- **Production quality:** text-embedding-3-large or Cohere v3.0
- **Self-hosted / privacy:** BAAI/bge-large-en-v1.5

---

# 8. Agentic Workflows

## 9 Production-Proven Patterns

### 1. ReAct (Reason + Act)
Pairs brief reasoning with immediate action in small, controlled steps.

```
While task not complete:
    1. THINK: What should I do next?
    2. ACT: Call tool / take action
    3. OBSERVE: Check result
    4. REPEAT or FINISH
```

**Best for:** Triaging requests, routing emails, support macros  
**Watch out for:** Can loop endlessly â€” add max step limits and cost guards

### 2. Plan-and-Execute
Separates strategic planning from tactical execution.

```
1. PLAN: Generate multi-step plan
2. EXECUTE: Run steps sequentially
3. REVIEW: Check results after each step
4. REPLAN: Adjust remaining steps if needed
5. AGGREGATE: Synthesize final result
```

**Best for:** Report generation, research summaries, data enrichment

### 3. Reflection (Self-Correction)
Agent evaluates its own output and iteratively refines.

**Best for:** Code generation, content writing, data validation  
**Key metric:** Quality typically plateaus after 2-3 iterations

### 4. Prompt Chaining
Tasks divided into sub-goals where each LLM output becomes next step's input.

```
Step 1 Output â†’ Step 2 Input â†’ Step 2 Output â†’ Step 3 Input â†’ ...
```

**Best for:** Customer support, assistants needing context preservation

### 5. Routing
Routing layer classifies input and directs to appropriate specialized handler.

**Best for:** Varied request types, cost optimization (route simple queries to cheaper models)

### 6. Parallelization
Big task split into sub-tasks for concurrent execution by multiple agents.

```
            â”Œâ”€â”€ Agent A (subtask 1) â”€â”€â”
Input â”€â”€â”€â”€â”€â”€â”¼â”€â”€ Agent B (subtask 2) â”€â”€â”¼â”€â”€â”€â”€ Aggregator â†’ Result
            â””â”€â”€ Agent C (subtask 3) â”€â”€â”˜
```

**Best for:** Code review, A/B testing, candidate evaluation

### 7. Orchestrator-Worker
Single orchestrator decomposes task and delegates to specialized workers.

**Best for:** RAG systems, coding agents, complex research  
**Watch out for:** Orchestrator can become bottleneck

### 8. Evaluator-Optimizer
Generator produces output; evaluator critiques and sends back for improvement.

**Best for:** Quality-critical content, compliance checking

### 9. Human-in-the-Loop (HITL)
AI executes while human approves at critical decision points.

**Best for:** High-stakes decisions, legal/compliance, financial approvals

## Three Levels of Agentic Behavior

| Level | Decision Type | Example |
|-------|--------------|---------|
| **Level 1: Output** | AI makes output decisions | Basic chat, summarization |
| **Level 2: Router** | AI chooses tasks and tools | Multi-model routing, tool selection |
| **Level 3: Autonomous** | AI creates new tasks and tools | Fully autonomous agents |

---

# 9. Templates & Prompt Examples

## Template 1: Structured CoT for Complex Analysis

```
You are a [ROLE] with expertise in [DOMAIN].

## Task
[DESCRIBE THE TASK]

## Instructions
1. First, identify the key variables and constraints.
2. List your assumptions explicitly.
3. Work through the analysis step-by-step.
4. Verify your reasoning by checking for logical errors.
5. Present your final answer with confidence level (High/Medium/Low).

## Constraints
- [CONSTRAINT 1]
- [CONSTRAINT 2]
- Maximum response length: [N] words

## Output Format
[SPECIFY EXACT FORMAT: JSON, Markdown table, bullet points, etc.]
```

## Template 2: Few-Shot Classification

```
Classify the following customer messages into categories.

Categories: Billing, Technical Support, Feature Request, Complaint, General Inquiry

Examples:
---
Message: "I was charged twice for my subscription"
Category: Billing
---
Message: "The app crashes when I try to upload files"
Category: Technical Support
---
Message: "It would be great if you could add dark mode"
Category: Feature Request
---
Now classify:
Message: "[USER INPUT]"
Category:
```

## Template 3: Meta-Prompting Self-Refinement

```
## Phase 1: Generate
Create a [DELIVERABLE] for [CONTEXT].

## Phase 2: Self-Critique
Review your output above. Evaluate on:
1. Accuracy: Are all facts correct?
2. Completeness: Is anything missing?
3. Clarity: Is the language clear and unambiguous?
4. Format: Does it match the requested structure?

List specific issues found.

## Phase 3: Revise
Fix every issue identified above. Present your improved final version.
```

## Template 4: Agentic System Prompt

```
You are an AI assistant with access to the following tools:
- web_search(query): Search the internet
- database_query(sql): Query the company database (SELECT only)
- send_email(to, subject, body): Send an email
- create_ticket(title, description, priority): Create a support ticket

## Behavior Rules
1. Always explain your reasoning before taking an action.
2. If uncertain, ask the user for clarification instead of guessing.
3. Never perform destructive operations without explicit user confirmation.
4. Limit yourself to 5 tool calls per request.
5. If a tool call fails, try once more with a modified approach, then report the failure.

## Response Format
For each step:
THOUGHT: [Your reasoning]
ACTION: [Tool name and parameters]
OBSERVATION: [Tool result]
... repeat as needed ...
FINAL ANSWER: [Your response to the user]
```

## Template 5: RAG System Prompt

```
You are a helpful assistant that answers questions based on the provided context.

## Rules
1. Base your answer ONLY on the provided context documents.
2. If the context doesn't contain enough information, say "I don't have enough information to answer this question."
3. Always cite your sources using [Source: document_name] format.
4. Never make up or infer information not present in the context.
5. If multiple sources conflict, mention the discrepancy.

## Context Documents
{retrieved_documents}

## User Question
{user_question}

## Answer
```

## Template 6: 6-Band Complete Prompt (sinc-LLM Framework)

```
## PERSONA
You are a senior distributed systems engineer with 15 years of production experience.

## CONTEXT
We are migrating our monolithic application to microservices. The team has 8 developers,
and we need a migration strategy that minimizes downtime. Budget: $50K.

## DATA
Current architecture: [paste architecture diagram or description]
Traffic patterns: [paste metrics]
Pain points: [list specific issues]

## CONSTRAINTS
- Zero-downtime deployment required
- Must maintain backward compatibility for 6 months
- Cannot exceed $50K budget
- Timeline: 3 months
- Must use Kubernetes

## FORMAT
Respond as a structured technical proposal with:
1. Executive Summary (100 words max)
2. Migration Phases (table with timeline, risk, cost)
3. Architecture Diagram (ASCII)
4. Risk Mitigation Plan (bullet points)
5. Cost Breakdown (table)

## GOAL
Produce a migration proposal our VP of Engineering can approve this week.
```

---

# 10. Decision Frameworks

## Framework 1: Choosing an Agent Architecture

```
START
  â”‚
  â–¼
Can a single LLM call solve this? â”€â”€Yesâ”€â”€> Direct Model Call
  â”‚ No
  â–¼
Do you need dynamic tool use? â”€â”€Noâ”€â”€> Prompt Chaining
  â”‚ Yes
  â–¼
Is one domain sufficient? â”€â”€Yesâ”€â”€> Single Agent + Tools
  â”‚ No
  â–¼
Are tasks parallelizable? â”€â”€Yesâ”€â”€> Concurrent Orchestration
  â”‚ No
  â–¼
Is a linear pipeline sufficient? â”€â”€Yesâ”€â”€> Sequential Orchestration
  â”‚ No
  â–¼
Do agents need to discuss/debate? â”€â”€Yesâ”€â”€> Group Chat Orchestration
  â”‚ No
  â–¼
Does responsibility transfer? â”€â”€Yesâ”€â”€> Handoff Pattern
  â”‚ No
  â–¼
Orchestrator-Worker Pattern
```

## Framework 2: Choosing a Prompting Technique

| Task Type | Recommended Technique | Why |
|-----------|----------------------|-----|
| Simple factual Q&A | Zero-Shot | LLM handles directly |
| Math / Logic problems | Chain-of-Thought | Step-by-step improves accuracy 15-40% |
| Creative problem-solving | Tree-of-Thought | Explores multiple approaches |
| Structured output needed | Few-Shot | Demonstrates exact format |
| Quality-critical content | Meta-Prompting (Self-Refinement) | Iterative improvement 10-25% |
| Production pipelines | DSPy | Auto-optimization, measurable |
| Safety-sensitive applications | Constitutional AI | Hard guardrails |
| Multi-step autonomous tasks | Agentic Prompts (ReAct) | Tool use + reasoning |
| Cost-sensitive at scale | Prompt Compression | 2-5x token reduction |

## Framework 3: RAG vs Fine-Tuning vs Prompt Engineering

| Factor | Prompt Engineering | RAG | Fine-Tuning |
|--------|-------------------|-----|-------------|
| **Setup cost** | Free | Medium | High |
| **Data freshness** | N/A | Real-time | Stale at training |
| **Private data** | âš ï¸ In prompt only | âœ… Indexed externally | âœ… In model weights |
| **Accuracy** | Low-Medium | High | High |
| **Maintenance** | Low | Medium | High |
| **Hallucination control** | Low | High (grounded) | Medium |
| **Best for** | Simple tasks | Knowledge-intensive Q&A | Domain-specific tone/behavior |

## Framework 4: Workflow Pattern Selection

| Your Scenario | Recommended Pattern |
|---------------|-------------------|
| Linear, step-by-step with dependencies | **Prompt Chaining** |
| Need speed, tasks are independent | **Parallelization** |
| Quality matters more than speed | **Evaluator-Optimizer** |
| Complex task needing decomposition | **Plan-and-Execute** |
| Multiple domains of expertise | **Orchestrator-Worker** |
| Input varies widely in category | **Router** |
| High-stakes decisions | **Human-in-the-Loop** |
| Need self-improvement | **Reflection** |
| Fast-moving tasks, continuous action | **ReAct** |

---

# 11. Validated Learning Resources

## ðŸ“š Comprehensive Guides

| Topic | Resource | URL |
|-------|----------|-----|
| Agent Patterns | AI Agent Orchestration Patterns - Azure Architecture Center | https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns |
| Agent Patterns | Choose a Design Pattern - Google Cloud | https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system |
| Agent Architectures | The Ultimate Guide to AI Agent Architectures 2025 - DEV Community | https://dev.to/sohail-akbar/the-ultimate-guide-to-ai-agent-architectures-in-2025-2j1c |
| Agent Patterns 2026 | AI Agent Architecture Patterns in 2026 - Codebridge | https://www.codebridge.tech/articles/the-5-agentic-ai-design-patterns-ctos-should-evaluate-before-choosing-an-architecture |
| Agent Patterns | AI Agent Architecture Patterns: Complete Guide 2025 - Fast.io | https://fast.io/resources/ai-agent-architecture-patterns/ |
| Agentic Design | The Definitive Guide to Agentic Design Patterns 2026 - SitePoint | https://www.sitepoint.com/the-definitive-guide-to-agentic-design-patterns-in-2026/ |
| Pattern Taxonomy | AI/LLM Architectural Patterns Taxonomy - GitHub | https://github.com/matu143/agentic_patterns/blob/main/AI_LLM_Architectural_Patterns_Taxonomy.md |
| RAG Production | RAG Production Guide 2026 - Lushbinary | https://lushbinary.com/blog/rag-retrieval-augmented-generation-production-guide/ |
| RAG Tutorial | How RAG Works - Dataquest | https://www.dataquest.io/blog/retrieval-augmented-generation/ |
| RAG Complete | Complete Guide to RAG: Naive, Advanced, GraphRAG - MrLatte | https://www.mrlatte.net/en/research/2026/04/27/rag-complete-guide/ |
| RAG Guide 2025 | RAG Complete Guide - Collabnix | https://collabnix.com/rag-retrieval-augmented-generation-the-complete-guide-to-building-intelligent-ai-systems-in-2025/ |
| RAG Explained | RAG Explained 2026 - GenAIML Institute | https://www.genaimlinstitute.com/blog/retrieval-augmented-generation-rag-explained |
| RAG Guide | The 2025 Guide to RAG - Eden AI | https://www.edenai.co/post/the-2025-guide-to-retrieval-augmented-generation-rag |
| Prompt Engineering | The Ultimate Prompt Engineering Guide 2026 - Lakera | https://www.lakera.ai/blog/prompt-engineering-guide |
| Prompt Techniques | Advanced Prompt Engineering 2025 - Maxim AI | https://www.getmaxim.ai/articles/advanced-prompt-engineering-techniques-in-2025/ |
| Prompt Engineering | 12 Advanced Techniques 2026 - Lushbinary | https://lushbinary.com/blog/advanced-prompt-engineering-techniques-developer-guide/ |
| Prompt Engineering | Complete Guide 2026 - sinc-LLM | https://sincllm.com/blog/prompt-engineering-guide-2026 |
| Prompt Engineering | The 2026 Guide - IBM | https://www.ibm.com/think/prompt-engineering |
| Prompting Techniques | Advanced Prompting Techniques - DeepWiki | https://deepwiki.com/jason-effi-lab/karpathy-llm-wiki-vault/5.1-advanced-prompting-techniques |
| Embeddings | Embeddings Deep Dive - Dev Weekends | https://resources.devweekends.com/ai-engineering/embeddings |
| Embeddings | Vector Embeddings - OpenAI API | https://developers.openai.com/api/docs/guides/embeddings |
| Embeddings | Text Embeddings using OpenAI - GeeksforGeeks | https://www.geeksforgeeks.org/nlp/text-embeddings-using-openai/ |
| Embeddings | Embedding Models Explained - Spot Intelligence | https://spotintelligence.com/2025/09/18/embedding-models/ |
| Embeddings + RAG | Complete Guide to Embeddings and RAG - Medium | https://medium.com/@sharanharsoor/the-complete-guide-to-embeddings-and-rag-from-theory-to-production-758a16d747ac |
| Embeddings | Embedding Models Comprehensive Guide - GitHub | https://github.com/girijesh-ai/ai-interview-codex/blob/main/embedding-models-comprehensive-guide.md |
| Workflows | Agentic Workflows 2026 Guide - Vellum | https://www.vellum.ai/blog/agentic-workflows-emerging-architectures-and-design-patterns |
| Workflows | 9 Agentic Workflow Patterns 2026 - Beam AI | https://beam.ai/agentic-insights/the-9-best-agentic-workflow-patterns-to-scale-ai-agents-in-2026 |
| Workflows | 10 Agentic Workflow Patterns - TechGropse | https://www.techgropse.com/blog/top-10-agentic-ai-workflow-patterns/ |
| Workflows | Agentic AI Architecture - Designveloper | https://www.designveloper.com/blog/agentic-ai-architecture-and-workflow/ |
| Intelligence Stack | LLMs vs RAG vs Agents - Analytics Vidhya | https://www.analyticsvidhya.com/blog/2025/10/ai-agents-vs-llms-vs-rag/ |
| Intelligence Stack | LLM vs RAG vs Agents: Complete Stack - Medium | https://medium.com/@ericajayasundera/llm-vs-rag-vs-agents-the-complete-intelligence-stack-explained-62426dfe7347 |
| Agent Anatomy | The Actual Anatomy of an AI Agent - DEV Community | https://dev.to/dextralabs/the-actual-anatomy-of-an-ai-agent-llms-rag-loops-and-action-layers-33nf |
| Academic Survey | Review of LLM-Based Agent Paradigms - ACL Anthology | https://aclanthology.org/2025.coling-main.652/ |
| Production Guide | Designing Production-Grade Agentic AI - arXiv | https://arxiv.org/pdf/2512.08769 |

## ðŸŽ¬ Video Tutorials

| Topic | Resource | URL |
|-------|----------|-----|
| AI Agents | AI Agents Full Course 2025 - Simplilearn | https://www.youtube.com/watch?v=uXVLyJJLEKA |
| RAG Tutorial | Complete RAG Tutorial 2025 (17-Part Series) | https://www.youtube.com/playlist?list=PLNIQLFWpQMRUMjxfe8o6g3uzJ6LH_VotY |
| RAG Explained | RAG Explained For Beginners - Simplilearn | https://www.youtube.com/watch?v=HkUs8mb0k3s |
| Prompt Engineering | LLM Prompt Engineering Full Course 2026 - Edureka | https://www.youtube.com/watch?v=oV7X01_A3EI |

---

## ðŸ“‹ Quick Reference Card

### The 5 Things Every AI Builder Must Know

1. **Start simple.** Use the lowest complexity pattern that meets requirements.
2. **Retrieval is the bottleneck.** In RAG systems, invest most effort in retrieval quality (chunking, hybrid search, reranking).
3. **Prompts are code.** Version them, test them, measure them. Use 20+ test cases minimum.
4. **Patterns compose.** Production systems combine multiple patterns: Router â†’ Orchestrator â†’ Subagents â†’ RAG â†’ Evaluator â†’ Human approval.
5. **Safety is not optional.** Add guardrails, human-in-the-loop checkpoints, and input validation from day one.

### The Golden Rule
> **"Think in Flows, Not Prompts."** â€” Optimizing the content of an LLM call is useful but insufficient. The real challenge is deciding what calls to make, in what order, with what data, and what to do when things go wrong.

---

*This resource was compiled on May 2, 2026. The AI landscape evolves rapidly â€” validate URLs and revisit architectural decisions periodically.*

---

# The AI Master Learning Prompt

### A Comprehensive Resource & Reusable Prompt for: LLMs Â· Prompting Â· Embeddings Â· RAG Â· Agents Â· Workflows Â· MCP

**Version:** 2026.05 Â· **Audience:** Practitioners building production AI systems Â· **Format:** Self-contained reference \+ reusable prompt template

---

## How to Use This Document

This document has two purposes:

1. **As a learning resource** â€” work top-to-bottom. Each section gives you the concept in plain English, validated primary-source URLs, working templates, and a study path.  
2. **As a reusable prompt** â€” copy any section (or the whole thing) into a chat with Claude, GPT, Gemini, or any frontier LLM. The "Master Prompt" block below is engineered to spin up a tutoring session on any subtopic.

All URLs were validated in early 2026\. The field moves fast â€” when in doubt, check the official docs linked in each section before relying on a third-party summary.

---

## The Master Prompt (Copy-Paste Ready)

ROLE

You are a senior AI engineer and tutor. You have deep, current knowledge of:

  \- LLM fundamentals (transformers, tokenization, sampling, context windows)

  \- Prompting techniques (clarity, examples, XML, chain-of-thought, extended thinking)

  \- Embeddings & vector databases (pgvector, Pinecone, Qdrant, Weaviate, Chroma)

  \- Retrieval-Augmented Generation (chunking, hybrid search, reranking, RAGAS)

  \- Agent systems (single & multi-agent, tool use, memory, planning)

  \- Workflow patterns (chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer)

  \- Model Context Protocol (MCP) and tool integration

  \- Production concerns (eval, observability, cost, safety)

TASK

Teach me {TOPIC} at the level of {BEGINNER | INTERMEDIATE | ADVANCED}.

My goal is: {GOAL â€” e.g., "ship a RAG chatbot over our 10k-doc help center"}.

My current stack: {STACK â€” e.g., "Python, Postgres, Anthropic API"}.

My constraints: {CONSTRAINTS â€” e.g., "must run on-prem, \<$500/mo"}.

METHOD

1\. Start with the smallest mental model that explains why this technique exists

   and what problem it solves. No jargon before it's defined.

2\. Show one minimal working example I can run in \<5 minutes. Use my stack.

3\. Identify the 3â€“5 decisions that actually move the needle in production

   (the "what only experience teaches" list).

4\. List the failure modes I will hit, in the order I will hit them,

   with the fix for each.

5\. Give me an evaluation rubric â€” how do I know it's working?

6\. Recommend exactly 3 next resources (paper, doc, or repo) â€” no more.

7\. End with one concrete exercise I can do today.

CONSTRAINTS ON YOUR RESPONSE

\- Cite primary sources (Anthropic / OpenAI / paper authors / official docs) over blog posts.

\- If something has changed in the last 6 months, say so and search if you can.

\- Prefer working code over pseudocode.

\- If I'm about to make a common mistake, stop me before showing the example.

\- Be honest about tradeoffs â€” every choice costs something.

**Fill in `{TOPIC}`, `{LEVEL}`, `{GOAL}`, `{STACK}`, `{CONSTRAINTS}` and send.** The rest of this document explains what to put in `{TOPIC}` and gives you the background to evaluate the answer you get back.

---

## 1\. The Mental Model â€” How These Pieces Fit Together

Before any single topic, hold this picture in your head:

                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”

                    â”‚    User / Application    â”‚

                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

                                  â”‚

                       (prompt \+ context)

                                  â”‚

                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”

                    â”‚       LLM (the brain)    â”‚  â† Section 2, 3

                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

                                  â”‚

              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”

              â”‚                   â”‚                   â”‚

       â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”

       â”‚  Retrieval  â”‚    â”‚     Tools    â”‚    â”‚    Memory   â”‚  â† Section 4, 5, 6

       â”‚  (RAG /     â”‚    â”‚   (MCP /     â”‚    â”‚  (short &   â”‚

       â”‚  embeddings)â”‚    â”‚  function-   â”‚    â”‚   long term)â”‚

       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚    calling)  â”‚    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

                                  â”‚

                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”

                    â”‚  Workflow / Agent loop   â”‚  â† Section 7, 8

                    â”‚  (orchestration)         â”‚

                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

The LLM is the reasoning core. Everything else is an *augmentation*: retrieval gives it knowledge, tools give it actions, memory gives it continuity, and workflows give it structure. Anthropic's "Building Effective Agents" guide calls the base unit *the augmented LLM* â€” that's the right primitive to design around.

â†’ **Primary source:** [https://www.anthropic.com/research/building-effective-agents](https://www.anthropic.com/research/building-effective-agents)

---

## 2\. LLM Fundamentals

### Concept

A large language model is a transformer trained to predict the next token. That single objective, scaled to trillions of tokens and billions of parameters, produces the emergent reasoning we now use in production. You don't need to be able to derive attention from scratch, but you do need to internalize four things:

- **Tokens, not words.** Cost, latency, and context limits are all in tokens. \~4 characters â‰ˆ 1 token in English.  
- **Context window.** Everything the model "sees" on a turn â€” system prompt, conversation history, retrieved documents, tool outputs â€” fits in this window. Modern frontier models offer 200Kâ€“2M tokens.  
- **Sampling parameters.** `temperature` controls randomness; `top_p` controls diversity; both affect determinism. For factual / structured tasks, lower is better.  
- **Knowledge cutoff.** Models don't know events after their training date. Anything time-sensitive needs retrieval or web search.

### Validated learning resources

| Resource | URL | Best for |
| :---- | :---- | :---- |
| Hugging Face LLM Course (free, definitive) | [https://huggingface.co/learn/llm-course/chapter1/1](https://huggingface.co/learn/llm-course/chapter1/1) | End-to-end foundations |
| Maxime Labonne's LLM Course (GitHub) | [https://huggingface.co/blog/mlabonne/llm-course](https://huggingface.co/blog/mlabonne/llm-course) | Going deeper on training/eval |
| DeepLearning.AI short courses | [https://learn.deeplearning.ai/](https://learn.deeplearning.ai/) | Bite-size topical lessons |
| Anthropic â€” What's new in Claude | [https://docs.claude.com/en/release-notes](https://docs.claude.com/en/release-notes) | Capability tracking |
| 3Blue1Brown â€” Transformer visualizations | [https://www.3blue1brown.com/topics/neural-networks](https://www.3blue1brown.com/topics/neural-networks) | Intuition for attention |

### Decision rubric (which model to use)

1. **Frontier task, no budget pressure** â†’ strongest available (Claude Opus, GPT-5-class, Gemini Ultra-class)  
2. **High-volume, latency-sensitive** â†’ mid-tier (Claude Sonnet/Haiku, GPT-mini)  
3. **On-prem / privacy-critical** â†’ open weights via vLLM or Ollama (Llama, Qwen, Mistral, DeepSeek)  
4. **Specialized domain** â†’ start with frontier \+ prompting; only fine-tune if you've measured a clear gap

---

## 3\. Prompting Techniques

### The hierarchy that actually matters

Most "prompt engineering" advice collapses into a small number of high-leverage moves. In rough order of impact:

1. **Be specific about the task, audience, and output format.** Vague in â†’ vague out. Always.  
2. **Give examples (few-shot).** One good example beats a paragraph of instructions.  
3. **Use structure (XML tags, headers, JSON schema).** Models are trained on structured text; help them parse what's input vs. instruction vs. example.  
4. **Ask for reasoning before the answer** (chain-of-thought / extended thinking). For any task harder than a lookup.  
5. **Assign a role only when it changes behavior.** "You are an expert..." is overused; it helps when expertise actually shifts the answer (legal, medical, code review).  
6. **Iterate against an eval, not vibes.** Measure before and after every prompt change.

### Template â€” production-grade prompt skeleton

\<role\>

You are a {ROLE}. You optimize for {OBJECTIVE\_1} and {OBJECTIVE\_2},

in that order.

\</role\>

\<context\>

{Background facts the model needs. Place long documents here, at the top.}

\</context\>

\<task\>

{What you want done, in one sentence.}

\</task\>

\<rules\>

\- {Hard constraint 1}

\- {Hard constraint 2}

\- If {edge case}, do {behavior}.

\</rules\>

\<examples\>

\<example\>

\<input\>{representative input 1}\</input\>

\<output\>{ideal output 1}\</output\>

\</example\>

\<example\>

\<input\>{representative input 2}\</input\>

\<output\>{ideal output 2}\</output\>

\</example\>

\</examples\>

\<output\_format\>

{Exact structure â€” JSON schema, markdown headings, etc.}

\</output\_format\>

\<input\>

{The actual user input goes here, last.}

\</input\>

Why last? On long-context tasks, putting the query at the end (after the documents) measurably improves accuracy.

### Validated learning resources

| Resource | URL | Notes |
| :---- | :---- | :---- |
| Anthropic â€” Prompting best practices | [https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview) | The single source of truth for Claude |
| Anthropic â€” Interactive Prompt Engineering Tutorial | [https://github.com/anthropics/prompt-eng-interactive-tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial) | 9 chapters, hands-on |
| OpenAI â€” Prompt engineering guide | [https://platform.openai.com/docs/guides/prompt-engineering](https://platform.openai.com/docs/guides/prompt-engineering) | GPT-flavored techniques |
| Google â€” Prompt engineering whitepaper | [https://www.kaggle.com/whitepaper-prompt-engineering](https://www.kaggle.com/whitepaper-prompt-engineering) | Vendor-neutral patterns |
| Prompting Guide (community) | [https://www.promptingguide.ai/](https://www.promptingguide.ai/) | Broad survey of techniques |

### Failure modes you will hit (and the fix)

- **Model ignores a rule** â†’ move the rule from prose to a numbered list at the end of the prompt; restate it in `<rules>`.  
- **Output drifts in format** â†’ add a JSON schema and "respond ONLY with JSON, no preamble."  
- **Hallucination on facts** â†’ require the model to quote sources before reasoning ("First, quote the relevant passage. Then answer.").  
- **Refusal on safe content** â†’ reduce role-playing intensity, clarify legitimate context.  
- **Over-long output** â†’ set explicit word/sentence/bullet limits; specify the audience.

---

## 4\. Embeddings & Vector Databases

### Concept

An **embedding** is a vector (typically 256â€“3072 floats) that represents the semantic meaning of a piece of text, image, or audio. Texts that mean similar things produce vectors that are close together in space. That property â€” and only that property â€” is what makes semantic search and RAG possible.

A **vector database** stores millions or billions of these vectors and answers the question *"which N vectors are closest to this query vector?"* in milliseconds, using approximate-nearest-neighbor (ANN) algorithms like HNSW or IVF.

### Three rules you cannot break

1. **Use the same embedding model for documents and queries.** Vectors from different models live in different spaces and similarity scores are meaningless across them.  
2. **Use the distance metric the model was trained on** â€” usually cosine for OpenAI/Cohere/Voyage. The model card tells you.  
3. **If you change embedding models, you must re-embed everything.** Old and new vectors are not comparable.

### Choosing an embedding model (2026)

| Model | Dim | Context | Strength |
| :---- | :---- | :---- | :---- |
| OpenAI `text-embedding-3-small` | 1536 (configurable down) | 8K | Cheap default, broadly good |
| OpenAI `text-embedding-3-large` | 3072 | 8K | Higher quality, modest cost increase |
| Cohere `embed-v4.0` | 256â€“1536 | 128K | Multilingual, multimodal, long context |
| Voyage `voyage-3-large` / `voyage-4-large` | 1024 | 32K | Top retrieval benchmarks; MongoDB-owned |
| `BGE-M3` (open weights) | 1024 | 8K | Self-host, strong multilingual |
| `nomic-embed-text` (open weights) | 768 | 8K | Lightweight, runs locally via Ollama |

### Choosing a vector database

| Option | When to choose it |
| :---- | :---- |
| **pgvector** (Postgres extension) | You already have Postgres. \<50M vectors. Default starting point. |
| **Chroma** | Local prototyping, embedded use cases |
| **Qdrant** | Open-source, self-host, excellent filtering |
| **Weaviate** | Built-in hybrid search, multi-modal |
| **Pinecone** | Managed, fast time-to-production, willing to pay |
| **Milvus** | 100M+ vectors, GPU acceleration |

The honest advice: **start with pgvector** unless you have a documented reason not to. You won't outgrow it before you outgrow your initial assumptions.

### Validated learning resources

- OpenAI Embeddings docs â€” [https://platform.openai.com/docs/guides/embeddings](https://platform.openai.com/docs/guides/embeddings)  
- Cohere Embed docs â€” [https://docs.cohere.com/docs/embeddings](https://docs.cohere.com/docs/embeddings)  
- Voyage AI docs â€” [https://docs.voyageai.com/](https://docs.voyageai.com/)  
- pgvector â€” [https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)  
- Qdrant â€” [https://qdrant.tech/documentation/](https://qdrant.tech/documentation/)  
- MTEB leaderboard (live benchmarks) â€” [https://huggingface.co/spaces/mteb/leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

### Minimal working example (Python)

import os

from openai import OpenAI

client \= OpenAI()

def embed(text: str) \-\> list\[float\]:

    resp \= client.embeddings.create(

        model="text-embedding-3-small",

        input=text,

    )

    return resp.data\[0\].embedding

def cosine(a, b):

    import numpy as np

    a, b \= np.array(a), np.array(b)

    return (a @ b) / (np.linalg.norm(a) \* np.linalg.norm(b))

q \= embed("How do I reset my password?")

d \= embed("Steps to change login credentials")

print(cosine(q, d))  \# \~0.85 â€” semantically very close

---

## 5\. Retrieval-Augmented Generation (RAG)

### Concept

Fine-tuning teaches a model new style and skills. **RAG teaches it new facts at query time** by injecting relevant documents into the prompt before generation. It's how you build a chatbot that knows your company's docs without retraining anything.

The naive pipeline is: *embed docs â†’ store in vector DB â†’ retrieve top-k â†’ stuff into prompt â†’ generate*. This works for demos. It fails in production, often, because retrieval finds the wrong documents and the LLM confidently answers from them.

### The production RAG checklist (in order)

1. **Chunking strategy.** 200â€“800 tokens, with 10â€“20% overlap, respecting structural boundaries (paragraphs, headings, code blocks). Bad chunking is the \#1 RAG failure.  
2. **Hybrid search.** Combine dense (embeddings) \+ sparse (BM25). Pure vector search misses exact terms, IDs, and acronyms; users type those constantly.  
3. **Reranking.** Retrieve top 50, rerank with a cross-encoder (Cohere Rerank, Voyage Rerank, BGE Reranker), keep top 5â€“10. This is the highest-leverage single addition you can make.  
4. **Metadata filtering.** Tenant ID, date range, document type â€” filter *before* vector search whenever possible.  
5. **Citations in the prompt.** Force the model to cite which chunk supports each claim. Reduces hallucination measurably.  
6. **Evaluation with RAGAS.** Faithfulness, answer relevancy, context precision, context recall. Target \>0.85 on each before shipping.

### When NOT to use RAG

- The knowledge fits in the context window. Just paste it in.  
- The task needs reasoning over the *whole* corpus, not retrieved slices (use long-context or summarization).  
- The data changes per-second (RAG indexes go stale; consider live tool calls instead).

### Validated learning resources

- Searching for Best Practices in RAG (Fudan, 2024\) â€” [https://arxiv.org/pdf/2407.01219](https://arxiv.org/pdf/2407.01219)  
- RAG GitHub repository (companion code) â€” [https://github.com/FudanDNN-NLP/RAG](https://github.com/FudanDNN-NLP/RAG)  
- LlamaIndex docs â€” [https://docs.llamaindex.ai/](https://docs.llamaindex.ai/)  
- LangChain RAG tutorial â€” [https://python.langchain.com/docs/tutorials/rag/](https://python.langchain.com/docs/tutorials/rag/)  
- RAGAS evaluation framework â€” [https://docs.ragas.io/](https://docs.ragas.io/)  
- Anthropic Contextual Retrieval blog post â€” [https://www.anthropic.com/news/contextual-retrieval](https://www.anthropic.com/news/contextual-retrieval)

### Reusable RAG prompt template

\<context\>

You are answering a question using only the provided documents.

If the answer is not in the documents, say "I don't have information on that"

and do not guess.

\</context\>

\<documents\>

\<document index="1" source="{source\_url\_1}"\>

{chunk\_text\_1}

\</document\>

\<document index="2" source="{source\_url\_2}"\>

{chunk\_text\_2}

\</document\>

\<\!-- â€¦ \--\>

\</documents\>

\<instructions\>

1\. First, quote the exact sentences from the documents that support your answer.

2\. Then, write the answer in 2â€“4 sentences.

3\. End with a list of the document indices you used.

\</instructions\>

\<question\>

{user\_question}

\</question\>

---

## 6\. Agent Systems

### Concept â€” Workflows vs. Agents (Anthropic's distinction)

This distinction is worth tattooing somewhere visible:

**Workflows** are systems where LLMs and tools are orchestrated through *predefined code paths*. **Agents** are systems where LLMs *dynamically direct their own processes and tool usage*.

Workflows are predictable, debuggable, and cheaper. Agents are flexible, capable of unbounded tasks, and harder to control. **Start with a workflow.** Move to an agent only when the task's branching is too complex to enumerate. Most production "agents" should actually be workflows.

### The five canonical workflow patterns

From Anthropic's *Building Effective Agents*:

1. **Prompt chaining** â€” break a task into sequential LLM calls, each refining the previous output. Use when steps are fixed (outline â†’ draft â†’ edit).  
2. **Routing** â€” classify input and dispatch to a specialized prompt/model. Use for heterogeneous inputs (refund vs. tech support vs. sales).  
3. **Parallelization** â€” run independent subtasks simultaneously, aggregate. Use for sectioned analysis (security review \+ perf review \+ style review of code).  
4. **Orchestrator-workers** â€” a lead LLM dynamically decomposes the task and assigns subtasks. Use when subtasks aren't known in advance (multi-file code edits).  
5. **Evaluator-optimizer** â€” one LLM produces, another critiques, loop until quality threshold met. Use when iterative refinement helps (translation, complex search).

### Agent loop (when you actually need one)

loop:

  thought \= LLM(state, available\_tools)

  if thought.is\_done: return thought.answer

  tool\_result \= execute(thought.chosen\_tool, thought.tool\_input)

  state.append(thought, tool\_result)

  if state.steps \> MAX\_STEPS: break  \# always have a stopping condition

### Multi-agent â€” when, and when not

**Use multi-agent when:**

- Distinct expertise domains (researcher \+ coder \+ reviewer)  
- Parallelizable subtasks  
- Adversarial verification helps (generator \+ critic)

**Don't use multi-agent when:**

- A single well-prompted agent works (it usually does)  
- Sub-agents share most of their context (you're paying tokens for nothing)  
- Failures compound (each agent's error rate multiplies)

### Framework choice (2026)

| Framework | When to choose |
| :---- | :---- |
| **No framework** (direct API) | \<300 lines of orchestration. Recommended starting point per Anthropic. |
| **LangGraph** | Production multi-step workflows, durable execution, audit trails |
| **CrewAI** | Quick role-based prototypes, intuitive abstractions |
| **AutoGen / AG2** | Conversational multi-agent research |
| **OpenAI Agents SDK** | OpenAI-native, handoff-based |
| **Google ADK** | Gemini-native, hierarchical |
| **Anthropic Claude Agent SDK** | Claude-native, integrates with Skills \+ MCP |

### Validated learning resources

- Anthropic â€” Building Effective Agents â€” [https://www.anthropic.com/research/building-effective-agents](https://www.anthropic.com/research/building-effective-agents)  
- Anthropic â€” Architecture Patterns whitepaper â€” [https://resources.anthropic.com/building-effective-ai-agents](https://resources.anthropic.com/building-effective-ai-agents)  
- Anthropic â€” Writing tools for agents â€” [https://www.anthropic.com/engineering/writing-tools-for-agents](https://www.anthropic.com/engineering/writing-tools-for-agents)  
- LangGraph docs â€” [https://langchain-ai.github.io/langgraph/](https://langchain-ai.github.io/langgraph/)  
- CrewAI docs â€” [https://docs.crewai.com/](https://docs.crewai.com/)  
- AutoGen / AG2 â€” [https://github.com/microsoft/autogen](https://github.com/microsoft/autogen)  
- IBM/Coursera â€” Agentic AI with LangGraph, CrewAI, AutoGen, BeeAI â€” [https://www.coursera.org/learn/agentic-ai-with-langgraph-crewai-autogen-and-beeai](https://www.coursera.org/learn/agentic-ai-with-langgraph-crewai-autogen-and-beeai)

---

## 7\. AI Workflow Patterns (Architectural / "Family Patterns")

If you take only one set of patterns from this document, take these. They generalize across LLM providers, frameworks, and use cases.

### The pattern catalog

| Pattern | Shape | Best for |
| :---- | :---- | :---- |
| **Augmented LLM** | LLM \+ retrieval \+ tools \+ memory | The base unit. Always start here. |
| **Prompt chaining** | A â†’ B â†’ C | Predictable multi-step tasks |
| **Routing** | classify â†’ branch | Heterogeneous inputs |
| **Parallelization (sectioning)** | split â†’ parallel LLMs â†’ aggregate | Independent subtasks |
| **Parallelization (voting)** | same task Ã— N â†’ majority/score | Reliability-critical decisions |
| **Orchestrator-workers** | lead LLM â†’ dynamic sub-tasks â†’ aggregate | Unpredictable decomposition |
| **Evaluator-optimizer** | generate â†’ critique â†’ revise | Iterative quality improvement |
| **ReAct (Reason \+ Act)** | thought â†’ action â†’ observation loop | Tool-using agents |
| **Reflection** | output â†’ self-critique â†’ revised output | Single-pass quality lift |
| **Tree-of-Thought** | branch â†’ evaluate â†’ prune â†’ continue | Search-style reasoning |
| **Plan-and-execute** | plan once â†’ execute steps | Long horizon, low branching |
| **Cache-augmented (CAG)** | precompute KV cache for static context | Same docs, many queries |
| **Graph RAG** | retrieve over knowledge graph, not vector chunks | Relational reasoning |

### Validated learning resources

- Cloudflare implementation of Anthropic's 5 patterns â€” [https://github.com/cloudflare/agents/tree/main/guides/anthropic-patterns](https://github.com/cloudflare/agents/tree/main/guides/anthropic-patterns)  
- Vercel AI SDK workflow patterns â€” [https://ai-sdk.dev/docs/agents/workflows](https://ai-sdk.dev/docs/agents/workflows)  
- GenAI Design Patterns catalog (Lakshmanan) â€” [https://github.com/lakshmanok/generative-ai-design-patterns](https://github.com/lakshmanok/generative-ai-design-patterns)  
- ReAct paper â€” [https://arxiv.org/abs/2210.03629](https://arxiv.org/abs/2210.03629)  
- Reflection / Reflexion paper â€” [https://arxiv.org/abs/2303.11366](https://arxiv.org/abs/2303.11366)  
- Tree-of-Thought paper â€” [https://arxiv.org/abs/2305.10601](https://arxiv.org/abs/2305.10601)

---

## 8\. Model Context Protocol (MCP)

### Concept

MCP is an open protocol â€” think *USB-C for AI tools* â€” that standardizes how an LLM application connects to external data sources, tools, and services. Before MCP, every model Ã— every tool was a custom integration (the NÃ—M problem). After MCP, you build one MCP server for your service and any compliant client (Claude, ChatGPT, Cursor, VS Code, etc.) can use it.

Introduced by Anthropic in late 2024, adopted by OpenAI in 2025, donated to the Linux Foundation in late 2025, MCP is now the de facto standard for tool integration in 2026\.

### The three primitives

- **Tools** â€” executable actions the LLM can call (e.g., `send_email`, `query_db`)  
- **Resources** â€” read-only data the LLM can pull in (e.g., a file, a row, a calendar)  
- **Prompts** â€” reusable templated prompts the server exposes

### When to build an MCP server

- You want your product to be agent-accessible (a 2026 enterprise procurement requirement)  
- You're tired of writing the same tool wrapper for OpenAI function-calling, Claude tool use, and Gemini function calls  
- You're building an internal AI assistant and have \>5 internal services it needs to reach

### Validated learning resources

- Official site & specification â€” [https://modelcontextprotocol.io/](https://modelcontextprotocol.io/)  
- 2025-11-25 spec â€” [https://modelcontextprotocol.io/specification/2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)  
- GitHub org (SDKs in Python, TS, C\#, Java, Rust) â€” [https://github.com/modelcontextprotocol](https://github.com/modelcontextprotocol)  
- Anthropic MCP intro â€” [https://docs.claude.com/en/docs/agents-and-tools/mcp](https://docs.claude.com/en/docs/agents-and-tools/mcp)  
- 2026 roadmap â€” [https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/)

---

## 9\. Production Concerns (the boring stuff that decides whether you ship)

### Evaluation

You cannot improve what you don't measure. Build an eval set *before* you optimize prompts. Minimum viable eval:

- 30â€“50 representative inputs with known-good outputs  
- An automated scorer (LLM-as-judge with a rubric, or exact-match for structured tasks)  
- Run it on every prompt change and log the diff

Tools: **Promptfoo**, **LangSmith**, **Braintrust**, **Anthropic Console eval**, **OpenAI Evals**.

### Observability

Trace every LLM call: input prompt, output, latency, tokens, cost, tool calls. Tools: **LangSmith**, **Langfuse**, **Helicone**, **Arize Phoenix**.

### Cost control

- **Cache aggressively.** Anthropic prompt caching, OpenAI prompt caching, semantic caching of common queries.  
- **Tier your models.** Cheap model for routing/classification, expensive model only for the hard step.  
- **Truncate history.** Summarize old conversation turns rather than re-sending them every call.  
- **Batch when latency allows.** Most providers offer 50% discounts on async batch APIs.

### Safety & guardrails

- Input filtering for prompt injection  
- Output validation against schemas  
- PII / secrets detection on both input and output  
- Human-in-the-loop checkpoints for high-stakes actions (emails, money movement, data deletion)

---

## 10\. Suggested Learning Paths

Pick the one that matches where you are.

### Path A â€” "I'm new to all of this" (4â€“6 weeks)

1. Hugging Face LLM Course, chapters 1â€“4 (foundations)  
2. Anthropic Interactive Prompt Tutorial (1 weekend)  
3. Build a single-prompt app (extract structured data from emails, e.g.)  
4. Add embeddings: build a "search my notes" tool with pgvector \+ OpenAI embeddings  
5. Add RAG: turn the search into a Q\&A bot  
6. Add a tool call: let it write to your notes too  
7. Read Anthropic's *Building Effective Agents* â€” now it'll click

### Path B â€” "I can prompt; I want to ship production AI" (3â€“4 weeks)

1. Anthropic prompting docs (1 day, deeply)  
2. RAGAS \+ an eval dataset for your use case (3 days â€” this is the gate)  
3. Implement hybrid search \+ reranking (week)  
4. Add observability (Langfuse or LangSmith) and cost dashboarding  
5. Read Anthropic's *Writing Tools for Agents* â€” apply to your tool surface  
6. Stand up MCP servers for your top 3 internal services

### Path C â€” "I'm building an agent system" (ongoing)

1. Read both Anthropic agent guides \+ OpenAI's agent design recommendations  
2. Implement the 5 canonical patterns by hand (no framework) â€” \~300 lines each  
3. Pick a framework based on what failed in \#2  
4. Build with the *fewest* abstractions you can â€” every layer hides a bug  
5. Invest in eval \+ replay: every agent failure should be reproducible from a trace

---

## 11\. Reusable Sub-Prompts for Each Topic

Drop any of these into a chat with Claude/GPT/Gemini after the Master Prompt above to focus the conversation.

**Prompting deep-dive:**

TOPIC \= "Prompting techniques for {USE\_CASE}".

Show me the prompt skeleton, then optimize it across 3 iterations,

explaining what changed and why each change improved the eval score.

**RAG architecture review:**

TOPIC \= "Review my RAG architecture".

Here is my current pipeline: {DESCRIBE}.

Walk through it and identify the 3 highest-leverage improvements,

ranked by impact-to-effort ratio.

**Agent design:**

TOPIC \= "Design an agent for {TASK}".

First, decide whether this should be a workflow or an agent (per Anthropic's distinction).

Justify the choice. Then specify the simplest design that solves it,

including tools, stopping conditions, and failure modes.

**Embedding model selection:**

TOPIC \= "Choose an embedding model for {DOMAIN}".

My corpus characteristics: {SIZE, LANGUAGE, AVG\_DOC\_LENGTH}.

Compare 3 candidates with verified pricing, give me a recommendation,

and tell me what eval I should run to confirm.

**MCP server design:**

TOPIC \= "Design an MCP server for {SERVICE}".

List the tools, resources, and prompts the server should expose.

Show me the JSON-RPC schemas and a Python skeleton using the official SDK.

---

## 12\. Single-Page Cheat Sheet

LLM             \= transformer \+ sampling \+ context window. Token-priced.

Prompting       \= role \+ context \+ task \+ rules \+ examples \+ format \+ input.

                  Examples \> instructions. Reasoning before answers.

Embeddings      \= same model for q & d. Cosine usually. pgvector by default.

RAG             \= chunk well \+ hybrid search \+ rerank \+ cite. Eval with RAGAS.

Workflow        \= predefined orchestration. Start here.

Agent           \= LLM directs itself. Only when workflow can't.

Patterns        \= chain, route, parallelize, orchestrate, evaluate.

Tools           \= MCP for portability. Few good tools \> many wrappers.

Memory          \= short (in-context) \+ long (vector / KV store).

Eval            \= build the dataset before optimizing the prompt.

Cost            \= cache \+ tier \+ truncate \+ batch.

Safety          \= filter input, validate output, human-loop high-stakes.

---

## 13\. Primary-Source URL Index (alphabetical)

- Anthropic Building Effective Agents â€” [https://www.anthropic.com/research/building-effective-agents](https://www.anthropic.com/research/building-effective-agents)  
- Anthropic Engineering blog â€” [https://www.anthropic.com/engineering](https://www.anthropic.com/engineering)  
- Anthropic Prompt Engineering docs â€” [https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)  
- Anthropic Prompt Engineering Tutorial â€” [https://github.com/anthropics/prompt-eng-interactive-tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial)  
- Anthropic Writing Tools for Agents â€” [https://www.anthropic.com/engineering/writing-tools-for-agents](https://www.anthropic.com/engineering/writing-tools-for-agents)  
- Cohere Embed docs â€” [https://docs.cohere.com/docs/embeddings](https://docs.cohere.com/docs/embeddings)  
- DeepLearning.AI courses â€” [https://learn.deeplearning.ai/](https://learn.deeplearning.ai/)  
- Hugging Face Learn hub â€” [https://huggingface.co/learn](https://huggingface.co/learn)  
- Hugging Face LLM Course â€” [https://huggingface.co/learn/llm-course/chapter1/1](https://huggingface.co/learn/llm-course/chapter1/1)  
- LangChain â€” [https://python.langchain.com/](https://python.langchain.com/)  
- LangGraph â€” [https://langchain-ai.github.io/langgraph/](https://langchain-ai.github.io/langgraph/)  
- Llama Index â€” [https://docs.llamaindex.ai/](https://docs.llamaindex.ai/)  
- MCP specification â€” [https://modelcontextprotocol.io/](https://modelcontextprotocol.io/)  
- MCP GitHub â€” [https://github.com/modelcontextprotocol](https://github.com/modelcontextprotocol)  
- MTEB benchmark â€” [https://huggingface.co/spaces/mteb/leaderboard](https://huggingface.co/spaces/mteb/leaderboard)  
- OpenAI Embeddings â€” [https://platform.openai.com/docs/guides/embeddings](https://platform.openai.com/docs/guides/embeddings)  
- OpenAI Prompt Engineering â€” [https://platform.openai.com/docs/guides/prompt-engineering](https://platform.openai.com/docs/guides/prompt-engineering)  
- pgvector â€” [https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)  
- RAGAS â€” [https://docs.ragas.io/](https://docs.ragas.io/)  
- RAG best-practices paper (Fudan) â€” [https://arxiv.org/abs/2407.01219](https://arxiv.org/abs/2407.01219)  
- ReAct paper â€” [https://arxiv.org/abs/2210.03629](https://arxiv.org/abs/2210.03629)  
- Reflexion paper â€” [https://arxiv.org/abs/2303.11366](https://arxiv.org/abs/2303.11366)  
- Tree-of-Thought paper â€” [https://arxiv.org/abs/2305.10601](https://arxiv.org/abs/2305.10601)  
- Voyage AI docs â€” [https://docs.voyageai.com/](https://docs.voyageai.com/)

---

*End of document. To use this as a prompt: paste sections 1â€“9 as system context, then ask your question. To use it as a study plan: pick a path in section 10 and start.*

