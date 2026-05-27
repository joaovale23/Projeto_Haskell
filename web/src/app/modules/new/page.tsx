"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function NewModulePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [orderIdx, setOrderIdx] = useState(1);
  const [prereq, setPrereq] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createModule({
        mrqTitle: title,
        mrqSlug: slug,
        mrqDescription: description,
        mrqOrderIdx: orderIdx,
        mrqPrerequisiteId: prereq ? Number(prereq) : null,
      });
      router.push("/modules");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar módulo");
    } finally {
      setLoading(false);
    }
  }

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
        <Field label="Slug (identificador na URL)">
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
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
        <Field label="Ordem">
          <input
            type="number"
            required
            value={orderIdx}
            onChange={(e) => setOrderIdx(Number(e.target.value))}
            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:border-pink-400 outline-none"
          />
        </Field>
        <Field label="ID do pré-requisito (opcional)">
          <input
            type="number"
            value={prereq}
            onChange={(e) => setPrereq(e.target.value)}
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
