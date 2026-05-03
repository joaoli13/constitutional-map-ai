import {getNeonSql} from "./neon.ts";
import type {
  SimilarSegmentResult,
  SimilarSegmentSource,
  SimilarSegmentsResponse,
} from "./types";

export const MAX_SIMILAR_SEGMENTS = 10;

type SimilarSegmentScope = SimilarSegmentsResponse["scope"];

type SimilarSegmentSourceRow = Omit<
  SimilarSegmentSource,
  "global_cluster" | "x" | "y" | "z"
> & {
  global_cluster: number | string;
  x: number | string;
  y: number | string;
  z: number | string;
  has_embedding: boolean | string | number;
};

type SimilarSegmentResultRow = Omit<
  SimilarSegmentResult,
  "global_cluster" | "x" | "y" | "z" | "rank" | "score" | "distance"
> & {
  global_cluster: number | string;
  x: number | string;
  y: number | string;
  z: number | string;
  score: number | string;
  distance: number | string;
};

export class SimilarSegmentError extends Error {
  status: 400 | 404;

  constructor(status: 400 | 404, message: string) {
    super(message);
    this.name = "SimilarSegmentError";
    this.status = status;
  }
}

export async function findSimilarSegments(params: {
  id: string;
  countries: string[] | null;
  limit?: number;
}): Promise<SimilarSegmentsResponse> {
  const id = params.id.trim();
  if (!id) {
    throw new SimilarSegmentError(400, "Missing required query parameter: id");
  }

  const limit = clampResultLimit(params.limit ?? MAX_SIMILAR_SEGMENTS);
  const sql = getNeonSql();
  const sourceRows = (await sql.query(
    `SELECT id, country_code, country_name, article_id, text, text_snippet,
            global_cluster, x, y, z, embedding IS NOT NULL AS has_embedding
     FROM articles
     WHERE id = $1
     LIMIT 1`,
    [id],
  )) as SimilarSegmentSourceRow[];

  const sourceRow = sourceRows[0];
  if (!sourceRow) {
    throw new SimilarSegmentError(404, "Segment not found.");
  }
  if (!coerceBoolean(sourceRow.has_embedding)) {
    throw new SimilarSegmentError(400, "Selected segment does not have an embedding.");
  }

  const source = coerceSimilarSegmentSource(sourceRow);
  const scope = deriveSimilarSegmentCandidateCountries(
    params.countries,
    source.country_code,
  );
  const queryParams: (string | number)[] = [source.id];
  let countryClause = "";
  if (scope.countries && scope.countries.length > 0) {
    queryParams.push(`{${scope.countries.join(",")}}`);
    countryClause = `AND a.country_code = ANY($${queryParams.length}::text[])`;
  }

  queryParams.push(limit);
  const rows = (await sql.query(
    `WITH source AS (
       SELECT id, country_code, embedding
       FROM articles
       WHERE id = $1
         AND embedding IS NOT NULL
       LIMIT 1
     ),
     candidate_distances AS (
       SELECT a.id, a.country_code, a.country_name, a.article_id, a.text,
              a.text_snippet, a.global_cluster, a.x, a.y, a.z,
              (a.embedding <=> source.embedding) AS distance
       FROM articles a
       CROSS JOIN source
       WHERE a.embedding IS NOT NULL
         AND a.id <> source.id
         AND a.country_code <> source.country_code
         ${countryClause}
     ),
     ranked AS (
       SELECT *,
              (1 / (1 + distance)) AS score,
              row_number() OVER (
                PARTITION BY country_code
                ORDER BY distance ASC, id ASC
              ) AS country_rank
       FROM candidate_distances
     )
     SELECT id, country_code, country_name, article_id, text, text_snippet,
            global_cluster, x, y, z, score, distance
     FROM ranked
     WHERE country_rank = 1
     ORDER BY distance ASC, id ASC
     LIMIT $${queryParams.length}`,
    queryParams,
  )) as SimilarSegmentResultRow[];

  return {
    source,
    scope,
    results: shapeDistinctCountrySimilarResults(rows, limit),
  };
}

export function parseSimilarSegmentCountries(raw: string | null): string[] | null {
  if (!raw) {
    return null;
  }

  const countries = normalizeCountryCodes(raw.split(","));
  return countries.length > 0 ? countries : null;
}

export function deriveSimilarSegmentCandidateCountries(
  selectedCountries: string[] | null,
  sourceCountryCode: string,
): SimilarSegmentScope {
  const normalized = normalizeCountryCodes(selectedCountries ?? []);

  if (normalized.length <= 2) {
    return {mode: "full_corpus", countries: null};
  }

  return {
    mode: "selected_countries",
    countries: normalized.filter((countryCode) => countryCode !== sourceCountryCode.toUpperCase()),
  };
}

export function shapeDistinctCountrySimilarResults(
  rows: SimilarSegmentResultRow[],
  limit: number = MAX_SIMILAR_SEGMENTS,
): SimilarSegmentResult[] {
  const seenCountries = new Set<string>();
  const results: SimilarSegmentResult[] = [];

  for (const row of rows) {
    const countryCode = row.country_code.toUpperCase();
    if (seenCountries.has(countryCode)) {
      continue;
    }

    seenCountries.add(countryCode);
    results.push({
      ...coerceSimilarSegmentResult(row),
      rank: results.length + 1,
    });

    if (results.length >= limit) {
      break;
    }
  }

  return results;
}

function normalizeCountryCodes(countryCodes: string[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const rawCode of countryCodes) {
    const code = rawCode.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code) || seen.has(code)) {
      continue;
    }

    seen.add(code);
    normalized.push(code);
  }

  return normalized;
}

function coerceSimilarSegmentSource(row: SimilarSegmentSourceRow): SimilarSegmentSource {
  return {
    id: row.id,
    country_code: row.country_code,
    country_name: row.country_name,
    article_id: row.article_id,
    text: row.text,
    text_snippet: row.text_snippet,
    global_cluster: Number(row.global_cluster),
    x: Number(row.x),
    y: Number(row.y),
    z: Number(row.z),
  };
}

function coerceSimilarSegmentResult(row: SimilarSegmentResultRow): SimilarSegmentResult {
  return {
    id: row.id,
    country_code: row.country_code,
    country_name: row.country_name,
    article_id: row.article_id,
    text: row.text,
    text_snippet: row.text_snippet,
    global_cluster: Number(row.global_cluster),
    x: Number(row.x),
    y: Number(row.y),
    z: Number(row.z),
    score: Number(row.score),
    distance: Number(row.distance),
    rank: 0,
  };
}

function coerceBoolean(value: boolean | string | number): boolean {
  return value === true || value === 1 || value === "true" || value === "t";
}

function clampResultLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return MAX_SIMILAR_SEGMENTS;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_SIMILAR_SEGMENTS);
}
