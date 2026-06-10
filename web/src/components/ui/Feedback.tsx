import type { ReactNode } from "react";

/** Mensagens de estado reutilizáveis (carregando / erro / vazio). */

export function Loading({ children = "Carregando..." }: { children?: ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-red-400" role="alert">
      {children}
    </p>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}
