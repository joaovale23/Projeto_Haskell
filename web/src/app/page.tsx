"use client";

import Link from "next/link";
import { homeFor } from "@/lib/api";
import { useUser } from "@/lib/useUser";
import { buttonClasses } from "@/components/ui";

export default function Home() {
  const user = useUser();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Cálculo para Devs
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          Aprenda Cálculo I traduzido para a linguagem mental de quem programa:
          funções como input/output, derivadas como taxa de mudança, integrais como
          acumulação.
        </p>
      </div>
      {user === undefined ? null : !user ? (
        <div className="flex flex-wrap gap-3">
          <Link href="/login" className={buttonClasses("primary", "md")}>
            Entrar
          </Link>
          <Link href="/register" className={buttonClasses("secondary", "md")}>
            Cadastrar
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Link href={homeFor(user.urRole)} className={buttonClasses("primary", "md")}>
            {user.urRole === "Teacher" ? "Ir para o painel" : "Ir para o meu roadmap"}
          </Link>
          <Link href="/modules" className={buttonClasses("secondary", "md")}>
            Ver módulos
          </Link>
        </div>
      )}
    </div>
  );
}
