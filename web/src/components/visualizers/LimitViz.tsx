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

export function LimitViz({
  f = "sin(x)/x",
  a = 0,
  xMin = -4,
  xMax = 4,
  yMin = -1.5,
  yMax = 1.5,
}: Props) {
  const fn = useMemo(() => compile(String(f)), [f]);
  const [delta, setDelta] = useState(1);

  const xL = a - delta;
  const xR = a + delta;
  const yL = fn(xL);
  const yR = fn(xR);

  // Estimativa do limite: média de aproximação muito próxima.
  const eps = 0.0001;
  const limitEstimate = (fn(a - eps) + fn(a + eps)) / 2;

  return (
    <VizCard
      title={`Limite  lim x→${a}  ${f}`}
      info={`L ≈ ${round(limitEstimate, 4)}`}
      controls={
        <>
          <Slider
            label="δ"
            min={0.001}
            max={Math.max(Math.abs(xMin - a), Math.abs(xMax - a))}
            step={0.01}
            value={delta}
            onChange={setDelta}
            formatValue={(v) => v.toFixed(3)}
          />
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
            <span>f({round(xL, 3)}) = {round(yL, 4)}</span>
            <span className="text-right">f({round(xR, 3)}) = {round(yR, 4)}</span>
          </div>
        </>
      }
    >
      <Mafs
        viewBox={{ x: [xMin, xMax], y: [yMin, yMax] }}
        height={320}
        pan={false}
      >
        <Coordinates.Cartesian />
        <Plot.OfX y={fn} color={Theme.pink} />
        {/* faixa delta */}
        <Line.Segment point1={[xL, yMin]} point2={[xL, yMax]} color={Theme.blue} opacity={0.4} />
        <Line.Segment point1={[xR, yMin]} point2={[xR, yMax]} color={Theme.blue} opacity={0.4} />
        {/* alvo */}
        <Line.Segment point1={[a, yMin]} point2={[a, yMax]} color={Theme.green} opacity={0.3} />
        {Number.isFinite(yL) && <Point x={xL} y={yL} color={Theme.blue} />}
        {Number.isFinite(yR) && <Point x={xR} y={yR} color={Theme.blue} />}
        {Number.isFinite(limitEstimate) && (
          <Point x={a} y={limitEstimate} color={Theme.green} />
        )}
      </Mafs>
    </VizCard>
  );
}
