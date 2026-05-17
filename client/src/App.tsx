import { useEffect, useMemo, useState } from "react";
import { Edge, Node } from "reactflow";
import { HelpLibraryDoc, compilePrompt, executePrompt, fetchHelpLibrary, fetchPatterns } from "./api";
import { AgentCanvas } from "./components/AgentCanvas";
import { ExecutionSandbox } from "./components/ExecutionSandbox";
import { HelpLibraryPanel } from "./components/HelpLibraryPanel";
import { PatternLibrary } from "./components/PatternLibrary";
import { PromptEditor } from "./components/PromptEditor";
import { TrustDashboard } from "./components/TrustDashboard";
import { ExecuteResult, PromptPattern, RoutingDecision } from "./types";

const starterNodes: Node[] = [
  {
    id: "core-router",
    position: { x: 180, y: 80 },
    data: { label: "Dynamic Router", patternId: -1 },
  },
  {
    id: "core-reason",
    position: { x: 120, y: 260 },
    data: { label: "Reasoning Block", patternId: -2 },
  },
  {
    id: "core-validate",
    position: { x: 350, y: 260 },
    data: { label: "Self-Critique", patternId: -3 },
  },
];

const starterEdges: Edge[] = [
  { id: "e1", source: "core-router", target: "core-reason", animated: true },
  { id: "e2", source: "core-reason", target: "core-validate", animated: true },
];

export default function App() {
  const [query, setQuery] = useState("react sql validation");
  const [patterns, setPatterns] = useState<PromptPattern[]>([]);
  const [nodes, setNodes] = useState<Node[]>(starterNodes);
  const [edges, setEdges] = useState<Edge[]>(starterEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const [goal, setGoal] = useState("Build an agent that queries SQLite and validates its own output.");
  const [agentType, setAgentType] = useState("Deliberative Agent");
  const [variables, setVariables] = useState<Record<string, string>>({
    user_context: "enterprise analytics pipeline",
    sql_schema: "prompt_patterns(id, pattern_name, category, template)",
  });

  const [finalPrompt, setFinalPrompt] = useState("");
  const [routing, setRouting] = useState<RoutingDecision>();
  const [trace, setTrace] = useState<string[]>([]);

  const [halted, setHalted] = useState(false);
  const [modelA, setModelA] = useState("GPT-4o");
  const [modelB, setModelB] = useState("Claude 3.5 Sonnet");
  const [resultA, setResultA] = useState<ExecuteResult>();
  const [resultB, setResultB] = useState<ExecuteResult>();
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpMarkdown, setHelpMarkdown] = useState("# Help Library\nNo content loaded yet.");
  const [helpDocs, setHelpDocs] = useState<HelpLibraryDoc[]>([]);

  useEffect(() => {
    fetchPatterns(query)
      .then(setPatterns)
      .catch(() => setPatterns([]));
  }, [query]);

  useEffect(() => {
    if (!helpOpen) {
      return;
    }

    setHelpLoading(true);
    fetchHelpLibrary()
      .then((payload) => {
        setHelpMarkdown(payload.markdown);
        setHelpDocs(payload.docs);
      })
      .catch(() => {
        setHelpMarkdown("# Help Library\nUnable to load docs/help-library.md");
        setHelpDocs([]);
      })
      .finally(() => setHelpLoading(false));
  }, [helpOpen]);

  const selectedPatternIds = useMemo(
    () =>
      nodes
        .map((node) => Number(node.data?.patternId || 0))
        .filter((id) => id > 0),
    [nodes]
  );

  async function compileNow() {
    const compiled = await compilePrompt({
      goal,
      agentType,
      selectedPatternIds,
      variables,
    });

    setFinalPrompt(compiled.finalPrompt);
    setRouting(compiled.routing);
  }

  async function runComparison() {
    if (!finalPrompt.trim()) {
      await compileNow();
    }

    const [a, b] = await Promise.all([
      executePrompt({ inputText: finalPrompt || goal, model: modelA, halted }),
      executePrompt({ inputText: finalPrompt || goal, model: modelB, halted }),
    ]);

    setResultA(a);
    setResultB(b);
    setTrace(a.trace);
  }

  return (
    <main className="app-shell">
      <header className="hero-header">
        <div className="hero-row">
          <div>
            <h1>Prompt Coach Mission Control</h1>
            <p>Architect, route, and validate agent prompts with visible reasoning and control.</p>
          </div>
        </div>
      </header>

      <section className="top-grid">
        <PatternLibrary
          query={query}
          setQuery={setQuery}
          patterns={patterns}
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          setSelectedNodeId={setSelectedNodeId}
          setSelectedEdgeId={setSelectedEdgeId}
        />
        <AgentCanvas
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          setSelectedNodeId={setSelectedNodeId}
          setSelectedEdgeId={setSelectedEdgeId}
        />
        <PromptEditor
          goal={goal}
          setGoal={setGoal}
          agentType={agentType}
          setAgentType={setAgentType}
          variables={variables}
          setVariables={setVariables}
          finalPrompt={finalPrompt}
          compileNow={compileNow}
        />
      </section>

      <section className="bottom-grid">
        <ExecutionSandbox
          halted={halted}
          setHalted={setHalted}
          modelA={modelA}
          setModelA={setModelA}
          modelB={modelB}
          setModelB={setModelB}
          runComparison={runComparison}
          resultA={resultA}
          resultB={resultB}
        />
        <TrustDashboard routing={routing} trace={trace} />
      </section>

      <HelpLibraryPanel
        open={helpOpen}
        loading={helpLoading}
        markdown={helpMarkdown}
        docs={helpDocs}
        onClose={() => setHelpOpen(false)}
      />
    </main>
  );
}
