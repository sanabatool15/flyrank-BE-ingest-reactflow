"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { DecisionNode, type DecisionNodeData } from "@/components/nodes/decision-node";
import { toWorkflowGraph } from "@/lib/workflow/from-flow";
import { loadGraph, saveGraph } from "@/lib/workflow/storage";
import type { WorkflowStepResult } from "@/lib/workflow/types";

const nodeTypes = { decision: DecisionNode };

let nodeCounter = 0;
function nextNodeId() {
  nodeCounter += 1;
  return `node-${nodeCounter}`;
}

function defaultNodes(): Node<DecisionNodeData>[] {
  return [
    {
      id: nextNodeId(),
      type: "decision",
      position: { x: 0, y: 0 },
      data: { prompt: "Is this a support request?", label: "Start" },
    },
  ];
}

type RunStatus =
  | { phase: "idle" }
  | { phase: "running" }
  | { phase: "done"; path: WorkflowStepResult[]; eventId: string }
  | { phase: "error"; message: string };

const ACTIVE_EDGE_STYLE = { stroke: "#2563eb", strokeWidth: 3 };
const YES_EDGE_STYLE = { stroke: "#16a34a", strokeWidth: 2 };
const NO_EDGE_STYLE = { stroke: "#dc2626", strokeWidth: 2 };

export function FlowCanvas() {
  const stored = useRef(loadGraph()).current;

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<DecisionNodeData>>(
    stored?.nodes.length ? stored.nodes : defaultNodes()
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(stored?.edges ?? []);
  const [run, setRun] = useState<RunStatus>({ phase: "idle" });
  const [activeEdgeIds, setActiveEdgeIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phase 2: persist the graph locally so a refresh doesn't lose it.
  useEffect(() => {
    saveGraph(nodes, edges);
  }, [nodes, edges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const isYes = connection.sourceHandle === "yes";
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            style: isYes ? YES_EDGE_STYLE : NO_EDGE_STYLE,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const addNode = useCallback(() => {
    setNodes((nds) => [
      ...nds,
      {
        id: nextNodeId(),
        type: "decision",
        position: { x: 80 + nds.length * 40, y: 120 + nds.length * 120 },
        data: { prompt: "" },
      },
    ]);
  }, [setNodes]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const importJson = useCallback(
    async (file: File) => {
      const text = await file.text();
      const parsed = JSON.parse(text) as { nodes: Node<DecisionNodeData>[]; edges: Edge[] };
      setNodes(parsed.nodes ?? []);
      setEdges(parsed.edges ?? []);
      setRun({ phase: "idle" });
      setActiveEdgeIds(new Set());
    },
    [setNodes, setEdges]
  );

  // Reveal the executed edges one at a time, replaying the run visually.
  const animatePath = useCallback((path: WorkflowStepResult[]) => {
    setActiveEdgeIds(new Set());
    path.forEach((_, i) => {
      const from = path[i - 1]?.nodeId;
      const to = path[i]?.nodeId;
      if (!from) return;
      setTimeout(() => {
        setEdges((eds) => {
          const edge = eds.find((e) => e.source === from && e.target === to);
          if (edge) {
            setActiveEdgeIds((prev) => new Set(prev).add(edge.id));
          }
          return eds;
        });
      }, i * 500);
    });
  }, [setEdges]);

  const runWorkflow = useCallback(async () => {
    setActiveEdgeIds(new Set());
    setRun({ phase: "running" });
    try {
      const graph = toWorkflowGraph(nodes, edges);
      const res = await fetch("/api/flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(graph),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? `Request failed with ${res.status}`);
      }

      const path: WorkflowStepResult[] = body.result?.path ?? [];
      setRun({ phase: "done", path, eventId: body.eventId });
      animatePath(path);
    } catch (err) {
      setRun({ phase: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }, [nodes, edges, animatePath]);

  // Apply active-edge styling on top of the YES/NO base color.
  const styledEdges = edges.map((e) =>
    activeEdgeIds.has(e.id)
      ? { ...e, animated: true, style: { ...e.style, ...ACTIVE_EDGE_STYLE } }
      : { ...e, animated: false }
  );

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <Button onClick={addNode} variant="secondary">
          + Add node
        </Button>
        <Button onClick={runWorkflow} disabled={run.phase === "running"}>
          {run.phase === "running" ? "Running…" : "Run workflow"}
        </Button>
        <Button onClick={exportJson} variant="outline">
          Export JSON
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
          Import JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importJson(file);
            e.target.value = "";
          }}
        />
      </div>

      {run.phase === "error" && (
        <div className="absolute right-4 top-4 z-10 w-80 rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive shadow-sm">
          {run.message}
        </div>
      )}

      {(run.phase === "running" || run.phase === "done") && (
        <div className="absolute right-4 top-4 z-10 max-h-[70vh] w-80 overflow-y-auto rounded-md border bg-card p-3 text-sm shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">Execution log</span>
            {run.phase === "running" && (
              <span className="text-xs text-muted-foreground">running…</span>
            )}
          </div>
          {run.phase === "running" && (
            <p className="text-xs text-muted-foreground">
              Waiting for steps to complete…
            </p>
          )}
          {run.phase === "done" &&
            (run.path.length === 0 ? (
              <p className="text-xs text-muted-foreground">No steps recorded.</p>
            ) : (
              <>
                <ol className="space-y-2">
                  {run.path.map((step, i) => (
                    <li key={step.nodeId} className="rounded border p-2">
                      <div className="text-xs text-muted-foreground">
                        Step {i + 1} · {step.nodeId}
                      </div>
                      <div className="mt-1">{step.prompt}</div>
                      <div
                        className={`mt-1 text-xs font-semibold ${
                          step.answer === "YES"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {step.answer}
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-xs text-muted-foreground">
                  Event <code>{run.eventId}</code> — full step history at{" "}
                  <a
                    className="underline"
                    href="http://localhost:8288"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Inngest dev dashboard
                  </a>
                </p>
              </>
            ))}
        </div>
      )}
    </div>
  );
}
