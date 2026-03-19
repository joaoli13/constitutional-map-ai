import {
  SEARCH_RATE_LIMIT,
  checkRateLimit,
  jsonWithRateLimit,
} from "@/lib/rateLimit";
import {parseSearchParams, searchArticles} from "@/lib/search";

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, SEARCH_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return jsonWithRateLimit(
      {error: "Too many search requests. Please retry later."},
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

    const payload = await searchArticles({query, countries, cluster, limit});
    return jsonWithRateLimit(payload, rateLimit);
  } catch (error) {
    console.error("Search route failed", error);
    return jsonWithRateLimit(
      {error: "Search request failed."},
      rateLimit,
      {status: 500},
    );
  }
}
