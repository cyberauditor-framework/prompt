import { useMemo } from "react";
import { Edge, Node } from "reactflow";
import { PromptPattern } from "../types";

interface PatternLibraryProps {
  query: string;
  setQuery: (value: string) => void;
  patterns: PromptPattern[];
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  setSelectedNodeId: (value: string | null) => void;
  setSelectedEdgeId: (value: string | null) => void;
}

export function PatternLibrary({
  query,
  setQuery,
  patterns,
  nodes,
  edges,
  setNodes,
  setEdges,
  selectedNodeId,
  selectedEdgeId,
  setSelectedNodeId,
  setSelectedEdgeId,
}: PatternLibraryProps) {
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId]
  );
  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId),
    [edges, selectedEdgeId]
  );

  const nodeData = (selectedNode?.data ?? {}) as Record<string, unknown>;
  const edgeData = (selectedEdge?.data ?? {}) as Record<string, unknown>;

  function updateSelectedNode(partial: Partial<Node>) {
    if (!selectedNodeId) {
      return;
    }
    setNodes(nodes.map((node) => (node.id === selectedNodeId ? { ...node, ...partial } : node)));
  }

  function updateSelectedNodeData(partial: Record<string, unknown>) {
    if (!selectedNodeId) {
      return;
    }
    setNodes(
      nodes.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...(node.data as Record<string, unknown>),
                ...partial,
              },
            }
          : node
      )
    );
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) {
      return;
    }
    setNodes(nodes.filter((node) => node.id !== selectedNodeId));
    setEdges(edges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
    setSelectedNodeId(null);
  }

  function duplicateSelectedNode() {
    if (!selectedNode) {
      return;
    }
    const duplicatedId = `node-copy-${Date.now()}`;
    const copy: Node = {
      ...selectedNode,
      id: duplicatedId,
      position: {
        x: selectedNode.position.x + 36,
        y: selectedNode.position.y + 36,
      },
      data: {
        ...(selectedNode.data as Record<string, unknown>),
        label: `${String((selectedNode.data as Record<string, unknown>)?.label ?? "Node")} Copy`,
      },
      selected: false,
    };
    setNodes([...nodes, copy]);
    setSelectedNodeId(duplicatedId);
    setSelectedEdgeId(null);
  }

  function updateSelectedEdge(partial: Partial<Edge>) {
    if (!selectedEdgeId) {
      return;
    }
    setEdges(edges.map((edge) => (edge.id === selectedEdgeId ? { ...edge, ...partial } : edge)));
  }

  function updateSelectedEdgeData(partial: Record<string, unknown>) {
    if (!selectedEdgeId) {
      return;
    }
    setEdges(
      edges.map((edge) =>
        edge.id === selectedEdgeId
          ? {
              ...edge,
              data: {
                ...(edge.data as Record<string, unknown>),
                ...partial,
              },
            }
          : edge
      )
    );
  }

  function deleteSelectedEdge() {
    if (!selectedEdgeId) {
      return;
    }
    setEdges(edges.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }

  return (
    <section className="panel library-panel">
      <div className="panel-header">
        <h2>Pattern Library</h2>
        <p>RAG-first retrieval and drag/drop prompt modules</p>
      </div>

      <label className="field-label">Search</label>
      <input
        className="text-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try: ReAct, SQL safety, dynamic router"
      />

      <div className="pattern-list">
        {patterns.map((pattern) => (
          <article
            key={pattern.id}
            className="pattern-card"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/prompt-pattern", JSON.stringify(pattern));
            }}
          >
            <div className="pattern-topline">
              <strong>{pattern.pattern_name}</strong>
              <span>{pattern.category}</span>
            </div>
            <p>{pattern.keywords}</p>
          </article>
        ))}
      </div>

      <div className="left-editor-section">
        <h3>Node Editor</h3>
        {!selectedNode ? (
          <p className="muted">Select a node on the canvas to edit all properties.</p>
        ) : (
          <>
            <label className="field-label">Node ID</label>
            <input className="text-input" value={selectedNode.id} readOnly />

            <label className="field-label">Label</label>
            <input
              className="text-input"
              value={String(nodeData.label ?? "")}
              onChange={(event) => updateSelectedNodeData({ label: event.target.value })}
            />

            <label className="field-label">Type</label>
            <input
              className="text-input"
              value={String(selectedNode.type ?? "default")}
              onChange={(event) => updateSelectedNode({ type: event.target.value || "default" })}
            />

            <label className="field-label">Category</label>
            <input
              className="text-input"
              value={String(nodeData.category ?? "")}
              onChange={(event) => updateSelectedNodeData({ category: event.target.value })}
            />

            <label className="field-label">Pattern ID</label>
            <input
              className="text-input"
              type="number"
              value={Number(nodeData.patternId ?? 0)}
              onChange={(event) => updateSelectedNodeData({ patternId: Number(event.target.value) || 0 })}
            />

            <label className="field-label">Template</label>
            <textarea
              className="text-area mono"
              rows={4}
              value={String(nodeData.template ?? "")}
              onChange={(event) => updateSelectedNodeData({ template: event.target.value })}
            />

            <div className="left-editor-grid2">
              <div>
                <label className="field-label">Position X</label>
                <input
                  className="text-input"
                  type="number"
                  value={Math.round(selectedNode.position.x)}
                  onChange={(event) =>
                    updateSelectedNode({
                      position: {
                        x: Number(event.target.value) || 0,
                        y: selectedNode.position.y,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="field-label">Position Y</label>
                <input
                  className="text-input"
                  type="number"
                  value={Math.round(selectedNode.position.y)}
                  onChange={(event) =>
                    updateSelectedNode({
                      position: {
                        x: selectedNode.position.x,
                        y: Number(event.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>

            <label className="left-editor-checkbox">
              <input
                type="checkbox"
                checked={selectedNode.draggable !== false}
                onChange={(event) => updateSelectedNode({ draggable: event.target.checked })}
              />
              Draggable
            </label>

            <div className="left-editor-actions">
              <button className="primary-btn" onClick={duplicateSelectedNode}>
                Duplicate Node
              </button>
              <button className="danger-btn" onClick={deleteSelectedNode}>
                Delete Node
              </button>
            </div>
          </>
        )}
      </div>

      <div className="left-editor-section">
        <h3>Relation Editor</h3>
        {!selectedEdge ? (
          <p className="muted">Select an edge on the canvas to edit relation properties.</p>
        ) : (
          <>
            <label className="field-label">Relation ID</label>
            <input className="text-input" value={selectedEdge.id} readOnly />

            <label className="field-label">Label</label>
            <input
              className="text-input"
              value={String(selectedEdge.label ?? "")}
              onChange={(event) => updateSelectedEdge({ label: event.target.value })}
            />

            <label className="field-label">Source Node</label>
            <select
              className="text-input"
              value={selectedEdge.source}
              onChange={(event) => updateSelectedEdge({ source: event.target.value })}
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {String((node.data as Record<string, unknown>)?.label ?? node.id)}
                </option>
              ))}
            </select>

            <label className="field-label">Target Node</label>
            <select
              className="text-input"
              value={selectedEdge.target}
              onChange={(event) => updateSelectedEdge({ target: event.target.value })}
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {String((node.data as Record<string, unknown>)?.label ?? node.id)}
                </option>
              ))}
            </select>

            <label className="field-label">Routing Type</label>
            <select
              className="text-input"
              value={String(edgeData.routing ?? "Static")}
              onChange={(event) => {
                const routing = event.target.value;
                updateSelectedEdgeData({ routing });
                updateSelectedEdge({ animated: routing !== "Static" });
              }}
            >
              <option value="Static">Static</option>
              <option value="Dynamic">Dynamic</option>
              <option value="Role-based">Role-based</option>
            </select>

            <label className="left-editor-checkbox">
              <input
                type="checkbox"
                checked={selectedEdge.animated === true}
                onChange={(event) => updateSelectedEdge({ animated: event.target.checked })}
              />
              Animated
            </label>

            <div className="left-editor-actions">
              <button className="danger-btn" onClick={deleteSelectedEdge}>
                Delete Relation
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
