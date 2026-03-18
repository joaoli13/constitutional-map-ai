"use client";

import {useTranslations} from "next-intl";

import type {CountryIndexRecord} from "@/lib/types";

type StatsPanelProps = {
  countries: CountryIndexRecord[];
};

export default function StatsPanel({countries}: StatsPanelProps) {
  const t = useTranslations("Atlas.Stats");

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/92 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {t("eyebrow")}
          </p>
          <h2 className="mt-1.5 text-2xl font-semibold text-slate-950">{t("title")}</h2>
        </div>
        {countries.length > 0 && (
          <span className="flex-shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {countries.length}
          </span>
        )}
      </div>

      {countries.length === 0 ? (
        <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {t("colCountry")}
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {t("colRegion")}
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {t("articleCount")}
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {t("clusterCount")}
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {t("coverage")}
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {t("entropy")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {countries.map((country) => (
                  <tr key={country.code} className="bg-white transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{country.name}</p>
                      <p className="text-xs text-slate-400">{country.code}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{country.sub_region}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {country.article_count}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {country.cluster_count}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {(country.semantic_coverage * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {country.semantic_entropy.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
