"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { api } from "@/lib/api";

const TEMPLATE = `# Título da lição

Texto explicativo em **markdown**. Você pode usar listas, código \`inline\` e
bloco:

\`\`\`
function f(x) { return x * x; }
\`\`\`

## Visualizadores

Insira em parágrafos isolados (uma linha inteira):

[[viz:function f=x^2 xMin=-3 xMax=3]]

[[viz:limit f=sin(x)/x a=0 yMax=1.5]]

[[viz:derivative f=x^2 a=1]]

[[viz:integral f=x^2 a=0 b=2 nMin=2 nMax=40]]
`;

export default function NewLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const moduleId = Number(id);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(TEMPLATE);
  const [orderIdx, setOrderIdx] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createLesson({
        lrqModuleId: moduleId,
        lrqTitle: title,
        lrqContent: content,
        lrqOrderIdx: orderIdx,
      });
      router.push(`/modules/${moduleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar lição");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Nova lição</h1>
      <p className="text-sm text-slate-400">
        Use markdown para o conteúdo. Para embedar visualizadores, escreva o
        shortcode em uma linha inteira (parágrafo isolado).
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Título">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Ordem">
          <input
            type="number"
            min={1}
            required
            value={orderIdx}
            onChange={(e) => setOrderIdx(Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        <Field label="Conteúdo (markdown + shortcodes [[viz:...]])">
          <textarea
            required
            rows={18}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${inputCls} font-mono text-xs`}
          />
        </Field>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-pink-500 text-white text-sm hover:bg-pink-400 disabled:opacity-50"
        >
          {loading ? "Criando..." : "Criar lição"}
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
