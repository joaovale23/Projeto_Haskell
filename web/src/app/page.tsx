"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadUser, type User } from "@/lib/api";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(loadUser());
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Cálculo para Devs</h1>
      <p className="text-slate-300 max-w-2xl">
        Aprenda Cálculo I traduzido para a linguagem mental de quem programa:
        funções como input/output, derivadas como taxa de mudança, integrais como
        acumulação.
      </p>
      {!mounted ? null : !user ? (
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
      ) : user.urRole === "Teacher" ? (
        <div className="flex gap-3">
          <Link
            href="/modules"
            className="px-4 py-2 rounded bg-pink-500 text-white text-sm hover:bg-pink-400"
          >
            Gerenciar módulos
          </Link>
          <Link
            href="/modules/new"
            className="px-4 py-2 rounded border border-slate-700 text-sm hover:bg-slate-800"
          >
            Novo módulo
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/roadmap"
            className="px-4 py-2 rounded bg-pink-500 text-white text-sm hover:bg-pink-400"
          >
            Meu roadmap
          </Link>
          <Link
            href="/diagnostic"
            className="px-4 py-2 rounded border border-slate-700 text-sm hover:bg-slate-800"
          >
            Fazer diagnóstico
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
