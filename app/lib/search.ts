import {getNeonSql} from "./neon";
import type {SearchResponse, SearchResult} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type SearchResultRow = Omit<SearchResult, "global_cluster" | "x" | "y" | "z" | "rank"> & {
  global_cluster: number | string;
  x: number | string;
  y: number | string;
  z: number | string;
  rank: number | string;
};

type CountRow = {
  count: string;
};

function detectQueryMode(input: string): "advanced" | "simple" {
  const hasParens = /[()]/.test(input);
  const hasBooleanOps = /\b(AND|OR)\b/i.test(input);
  return hasParens && hasBooleanOps ? "advanced" : "simple";
}

function toTsqueryExpression(input: string): string {
  return input
    .replace(/\bAND\b/gi, "&")
    .replace(/\bOR\b/gi, "|")
    .replace(/"([^"]+)"/g, (_, phrase: string) =>
      phrase.trim().split(/\s+/).join(" <-> "),
    )
    .replace(/(\w+)\*/g, "$1:*");
}

export async function searchArticles(params: {
  query: string;
  countries: string[] | null;
  cluster: number | null;
  limit: number;
}): Promise<SearchResponse> {
  const sql = getNeonSql();

  const mode = detectQueryMode(params.query);
  const broadExpr = mode === "advanced" ? toTsqueryExpression(params.query) : params.query;
  const broadFn = mode === "advanced" ? "to_tsquery" : "websearch_to_tsquery";

  // Build WHERE conditions dynamically to avoid Neon HTTP driver issues
  // with null array parameters in ANY($n) expressions.
  // $1 = original query (for phraseto_tsquery and fallback)
  // $2 = broad expression (may equal $1 in simple mode)
  const queryParams: (string | number)[] = [params.query, broadExpr];

  let countryClause = "";
  if (params.countries && params.countries.length > 0) {
    // Pass as PostgreSQL array literal string — reliably handled by Neon HTTP driver.
    queryParams.push(`{${params.countries.join(",")}}`);
    countryClause = `AND country_code = ANY($${queryParams.length}::text[])`;
  }

  let clusterClause = "";
  if (params.cluster !== null) {
    queryParams.push(params.cluster);
    clusterClause = `AND global_cluster = $${queryParams.length}`;
  }

  // Track whether we fell back to simple mode so COUNT uses the same tsquery function.
  let resolvedBroadFn = broadFn;
  let resolvedBroadExpr = broadExpr;

  let rows: SearchResultRow[];
  try {
    const selectParams = [...queryParams, params.limit];
    rows = (await sql.query(
      `WITH q AS (
         SELECT
           phraseto_tsquery('english', $1::text)    AS phrase_q,
           ${broadFn}('english', $2::text)          AS broad_q
       )
       SELECT id, country_code, country_name, article_id, text_snippet,
              global_cluster, x, y, z,
              (
                4 * ts_rank_cd(search_tsv, q.phrase_q) +
                1 * ts_rank_cd(search_tsv, q.broad_q)
              ) AS rank
       FROM articles, q
       WHERE search_tsv @@ q.broad_q
         ${countryClause}
         ${clusterClause}
       ORDER BY rank DESC, year DESC
       LIMIT $${selectParams.length}`,
      selectParams,
    )) as SearchResultRow[];
  } catch (err) {
    // to_tsquery raised on malformed advanced input — fall back to simple mode
    console.warn("[search] advanced query failed, falling back to websearch_to_tsquery:", params.query, err);
    resolvedBroadFn = "websearch_to_tsquery";
    resolvedBroadExpr = params.query;
    const fallbackParams = [...queryParams.slice(0, 1), params.query, ...queryParams.slice(2), params.limit] as (string | number)[];
    rows = (await sql.query(
      `WITH q AS (
         SELECT
           phraseto_tsquery('english', $1::text)        AS phrase_q,
           websearch_to_tsquery('english', $2::text)    AS broad_q
       )
       SELECT id, country_code, country_name, article_id, text_snippet,
              global_cluster, x, y, z,
              (
                4 * ts_rank_cd(search_tsv, q.phrase_q) +
                1 * ts_rank_cd(search_tsv, q.broad_q)
              ) AS rank
       FROM articles, q
       WHERE search_tsv @@ q.broad_q
         ${countryClause}
         ${clusterClause}
       ORDER BY rank DESC, year DESC
       LIMIT $${fallbackParams.length}`,
      fallbackParams,
    )) as SearchResultRow[];
  }

  // COUNT uses $1 = resolvedBroadExpr only — no unused params.
  const countParams: (string | number)[] = [resolvedBroadExpr];
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
    `WITH q AS (SELECT ${resolvedBroadFn}('english', $1::text) AS broad_q)
     SELECT COUNT(*)::text AS count
     FROM articles, q
     WHERE search_tsv @@ q.broad_q
       ${countCountryClause}
       ${countClusterClause}`,
    countParams,
  )) as CountRow[];

  return {
    query: params.query,
    total: Number.parseInt(countRows[0]?.count ?? "0", 10),
    results: rows.map((row) => ({
      ...row,
      global_cluster: Number(row.global_cluster),
      x: Number(row.x),
      y: Number(row.y),
      z: Number(row.z),
      rank: Number(row.rank),
    })),
  };
}

export function parseSearchParams(url: URL) {
  const query = url.searchParams.get("q")?.trim() ?? "";
  const singleCountry = url.searchParams.get("country")?.trim().toUpperCase() || null;
  const multipleCountries = (url.searchParams.get("countries") ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
  const countries = Array.from(
    new Set(singleCountry ? [singleCountry, ...multipleCountries] : multipleCountries),
  );
  const clusterParam = url.searchParams.get("cluster");
  const cluster =
    clusterParam === null || clusterParam === ""
      ? null
      : Number.parseInt(clusterParam, 10);
  const limit = clampLimit(url.searchParams.get("limit"));

  return {
    query,
    countries: countries.length > 0 ? countries : null,
    clusterParam,
    cluster,
    limit,
  };
}

function clampLimit(rawValue: string | null): number {
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : DEFAULT_LIMIT;
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, MAX_LIMIT);
}
