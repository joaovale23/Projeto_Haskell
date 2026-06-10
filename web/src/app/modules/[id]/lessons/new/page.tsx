"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { api } from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";
import { Button, ErrorText, Field, Input, Loading, PageHeader, Textarea } from "@/components/ui";

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
  const { ready, allowed } = useRequireRole("Teacher");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(TEMPLATE);
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
        lrqOrderIdx: 0, // ignorado: a posição é atribuída automaticamente pelo backend
      });
      router.push(`/modules/${moduleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar lição");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return <Loading />;
  if (!allowed) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Nova lição"
        description="Use markdown para o conteúdo. Para embedar visualizadores, escreva o shortcode em uma linha inteira (parágrafo isolado)."
      />

      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Título">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="Conteúdo (markdown + shortcodes [[viz:...]])">
          <Textarea
            required
            rows={18}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono text-xs"
          />
        </Field>

        {error && <ErrorText>{error}</ErrorText>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Criando..." : "Criar lição"}
        </Button>
      </form>
    </div>
  );
}
