"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";
import { Button, ErrorText, Field, Input, Loading, PageHeader, Textarea } from "@/components/ui";

export default function NewModulePage() {
  const { ready, allowed } = useRequireRole("Teacher");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createModule({
        mrqTitle: title,
        mrqSlug: slugify(title), // gerado do título; backend garante unicidade
        mrqDescription: description,
        mrqOrderIdx: 0, // ignorado: a posição é atribuída automaticamente pelo backend
        mrqPrerequisiteId: null,
      });
      router.push("/modules");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar módulo");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return <Loading />;
  if (!allowed) return null;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader title="Novo módulo" />
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
          {loading ? "Criando..." : "Criar módulo"}
        </Button>
      </form>
    </div>
  );
}

// Gera um identificador de URL a partir do título (sem acentos, minúsculo).
function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
