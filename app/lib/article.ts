import {getNeonSql} from "./neon";
import type {ArticleDetail} from "./types";

export async function getArticleDetail(params: {
  id: string;
  countryCode?: string | null;
  articleId?: string | null;
}): Promise<ArticleDetail | null> {
  const sql = getNeonSql();
  const rows = (await sql.query(
    `SELECT id, country_code, country_name, article_id, text, text_snippet, global_cluster
     FROM articles
     WHERE id = $1
     LIMIT 1`,
    [params.id],
  )) as ArticleDetail[];

  if (rows[0]) {
    return rows[0];
  }

  if (!params.countryCode || !params.articleId) {
    return null;
  }

  const fallbackRows = (await sql.query(
    `SELECT id, country_code, country_name, article_id, text, text_snippet, global_cluster
     FROM articles
     WHERE country_code = $1
       AND article_id = $2
     ORDER BY year DESC
     LIMIT 1`,
    [params.countryCode, params.articleId],
  )) as ArticleDetail[];

  return fallbackRows[0] ?? null;
}
