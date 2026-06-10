"use client";

import { Button, controlClasses } from "@/components/ui";

/**
 * Editor dinâmico de alternativas de múltipla escolha.
 * - Marca a alternativa correta diretamente (radio), sem informar índice.
 * - Adiciona / edita / remove alternativas sem recarregar a página.
 */
export function AlternativesEditor({
  options,
  correctIdx,
  onChange,
}: {
  options: string[];
  correctIdx: number;
  onChange: (options: string[], correctIdx: number) => void;
}) {
  function updateOption(i: number, value: string) {
    const next = options.slice();
    next[i] = value;
    onChange(next, correctIdx);
  }

  function addOption() {
    onChange([...options, ""], correctIdx);
  }

  function removeOption(i: number) {
    if (options.length <= 1) return;
    const next = options.filter((_, idx) => idx !== i);
    // Reajusta o índice da correta após remoção.
    let nextCorrect = correctIdx;
    if (i === correctIdx) nextCorrect = 0;
    else if (i < correctIdx) nextCorrect = correctIdx - 1;
    onChange(next, Math.min(nextCorrect, next.length - 1));
  }

  function markCorrect(i: number) {
    onChange(options, i);
  }

  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const isCorrect = i === correctIdx;
        return (
          <div key={i} className="flex items-center gap-2">
            <label
              className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer shrink-0"
              title="Marcar como alternativa correta"
            >
              <input
                type="radio"
                name="correct-alt"
                checked={isCorrect}
                onChange={() => markCorrect(i)}
                className="accent-emerald-500"
              />
            </label>
            <input
              type="text"
              required
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Alternativa ${i + 1}`}
              className={
                isCorrect
                  ? `${controlClasses} flex-1 border-emerald-500`
                  : `${controlClasses} flex-1`
              }
            />
            {isCorrect && (
              <span className="shrink-0 text-xs text-emerald-400">✓ correta</span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => removeOption(i)}
              disabled={options.length <= 1}
              className="shrink-0"
            >
              Remover
            </Button>
          </div>
        );
      })}
      <Button variant="secondary" size="sm" onClick={addOption}>
        + Adicionar alternativa
      </Button>
      <p className="text-xs text-slate-500">
        Selecione o círculo à esquerda para marcar a alternativa correta.
      </p>
    </div>
  );
}
