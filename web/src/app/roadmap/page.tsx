"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api, type RoadmapItem } from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";
import { EmptyState, ErrorText, Loading } from "@/components/ui";

type Status = "locked" | "notStarted" | "inProgress" | "done";

function statusOf(it: RoadmapItem): Status {
  if (!it.riUnlocked) return "locked";
  if (it.riTotalLessons > 0 && it.riCompletedLessons >= it.riTotalLessons) return "done";
  if (it.riCompletedLessons > 0) return "inProgress";
  return "notStarted";
}

const STATUS_META: Record<Status, { label: string; ring: string; badge: string }> = {
  locked: {
    label: "Bloqueado",
    ring: "border-slate-800 bg-slate-900/60 opacity-70",
    badge: "text-slate-500",
  },
  notStarted: {
    label: "Não iniciado",
    ring: "border-slate-700 bg-slate-900",
    badge: "text-slate-400",
  },
  inProgress: {
    label: "Em andamento",
    ring: "border-sky-500 bg-sky-950/40",
    badge: "text-sky-400",
  },
  done: {
    label: "Concluído",
    ring: "border-emerald-500 bg-emerald-950/40",
    badge: "text-emerald-400",
  },
};

type RoadmapNodeData = { item: RoadmapItem; onOpen: (id: number) => void };

function RoadmapNode({ data }: NodeProps) {
  const { item, onOpen } = data as unknown as RoadmapNodeData;
  const status = statusOf(item);
  const meta = STATUS_META[status];
  const clickable = status !== "locked";

  return (
    <div
      onClick={() => clickable && onOpen(item.riModuleId)}
      className={`w-56 rounded-lg border p-3 ${meta.ring} ${
        clickable ? "cursor-pointer hover:border-pink-400" : "cursor-not-allowed"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-600" />
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-sm text-slate-100">
          {item.riOrderIdx}. {item.riTitle}
        </span>
        <span className={`text-[10px] uppercase tracking-wide ${meta.badge}`}>
          {meta.label}
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.riDescription}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-pink-500"
            style={{
              width: `${
                item.riTotalLessons > 0
                  ? Math.round((item.riCompletedLessons / item.riTotalLessons) * 100)
                  : 0
              }%`,
            }}
          />
        </div>
        <span className="text-[10px] text-slate-500 shrink-0">
          {item.riCompletedLessons}/{item.riTotalLessons}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-600" />
    </div>
  );
}

const nodeTypes = { roadmapNode: RoadmapNode };

// Layout em camadas: nível = profundidade na cadeia de pré-requisitos.
function buildGraph(
  items: RoadmapItem[],
  onOpen: (id: number) => void
): { nodes: Node[]; edges: Edge[] } {
  const byId = new Map(items.map((i) => [i.riModuleId, i]));
  const levelCache = new Map<number, number>();
  const levelOf = (id: number, seen: Set<number> = new Set()): number => {
    if (levelCache.has(id)) return levelCache.get(id)!;
    if (seen.has(id)) return 0; // proteção contra ciclo
    seen.add(id);
    const it = byId.get(id);
    let lvl = 0;
    if (it && it.riPrerequisiteId != null && byId.has(it.riPrerequisiteId)) {
      lvl = levelOf(it.riPrerequisiteId, seen) + 1;
    }
    levelCache.set(id, lvl);
    return lvl;
  };

  const levels = new Map<number, RoadmapItem[]>();
  for (const it of items) {
    const l = levelOf(it.riModuleId);
    if (!levels.has(l)) levels.set(l, []);
    levels.get(l)!.push(it);
  }

  const xGap = 280;
  const yGap = 170;
  const positions = new Map<number, { x: number; y: number }>();
  for (const [l, group] of levels) {
    group.sort((a, b) => a.riOrderIdx - b.riOrderIdx);
    const offset = ((group.length - 1) * xGap) / 2;
    group.forEach((it, i) => {
      positions.set(it.riModuleId, { x: i * xGap - offset, y: l * yGap });
    });
  }

  const nodes: Node[] = items.map((it) => ({
    id: String(it.riModuleId),
    type: "roadmapNode",
    position: positions.get(it.riModuleId) ?? { x: 0, y: 0 },
    data: { item: it, onOpen },
  }));

  const edges: Edge[] = items
    .filter((it) => it.riPrerequisiteId != null && byId.has(it.riPrerequisiteId))
    .map((it) => ({
      id: `e-${it.riPrerequisiteId}-${it.riModuleId}`,
      source: String(it.riPrerequisiteId),
      target: String(it.riModuleId),
      animated: it.riUnlocked,
      style: { stroke: "#475569" },
    }));

  return { nodes, edges };
}

export default function RoadmapPage() {
  const { ready, allowed } = useRequireRole("Student");
  const router = useRouter();
  const [items, setItems] = useState<RoadmapItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    api
      .getRoadmap()
      .then(setItems)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar roadmap")
      );
  }, [allowed]);

  const onOpen = useCallback(
    (id: number) => router.push(`/modules/${id}`),
    [router]
  );

  const { nodes, edges } = useMemo(
    () => buildGraph(items ?? [], onOpen),
    [items, onOpen]
  );

  const totalLessons = (items ?? []).reduce((s, i) => s + i.riTotalLessons, 0);
  const doneLessons = (items ?? []).reduce((s, i) => s + i.riCompletedLessons, 0);
  const overall = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  if (!ready) return <Loading />;
  if (!allowed) return null;
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!items) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Seu roadmap
          </h1>
          <p className="text-sm text-slate-400">
            Conclua todas as lições de um módulo para desbloquear os próximos.
          </p>
        </div>
        <div className="min-w-[200px]">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progresso geral</span>
            <span>{overall}%</span>
          </div>
          <div className="h-2 w-full rounded bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${overall}%` }} />
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState>Nenhum módulo cadastrado ainda.</EmptyState>
      ) : (
        <div className="h-[70vh] rounded-lg border border-slate-800 bg-slate-950/40">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            edgesFocusable={false}
          >
            <Background color="#1e293b" gap={20} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
