"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";
import { Button, ErrorText, Field, Input, Loading, PageHeader, Textarea } from "@/components/ui";

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

  if (!authReady) return <Loading />;
  if (!allowed) return null;
  if (!ready && !error) return <Loading />;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Editar lição" />
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Título">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="Conteúdo (markdown + shortcodes [[viz:...]])">
          <Textarea
            required
            rows={18}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono text-xs"
          />
        </Field>

        {error && <ErrorText>{error}</ErrorText>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </div>
  );
}
