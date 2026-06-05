"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LessonContent } from "@/components/LessonContent";
import {
  api,
  type ApiExercise,
  type ApiLesson,
  type ExerciseResponseEntry,
  type SubmitResult,
} from "@/lib/api";
import { useDeleteConfirm } from "@/lib/useDeleteConfirm";
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
  const [responses, setResponses] = useState<Record<number, ExerciseResponseEntry>>({});
  const [error, setError] = useState<string | null>(null);
  const user = useUser();
  const { ask, dialogProps } = useDeleteConfirm();

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

  // Respostas já enviadas pelo aluno (para bloquear os exercícios respondidos).
  useEffect(() => {
    if (user?.urRole !== "Student") return;
    api
      .listResponsesOfLesson(lessonId)
      .then((rs) => {
        const map: Record<number, ExerciseResponseEntry> = {};
        for (const r of rs) map[r.rseExerciseId] = r;
        setResponses(map);
      })
      .catch(() => undefined);
  }, [lessonId, user]);

  function onDeleteExercise(exerciseId: number) {
    ask({
      title: "Excluir exercício",
      message: "Esta ação não pode ser desfeita.",
      run: async () => {
        await api.deleteExercise(exerciseId);
        setExercises((exs) => (exs ? exs.filter((e) => e.ersId !== exerciseId) : exs));
      },
    });
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (!lesson || !exercises)
    return <p className="text-slate-400">Carregando...</p>;

  const isTeacher = user?.urRole === "Teacher";

  return (
    <div className="space-y-8">
      <ConfirmDialog {...dialogProps} />
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
        {exercises.map((ex) =>
          isTeacher ? (
            <TeacherExerciseCard
              key={ex.ersId}
              exercise={ex}
              lessonId={lessonId}
              onDelete={onDeleteExercise}
            />
          ) : (
            <ExerciseCard
              key={`${ex.ersId}-${responses[ex.ersId] ? "answered" : "open"}`}
              exercise={ex}
              initialResponse={responses[ex.ersId]}
            />
          )
        )}
      </section>
    </div>
  );
}

function ExerciseCard({
  exercise,
  initialResponse,
}: {
  exercise: ApiExercise;
  initialResponse?: ExerciseResponseEntry;
}) {
  const [answer, setAnswer] = useState<string>(
    initialResponse != null ? String(initialResponse.rseAnswer ?? "") : ""
  );
  const [result, setResult] = useState<SubmitResult | null>(
    initialResponse != null
      ? { sersCorrect: initialResponse.rseCorrect, sersExplanation: "" }
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Uma vez respondido, o exercício fica bloqueado (não pode ser alterado).
  const [answered, setAnswered] = useState<boolean>(initialResponse != null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answered) return;
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
      setAnswered(true);
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
            <label
              key={idx}
              className={`flex gap-2 text-sm ${
                answered ? "cursor-default opacity-80" : "cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name={`ex-${exercise.ersId}`}
                value={idx}
                checked={answer === String(idx)}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={answered}
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
          disabled={answered}
          className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 focus:border-pink-400 outline-none disabled:opacity-70"
        />
      )}

      {exercise.ersKind === "OpenText" && (
        <input
          type="text"
          required
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={answered}
          className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 focus:border-pink-400 outline-none disabled:opacity-70"
        />
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {!answered && (
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1 rounded bg-pink-500 hover:bg-pink-400 text-sm disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Responder"}
          </button>
        )}
        {answered && (
          <span className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-400">
            🔒 Já respondida
          </span>
        )}
        {result && (
          <span
            className={`text-sm ${
              result.sersCorrect ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {result.sersCorrect ? "✓ Correto" : "✗ Incorreto"}
            {result.sersExplanation ? ` — ${result.sersExplanation}` : ""}
          </span>
        )}
        {error && <span className="text-red-400 text-sm">{error}</span>}
      </div>
    </form>
  );
}

function TeacherExerciseCard({
  exercise,
  lessonId,
  onDelete,
}: {
  exercise: ApiExercise;
  lessonId: number;
  onDelete: (id: number) => void;
}) {
  const options =
    exercise.ersKind === "MultipleChoice" &&
    typeof exercise.ersPayload === "object" &&
    exercise.ersPayload !== null &&
    Array.isArray((exercise.ersPayload as { options?: unknown }).options)
      ? (exercise.ersPayload as { options: string[] }).options
      : [];
  const correctIdx =
    typeof exercise.ersAnswer === "number" ? exercise.ersAnswer : null;

  return (
    <div className="border border-slate-800 rounded p-4 bg-slate-900/50 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <p className="font-medium">{exercise.ersPrompt}</p>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/lessons/${lessonId}/exercises/${exercise.ersId}/edit`}
            className="text-xs px-3 py-1 rounded border border-slate-700 hover:bg-slate-800"
          >
            Editar
          </Link>
          <button
            onClick={() => onDelete(exercise.ersId)}
            className="text-xs px-3 py-1 rounded border border-red-800 text-red-300 hover:bg-red-950"
          >
            Excluir
          </button>
        </div>
      </div>

      {exercise.ersKind === "MultipleChoice" && (
        <ul className="space-y-1">
          {options.map((opt, idx) => {
            const isCorrect = idx === correctIdx;
            return (
              <li
                key={idx}
                className={`text-sm flex items-center gap-2 rounded px-2 py-1 border ${
                  isCorrect
                    ? "bg-emerald-900/40 border-emerald-700 text-emerald-200"
                    : "border-transparent text-slate-300"
                }`}
              >
                <span>{isCorrect ? "✓" : "•"}</span>
                <span>{opt}</span>
                {isCorrect && (
                  <span className="ml-auto text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                    Gabarito
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(exercise.ersKind === "Numeric" || exercise.ersKind === "OpenText") && (
        <p className="text-sm">
          <span className="text-slate-400">Gabarito: </span>
          <span className="inline-block rounded px-2 py-0.5 bg-emerald-900/40 border border-emerald-700 text-emerald-200">
            {exercise.ersAnswer != null ? String(exercise.ersAnswer) : "—"}
          </span>
        </p>
      )}

      {exercise.ersExplanation && (
        <p className="text-xs text-slate-500">
          Explicação: {exercise.ersExplanation}
        </p>
      )}
    </div>
  );
}
