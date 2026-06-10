"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";
import { Button, ErrorText, Field, Input, Loading, PageHeader, Textarea } from "@/components/ui";

export default function EditModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const moduleId = Number(id);
  const { ready: authReady, allowed } = useRequireRole("Teacher");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [orderIdx, setOrderIdx] = useState(1);
  const [prereq, setPrereq] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    api
      .getModule(moduleId)
      .then((m) => {
        setTitle(m.mrsTitle);
        setSlug(m.mrsSlug);
        setDescription(m.mrsDescription);
        setOrderIdx(m.mrsOrderIdx);
        setPrereq(m.mrsPrerequisiteId !== null ? String(m.mrsPrerequisiteId) : "");
        setReady(true);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar módulo")
      );
  }, [moduleId, allowed]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.updateModule(moduleId, {
        mrqTitle: title,
        mrqSlug: slug,
        mrqDescription: description,
        mrqOrderIdx: orderIdx,
        mrqPrerequisiteId: prereq ? Number(prereq) : null,
      });
      router.push(`/modules/${moduleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar módulo");
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) return <Loading />;
  if (!allowed) return null;
  if (!ready && !error) return <Loading />;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader title="Editar módulo" />
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Título">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Descrição">
          <Textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
