import {
  SHARE_RATE_LIMIT,
  checkRateLimit,
  jsonWithRateLimit,
} from "@/lib/rateLimit";
import {getNeonSql} from "@/lib/neon";
import type {SharedViewPayload} from "@/lib/types";

const BASE_URL = "https://constitutionalmap.ai";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, SHARE_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return jsonWithRateLimit(
      {error: "Too many share requests. Please retry later."},
      rateLimit,
      {status: 429},
    );
  }

  try {
    const body = (await request.json()) as Partial<SharedViewPayload>;

    const title = (body.title ?? "").trim();
    const observation = (body.observation ?? "").trim();

    if (!title || title.length > 120) {
      return jsonWithRateLimit(
        {error: "Title must be between 1 and 120 characters."},
        rateLimit,
        {status: 422},
      );
    }
    if (!observation || observation.length > 1000) {
      return jsonWithRateLimit(
        {error: "Observation must be between 1 and 1000 characters."},
        rateLimit,
        {status: 422},
      );
    }

    const authorName =
      body.author_name ? body.author_name.trim().slice(0, 80) : null;
    const camera = body.camera ? JSON.stringify(body.camera) : null;

    const sql = getNeonSql();
    const rows = (await sql`
      INSERT INTO shared_views (
        title, observation, author_name,
        countries, query_text, query_semantic,
        filter_country, filter_cluster, focused_segment_id, camera, color_mode, locale
      ) VALUES (
        ${title}, ${observation}, ${authorName},
        ${body.countries ?? null}, ${body.query_text ?? null}, ${body.query_semantic ?? null},
        ${body.filter_country ?? null}, ${body.filter_cluster ?? null},
        ${body.focused_segment_id ?? null},
        ${camera}::jsonb, ${body.color_mode ?? null}, ${body.locale ?? "en"}
      )
      RETURNING id
    `) as {id: string}[];

    const id = rows[0].id;
    return jsonWithRateLimit(
      {id, url: `${BASE_URL}/share/${id}`},
      rateLimit,
      {status: 201},
    );
  } catch (error) {
    console.error("Share create route failed", error);
    return jsonWithRateLimit(
      {error: "Failed to create shared view."},
      rateLimit,
      {status: 500},
    );
  }
}
