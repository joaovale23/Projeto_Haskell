"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, type Role } from "@/lib/api";
import { useUser } from "@/lib/useUser";

/**
 * Protege uma página por perfil. Visitante não logado vai para /login;
 * usuário com perfil diferente é mandado para a home do seu próprio perfil.
 *
 * Uso:
 *   const { ready, allowed } = useRequireRole("Teacher");
 *   if (!ready) return <Loading/>;
 *   if (!allowed) return null; // redirecionando
 */
export function useRequireRole(role: Role): { ready: boolean; allowed: boolean } {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return; // estado de auth ainda carregando
    if (!user) {
      router.replace("/login");
    } else if (user.urRole !== role) {
      router.replace(homeFor(user.urRole));
    }
  }, [user, role, router]);

  return {
    ready: user !== undefined,
    allowed: !!user && user.urRole === role,
  };
}
