"use client";

import katex from "katex";
import { useMemo, useState } from "react";
import { callCas, type CasOp, type CasResult } from "@/lib/cas";

interface HistoryItem {
  op: CasOp;
  expression: string;
  variables?: Record<string, number>;
  result: CasResult;
}

const OP_LABELS: Record<CasOp, string> = {
  derivative: "Derivada",
  integral: "Integral",
  simplify: "Simplificar",
  evaluate: "Avaliar",
};

export default function CasPage() {
  const [op, setOp] = useState<CasOp>("derivative");
  const [expression, setExpression] = useState("x^2 + sin(x)");
  const [variable, setVariable] = useState("x");
  const [variablesText, setVariablesText] = useState("x=2");
  const [result, setResult] = useState<CasResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  function parseVariables(text: string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const tok of text.split(/[\s,]+/).filter(Boolean)) {
      const eq = tok.indexOf("=");
      if (eq <= 0) continue;
      const key = tok.slice(0, eq).trim();
      const val = Number(tok.slice(eq + 1));
      if (key && Number.isFinite(val)) out[key] = val;
    }
    return out;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      let r: CasResult;
      let variables: Record<string, number> | undefined;
      switch (op) {
        case "derivative":
          r = await callCas({ op, body: { expression, variable } });
          break;
        case "integral":
          r = await callCas({ op, body: { expression, variable } });
          break;
        case "simplify":
          r = await callCas({ op, body: { expression } });
          break;
        case "evaluate":
          variables = parseVariables(variablesText);
          r = await callCas({ op, body: { expression, variables } });
          break;
      }
      setResult(r);
      setHistory((h) => [{ op, expression, variables, result: r }, ...h].slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Calculadora Simbólica</h1>
        <p className="text-sm text-slate-400 mt-2">
          Cálculo simbólico via microserviço <code>sympy_service</code>{" "}
          (FastAPI + SymPy). Aceita <code>x^2</code>, <code>sin(x)</code>,{" "}
          <code>exp(x)</code>, <code>log(x)</code>, <code>sqrt</code>, etc.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 border border-slate-800 rounded p-4 bg-slate-900/40"
      >
        <Field label="Operação">
          <select
            value={op}
            onChange={(e) => setOp(e.target.value as CasOp)}
            className={inputCls}
          >
            {(Object.keys(OP_LABELS) as CasOp[]).map((k) => (
              <option key={k} value={k}>
                {OP_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Expressão">
          <input
            required
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className={`${inputCls} font-mono`}
            placeholder="x^2 + sin(x)"
          />
        </Field>

        {(op === "derivative" || op === "integral") && (
          <Field label="Variável">
            <input
              required
              value={variable}
              onChange={(e) => setVariable(e.target.value)}
              className={`${inputCls} font-mono w-24`}
            />
          </Field>
        )}

        {op === "evaluate" && (
          <Field label="Variáveis (formato: x=2 y=3)">
            <input
              required
              value={variablesText}
              onChange={(e) => setVariablesText(e.target.value)}
              className={`${inputCls} font-mono`}
              placeholder="x=2 y=3"
            />
          </Field>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-pink-500 hover:bg-pink-400 text-sm disabled:opacity-50"
        >
          {loading ? "Calculando..." : "Calcular"}
        </button>
      </form>

      {result && (
        <div className="border border-emerald-700 bg-emerald-900/20 rounded p-4 space-y-3">
          <h2 className="text-sm font-medium text-slate-300">Resultado</h2>
          <Latex tex={result.latex} display />
          <p className="text-xs text-slate-400 font-mono break-all">
            {result.result}
            {result.value !== undefined && ` · ≈ ${result.value}`}
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-slate-400">Histórico</h2>
          <ul className="space-y-2">
            {history.map((h, i) => (
              <li
                key={i}
                className="border border-slate-800 rounded p-3 text-sm bg-slate-900/40"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    [{OP_LABELS[h.op]}] <code className="font-mono">{h.expression}</code>
                    {h.variables &&
                      ` com ${Object.entries(h.variables)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(" ")}`}
                  </span>
                </div>
                <div className="mt-2">
                  <Latex tex={h.result.latex} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Latex({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        throwOnError: false,
        displayMode: display,
      });
    } catch {
      return tex;
    }
  }, [tex, display]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

const inputCls =
  "px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:border-pink-400 outline-none w-full";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-slate-300">{label}</span>
      {children}
    </label>
  );
}
