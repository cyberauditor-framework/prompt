import {
  Connection,
  Background,
  Controls,
  EdgeChange,
  Edge,
  MiniMap,
  Node,
  NodeChange,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  useReactFlow,
} from "reactflow";
import { PromptPattern } from "../types";

interface AgentCanvasProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  setSelectedNodeId: (value: string | null) => void;
  setSelectedEdgeId: (value: string | null) => void;
}

export function AgentCanvas({
  nodes,
  edges,
  setNodes,
  setEdges,
  selectedNodeId,
  selectedEdgeId,
  setSelectedNodeId,
  setSelectedEdgeId,
}: AgentCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = (connection: Connection) => {
    const id = `edge-${Date.now()}`;
    const created = addEdge(
      {
        ...connection,
        id,
        label: "Static route",
        animated: true,
        data: { routing: "Static" },
      },
      edges
    );
    setEdges(created);
  };

  function onNodesChange(changes: NodeChange[]) {
    setNodes(applyNodeChanges(changes, nodes));
  }

  function onEdgesChange(changes: EdgeChange[]) {
    setEdges(applyEdgeChanges(changes, edges));
  }

  function addPatternNode(pattern: PromptPattern, x: number, y: number) {
    const id = `node-${pattern.id}-${Date.now()}`;
    const next = [
      ...nodes,
      {
        id,
        type: "default",
        position: { x, y },
        data: {
          label: `${pattern.pattern_name}`,
          patternId: pattern.id,
          template: pattern.template,
          category: pattern.category,
        },
      },
    ];
    setNodes(next);
  }

  function addBlankNode() {
    const id = `node-custom-${Date.now()}`;
    setNodes([
      ...nodes,
      {
        id,
        type: "default",
        position: { x: 240, y: 180 },
        data: {
          label: "New Node",
          patternId: 0,
          template: "",
          category: "Custom",
        },
      },
    ]);
  }

  function deleteSelected() {
    if (selectedEdgeId) {
      setEdges(edges.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId(null);
      return;
    }

    if (selectedNodeId) {
      setNodes(nodes.filter((node) => node.id !== selectedNodeId));
      setEdges(
        edges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
      );
      setSelectedNodeId(null);
    }
  }

  return (
    <section
      className="panel canvas-panel"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const payload = event.dataTransfer.getData("application/prompt-pattern");
        if (!payload) {
          return;
        }
        const pattern = JSON.parse(payload) as PromptPattern;
        const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        addPatternNode(pattern, point.x, point.y);
      }}
    >
      <div className="panel-header">
        <h2>Agent Canvas</h2>
        <p>Design routing logic with visual nodes and edges</p>
      </div>

      <div className="canvas-tools">
        <button className="primary-btn" onClick={addBlankNode}>
          Add Node
        </button>
        <button
          className="danger-btn"
          onClick={deleteSelected}
          disabled={!selectedNodeId && !selectedEdgeId}
        >
          Delete Selected
        </button>
      </div>

      <div className="canvas-frame">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_event, node) => {
            setSelectedNodeId(node.id);
            setSelectedEdgeId(null);
          }}
          onEdgeClick={(_event, edge) => {
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
          }}
          onPaneClick={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
          }}
          onPaneDoubleClick={(event) => {
            const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
            const id = `node-custom-${Date.now()}`;
            setNodes([
              ...nodes,
              {
                id,
                type: "default",
                position: point,
                data: { label: "New Node", patternId: 0, template: "", category: "Custom" },
              },
            ]);
          }}
          onConnect={onConnect}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </section>
  );
}
