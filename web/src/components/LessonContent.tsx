"use client";

import { marked } from "marked";
import { splitContent } from "@/lib/shortcode";
import { visualizers } from "./visualizers";

export function LessonContent({ markdown }: { markdown: string }) {
  const segments = splitContent(markdown);
  return (
    <div>
      {segments.map((seg, i) => {
        if (seg.type === "markdown") {
          return (
            <article
              key={i}
              className="prose prose-invert max-w-none text-slate-200 [&_h2]:mt-6 [&_h2]:text-xl [&_p]:mt-3 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded"
              dangerouslySetInnerHTML={{
                __html: marked.parse(seg.text) as string,
              }}
            />
          );
        }
        const Comp = visualizers[seg.code.kind];
        if (!Comp) return null;
        return <Comp key={i} {...seg.code.params} />;
      })}
    </div>
  );
}
