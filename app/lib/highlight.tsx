import type {ReactNode} from "react";
import {getHighlightTerms, type HighlightMode} from "./highlight-terms";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightTerms(
  text: string,
  query: string,
  mode: HighlightMode = "structured",
): ReactNode {
  const terms = getHighlightTerms(query, mode);

  if (terms.length === 0) return text;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) =>
    terms.includes(part.toLowerCase()) ? (
      <mark key={index} className="rounded bg-amber-200 px-1 text-slate-950">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}
