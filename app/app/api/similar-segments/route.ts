import {
  SIMILAR_SEGMENTS_RATE_LIMIT,
  checkRateLimit,
  jsonWithRateLimit,
} from "@/lib/rateLimit";
import {
  SimilarSegmentError,
  findSimilarSegments,
  parseSimilarSegmentCountries,
} from "@/lib/similarSegments";

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, SIMILAR_SEGMENTS_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return jsonWithRateLimit(
      {error: "Too many similar segment requests. Please retry later."},
      rateLimit,
      {status: 429},
    );
  }

  try {
    const {searchParams} = new URL(request.url);
    const id = searchParams.get("id")?.trim() ?? "";

    if (!id) {
      return jsonWithRateLimit(
        {error: "Missing required query parameter: id"},
        rateLimit,
        {status: 400},
      );
    }

    const payload = await findSimilarSegments({
      id,
      countries: parseSimilarSegmentCountries(searchParams.get("countries")),
    });

    return jsonWithRateLimit(payload, rateLimit);
  } catch (error) {
    if (error instanceof SimilarSegmentError) {
      return jsonWithRateLimit(
        {error: error.message},
        rateLimit,
        {status: error.status},
      );
    }

    console.error("Similar segments route failed", error);
    return jsonWithRateLimit(
      {error: "Similar segments request failed."},
      rateLimit,
      {status: 500},
    );
  }
}
