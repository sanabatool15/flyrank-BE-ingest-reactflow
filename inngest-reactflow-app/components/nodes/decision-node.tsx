"use client";

import { Handle, Position, useReactFlow, type NodeProps, type Node } from "@xyflow/react";

export interface DecisionNodeData {
  prompt: string;
  label?: string;
  [key: string]: unknown;
}

export type DecisionNode = Node<DecisionNodeData, "decision">;

export function DecisionNode({ id, data, selected }: NodeProps<DecisionNode>) {
  const { updateNodeData } = useReactFlow();

  return (
    <div
      className={`w-64 rounded-lg border bg-card text-card-foreground shadow-sm ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-border"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />

      <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
        {data.label ?? "Decision"}
      </div>

      <div className="p-3">
        <textarea
          className="nodrag w-full resize-none rounded-md border border-input bg-transparent p-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          rows={3}
          placeholder="Is this a support request?"
          value={data.prompt}
          onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
        />
      </div>

      <div className="flex justify-between px-3 pb-2 text-xs font-medium">
        <span className="text-green-600 dark:text-green-400">YES</span>
        <span className="text-red-600 dark:text-red-400">NO</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: "25%" }}
        className="!bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: "75%" }}
        className="!bg-red-500"
      />
    </div>
  );
}
