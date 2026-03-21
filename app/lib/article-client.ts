import type {ArticleDetail, SearchResultBase} from "./types";

type ResultArticleTarget = Pick<SearchResultBase, "id" | "country_code" | "article_id">;

export async function fetchArticleDetailForResult(
  target: ResultArticleTarget,
): Promise<ArticleDetail> {
  const response = await fetch(
    `/api/article?${new URLSearchParams({
      id: target.id,
      country_code: target.country_code,
      article_id: target.article_id,
    }).toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Article request failed with status ${response.status}`);
  }

  return (await response.json()) as ArticleDetail;
}
