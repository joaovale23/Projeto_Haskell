"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type ApiModule } from "@/lib/api";
import { useUser } from "@/lib/useUser";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Módulos</h1>
        {user?.urRole === "Teacher" && (
          <Link
            href="/modules/new"
            className="px-3 py-2 rounded bg-pink-500 text-white text-sm hover:bg-pink-400"
          >
            + Novo módulo
          </Link>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {modules === null && !error && (
        <p className="text-slate-400 text-sm">Carregando...</p>
      )}

      {modules && modules.length === 0 && (
        <p className="text-slate-400 text-sm">
          Nenhum módulo cadastrado ainda.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {modules?.map((m) => (
          <li key={m.mrsId}>
            <Link
              href={`/modules/${m.mrsId}`}
              className="block border border-slate-800 rounded p-4 bg-slate-900/50 hover:border-pink-400 hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-medium">{m.mrsTitle}</h2>
                <span className="text-xs text-slate-500">#{m.mrsOrderIdx}</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">{m.mrsDescription}</p>
              <p className="text-xs text-slate-500 mt-3">
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
