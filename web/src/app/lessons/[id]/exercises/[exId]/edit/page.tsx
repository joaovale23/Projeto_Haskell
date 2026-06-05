"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { AlternativesEditor } from "@/components/AlternativesEditor";
import { api, type ApiExercise, type ExerciseKind } from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";

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

  if (!authReady) return <p className="text-slate-400">Carregando...</p>;
  if (!allowed) return null;
  if (!ready && !error)
    return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Editar exercício</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Tipo">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ExerciseKind)}
            className={inputCls}
          >
            <option value="MultipleChoice">Múltipla escolha</option>
            <option value="Numeric">Numérico</option>
            <option value="OpenText">Texto livre</option>
          </select>
        </Field>

        <Field label="Enunciado">
          <textarea
            required
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className={inputCls}
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
              <input
                type="number"
                step="any"
                required
                value={numericAnswer}
                onChange={(e) => setNumericAnswer(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Tolerância">
              <input
                type="number"
                step="any"
                required
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                className={inputCls}
              />
            </Field>
          </>
        )}

        {kind === "OpenText" && (
          <Field label="Resposta esperada (case/espaços ignorados)">
            <input
              type="text"
              required
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              className={inputCls}
            />
          </Field>
        )}

        <Field label="Explicação (mostrada após responder)">
          <textarea
            required
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className={inputCls}
          />
        </Field>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-pink-500 hover:bg-pink-400 text-sm disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:border-pink-400 outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-slate-300">{label}</span>
      {children}
    </label>
  );
}
