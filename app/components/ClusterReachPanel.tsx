"use client";

import {useMemo, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {useLocale, useTranslations} from "next-intl";
import {ComposableMap, Geographies, Geography, ZoomableGroup} from "react-simple-maps";

import {CountryBadge, useCountryIndex} from "@/components/CountryBadge";
import {colorForCluster} from "@/lib/colors";
import {resolveCountryForGeography} from "@/lib/geo";
import {useAppStore} from "@/stores/appStore";
import type {ClusterSummary} from "@/lib/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type SortKey = "country_count" | "id" | "size";
type SortDir = "asc" | "desc";

type ClusterReachPanelProps = {
  clusters: ClusterSummary[];
};

export default function ClusterReachPanel({clusters}: ClusterReachPanelProps) {
  const t = useTranslations("Atlas.ClusterReach");
  const locale = useLocale();
  const [sortKey, setSortKey] = useState<SortKey>("country_count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [activeClusterId, setActiveClusterId] = useState<number | null>(null);

  const clearCountrySelection = useAppStore((s) => s.clearCountrySelection);
  const addCountries = useAppStore((s) => s.addCountries);
  const setColorMode = useAppStore((s) => s.setColorMode);
  const setFocusedClusterId = useAppStore((s) => s.setFocusedClusterId);

  function handleRowClick(cluster: ClusterSummary) {
    clearCountrySelection();
    addCountries(cluster.top_countries);
    setColorMode("cluster");
    setFocusedClusterId(cluster.id);
    setActiveClusterId(cluster.id);
  }

  function handleClearActive() {
    clearCountrySelection();
    setFocusedClusterId(null);
    setActiveClusterId(null);
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const top10 = useMemo(
    () => [...clusters].sort((a, b) => b.country_count - a.country_count).slice(0, 10),
    [clusters],
  );

  const sorted = useMemo(
    () =>
      [...top10].sort((a, b) => {
        const cmp = a[sortKey] - b[sortKey];
        return sortDir === "asc" ? cmp : -cmp;
      }),
    [top10, sortKey, sortDir],
  );

  const activeCluster = useMemo(
    () => (activeClusterId !== null ? top10.find((c) => c.id === activeClusterId) ?? null : null),
    [activeClusterId, top10],
  );

  function arrow(key: SortKey) {
    if (key !== sortKey) return <span className="ml-1 opacity-25">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/92 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          {t("eyebrow")}
        </p>
        <h2 className="mt-1.5 text-2xl font-semibold text-slate-950">{t("title")}</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{t("subtitle")}</p>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="w-[65%] overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-y-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left">
                  <th className="w-10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 text-center">
                    {t("colRank")}
                  </th>
                  <SortTh active={sortKey === "id"} right onClick={() => handleSort("id")} className="w-14">
                    {t("colClusterId")}{arrow("id")}
                  </SortTh>
                  <SortTh active={sortKey === "country_count"} right onClick={() => handleSort("country_count")} className="w-20">
                    {t("colCountryCount")}{arrow("country_count")}
                  </SortTh>
                  <SortTh active={sortKey === "size"} right onClick={() => handleSort("size")} className="w-20">
                    {t("colSize")}{arrow("size")}
                  </SortTh>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {t("colLabel")}
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      {t("colCountryBreakdown")}
                      <InfoTip text={t("colCountryBreakdownTooltip")} />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((cluster, index) => {
                  const isActive = cluster.id === activeClusterId;
                  return (
                    <tr
                      key={cluster.id}
                      className={`group cursor-pointer transition ${
                        isActive ? "bg-slate-950 text-white" : "bg-white hover:bg-slate-50"
                      }`}
                      onClick={() => handleRowClick(cluster)}
                    >
                      <td className="w-10 px-3 py-3 text-xs text-center">
                        {isActive ? (
                          <span className="text-emerald-400">✓</span>
                        ) : (
                          <>
                            <span className="tabular-nums text-slate-400 group-hover:hidden">{index + 1}</span>
                            <span className="hidden text-slate-400 group-hover:inline">⊕</span>
                          </>
                        )}
                      </td>
                      <td className={`w-14 px-3 py-3 text-right tabular-nums font-semibold ${isActive ? "text-white" : "text-slate-900"}`}>
                        {cluster.id}
                      </td>
                      <td className={`w-20 px-3 py-3 text-right tabular-nums font-semibold ${isActive ? "text-white" : "text-slate-900"}`}>
                        {cluster.country_count}
                      </td>
                      <td className={`w-20 px-3 py-3 text-right tabular-nums ${isActive ? "text-slate-300" : "text-slate-700"}`}>
                        {cluster.size}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                        {cluster.labels
                          ? (cluster.labels[locale] ?? cluster.labels["en"] ?? "—")
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {cluster.top_countries.map((code, i) => (
                            <span key={code} className="inline-flex items-center gap-1">
                              <CountryBadge countryCode={code} tone={isActive ? "emerald" : "slate"} />
                              <span className={`text-xs tabular-nums ${isActive ? "text-slate-400" : "text-slate-400"}`}>
                                {cluster.top_countries_counts[i]}
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex min-h-[32px] items-center justify-between border-t border-slate-100 px-3 py-2">
            {activeClusterId === null ? (
              <p className="text-[11px] text-slate-400">{t("footerIdle")}</p>
            ) : (
              <>
                <p className="text-[11px] text-slate-500">
                  {t("footerActive", {count: activeCluster?.top_countries.length ?? 0, id: activeClusterId})}
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleClearActive(); }}
                  className="ml-3 shrink-0 text-[11px] text-slate-400 transition hover:text-slate-700"
                >
                  · {t("footerClear")}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeCluster?.all_countries
            ? <ClusterDetail cluster={activeCluster} />
            : <ClusterDetailPlaceholder />}
        </div>
      </div>
    </section>
  );
}

function ClusterDetail({cluster}: {cluster: ClusterSummary}) {
  const t = useTranslations("Atlas.ClusterReach");
  const countryByCode = useCountryIndex();
  const highlightColor = colorForCluster(cluster.id);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 18]);

  const countriesList = useMemo(() => Object.values(countryByCode), [countryByCode]);
  const highlightSet = useMemo(
    () => new Set(cluster.all_countries ?? []),
    [cluster.all_countries],
  );

  function zoomBy(factor: number) {
    setZoom((z) => Math.min(Math.max(z * factor, 1), 8));
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {t("detailTitle", {id: cluster.id, count: cluster.country_count})}
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-500 hover:text-slate-900 disabled:opacity-40"
            onClick={() => zoomBy(1 / 1.5)}
            disabled={zoom <= 1}
          >
            −
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-500 hover:text-slate-900 disabled:opacity-40"
            onClick={() => zoomBy(1.5)}
            disabled={zoom >= 8}
          >
            +
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(180deg,_rgba(241,245,249,0.95),_rgba(226,232,240,0.92))]">
        <ComposableMap projection="geoEqualEarth" className="h-full w-full">
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={({coordinates, zoom: z}) => {
              setCenter(coordinates as [number, number]);
              setZoom(z);
            }}
          >
            <Geographies geography={GEO_URL}>
              {({geographies}) =>
                geographies.map((geo) => {
                  const name = typeof geo.properties.name === "string" ? geo.properties.name : "";
                  const country = resolveCountryForGeography(name, countriesList);
                  const isHighlighted = Boolean(country?.code && highlightSet.has(country.code));
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={undefined}
                      style={{
                        default: {
                          fill: isHighlighted ? highlightColor : "#e2e8f0",
                          stroke: "#ffffff",
                          strokeWidth: 0.5,
                          outline: "none",
                          cursor: "grab",
                        },
                        hover: {
                          fill: isHighlighted ? highlightColor : "#e2e8f0",
                          stroke: "#ffffff",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        pressed: {
                          fill: isHighlighted ? highlightColor : "#e2e8f0",
                          outline: "none",
                          cursor: "grabbing",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>
    </div>
  );
}

function ClusterDetailPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
      <svg className="mb-3 h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
      <p className="text-xs text-slate-400">Select a cluster to see its geographic reach</p>
    </div>
  );
}

function InfoTip({text}: {text: string}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<{x: number; y: number} | null>(null);

  function handleMouseEnter() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setCoords({x: r.left + r.width / 2, y: r.bottom + 8});
  }

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setCoords(null)}
        className="inline-flex h-3.5 w-3.5 cursor-default items-center justify-center rounded-full border border-slate-300 text-[9px] font-bold text-slate-400 transition hover:border-slate-500 hover:text-slate-600"
      >
        i
      </span>
      {coords &&
        createPortal(
          <div
            style={{position: "fixed", left: coords.x, top: coords.y, transform: "translateX(-50%)", zIndex: 9999}}
            className="pointer-events-none w-72 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-normal leading-relaxed text-slate-600 shadow-lg"
          >
            {text}
          </div>,
          document.body,
        )}
    </>
  );
}

function SortTh({
  children,
  active,
  right,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  active: boolean;
  right?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th
      className={`cursor-pointer select-none px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] transition hover:text-slate-800 ${
        right ? "text-right" : "text-left"
      } ${active ? "text-slate-800" : "text-slate-500"} ${className}`}
      onClick={onClick}
    >
      {children}
    </th>
  );
}
