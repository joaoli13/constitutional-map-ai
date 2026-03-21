import {readFile} from "node:fs/promises";
import path from "node:path";
import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";

import AtlasClient from "@/components/AtlasClient";
import {getNeonSql} from "@/lib/neon";
import type {AtlasIndexData, ClusterSummary, SharedViewPayload} from "@/lib/types";

type SharePageProps = Readonly<{
  params: Promise<{locale: string; id: string}>;
}>;

export default async function SharedViewPage({params}: SharePageProps) {
  const {locale, id} = await params;
  setRequestLocale(locale);

  const sql = getNeonSql();
  let view: SharedViewPayload | null = null;

  try {
    const rows = (await sql`
      SELECT
        id, title, observation, author_name,
        countries, query_text, query_semantic,
        filter_country, filter_cluster, camera, color_mode, locale,
        created_at
      FROM shared_views
      WHERE id = ${id}::uuid
    `) as SharedViewPayload[];
    view = rows[0] ?? null;
  } catch {
    // DB error — treat as not found
  }

  if (!view) {
    notFound();
  }

  const [atlasIndex, clusters] = await Promise.all([
    loadJson<AtlasIndexData>(path.join(process.cwd(), "public", "data", "index.json")),
    loadJson<ClusterSummary[]>(path.join(process.cwd(), "public", "data", "clusters.json")),
  ]);

  return (
    <AtlasClient atlasIndex={atlasIndex} clusters={clusters} initialSharedView={view} />
  );
}

async function loadJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf-8")) as T;
}
