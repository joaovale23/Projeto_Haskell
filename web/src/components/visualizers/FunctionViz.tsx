"use client";

import { Coordinates, Mafs, Plot, Point, Line, Theme } from "mafs";
import { useMemo, useState } from "react";
import { compile, round } from "@/lib/mathExpr";
import { Slider, VizCard } from "./VizCard";

interface Props {
  f?: string;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
}

export function FunctionViz({
  f = "x^2",
  xMin = -5,
  xMax = 5,
  yMin = -5,
  yMax = 5,
}: Props) {
  const fn = useMemo(() => compile(String(f)), [f]);
  const [x, setX] = useState(1);
  const y = fn(x);

  return (
    <VizCard
      title={`Função  y = ${f}`}
      info={`f(${round(x, 2)}) = ${round(y, 4)}`}
      controls={
        <Slider
          label="x"
          min={xMin}
          max={xMax}
          step={(xMax - xMin) / 200}
          value={x}
          onChange={setX}
          formatValue={(v) => v.toFixed(2)}
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
        {Number.isFinite(y) && (
          <>
            <Line.Segment point1={[x, 0]} point2={[x, y]} color={Theme.blue} opacity={0.5} />
            <Line.Segment point1={[0, y]} point2={[x, y]} color={Theme.blue} opacity={0.5} />
            <Point x={x} y={y} color={Theme.blue} />
          </>
        )}
      </Mafs>
    </VizCard>
  );
}
