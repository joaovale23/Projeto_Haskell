"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";

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

  if (!ready) return <p className="text-slate-400">Carregando...</p>;
  if (!allowed) return null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Novo módulo</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Título">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:border-pink-400 outline-none"
          />
        </Field>
        <Field label="Descrição">
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:border-pink-400 outline-none"
          />
        </Field>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-pink-500 text-white text-sm hover:bg-pink-400 disabled:opacity-50"
        >
          {loading ? "Criando..." : "Criar módulo"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-slate-300">{label}</span>
      {children}
    </label>
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
