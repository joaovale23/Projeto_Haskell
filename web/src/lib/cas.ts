export const CAS_URL =
  process.env.NEXT_PUBLIC_CAS_URL ?? "http://localhost:8001";

export type CasOp = "derivative" | "integral" | "simplify" | "evaluate";

export interface CasResult {
  result: string;
  latex: string;
  value?: number;
}

interface CasError {
  detail?: string;
  message?: string;
}

export interface DerivativeBody {
  expression: string;
  variable: string;
}

export interface IntegralBody {
  expression: string;
  variable: string;
}

export interface SimplifyBody {
  expression: string;
}

export interface EvaluateBody {
  expression: string;
  variables: Record<string, number>;
}

type CasBody =
  | { op: "derivative"; body: DerivativeBody }
  | { op: "integral"; body: IntegralBody }
  | { op: "simplify"; body: SimplifyBody }
  | { op: "evaluate"; body: EvaluateBody };

export async function callCas({ op, body }: CasBody): Promise<CasResult> {
  const res = await fetch(`${CAS_URL}/symbolic/${op}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err: CasError = await res.json();
      msg = err.detail ?? err.message ?? msg;
    } catch {
      // fallthrough
    }
    throw new Error(msg);
  }
  return res.json() as Promise<CasResult>;
}
