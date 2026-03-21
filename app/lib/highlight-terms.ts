const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "not", "no", "nor",
  "so", "yet", "as", "if", "that", "this", "these", "those", "it", "its",
  "he", "she", "they", "we", "you", "i", "me", "him", "her", "us", "them",
  "aunque", "após", "como", "com", "con", "contra", "conforme", "contudo",
  "cuando", "de", "del", "desde", "do", "dos", "da", "das", "durante",
  "e", "em", "en", "entre", "hasta", "mas", "mediante", "ou", "para",
  "pero", "por", "porque", "porém", "pois", "que", "se", "sem", "si",
  "sin", "sobre", "todavia", "todavía", "tras", "versus", "via", "y",
]);

export type HighlightMode = "plain" | "structured";

export function getHighlightTerms(
  query: string,
  mode: HighlightMode = "structured",
) {
  const normalizedQuery = mode === "structured"
    ? query
        .replace(/["()]/g, " ")
        .replace(/\b(AND|OR|NOT)\b/gi, " ")
    : query.replace(/[^\p{L}\p{N}\s'-]+/gu, " ");

  return Array.from(
    new Set(
      normalizedQuery
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((term) => term.length > 3 && !STOPWORDS.has(term)),
    ),
  );
}
