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

export async function searchArticles(params: {
  query: string;
  countries: string[] | null;
  cluster: number | null;
  limit: number;
}): Promise<SearchResponse> {
  const sql = getNeonSql();

  // Build WHERE conditions dynamically to avoid Neon HTTP driver issues
  // with null array parameters in ANY($n) expressions.
  const queryParams: (string | number)[] = [params.query];

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

  const selectParams = [...queryParams, params.limit];
  const rows = (await sql.query(
    `SELECT id, country_code, country_name, article_id, text_snippet,
            global_cluster, x, y, z,
            ts_rank(to_tsvector('english', text), query) AS rank
     FROM articles, plainto_tsquery('english', $1) query
     WHERE to_tsvector('english', text) @@ query
       ${countryClause}
       ${clusterClause}
     ORDER BY rank DESC
     LIMIT $${selectParams.length}`,
    selectParams,
  )) as SearchResultRow[];

  const countRows = (await sql.query(
    `SELECT COUNT(*)::text AS count
     FROM articles, plainto_tsquery('english', $1) query
     WHERE to_tsvector('english', text) @@ query
       ${countryClause}
       ${clusterClause}`,
    queryParams,
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
