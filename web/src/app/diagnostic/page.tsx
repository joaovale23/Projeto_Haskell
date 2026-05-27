"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  api,
  type DiagnosticAnswer,
  type DiagnosticQuestion,
  type DiagnosticResult,
} from "@/lib/api";

export default function DiagnosticPage() {
  const [questions, setQuestions] = useState<DiagnosticQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getDiagnosticQuestions()
      .then(setQuestions)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro")
      );
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!questions) return;
    setError(null);
    setLoading(true);
    try {
      const payload: DiagnosticAnswer[] = questions.map((q) => ({
        daQuestionId: q.dqId,
        daSelectedIdx: answers[q.dqId] ?? -1,
      }));
      const r = await api.submitDiagnostic(payload);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  }

  if (error && !questions)
    return <p className="text-red-400">{error}</p>;

  if (!questions) return <p className="text-slate-400">Carregando...</p>;

  if (result) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Resultado do diagnóstico</h1>
        <Section title="Pontos fortes" items={result.drStrengths} color="emerald" />
        <Section title="Pontos a melhorar" items={result.drWeaknesses} color="red" />
        <Section
          title="Módulos recomendados (slugs)"
          items={result.drRecommendedSlugs}
          color="sky"
        />
        <Link
          href="/roadmap"
          className="inline-block px-4 py-2 rounded bg-pink-500 hover:bg-pink-400 text-sm"
        >
          Ver meu roadmap
        </Link>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <p className="text-slate-400 text-sm">
        Nenhuma pergunta de diagnóstico cadastrada ainda.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <h1 className="text-2xl font-semibold">Avaliação diagnóstica</h1>
      <p className="text-slate-400 text-sm">
        Responda para descobrir suas forças e fraquezas em matemática básica.
      </p>
      {questions.map((q) => (
        <div
          key={q.dqId}
          className="border border-slate-800 rounded p-4 bg-slate-900/50 space-y-2"
        >
          <p className="font-medium">
            <span className="text-xs text-slate-500 mr-2">[{q.dqTopic}]</span>
            {q.dqPrompt}
          </p>
          {q.dqOptions.map((opt, idx) => (
            <label key={idx} className="flex gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name={`q-${q.dqId}`}
                value={idx}
                checked={answers[q.dqId] === idx}
                onChange={() => setAnswers((a) => ({ ...a, [q.dqId]: idx }))}
                required
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ))}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded bg-pink-500 hover:bg-pink-400 text-sm disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Ver resultado"}
      </button>
    </form>
  );
}

function Section({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: "emerald" | "red" | "sky";
}) {
  const cls = {
    emerald: "border-emerald-700 bg-emerald-900/30",
    red: "border-red-700 bg-red-900/30",
    sky: "border-sky-700 bg-sky-900/30",
  }[color];
  return (
    <div className={`border rounded p-4 ${cls}`}>
      <h2 className="font-medium mb-1">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">—</p>
      ) : (
        <ul className="text-sm list-disc list-inside text-slate-200">
          {items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
