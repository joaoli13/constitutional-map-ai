import type {ReactNode} from "react";

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "not", "no", "nor",
  "so", "yet", "as", "if", "that", "this", "these", "those", "it", "its",
  "he", "she", "they", "we", "you", "i", "me", "him", "her", "us", "them",
]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightTerms(text: string, query: string): ReactNode {
  const terms = query
    .replace(/["()]/g, " ")
    .replace(/\b(AND|OR|NOT)\b/gi, " ")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));

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
