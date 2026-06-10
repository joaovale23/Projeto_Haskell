"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearUser, loadUser, type User } from "@/lib/api";
import { buttonClasses, focusRing } from "@/components/ui";

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
    return <nav className="flex gap-1 text-sm text-slate-400" aria-hidden />;
  }

  function logout() {
    clearUser();
    setUser(null);
    router.push("/");
  }

  if (!user) {
    return (
      <nav className="flex items-center gap-1 text-sm">
        <NavLink href="/login">Entrar</NavLink>
        <NavLink href="/register">Cadastrar</NavLink>
      </nav>
    );
  }

  if (user.urRole === "Teacher") {
    return (
      <nav className="flex items-center gap-1 text-sm">
        <NavLink href="/dashboard">Dashboard</NavLink>
        <NavLink href="/modules">Módulos</NavLink>
        <UserChip user={user} onLogout={logout} />
      </nav>
    );
  }

  // Student
  return (
    <nav className="flex items-center gap-1 text-sm">
      <NavLink href="/roadmap">Roadmap</NavLink>
      <NavLink href="/modules">Módulos</NavLink>
      <NavLink href="/progress">Progresso</NavLink>
      <UserChip user={user} onLogout={logout} />
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-2.5 py-1.5 transition-colors ${focusRing} ${
        active
          ? "bg-slate-800 text-slate-100"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
      }`}
    >
      {children}
    </Link>
  );
}

function UserChip({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <span className="ml-2 flex items-center gap-2 border-l border-slate-800 pl-3">
      <Link
        href="/profile"
        title="Ver perfil"
        className={`rounded-md px-1.5 py-1 text-xs text-slate-300 transition-colors hover:text-slate-100 ${focusRing}`}
      >
        {user.urName}{" "}
        <span className="text-slate-500">
          ({user.urRole === "Teacher" ? "Prof" : "Aluno"})
        </span>
      </Link>
      <button onClick={onLogout} className={buttonClasses("secondary", "sm")}>
        Sair
      </button>
    </span>
  );
}
