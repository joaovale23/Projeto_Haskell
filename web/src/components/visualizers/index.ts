import type { ComponentType } from "react";
import type { VizKind } from "@/lib/shortcode";
import { FunctionViz } from "./FunctionViz";
import { LimitViz } from "./LimitViz";
import { DerivativeViz } from "./DerivativeViz";
import { IntegralViz } from "./IntegralViz";

// Cada visualizador aceita um Record<string, string|number> e ignora extras.
type VizComponent = ComponentType<Record<string, string | number>>;

export const visualizers: Record<VizKind, VizComponent> = {
  function: FunctionViz as VizComponent,
  limit: LimitViz as VizComponent,
  derivative: DerivativeViz as VizComponent,
  integral: IntegralViz as VizComponent,
};
