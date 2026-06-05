"use client";

import { useState } from "react";

export type ConfirmAction = {
  title: string;
  message: string;
  confirmLabel?: string;
  run: () => Promise<void>;
};

/**
 * Gerencia o estado de um modal de confirmação de exclusão.
 * `ask(action)` abre o modal; ao confirmar, executa `action.run()`.
 * `dialogProps` é passado direto para <ConfirmDialog />.
 */
export function useDeleteConfirm() {
  const [pending, setPending] = useState<ConfirmAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function ask(action: ConfirmAction) {
    setError(null);
    setPending(action);
  }

  function onCancel() {
    if (loading) return;
    setPending(null);
    setError(null);
  }

  async function onConfirm() {
    if (!pending) return;
    setLoading(true);
    setError(null);
    try {
      await pending.run();
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setLoading(false);
    }
  }

  return {
    ask,
    dialogProps: {
      open: pending !== null,
      title: pending?.title ?? "",
      message: pending?.message ?? "",
      confirmLabel: pending?.confirmLabel ?? "Excluir",
      loading,
      error,
      onConfirm,
      onCancel,
    },
  };
}
