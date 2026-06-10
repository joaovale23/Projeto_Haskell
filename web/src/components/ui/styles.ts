/**
 * Tokens de estilo compartilhados (paleta slate/pink/emerald inalterada).
 *
 * Centraliza raio, espaçamento, estados de foco e proporções (alturas/alvos de
 * toque) que antes estavam repetidos em string por toda a aplicação. Use estes
 * helpers tanto nos componentes <Button>/<Card>/<Input> quanto em <Link> que
 * precisem do mesmo visual.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "dangerSolid"
  | "success"
  | "ghost";

export type ButtonSize = "sm" | "md";

// Anel de foco consistente para qualquer elemento interativo (acessibilidade).
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium " +
  "whitespace-nowrap transition-colors disabled:opacity-50 " +
  "disabled:pointer-events-none " +
  focusRing;

// Alturas garantem alvos de toque confortáveis (md ~40px, sm ~36px).
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-pink-500 text-white hover:bg-pink-400",
  secondary: "border border-slate-700 text-slate-200 hover:bg-slate-800",
  danger: "border border-red-800 text-red-300 hover:bg-red-950",
  dangerSolid: "bg-red-600 text-white hover:bg-red-500",
  success: "bg-emerald-600 text-white hover:bg-emerald-500",
  ghost: "text-slate-300 hover:bg-slate-800",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
): string {
  return `${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]} ${extra}`.trim();
}

// Superfície padrão de card/painel: raio e respiro maiores que o legado.
export function cardClasses(extra = ""): string {
  return `rounded-xl border border-slate-800 bg-slate-900/50 p-5 ${extra}`.trim();
}

// Card clicável (vira <Link>): hover de borda rosa + foco visível.
export function interactiveCardClasses(extra = ""): string {
  return (
    `block ${cardClasses()} transition-colors hover:border-pink-400 ` +
    `hover:bg-slate-900 ${focusRing} ${extra}`
  ).trim();
}

// Controles de formulário (input/select/textarea) com foco visível e altura
// confortável.
export const controlClasses =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm " +
  "text-slate-100 placeholder:text-slate-500 outline-none transition-colors " +
  "focus:border-pink-400 focus-visible:ring-2 focus-visible:ring-pink-500/40 " +
  "disabled:opacity-60";
