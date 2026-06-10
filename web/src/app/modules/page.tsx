"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type ApiModule } from "@/lib/api";
import { useUser } from "@/lib/useUser";
import {
  buttonClasses,
  EmptyState,
  ErrorText,
  interactiveCardClasses,
  Loading,
  PageHeader,
} from "@/components/ui";

export default function ModulesPage() {
  const [modules, setModules] = useState<ApiModule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const user = useUser();

  useEffect(() => {
    api
      .listModules()
      .then(setModules)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar módulos")
      );
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Módulos"
        actions={
          user?.urRole === "Teacher" && (
            <Link href="/modules/new" className={buttonClasses("primary", "md")}>
              + Novo módulo
            </Link>
          )
        }
      />

      {error && <ErrorText>{error}</ErrorText>}

      {modules === null && !error && <Loading />}

      {modules && modules.length === 0 && (
        <EmptyState>Nenhum módulo cadastrado ainda.</EmptyState>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {modules?.map((m) => (
          <li key={m.mrsId}>
            <Link href={`/modules/${m.mrsId}`} className={interactiveCardClasses()}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-medium text-slate-100">{m.mrsTitle}</h2>
                <span className="text-xs text-slate-500">#{m.mrsOrderIdx}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{m.mrsDescription}</p>
              <p className="mt-3 text-xs text-slate-500">
                slug: <code>{m.mrsSlug}</code>
                {m.mrsPrerequisiteId !== null && (
                  <> · requer #{m.mrsPrerequisiteId}</>
                )}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
