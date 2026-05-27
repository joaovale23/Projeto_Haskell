"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api, type ApiLesson, type ApiModule } from "@/lib/api";
import { useUser } from "@/lib/useUser";

export default function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const moduleId = Number(id);
  const [mod, setMod] = useState<ApiModule | null>(null);
  const [lessons, setLessons] = useState<ApiLesson[] | null>(null);
  const [progress, setProgress] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const user = useUser();

  useEffect(() => {
    Promise.all([api.getModule(moduleId), api.listLessonsOfModule(moduleId)])
      .then(([m, ls]) => {
        setMod(m);
        setLessons(ls);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar")
      );
    if (user) {
      api
        .listProgress()
        .then((entries) =>
          setProgress(
            new Set(entries.filter((e) => e.peCompleted).map((e) => e.peLessonId))
          )
        )
        .catch(() => undefined);
    }
  }, [moduleId, user]);

  async function toggleCompleted(lessonId: number) {
    if (!user) {
      alert("Faça login para registrar progresso");
      return;
    }
    try {
      if (progress.has(lessonId)) {
        await api.unmarkLesson(lessonId);
        setProgress((s) => {
          const n = new Set(s);
          n.delete(lessonId);
          return n;
        });
      } else {
        await api.markLessonCompleted(lessonId);
        setProgress((s) => new Set(s).add(lessonId));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    }
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (!mod || !lessons) return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/modules" className="text-sm text-slate-400 hover:text-slate-100">
          ← Módulos
        </Link>
        <h1 className="text-3xl font-semibold mt-2">{mod.mrsTitle}</h1>
        <p className="text-slate-300 mt-2">{mod.mrsDescription}</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Lições</h2>
        {user?.urRole === "Teacher" && (
          <Link
            href={`/modules/${moduleId}/lessons/new`}
            className="text-xs px-3 py-1 rounded bg-pink-500 hover:bg-pink-400"
          >
            + Nova lição
          </Link>
        )}
      </div>
      {lessons.length === 0 && (
        <p className="text-slate-400 text-sm">Nenhuma lição cadastrada.</p>
      )}
      <ul className="space-y-2">
        {lessons.map((l) => (
          <li
            key={l.lrsId}
            className="border border-slate-800 rounded p-4 bg-slate-900/50 flex items-center justify-between"
          >
            <div>
              <Link
                href={`/lessons/${l.lrsId}`}
                className="font-medium hover:text-pink-400"
              >
                {l.lrsOrderIdx}. {l.lrsTitle}
              </Link>
            </div>
            {user && (
              <button
                onClick={() => toggleCompleted(l.lrsId)}
                className={`px-3 py-1 rounded text-xs ${
                  progress.has(l.lrsId)
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "border border-slate-700 hover:bg-slate-800"
                }`}
              >
                {progress.has(l.lrsId) ? "✓ Concluída" : "Marcar concluída"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
