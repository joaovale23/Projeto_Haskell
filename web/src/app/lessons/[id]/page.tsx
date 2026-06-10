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
import {
  Button,
  buttonClasses,
  Card,
  cardClasses,
  EmptyState,
  ErrorText,
  focusRing,
  Input,
  Loading,
} from "@/components/ui";

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

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!lesson || !exercises) return <Loading />;

  const isTeacher = user?.urRole === "Teacher";

  return (
    <div className="space-y-8">
      <ConfirmDialog {...dialogProps} />
      <div className="space-y-2">
        <Link
          href={`/modules/${lesson.lrsModuleId}`}
          className={`inline-flex rounded-md text-sm text-slate-400 transition-colors hover:text-slate-100 ${focusRing}`}
        >
          ← Módulo
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {lesson.lrsTitle}
        </h1>
      </div>

      <LessonContent markdown={lesson.lrsContent} />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-medium">Exercícios</h2>
          {user?.urRole === "Teacher" && (
            <Link
              href={`/lessons/${lessonId}/exercises/new`}
              className={buttonClasses("primary", "sm")}
            >
              + Novo exercício
            </Link>
          )}
        </div>
        {exercises.length === 0 && <EmptyState>Nenhum exercício ainda.</EmptyState>}
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
    <form onSubmit={onSubmit} className={cardClasses("!p-4 space-y-3")}>
      <p className="font-medium">{exercise.ersPrompt}</p>

        {exercise.ersKind === "MultipleChoice" && options.length > 0 && (
          <div className="space-y-1">
            {options.map((opt, idx) => (
              <label
                key={idx}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  answered
                    ? "cursor-default opacity-80"
                    : "cursor-pointer hover:bg-slate-800/60"
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
          <Input
            type="number"
            step="any"
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={answered}
          />
        )}

        {exercise.ersKind === "OpenText" && (
          <Input
            type="text"
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={answered}
          />
        )}

        <div className="flex flex-wrap items-center gap-3">
          {!answered && (
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Enviando..." : "Responder"}
            </Button>
          )}
          {answered && (
            <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-400">
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
          {error && <span className="text-sm text-red-400">{error}</span>}
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
    <Card className="!p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <p className="font-medium">{exercise.ersPrompt}</p>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/lessons/${lessonId}/exercises/${exercise.ersId}/edit`}
            className={buttonClasses("secondary", "sm")}
          >
            Editar
          </Link>
          <Button variant="danger" size="sm" onClick={() => onDelete(exercise.ersId)}>
            Excluir
          </Button>
        </div>
      </div>

      {exercise.ersKind === "MultipleChoice" && (
        <ul className="space-y-1">
          {options.map((opt, idx) => {
            const isCorrect = idx === correctIdx;
            return (
              <li
                key={idx}
                className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm ${
                  isCorrect
                    ? "border-emerald-700 bg-emerald-900/40 text-emerald-200"
                    : "border-transparent text-slate-300"
                }`}
              >
                <span>{isCorrect ? "✓" : "•"}</span>
                <span>{opt}</span>
                {isCorrect && (
                  <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-emerald-400">
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
          <span className="inline-block rounded-md border border-emerald-700 bg-emerald-900/40 px-2 py-0.5 text-emerald-200">
            {exercise.ersAnswer != null ? String(exercise.ersAnswer) : "—"}
          </span>
        </p>
      )}

      {exercise.ersExplanation && (
        <p className="text-xs text-slate-500">
          Explicação: {exercise.ersExplanation}
        </p>
      )}
    </Card>
  );
}
