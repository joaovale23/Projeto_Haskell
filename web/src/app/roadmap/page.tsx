"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type RoadmapItem } from "@/lib/api";

export default function RoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRoadmap()
      .then(setItems)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar roadmap")
      );
  }, []);

  if (error)
    return (
      <div className="space-y-3">
        <p className="text-red-400">{error}</p>
        <p className="text-sm text-slate-400">
          Faça login antes de ver o roadmap.
        </p>
      </div>
    );

  if (!items) return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Seu roadmap</h1>
      <p className="text-slate-400 text-sm">
        Conclua todas as lições de um módulo para desbloquear seus dependentes.
      </p>
      {items.length === 0 && (
        <p className="text-slate-400 text-sm">
          Nenhum módulo cadastrado ainda.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => {
          const complete = it.riTotalLessons > 0 && it.riCompletedLessons >= it.riTotalLessons;
          const cls = complete
            ? "border-emerald-500 bg-emerald-900/30"
            : it.riUnlocked
              ? "border-sky-500 bg-sky-900/20"
              : "border-slate-800 bg-slate-900/40 opacity-60";
          const badge = complete
            ? "Concluído"
            : it.riUnlocked
              ? "Disponível"
              : "Bloqueado";
          return (
            <div key={it.riModuleId} className={`border rounded p-4 ${cls}`}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-medium">
                  {it.riOrderIdx}. {it.riTitle}
                </h2>
                <span className="text-xs text-slate-400">{badge}</span>
              </div>
              <p className="text-sm text-slate-300 mt-2">{it.riDescription}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {it.riCompletedLessons}/{it.riTotalLessons} lições
                </span>
                {it.riUnlocked ? (
                  <Link
                    href={`/modules/${it.riModuleId}`}
                    className="text-xs px-3 py-1 rounded bg-pink-500 hover:bg-pink-400"
                  >
                    Abrir
                  </Link>
                ) : it.riPrerequisiteId !== null ? (
                  <span className="text-xs text-slate-500">
                    requer módulo #{it.riPrerequisiteId}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
