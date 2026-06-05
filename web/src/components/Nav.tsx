"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearUser, loadUser, type User } from "@/lib/api";

export default function Nav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(loadUser());
    setMounted(true);
    const onChange = () => setUser(loadUser());
    window.addEventListener("storage", onChange);
    window.addEventListener("auth-change", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("auth-change", onChange);
    };
  }, []);

  // Evita mismatch SSR vs client: enquanto não montou, não renderiza links que
  // dependem do estado de login.
  if (!mounted) {
    return <nav className="flex gap-4 text-sm text-slate-400" aria-hidden />;
  }

  function logout() {
    clearUser();
    setUser(null);
    router.push("/");
  }

  if (!user) {
    return (
      <nav className="flex gap-4 text-sm text-slate-400">
        <NavLink href="/login">Entrar</NavLink>
        <NavLink href="/register">Cadastrar</NavLink>
      </nav>
    );
  }

  if (user.urRole === "Teacher") {
    return (
      <nav className="flex gap-4 text-sm text-slate-400 items-center">
        <NavLink href="/dashboard">Dashboard</NavLink>
        <NavLink href="/modules">Módulos</NavLink>
        <UserChip user={user} onLogout={logout} />
      </nav>
    );
  }

  // Student
  return (
    <nav className="flex gap-4 text-sm text-slate-400 items-center">
      <NavLink href="/roadmap">Roadmap</NavLink>
      <NavLink href="/modules">Módulos</NavLink>
      <NavLink href="/progress">Progresso</NavLink>
      <UserChip user={user} onLogout={logout} />
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="hover:text-slate-100">
      {children}
    </Link>
  );
}

function UserChip({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <span className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-800">
      <Link
        href="/profile"
        className="text-slate-300 text-xs hover:text-slate-100"
        title="Ver perfil"
      >
        {user.urName}{" "}
        <span className="text-slate-500">
          ({user.urRole === "Teacher" ? "Prof" : "Aluno"})
        </span>
      </Link>
      <button
        onClick={onLogout}
        className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
      >
        Sair
      </button>
    </span>
  );
}
