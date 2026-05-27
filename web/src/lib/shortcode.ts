export type VizKind = "function" | "limit" | "derivative" | "integral";

export interface Shortcode {
  kind: VizKind;
  params: Record<string, string | number>;
}

export type Segment =
  | { type: "markdown"; text: string }
  | { type: "viz"; code: Shortcode };

const SHORTCODE_RE = /^\[\[viz:(\w+)([^\]]*)\]\]$/;

function isKnownKind(s: string): s is VizKind {
  return s === "function" || s === "limit" || s === "derivative" || s === "integral";
}

function parseParams(raw: string): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  // separa por espaço respeitando "chave=valor" (sem suporte a aspas/espaços no valor — MVP)
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  for (const t of tokens) {
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq);
    const value = t.slice(eq + 1);
    const asNum = Number(value);
    out[key] = Number.isFinite(asNum) && value.trim() !== "" ? asNum : value;
  }
  return out;
}

export function splitContent(content: string): Segment[] {
  const lines = content.split(/\r?\n/);
  const segments: Segment[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer.join("\n");
    if (text.trim() !== "") segments.push({ type: "markdown", text });
    buffer = [];
  };

  for (const line of lines) {
    const m = line.trim().match(SHORTCODE_RE);
    if (m && isKnownKind(m[1])) {
      flush();
      segments.push({
        type: "viz",
        code: { kind: m[1], params: parseParams(m[2]) },
      });
    } else {
      buffer.push(line);
    }
  }
  flush();
  return segments;
}
