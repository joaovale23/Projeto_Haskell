"use client";

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
              className={`flex-1 px-3 py-2 rounded bg-slate-900 border outline-none ${
                isCorrect
                  ? "border-emerald-500"
                  : "border-slate-700 focus:border-pink-400"
              }`}
            />
            {isCorrect && (
              <span className="text-xs text-emerald-400 shrink-0">✓ correta</span>
            )}
            <button
              type="button"
              onClick={() => removeOption(i)}
              disabled={options.length <= 1}
              className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40 shrink-0"
            >
              Remover
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addOption}
        className="text-xs px-3 py-1 rounded border border-slate-700 hover:bg-slate-800"
      >
        + Adicionar alternativa
      </button>
      <p className="text-xs text-slate-500">
        Selecione o círculo à esquerda para marcar a alternativa correta.
      </p>
    </div>
  );
}
