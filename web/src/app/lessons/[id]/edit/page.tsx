"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";

export default function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const lessonId = Number(id);
  const { ready: authReady, allowed } = useRequireRole("Teacher");
  const router = useRouter();
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [orderIdx, setOrderIdx] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    api
      .getLesson(lessonId)
      .then((l) => {
        setModuleId(l.lrsModuleId);
        setTitle(l.lrsTitle);
        setContent(l.lrsContent);
        setOrderIdx(l.lrsOrderIdx);
        setReady(true);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar lição")
      );
  }, [lessonId, allowed]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (moduleId === null) return;
    setError(null);
    setLoading(true);
    try {
      await api.updateLesson(lessonId, {
        lrqModuleId: moduleId,
        lrqTitle: title,
        lrqContent: content,
        lrqOrderIdx: orderIdx,
      });
      router.push(`/lessons/${lessonId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar lição");
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) return <p className="text-slate-400">Carregando...</p>;
  if (!allowed) return null;
  if (!ready && !error)
    return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Editar lição</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Título">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Conteúdo (markdown + shortcodes [[viz:...]])">
          <textarea
            required
            rows={18}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${inputCls} font-mono text-xs`}
          />
        </Field>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-pink-500 text-white text-sm hover:bg-pink-400 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:border-pink-400 outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-slate-300">{label}</span>
      {children}
    </label>
  );
}
