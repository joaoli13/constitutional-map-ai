"use client";

import {useTranslations} from "next-intl";

import type {ArticleDetail, AtlasSelectionPoint} from "@/lib/types";

type DetailPanelProps = {
  selectedPoint: AtlasSelectionPoint | null;
  articleDetail: ArticleDetail | null;
  isLoading: boolean;
};

export default function DetailPanel({
  selectedPoint,
  articleDetail,
  isLoading,
}: DetailPanelProps) {
  const t = useTranslations("Atlas.Detail");

  if (!selectedPoint) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          {t("eyebrow")}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">{t("title")}</h2>
        <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-sm leading-7 text-slate-500">
          {t("empty")}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          {t("eyebrow")}
        </p>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
          {selectedPoint.country_code}
        </span>
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{t("title")}</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile label={t("country")} value={selectedPoint.country_name} />
        <InfoTile label={t("article")} value={selectedPoint.article_id} />
        <InfoTile label={t("cluster")} value={selectedPoint.global_cluster} />
        <InfoTile
          label={t("probability")}
          value={
            selectedPoint.cluster_probability === null
              ? "n/a"
              : `${(selectedPoint.cluster_probability * 100).toFixed(1)}%`
          }
        />
      </div>

      <div className="mt-5 rounded-[1.5rem] bg-[#f8f6f1] p-5">
        {isLoading ? (
          <p className="text-sm text-slate-500">{t("loading")}</p>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {articleDetail?.text ?? selectedPoint.text_snippet}
          </p>
        )}
      </div>
    </section>
  );
}

function InfoTile({label, value}: {label: string; value: number | string}) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
