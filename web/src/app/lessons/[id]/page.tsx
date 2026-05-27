"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { LessonContent } from "@/components/LessonContent";
import { api, type ApiExercise, type ApiLesson, type SubmitResult } from "@/lib/api";
import { useUser } from "@/lib/useUser";

export default function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const lessonId = Number(id);
  const [lesson, setLesson] = useState<ApiLesson | null>(null);
  const [exercises, setExercises] = useState<ApiExercise[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const user = useUser();

  useEffect(() => {
    Promise.all([api.getLesson(lessonId), api.listExercisesOfLesson(lessonId)])
      .then(([l, exs]) => {
        setLesson(l);
        setExercises(exs);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar")
      );
  }, [lessonId]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!lesson || !exercises)
    return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/modules/${lesson.lrsModuleId}`}
          className="text-sm text-slate-400 hover:text-slate-100"
        >
          ← Módulo
        </Link>
        <h1 className="text-3xl font-semibold mt-2">{lesson.lrsTitle}</h1>
      </div>

      <LessonContent markdown={lesson.lrsContent} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Exercícios</h2>
          {user?.urRole === "Teacher" && (
            <Link
              href={`/lessons/${lessonId}/exercises/new`}
              className="text-xs px-3 py-1 rounded bg-pink-500 hover:bg-pink-400"
            >
              + Novo exercício
            </Link>
          )}
        </div>
        {exercises.length === 0 && (
          <p className="text-slate-400 text-sm">Nenhum exercício ainda.</p>
        )}
        {exercises.map((ex) => (
          <ExerciseCard key={ex.ersId} exercise={ex} />
        ))}
      </section>
    </div>
  );
}

function ExerciseCard({ exercise }: { exercise: ApiExercise }) {
  const [answer, setAnswer] = useState<string>("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let payload: unknown;
      switch (exercise.ersKind) {
        case "MultipleChoice":
          payload = Number(answer);
          break;
        case "Numeric":
          payload = Number(answer);
          break;
        case "OpenText":
          payload = answer;
          break;
      }
      const r = await api.submitExercise(exercise.ersId, payload);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  const options =
    exercise.ersKind === "MultipleChoice" &&
    typeof exercise.ersPayload === "object" &&
    exercise.ersPayload !== null &&
    Array.isArray((exercise.ersPayload as { options?: unknown }).options)
      ? ((exercise.ersPayload as { options: string[] }).options)
      : [];

  return (
    <form
      onSubmit={onSubmit}
      className="border border-slate-800 rounded p-4 bg-slate-900/50 space-y-3"
    >
      <p className="font-medium">{exercise.ersPrompt}</p>

      {exercise.ersKind === "MultipleChoice" && options.length > 0 && (
        <div className="space-y-1">
          {options.map((opt, idx) => (
            <label key={idx} className="flex gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name={`ex-${exercise.ersId}`}
                value={idx}
                checked={answer === String(idx)}
                onChange={(e) => setAnswer(e.target.value)}
                required
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {exercise.ersKind === "Numeric" && (
        <input
          type="number"
          step="any"
          required
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 focus:border-pink-400 outline-none"
        />
      )}

      {exercise.ersKind === "OpenText" && (
        <input
          type="text"
          required
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 focus:border-pink-400 outline-none"
        />
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1 rounded bg-pink-500 hover:bg-pink-400 text-sm disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Responder"}
        </button>
        {result && (
          <span
            className={`text-sm ${
              result.sersCorrect ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {result.sersCorrect ? "✓ Correto" : "✗ Incorreto"} —{" "}
            {result.sersExplanation}
          </span>
        )}
        {error && <span className="text-red-400 text-sm">{error}</span>}
      </div>
    </form>
  );
}
