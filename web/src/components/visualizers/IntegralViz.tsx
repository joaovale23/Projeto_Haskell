"use client";

import { Coordinates, Mafs, Plot, Polygon, Theme } from "mafs";
import { useMemo, useState } from "react";
import { compile, round } from "@/lib/mathExpr";
import { Slider, VizCard } from "./VizCard";

interface Props {
  f?: string;
  a?: number;
  b?: number;
  nMin?: number;
  nMax?: number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
}

export function IntegralViz({
  f = "x^2",
  a = 0,
  b = 2,
  nMin = 2,
  nMax = 40,
  xMin,
  xMax,
  yMin = 0,
  yMax,
}: Props) {
  const fn = useMemo(() => compile(String(f)), [f]);
  const [n, setN] = useState(Math.max(nMin, Math.min(8, nMax)));

  const dx = (b - a) / n;
  const rectangles: [number, number][][] = [];
  let area = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const x1 = x0 + dx;
    const h = fn(x0); // soma de Riemann pela esquerda
    if (!Number.isFinite(h)) continue;
    area += h * dx;
    rectangles.push([
      [x0, 0],
      [x1, 0],
      [x1, h],
      [x0, h],
    ]);
  }

  // viewBox razoável quando não informado
  const padX = Math.max(0.5, (b - a) * 0.2);
  const vxMin = xMin ?? a - padX;
  const vxMax = xMax ?? b + padX;
  const sampleVals = Array.from({ length: 50 }, (_, i) =>
    fn(a + ((b - a) * i) / 49)
  ).filter(Number.isFinite);
  const dataMax = Math.max(0, ...sampleVals);
  const vyMax = yMax ?? Math.max(1, dataMax * 1.2);

  return (
    <VizCard
      title={`Integral  ∫ ${f} dx em [${a}, ${b}]`}
      info={`Soma ≈ ${round(area, 4)}`}
      controls={
        <Slider
          label="n"
          min={nMin}
          max={nMax}
          step={1}
          value={n}
          onChange={setN}
          formatValue={(v) => `${v} ret.`}
        />
      }
    >
      <Mafs
        viewBox={{ x: [vxMin, vxMax], y: [yMin, vyMax] }}
        height={320}
        pan={false}
      >
        <Coordinates.Cartesian />
        {rectangles.map((pts, i) => (
          <Polygon
            key={i}
            points={pts}
            color={Theme.blue}
            fillOpacity={0.25}
            strokeOpacity={0.6}
          />
        ))}
        <Plot.OfX y={fn} color={Theme.pink} />
      </Mafs>
    </VizCard>
  );
}
