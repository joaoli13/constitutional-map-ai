import {
  SEMANTIC_SEARCH_RATE_LIMIT,
  checkRateLimit,
  jsonWithRateLimit,
} from "@/lib/rateLimit";
import {parseSearchParams} from "@/lib/search";
import {semanticSearchArticles} from "@/lib/semanticSearch";

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, SEMANTIC_SEARCH_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return jsonWithRateLimit(
      {error: "Too many semantic search requests. Please retry later."},
      rateLimit,
      {status: 429},
    );
  }

  try {
    const {query, countries, clusterParam, cluster, limit} = parseSearchParams(
      new URL(request.url),
    );

    if (!query) {
      return jsonWithRateLimit(
        {error: "Missing required query parameter: q"},
        rateLimit,
        {status: 400},
      );
    }

    if (clusterParam && Number.isNaN(cluster)) {
      return jsonWithRateLimit(
        {error: "Invalid cluster query parameter."},
        rateLimit,
        {status: 400},
      );
    }

    const payload = await semanticSearchArticles({query, countries, cluster, limit});
    return jsonWithRateLimit(payload, rateLimit);
  } catch (error) {
    console.error("Semantic search route failed", error);
    return jsonWithRateLimit(
      {error: "Semantic search request failed."},
      rateLimit,
      {status: 500},
    );
  }
}
