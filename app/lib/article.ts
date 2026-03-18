import {getNeonSql} from "./neon";
import type {ArticleDetail} from "./types";

export async function getArticleDetail(id: string): Promise<ArticleDetail | null> {
  const sql = getNeonSql();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (await sql.query(
    `SELECT id, country_code, country_name, article_id, text, text_snippet, global_cluster
     FROM articles
     WHERE id = $1
     LIMIT 1`,
    [id],
  )) as any as ArticleDetail[];

  return rows[0] ?? null;
}
