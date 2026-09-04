"use client";

import { useCallback, useState } from "react";
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

const nodeTypes = { decision: DecisionNode };

let nodeCounter = 0;
function nextNodeId() {
  nodeCounter += 1;
  return `node-${nodeCounter}`;
}

const initialNodes: Node<DecisionNodeData>[] = [
  {
    id: nextNodeId(),
    type: "decision",
    position: { x: 0, y: 0 },
    data: { prompt: "Is this a support request?", label: "Start" },
  },
];

type RunState =
  | { status: "idle" }
  | { status: "running"; eventId: string }
  | { status: "error"; message: string };

export function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [run, setRun] = useState<RunState>({ status: "idle" });

  const onConnect = useCallback(
    (connection: Connection) => {
      const isYes = connection.sourceHandle === "yes";
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: true,
            style: { stroke: isYes ? "#16a34a" : "#dc2626", strokeWidth: 2 },
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

  const runWorkflow = useCallback(async () => {
    try {
      const graph = toWorkflowGraph(nodes, edges);
      setRun({ status: "running", eventId: "" });

      const res = await fetch("/api/flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(graph),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with ${res.status}`);
      }

      const { eventId } = await res.json();
      setRun({ status: "running", eventId });
    } catch (err) {
      setRun({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }, [nodes, edges]);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
        <Button onClick={runWorkflow} disabled={run.status === "running"}>
          {run.status === "running" ? "Running…" : "Run workflow"}
        </Button>
      </div>

      {run.status === "running" && run.eventId && (
        <div className="absolute right-4 top-4 z-10 rounded-md border bg-card px-3 py-2 text-sm text-card-foreground shadow-sm">
          Started (event <code className="text-xs">{run.eventId}</code>) — watch it at{" "}
          <a
            className="underline"
            href="http://localhost:8288"
            target="_blank"
            rel="noreferrer"
          >
            Inngest dev dashboard
          </a>
        </div>
      )}

      {run.status === "error" && (
        <div className="absolute right-4 top-4 z-10 rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive shadow-sm">
          {run.message}
        </div>
      )}
    </div>
  );
}
