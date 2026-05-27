"use client";

import { useEffect, useState } from "react";
import { api, type ProgressEntry } from "@/lib/api";

export default function ProgressPage() {
  const [entries, setEntries] = useState<ProgressEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listProgress()
      .then(setEntries)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro")
      );
  }, []);

  if (error)
    return (
      <div className="space-y-3">
        <p className="text-red-400">{error}</p>
        <p className="text-sm text-slate-400">Faça login antes.</p>
      </div>
    );
  if (!entries) return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Meu progresso</h1>
      {entries.length === 0 && (
        <p className="text-sm text-slate-400">
          Nenhuma lição marcada como concluída ainda.
        </p>
      )}
      <ul className="space-y-2">
        {entries.map((e) => (
          <li
            key={e.peLessonId}
            className="border border-slate-800 rounded p-3 bg-slate-900/40 flex justify-between"
          >
            <span>Lição #{e.peLessonId}</span>
            <span className="text-xs text-slate-400">
              {new Date(e.peCompletedAt).toLocaleString("pt-BR")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
