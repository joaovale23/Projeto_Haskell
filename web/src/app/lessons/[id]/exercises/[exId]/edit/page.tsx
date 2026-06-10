"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { AlternativesEditor } from "@/components/AlternativesEditor";
import { api, type ApiExercise, type ExerciseKind } from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  Button,
  ErrorText,
  Field,
  Input,
  Loading,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";

export default function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string; exId: string }>;
}) {
  const { id, exId } = use(params);
  const lessonId = Number(id);
  const exerciseId = Number(exId);
  const { ready: authReady, allowed } = useRequireRole("Teacher");
  const router = useRouter();
  const [kind, setKind] = useState<ExerciseKind>("MultipleChoice");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [numericAnswer, setNumericAnswer] = useState("");
  const [tolerance, setTolerance] = useState("0.01");
  const [textAnswer, setTextAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [orderIdx, setOrderIdx] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    api
      .getExercise(exerciseId)
      .then((ex: ApiExercise) => {
        setKind(ex.ersKind);
        setPrompt(ex.ersPrompt);
        setOrderIdx(ex.ersOrderIdx);
        if (typeof ex.ersExplanation === "string") setExplanation(ex.ersExplanation);

        const payload = ex.ersPayload as Record<string, unknown> | null;
        const answer = ex.ersAnswer;
        switch (ex.ersKind) {
          case "MultipleChoice": {
            const opts = Array.isArray(payload?.options)
              ? (payload!.options as string[])
              : [];
            setOptions(opts.length >= 2 ? opts : [...opts, ...Array(2 - opts.length).fill("")]);
            if (typeof answer === "number") setCorrectIdx(answer);
            break;
          }
          case "Numeric": {
            const tol = payload?.tolerance;
            if (typeof tol === "number") setTolerance(String(tol));
            if (typeof answer === "number") setNumericAnswer(String(answer));
            break;
          }
          case "OpenText": {
            if (typeof answer === "string") setTextAnswer(answer);
            break;
          }
        }
        setReady(true);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar exercício")
      );
  }, [exerciseId, allowed]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let payload: unknown = null;
      let answer: unknown = null;
      switch (kind) {
        case "MultipleChoice": {
          const opts = options.map((s) => s.trim());
          if (opts.length < 2 || opts.some((o) => !o)) {
            throw new Error("Informe ao menos 2 alternativas, todas preenchidas.");
          }
          payload = { options: opts };
          answer = correctIdx;
          break;
        }
        case "Numeric":
          payload = { tolerance: Number(tolerance) };
          answer = Number(numericAnswer);
          break;
        case "OpenText":
          payload = null;
          answer = textAnswer;
          break;
      }
      await api.updateExercise(exerciseId, {
        erqLessonId: lessonId,
        erqKind: kind,
        erqPrompt: prompt,
        erqPayload: payload,
        erqAnswer: answer,
        erqExplanation: explanation,
        erqOrderIdx: orderIdx,
      });
      router.push(`/lessons/${lessonId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar exercício");
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) return <Loading />;
  if (!allowed) return null;
  if (!ready && !error) return <Loading />;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader title="Editar exercício" />
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Tipo">
          <Select value={kind} onChange={(e) => setKind(e.target.value as ExerciseKind)}>
            <option value="MultipleChoice">Múltipla escolha</option>
            <option value="Numeric">Numérico</option>
            <option value="OpenText">Texto livre</option>
          </Select>
        </Field>

        <Field label="Enunciado">
          <Textarea
            required
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </Field>

        {kind === "MultipleChoice" && (
          <Field label="Alternativas">
            <AlternativesEditor
              options={options}
              correctIdx={correctIdx}
              onChange={(opts, idx) => {
                setOptions(opts);
                setCorrectIdx(idx);
              }}
            />
          </Field>
        )}

        {kind === "Numeric" && (
          <>
            <Field label="Resposta numérica">
              <Input
                type="number"
                step="any"
                required
                value={numericAnswer}
                onChange={(e) => setNumericAnswer(e.target.value)}
              />
            </Field>
            <Field label="Tolerância">
              <Input
                type="number"
                step="any"
                required
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
              />
            </Field>
          </>
        )}

        {kind === "OpenText" && (
          <Field label="Resposta esperada (case/espaços ignorados)">
            <Input
              type="text"
              required
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
            />
          </Field>
        )}

        <Field label="Explicação (mostrada após responder)">
          <Textarea
            required
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
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
