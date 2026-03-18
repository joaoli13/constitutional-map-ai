import {getArticleDetail} from "@/lib/article";
import {
  ARTICLE_RATE_LIMIT,
  checkRateLimit,
  jsonWithRateLimit,
} from "@/lib/rateLimit";

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, ARTICLE_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return jsonWithRateLimit(
      {error: "Too many article requests. Please retry later."},
      rateLimit,
      {status: 429},
    );
  }

  try {
    const {searchParams} = new URL(request.url);
    const id = searchParams.get("id")?.trim();
    const countryCode = searchParams.get("country_code")?.trim().toUpperCase() || null;
    const articleId = searchParams.get("article_id")?.trim() || null;

    if (!id) {
      return jsonWithRateLimit(
        {error: "Missing required query parameter: id"},
        rateLimit,
        {status: 400},
      );
    }

    const article = await getArticleDetail({
      id,
      countryCode,
      articleId,
    });
    if (!article) {
      return jsonWithRateLimit(
        {error: "Article not found."},
        rateLimit,
        {status: 404},
      );
    }

    return jsonWithRateLimit(article, rateLimit);
  } catch (error) {
    console.error("Article route failed", error);
    return jsonWithRateLimit(
      {error: "Article request failed."},
      rateLimit,
      {status: 500},
    );
  }
}
