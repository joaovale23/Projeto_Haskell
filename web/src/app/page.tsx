"use client";

import Link from "next/link";
import { homeFor } from "@/lib/api";
import { useUser } from "@/lib/useUser";

export default function Home() {
  const user = useUser();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Cálculo para Devs</h1>
      <p className="text-slate-300 max-w-2xl">
        Aprenda Cálculo I traduzido para a linguagem mental de quem programa:
        funções como input/output, derivadas como taxa de mudança, integrais como
        acumulação.
      </p>
      {user === undefined ? null : !user ? (
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded bg-pink-500 text-white text-sm hover:bg-pink-400"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded border border-slate-700 text-sm hover:bg-slate-800"
          >
            Cadastrar
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 flex-wrap">
          <Link
            href={homeFor(user.urRole)}
            className="px-4 py-2 rounded bg-pink-500 text-white text-sm hover:bg-pink-400"
          >
            {user.urRole === "Teacher" ? "Ir para o painel" : "Ir para o meu roadmap"}
          </Link>
          <Link
            href="/modules"
            className="px-4 py-2 rounded border border-slate-700 text-sm hover:bg-slate-800"
          >
            Ver módulos
          </Link>
        </div>
      )}
    </div>
  );
}
