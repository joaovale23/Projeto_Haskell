"use client";

import type { ReactNode } from "react";

export function VizCard({
  title,
  children,
  controls,
  info,
}: {
  title: string;
  children: ReactNode;
  controls?: ReactNode;
  info?: ReactNode;
}) {
  return (
    <div className="my-6 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
      <div className="px-4 py-2 border-b border-slate-800 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-slate-200">{title}</h3>
        {info && <span className="text-xs text-slate-400 font-mono">{info}</span>}
      </div>
      <div className="p-3 bg-slate-950">{children}</div>
      {controls && (
        <div className="px-4 py-3 border-t border-slate-800 space-y-2 text-sm">
          {controls}
        </div>
      )}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  return (
    <label className="flex items-center gap-3 text-xs text-slate-300">
      <span className="w-12 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-pink-500"
      />
      <span className="w-16 shrink-0 font-mono text-right text-slate-400">
        {formatValue ? formatValue(value) : value.toFixed(2)}
      </span>
    </label>
  );
}
