import {embedSemanticQuery} from "./gemini";
import {getNeonSql} from "./neon";
import {SEMANTIC_SCORE_DROP_THRESHOLD} from "./search-config";
import type {SemanticSearchResponse, SemanticSearchResult} from "./types";

type SemanticSearchResultRow = Omit<SemanticSearchResult, "global_cluster" | "x" | "y" | "z" | "score"> & {
  global_cluster: number | string;
  x: number | string;
  y: number | string;
  z: number | string;
  score: number | string;
};

type CountRow = {
  count: string;
};

export async function semanticSearchArticles(params: {
  query: string;
  countries: string[] | null;
  cluster: number | null;
  limit: number;
}) : Promise<SemanticSearchResponse> {
  const sql = getNeonSql();
  const embedding = await embedSemanticQuery(params.query);
  const vectorLiteral = toVectorLiteral(embedding);

  const queryParams: (string | number)[] = [vectorLiteral];

  let countryClause = "";
  if (params.countries && params.countries.length > 0) {
    queryParams.push(`{${params.countries.join(",")}}`);
    countryClause = `AND country_code = ANY($${queryParams.length}::text[])`;
  }

  let clusterClause = "";
  if (params.cluster !== null) {
    queryParams.push(params.cluster);
    clusterClause = `AND global_cluster = $${queryParams.length}`;
  }

  const selectParams = [...queryParams, params.limit];
  const rows = (await sql.query(
    `SELECT id, country_code, country_name, article_id, text_snippet,
            global_cluster, x, y, z,
            (-1 * (embedding <#> $1::vector)) AS score
     FROM articles
     WHERE embedding IS NOT NULL
       ${countryClause}
       ${clusterClause}
     ORDER BY embedding <#> $1::vector ASC, year DESC
     LIMIT $${selectParams.length}`,
    selectParams,
  )) as SemanticSearchResultRow[];

  const countParams: (string | number)[] = [];
  let countCountryClause = "";
  if (params.countries && params.countries.length > 0) {
    countParams.push(`{${params.countries.join(",")}}`);
    countCountryClause = `AND country_code = ANY($${countParams.length}::text[])`;
  }
  let countClusterClause = "";
  if (params.cluster !== null) {
    countParams.push(params.cluster);
    countClusterClause = `AND global_cluster = $${countParams.length}`;
  }

  const countRows = (await sql.query(
    `SELECT COUNT(*)::text AS count
     FROM articles
     WHERE embedding IS NOT NULL
       ${countCountryClause}
       ${countClusterClause}`,
    countParams,
  )) as CountRow[];

  const results = rows.map((row) => ({
    ...row,
    global_cluster: Number(row.global_cluster),
    x: Number(row.x),
    y: Number(row.y),
    z: Number(row.z),
    score: Number(row.score),
  }));

  const bestScore = results[0]?.score ?? 0;
  const minScore = bestScore * (1 - SEMANTIC_SCORE_DROP_THRESHOLD);
  const filtered = results.filter((r) => r.score >= minScore);

  return {
    query: params.query,
    total: Number.parseInt(countRows[0]?.count ?? "0", 10),
    results: filtered,
  };
}

function toVectorLiteral(embedding: number[]) {
  return `[${embedding.map((value) => Number(value).toString()).join(",")}]`;
}
