"use client";

import { useEffect, useState } from "react";
import { api, type ProgressEntry } from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";
import { Card, EmptyState, ErrorText, Loading, PageHeader } from "@/components/ui";

export default function ProgressPage() {
  const { ready, allowed } = useRequireRole("Student");
  const [entries, setEntries] = useState<ProgressEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    api
      .listProgress()
      .then(setEntries)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro")
      );
  }, [allowed]);

  if (!ready) return <Loading />;
  if (!allowed) return null;

  if (error)
    return (
      <div className="space-y-3">
        <ErrorText>{error}</ErrorText>
        <p className="text-sm text-slate-400">Faça login antes.</p>
      </div>
    );
  if (!entries) return <Loading />;

  return (
    <div className="space-y-8">
      <PageHeader title="Meu progresso" />
      {entries.length === 0 && (
        <EmptyState>Nenhuma lição marcada como concluída ainda.</EmptyState>
      )}
      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.peLessonId}>
            <Card className="flex items-center justify-between !p-4">
              <span>Lição #{e.peLessonId}</span>
              <span className="text-xs text-slate-400">
                {new Date(e.peCompletedAt).toLocaleString("pt-BR")}
              </span>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
