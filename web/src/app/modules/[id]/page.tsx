"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { api, type ApiLesson, type ApiModule } from "@/lib/api";
import { useDeleteConfirm } from "@/lib/useDeleteConfirm";
import { useUser } from "@/lib/useUser";
import {
  Button,
  buttonClasses,
  Card,
  EmptyState,
  ErrorText,
  focusRing,
  Loading,
  PageHeader,
} from "@/components/ui";

export default function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const moduleId = Number(id);
  const router = useRouter();
  const [mod, setMod] = useState<ApiModule | null>(null);
  const [lessons, setLessons] = useState<ApiLesson[] | null>(null);
  const [progress, setProgress] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const user = useUser();
  const { ask, dialogProps } = useDeleteConfirm();

  function onDeleteModule() {
    ask({
      title: "Excluir módulo",
      message: "Suas lições e exercícios também serão removidos. Esta ação não pode ser desfeita.",
      run: async () => {
        await api.deleteModule(moduleId);
        router.push("/modules");
      },
    });
  }

  function onDeleteLesson(lessonId: number) {
    ask({
      title: "Excluir lição",
      message: "Seus exercícios também serão removidos. Esta ação não pode ser desfeita.",
      run: async () => {
        await api.deleteLesson(lessonId);
        setLessons((ls) => (ls ? ls.filter((l) => l.lrsId !== lessonId) : ls));
      },
    });
  }

  useEffect(() => {
    Promise.all([api.getModule(moduleId), api.listLessonsOfModule(moduleId)])
      .then(([m, ls]) => {
        setMod(m);
        setLessons(ls);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar")
      );
    if (user) {
      api
        .listProgress()
        .then((entries) =>
          setProgress(
            new Set(entries.filter((e) => e.peCompleted).map((e) => e.peLessonId))
          )
        )
        .catch(() => undefined);
    }
  }, [moduleId, user]);

  async function toggleCompleted(lessonId: number) {
    if (!user) {
      alert("Faça login para registrar progresso");
      return;
    }
    try {
      if (progress.has(lessonId)) {
        await api.unmarkLesson(lessonId);
        setProgress((s) => {
          const n = new Set(s);
          n.delete(lessonId);
          return n;
        });
      } else {
        await api.markLessonCompleted(lessonId);
        setProgress((s) => new Set(s).add(lessonId));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    }
  }

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!mod || !lessons) return <Loading />;

  return (
    <div className="space-y-8">
      <ConfirmDialog {...dialogProps} />

      <PageHeader
        back={
          <Link
            href="/modules"
            className={`inline-flex rounded-md text-sm text-slate-400 transition-colors hover:text-slate-100 ${focusRing}`}
          >
            ← Módulos
          </Link>
        }
        title={mod.mrsTitle}
        description={mod.mrsDescription}
        actions={
          user?.urRole === "Teacher" && (
            <>
              <Link
                href={`/modules/${moduleId}/edit`}
                className={buttonClasses("secondary", "sm")}
              >
                Editar
              </Link>
              <Button variant="danger" size="sm" onClick={onDeleteModule}>
                Excluir
              </Button>
            </>
          )
        }
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-medium">Lições</h2>
          {user?.urRole === "Teacher" && (
            <Link
              href={`/modules/${moduleId}/lessons/new`}
              className={buttonClasses("primary", "sm")}
            >
              + Nova lição
            </Link>
          )}
        </div>

        {lessons.length === 0 && <EmptyState>Nenhuma lição cadastrada.</EmptyState>}

        <ul className="space-y-3">
          {lessons.map((l) => (
            <li key={l.lrsId}>
              <Card className="flex items-center justify-between gap-4 !p-4">
                <Link
                  href={`/lessons/${l.lrsId}`}
                  className={`rounded-md font-medium text-slate-100 transition-colors hover:text-pink-400 ${focusRing}`}
                >
                  {l.lrsOrderIdx}. {l.lrsTitle}
                </Link>
                {user?.urRole === "Teacher" ? (
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/lessons/${l.lrsId}/edit`}
                      className={buttonClasses("secondary", "sm")}
                    >
                      Editar
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDeleteLesson(l.lrsId)}
                    >
                      Excluir
                    </Button>
                  </div>
                ) : (
                  user && (
                    <Button
                      variant={progress.has(l.lrsId) ? "success" : "secondary"}
                      size="sm"
                      onClick={() => toggleCompleted(l.lrsId)}
                    >
                      {progress.has(l.lrsId) ? "✓ Concluída" : "Marcar concluída"}
                    </Button>
                  )
                )}
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
