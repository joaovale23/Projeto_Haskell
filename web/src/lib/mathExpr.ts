import { Parser } from "expr-eval";

const parser = new Parser();

export type RealFn = (x: number) => number;

export function compile(expr: string): RealFn {
  try {
    const e = parser.parse(expr);
    return (x: number) => {
      try {
        const v = e.evaluate({ x });
        return typeof v === "number" ? v : NaN;
      } catch {
        return NaN;
      }
    };
  } catch {
    return () => NaN;
  }
}

// Avaliação numérica robusta — útil para labels.
export function safeEval(f: RealFn, x: number): number {
  const v = f(x);
  return Number.isFinite(v) ? v : NaN;
}

// Amostra (xs, ys) em [a, b] com n+1 pontos.
export function sample(f: RealFn, a: number, b: number, n: number): { x: number; y: number }[] {
  if (n <= 0 || !Number.isFinite(a) || !Number.isFinite(b) || a >= b) return [];
  const step = (b - a) / n;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const x = a + i * step;
    out.push({ x, y: f(x) });
  }
  return out;
}

export function round(n: number, digits = 4): number {
  if (!Number.isFinite(n)) return NaN;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
