"use client";

import { Coordinates, Mafs, Plot, Point, Line, Theme } from "mafs";
import { useMemo, useState } from "react";
import { compile, round } from "@/lib/mathExpr";
import { Slider, VizCard } from "./VizCard";

interface Props {
  f?: string;
  a?: number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
}

export function DerivativeViz({
  f = "x^2",
  a = 1,
  xMin = -4,
  xMax = 4,
  yMin = -2,
  yMax = 8,
}: Props) {
  const fn = useMemo(() => compile(String(f)), [f]);
  const [h, setH] = useState(1);

  const ya = fn(a);
  const yb = fn(a + h);
  const slope = (yb - ya) / h;
  const tangent = (x: number) => ya + slope * (x - a);

  // f'(a) numérica via diferença centrada para o "valor correto"
  const eps = 0.0001;
  const trueDeriv = (fn(a + eps) - fn(a - eps)) / (2 * eps);

  return (
    <VizCard
      title={`Derivada  f'(${a}) de ${f}`}
      info={`f'(${a}) ≈ ${round(trueDeriv, 4)} · secante = ${round(slope, 4)}`}
      controls={
        <Slider
          label="h"
          min={0.01}
          max={3}
          step={0.01}
          value={h}
          onChange={setH}
          formatValue={(v) => v.toFixed(3)}
        />
      }
    >
      <Mafs
        viewBox={{ x: [xMin, xMax], y: [yMin, yMax] }}
        height={320}
        pan={false}
      >
        <Coordinates.Cartesian />
        <Plot.OfX y={fn} color={Theme.pink} />
        {/* reta secante */}
        {Number.isFinite(slope) && (
          <Plot.OfX y={tangent} color={Theme.blue} opacity={0.7} />
        )}
        {/* pontos */}
        {Number.isFinite(ya) && <Point x={a} y={ya} color={Theme.green} />}
        {Number.isFinite(yb) && <Point x={a + h} y={yb} color={Theme.blue} />}
        {/* h horizontal */}
        <Line.Segment point1={[a, ya]} point2={[a + h, ya]} color={Theme.foreground} opacity={0.3} />
        <Line.Segment point1={[a + h, ya]} point2={[a + h, yb]} color={Theme.foreground} opacity={0.3} />
      </Mafs>
    </VizCard>
  );
}
