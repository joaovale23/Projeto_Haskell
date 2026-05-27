"use client";

import { useEffect, useState } from "react";
import { loadUser, type User } from "@/lib/api";

/**
 * Lê o usuário do localStorage só após mount, evitando mismatch
 * entre HTML do SSR (sempre null) e o cliente.
 *
 * Retorna `undefined` durante o primeiro render (use isso como "ainda não sei")
 * e o `User | null` após montar.
 */
export function useUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    setUser(loadUser());
    const onStorage = () => setUser(loadUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return user;
}
