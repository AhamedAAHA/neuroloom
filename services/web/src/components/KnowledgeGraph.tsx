"use client";

import { useEffect, useState } from "react";
import { Category } from "iconsax-react";
import { ReactFlow, Background, Controls, MiniMap, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api, GraphNode } from "@/lib/api";

const NODE_COLORS: Record<string, string> = {
  medication: "#4ecdc4",
  document: "#a78bfa",
  event: "#fbbf24",
  handoff: "#ff8e8e",
  checkin: "#f472b6",
};

export default function KnowledgeGraph({ circleId }: { circleId: string }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    api.getGraph(circleId).then((data) => {
      const flowNodes: Node[] = data.nodes.map((n: GraphNode, i: number) => ({
        id: n.id,
        data: { label: n.label },
        position: { x: (i % 4) * 200, y: Math.floor(i / 4) * 120 },
        style: {
          background: NODE_COLORS[n.type] || "#8b9cb3",
          color: "#0b1426",
          border: "none",
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          padding: "8px 16px",
        },
      }));
      const flowEdges: Edge[] = data.edges.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: "#4ecdc4", strokeWidth: 2 },
      }));
      setNodes(flowNodes);
      setEdges(flowEdges);
    });
  }, [circleId]);

  return (
    <div className="glass rounded-2xl overflow-hidden" style={{ height: 400 }}>
      <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold flex items-center gap-2">
        <Category size={18} color="#4ecdc4" variant="Bulk" />
        Care Knowledge Graph
      </div>
      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-[340px] text-[#8b9cb3] text-sm">
          Agents will build the knowledge graph as you add care data
        </div>
      ) : (
        <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
          <Background color="#ffffff10" gap={20} />
          <Controls />
          <MiniMap nodeColor={(n) => (n.style as { background?: string })?.background as string || "#8b9cb3"} />
        </ReactFlow>
      )}
    </div>
  );
}
