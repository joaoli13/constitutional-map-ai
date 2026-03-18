import {readFile} from "node:fs/promises";
import path from "node:path";
import {setRequestLocale} from "next-intl/server";

import AtlasClient from "@/components/AtlasClient";
import type {AtlasIndexData, ClusterSummary} from "@/lib/types";

type LocalePageProps = Readonly<{
  params: Promise<{locale: string}>;
}>;

export default async function LocaleHome({params}: LocalePageProps) {
  const {locale} = await params;
  setRequestLocale(locale);
  const [atlasIndex, clusters] = await Promise.all([
    loadJson<AtlasIndexData>(path.join(process.cwd(), "public", "data", "index.json")),
    loadJson<ClusterSummary[]>(
      path.join(process.cwd(), "public", "data", "clusters.json"),
    ),
  ]);

  return <AtlasClient atlasIndex={atlasIndex} clusters={clusters} />;
}

async function loadJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf-8")) as T;
}
