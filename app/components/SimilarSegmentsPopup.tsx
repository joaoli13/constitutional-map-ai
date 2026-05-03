"use client";

import {useMemo} from "react";
import {useLocale, useTranslations} from "next-intl";

import {CountryBadge} from "@/components/CountryBadge";
import type {SimilarSegmentResult, SimilarSegmentsResponse} from "@/lib/types";

type SimilarSegmentsPopupProps = {
  response: SimilarSegmentsResponse | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onSelectResult: (result: SimilarSegmentResult) => void;
};

export default function SimilarSegmentsPopup({
  response,
  loading,
  error,
  onClose,
  onRetry,
  onSelectResult,
}: SimilarSegmentsPopupProps) {
  const locale = useLocale();
  const t = useTranslations("Atlas.Canvas");
  const graphNodes = useMemo(
    () => buildRelativeDistanceGraph(response?.results ?? []),
    [response],
  );

  if (!loading && !error && !response) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-3 pb-3 pt-16 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="similar-segments-title"
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">
              {t("similarEyebrow")}
            </p>
            <h2 id="similar-segments-title" className="mt-1 text-xl font-semibold text-slate-950">
              {t("similarModalTitle")}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              {t("similarModalSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("similarClose")}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
          >
            {t("similarClose")}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading && !response ? (
            <LoadingSimilarState label={t("similarLoading")} />
          ) : null}

          {error && !loading ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
              <p className="text-sm font-medium text-rose-800">{t("similarError")}</p>
              <p className="mt-1 text-sm leading-6 text-rose-700">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded-full border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-800 transition hover:border-rose-500"
              >
                {t("similarRetry")}
              </button>
            </div>
          ) : null}

          {response ? (
            <div className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t("similarSourceLabel")}
                  </span>
                  <CountryBadge
                    countryCode={response.source.country_code}
                    countryName={response.source.country_name}
                    tone="slate"
                    size="sm"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    {response.source.country_name}
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 font-mono text-[11px] text-slate-500">
                    {response.source.article_id}
                  </span>
                </div>
                <p className="mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap pr-1 text-sm leading-7 text-slate-700">
                  {response.source.text}
                </p>
              </section>

              {response.results.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  {t("similarEmpty")}
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <section className="min-w-0">
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">
                      {t("similarResultsLabel", {count: response.results.length})}
                    </h3>
                    <div className="space-y-3">
                      {response.results.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => onSelectResult(result)}
                          className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-teal-400 hover:bg-teal-50/40 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-semibold text-white">
                              {t("similarRank", {rank: result.rank})}
                            </span>
                            <CountryBadge
                              countryCode={result.country_code}
                              countryName={result.country_name}
                              tone="slate"
                              size="sm"
                            />
                            <span className="text-sm font-semibold text-slate-800">
                              {result.country_name}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {result.article_id}
                            </span>
                            <span className="ml-auto text-[11px] font-medium text-slate-500">
                              {t("similarScore", {
                                score: formatPercent(result.score, locale),
                              })}
                            </span>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                            {result.text}
                          </p>
                          <p className="mt-3 text-xs font-medium text-teal-700">
                            {t("similarOpenResult")}
                          </p>
                        </button>
                      ))}
                    </div>
                  </section>

                  <aside className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {t("similarChartTitle")}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {t("similarChartSubtitle")}
                    </p>
                    <RelativeDistanceGraph
                      nodes={graphNodes}
                      sourceLabel={response.source.country_code}
                      distanceLabel={(distance) => t("similarDistance", {distance})}
                    />
                  </aside>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LoadingSimilarState({label}: {label: string}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
      <svg
        viewBox="0 0 220 180"
        role="img"
        aria-label={label}
        className="h-36 w-full max-w-xs"
      >
        <circle cx="110" cy="90" r="28" fill="#0f766e" opacity="0.12" className="animate-ping" />
        <circle cx="110" cy="90" r="15" fill="#0f766e" />
        <g className="origin-center animate-spin" style={{transformOrigin: "110px 90px"}}>
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const angle = (index / 6) * Math.PI * 2;
            const x = 110 + Math.cos(angle) * 58;
            const y = 90 + Math.sin(angle) * 58;
            return (
              <g key={index}>
                <line x1="110" y1="90" x2={x} y2={y} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 4" />
                <circle
                  cx={x}
                  cy={y}
                  r={6}
                  fill={index % 2 === 0 ? "#14b8a6" : "#f59e0b"}
                  opacity="0.9"
                />
              </g>
            );
          })}
        </g>
      </svg>
      <p className="mt-3 font-medium text-slate-600">{label}</p>
    </div>
  );
}

function RelativeDistanceGraph({
  nodes,
  sourceLabel,
  distanceLabel,
}: {
  nodes: RelativeDistanceNode[];
  sourceLabel: string;
  distanceLabel: (distance: string) => string;
}) {
  return (
    <div className="mt-4">
      <svg
        viewBox="0 0 280 260"
        role="img"
        aria-label="Relative vector distance graph"
        className="h-auto w-full rounded-2xl bg-white"
      >
        <circle cx="140" cy="130" r="38" fill="none" stroke="#ccfbf1" strokeWidth="1.5" />
        <circle cx="140" cy="130" r="74" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="140" cy="130" r="110" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 6" />
        {nodes.map((node) => (
          <g key={`${node.id}-edge`}>
            <line
              x1="140"
              y1="130"
              x2={node.x}
              y2={node.y}
              stroke="#94a3b8"
              strokeWidth={node.edgeWidth}
              opacity={node.edgeOpacity}
            />
          </g>
        ))}
        <g>
          <circle cx="140" cy="130" r="17" fill="#0f766e" />
          <circle cx="140" cy="130" r="24" fill="none" stroke="#0f766e" strokeWidth="1.5" opacity="0.35" />
          <text x="140" y="134" textAnchor="middle" className="fill-white text-[11px] font-bold">
            {sourceLabel}
          </text>
        </g>
        {nodes.map((node) => (
          <g key={node.id}>
            <title>{`${node.rank}. ${node.countryCode} - ${distanceLabel(node.distance)}`}</title>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={node.fill}
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <text
              x={node.x}
              y={node.y + 3}
              textAnchor="middle"
              className="fill-white text-[9px] font-bold"
            >
              {node.rank}
            </text>
            <text
              x={node.labelX}
              y={node.labelY}
              textAnchor={node.textAnchor}
              className="fill-slate-600 text-[10px] font-semibold"
            >
              {node.countryCode}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-3 space-y-1.5">
        {nodes.map((node) => (
          <div key={`${node.id}-legend`} className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-600">
            <span>{node.rank}. {node.countryCode}</span>
            <span>{distanceLabel(node.distance)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type RelativeDistanceNode = {
  id: string;
  rank: number;
  countryCode: string;
  distance: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  textAnchor: "start" | "middle" | "end";
  radius: number;
  fill: string;
  edgeWidth: number;
  edgeOpacity: number;
};

function buildRelativeDistanceGraph(results: SimilarSegmentResult[]): RelativeDistanceNode[] {
  if (results.length === 0) {
    return [];
  }

  const distances = results.map((result) => result.distance);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);
  const range = maxDistance - minDistance;
  const palette = ["#0f766e", "#14b8a6", "#f59e0b", "#0e7490", "#6366f1"];

  return results.map((result) => {
    const relativeCloseness = range <= 0
      ? 1
      : 1 - ((result.distance - minDistance) / range);
    const distanceRatio = 1 - relativeCloseness;
    const angle = -Math.PI / 2 + ((result.rank - 1) / results.length) * Math.PI * 2;
    const radiusFromCenter = 44 + distanceRatio * 76;
    const x = 140 + Math.cos(angle) * radiusFromCenter;
    const y = 130 + Math.sin(angle) * radiusFromCenter;
    const labelOffset = 15;

    return {
      id: result.id,
      rank: result.rank,
      countryCode: result.country_code,
      distance: result.distance.toFixed(4),
      x,
      y,
      labelX: x + Math.cos(angle) * labelOffset,
      labelY: y + Math.sin(angle) * labelOffset + 3,
      textAnchor: Math.cos(angle) > 0.28
        ? "start"
        : Math.cos(angle) < -0.28
          ? "end"
          : "middle",
      radius: 8 + relativeCloseness * 4,
      fill: palette[(result.rank - 1) % palette.length],
      edgeWidth: 1 + relativeCloseness * 2,
      edgeOpacity: 0.22 + relativeCloseness * 0.44,
    };
  });
}

function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}
