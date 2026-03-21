import {NextResponse} from "next/server";
import {getNeonSql} from "@/lib/neon";
import type {SharedViewPayload} from "@/lib/types";

export async function GET(
  _request: Request,
  {params}: {params: Promise<{id: string}>},
) {
  const {id} = await params;

  try {
    const sql = getNeonSql();
    const rows = (await sql`
      SELECT
        id, title, observation, author_name,
        countries, query_text, query_semantic,
        filter_country, filter_cluster, focused_segment_id, camera, color_mode, locale,
        created_at
      FROM shared_views
      WHERE id = ${id}::uuid
    `) as SharedViewPayload[];

    if (!rows[0]) {
      return NextResponse.json({error: "Shared view not found."}, {status: 404});
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Share read route failed", error);
    return NextResponse.json(
      {error: "Failed to retrieve shared view."},
      {status: 500},
    );
  }
}
