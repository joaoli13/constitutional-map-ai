"use client";

import dynamic from "next/dynamic";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useTranslations} from "next-intl";

import {useFullscreen} from "@/hooks/useFullscreen";
import {colorForCluster} from "@/lib/colors";
import type {ArticleDetail, AtlasSelectionPoint, ColorMode} from "@/lib/types";

// Use the factory pattern so we control which Plotly bundle is loaded.
// react-plotly.js's default import requires "plotly.js/dist/plotly" (not installed);
// the factory lets us substitute plotly.js-dist-min instead.
const Plot = dynamic(
  () =>
    Promise.all([
      import("react-plotly.js/factory"),
      import("plotly.js-dist-min"),
    ]).then(([{default: createPlotlyComponent}, Plotly]) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: createPlotlyComponent(Plotly as any),
    })),
  {ssr: false},
);

type Canvas3DProps = {
  points: AtlasSelectionPoint[];
  searchHighlightedPoints: AtlasSelectionPoint[];
  selectedCountries: string[];
  selectedPoint: AtlasSelectionPoint | null;
  countryColors: Record<string, string>;
  colorMode: ColorMode;
  articleDetail: ArticleDetail | null;
  isArticleLoading: boolean;
  onSelectPoint: (point: AtlasSelectionPoint) => void;
  onSetColorMode: (mode: ColorMode) => void;
};

const INITIAL_CAMERA = {
  eye: {x: 1.6, y: 1.6, z: 1.0},
  center: {x: 0, y: 0, z: 0},
  up: {x: 0, y: 1, z: 0},
};

const AXIS_STYLE = {
  showgrid: false,
  showticklabels: false,
  zeroline: false,
  showspikes: false,
  showline: false,
  showbackground: false,
} as const;

export default function Canvas3D({
  points,
  searchHighlightedPoints,
  selectedCountries,
  selectedPoint,
  countryColors,
  colorMode,
  articleDetail,
  isArticleLoading,
  onSelectPoint,
  onSetColorMode,
}: Canvas3DProps) {
  const t = useTranslations("Atlas.Canvas");
  const {ref, isFullscreen, toggleFullscreen} = useFullscreen<HTMLElement>();
  const graphDivRef = useRef<HTMLElement | null>(null);
  const plotlyRef = useRef<typeof import("plotly.js-dist-min") | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<AtlasSelectionPoint | null>(null);
  // uirevision: stable string preserves camera on data updates;
  // changes on "Fit all" to trigger camera reset.
  const [uirevision, setUirevision] = useState<string>("stable");

  // Load Plotly once for imperative camera calls (relayout).
  useEffect(() => {
    import("plotly.js-dist-min").then((mod) => {
      plotlyRef.current = mod;
    });
  }, []);

  useEffect(() => {
    if (!graphDivRef.current || !plotlyRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (plotlyRef.current?.Plots.resize as any)?.(graphDivRef.current);
    }, 80);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isFullscreen]);

  const visibleCount = useMemo(() => {
    const selectedSet = new Set(selectedCountries);
    const renderedIds = new Set(
      (selectedCountries.length > 0
        ? points.filter((point) => selectedSet.has(point.country_code))
        : points
      ).map((point) => point.id),
    );

    for (const point of searchHighlightedPoints) {
      renderedIds.add(point.id);
    }

    return renderedIds.size;
  }, [points, searchHighlightedPoints, selectedCountries]);

  function resolveColor(point: AtlasSelectionPoint): string {
    if (colorMode === "cluster") return colorForCluster(point.global_cluster);
    return countryColors[point.country_code] ?? "#64748b";
  }

  // Build Plotly traces: ghost layer (unselected) + selected layer.
  const traces = useMemo(() => {
    const selectedSet = new Set(selectedCountries);
    const hasSelection = selectedCountries.length > 0;
    const searchHighlightIds = new Set(searchHighlightedPoints.map((point) => point.id));

    const ghostPoints = hasSelection
      ? points.filter((p) => !selectedSet.has(p.country_code))
      : [];
    const activePoints = hasSelection
      ? points.filter((p) => selectedSet.has(p.country_code))
      : points;
    const activeBackgroundPoints =
      searchHighlightIds.size > 0
        ? activePoints.filter((point) => !searchHighlightIds.has(point.id))
        : activePoints;

    function makeTrace(
      pts: AtlasSelectionPoint[],
      opacity: number,
    ): Partial<Plotly.ScatterData> {
      return {
        type: "scatter3d",
        mode: "markers",
        x: pts.map((p) => p.x),
        y: pts.map((p) => p.y),
        z: pts.map((p) => p.z),
        customdata: pts as unknown as Plotly.Datum[],
        text: pts.map((p) => `<b>${p.country_name}</b> · ${p.article_id}`),
        hovertemplate: "%{text}<extra></extra>",
        marker: {
          size: pts.map((p) => 2.5 + (p.cluster_probability ?? 0) * 4),
          color: pts.map((p) => resolveColor(p)),
          opacity,
          line: {width: 0, color: "transparent"},
        },
        showlegend: false,
      } as Partial<Plotly.ScatterData>;
    }

    const searchHighlightTrace =
      searchHighlightedPoints.length > 0
        ? ({
            type: "scatter3d",
            mode: "markers",
            x: searchHighlightedPoints.map((point) => point.x),
            y: searchHighlightedPoints.map((point) => point.y),
            z: searchHighlightedPoints.map((point) => point.z),
            customdata: searchHighlightedPoints as unknown as Plotly.Datum[],
            text: searchHighlightedPoints.map(
              (point) => `<b>${point.country_name}</b> · ${point.article_id}`,
            ),
            hovertemplate: "%{text}<extra></extra>",
            marker: {
              size: searchHighlightedPoints.map((point) => {
                const baseSize = 2.5 + (point.cluster_probability ?? 0) * 4;
                return Math.max(baseSize * 2.2, 9);
              }),
              color: "#facc15",
              opacity: 1,
              line: {
                width: 3.5,
                color: "#111827",
              },
            },
            showlegend: false,
          } as Partial<Plotly.ScatterData>)
        : null;

    const highlightTrace = selectedPoint
      ? ({
          type: "scatter3d",
          mode: "markers",
          x: [selectedPoint.x],
          y: [selectedPoint.y],
          z: [selectedPoint.z],
          hoverinfo: "skip",
          marker: {
            size: (2.5 + (selectedPoint.cluster_probability ?? 0) * 4) * 2.25,
            color: resolveColor(selectedPoint),
            opacity: 0.12,
            line: {
              width: 1.4,
              color: "rgba(255, 248, 214, 0.45)",
            },
          },
          showlegend: false,
        } as Partial<Plotly.ScatterData>)
      : null;

    return [
      makeTrace(ghostPoints, 0.12),
      makeTrace(activeBackgroundPoints, searchHighlightIds.size > 0 ? 0.4 : 0.88),
      ...(searchHighlightTrace ? [searchHighlightTrace] : []),
      ...(highlightTrace ? [highlightTrace] : []),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, searchHighlightedPoints, selectedCountries, colorMode, countryColors, selectedPoint]);

  const layout = useMemo(
    () =>
      ({
        uirevision,
        margin: {l: 0, r: 0, t: 0, b: 0},
        paper_bgcolor: "transparent",
        scene: {
          bgcolor: "rgba(237,244,239,0)",
          xaxis: AXIS_STYLE,
          yaxis: AXIS_STYLE,
          zaxis: AXIS_STYLE,
          aspectmode: "cube",
        },
        showlegend: false,
      }) as Partial<Plotly.Layout>,
    [uirevision],
  );

  const config = useMemo(
    () =>
      ({
        displayModeBar: false,
        responsive: true,
      }) as Partial<Plotly.Config>,
    [],
  );

  const handleClick = useCallback(
    (data: Plotly.PlotMouseEvent) => {
      const pt = data.points[0];
      if (pt?.customdata) onSelectPoint(pt.customdata as unknown as AtlasSelectionPoint);
    },
    [onSelectPoint],
  );

  const handleHover = useCallback((data: Plotly.PlotHoverEvent) => {
    const pt = data.points[0];
    if (pt?.customdata) setHoveredPoint(pt.customdata as unknown as AtlasSelectionPoint);
  }, []);

  const handleUnhover = useCallback(() => setHoveredPoint(null), []);

  function handleResetView() {
    if (graphDivRef.current && plotlyRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (plotlyRef.current.relayout as any)(graphDivRef.current, {
        "scene.camera": INITIAL_CAMERA,
      });
    }
    setUirevision(`reset-${Date.now()}`);
  }

  function handleFocusSelection() {
    if (!selectedPoint || !graphDivRef.current || !plotlyRef.current) return;
    const {x, y, z} = selectedPoint;
    const dist = 4;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (plotlyRef.current.relayout as any)(graphDivRef.current, {
      "scene.camera": {
        eye: {x: x + dist, y: y + dist, z: z + dist * 0.6},
        center: {x, y, z},
        up: {x: 0, y: 1, z: 0},
      },
    });
  }

  return (
    <section
      ref={ref}
      className={`rounded-[2rem] border border-[#d8ddd7] bg-[linear-gradient(180deg,_#fbf7ef,_#eef4f1)] p-4 shadow-[0_28px_90px_rgba(15,23,42,0.14)] ${
        isFullscreen ? "flex h-full flex-col rounded-none border-0 p-5 shadow-none" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-2 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
            {t("eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{t("title")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {t("body", {loaded: points.length, visible: visibleCount})}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`rounded-full px-3 py-2 text-sm font-medium transition ${
              colorMode === "country"
                ? "bg-slate-950 text-white"
                : "border border-slate-300 bg-white/80 text-slate-700 hover:border-slate-500"
            }`}
            type="button"
            onClick={() => onSetColorMode("country")}
          >
            {t("colorByCountry")}
          </button>
          <button
            className={`rounded-full px-3 py-2 text-sm font-medium transition ${
              colorMode === "cluster"
                ? "bg-slate-950 text-white"
                : "border border-slate-300 bg-white/80 text-slate-700 hover:border-slate-500"
            }`}
            type="button"
            onClick={() => onSetColorMode("cluster")}
          >
            {t("colorByCluster")}
          </button>
          <button
            className="rounded-full border border-slate-300 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500"
            type="button"
            onClick={handleResetView}
          >
            {t("resetView")}
          </button>
          <button
            className="rounded-full border border-slate-300 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 disabled:opacity-40"
            type="button"
            onClick={handleFocusSelection}
            disabled={!selectedPoint}
          >
            {t("focusSelection")}
          </button>
          <button
            className="rounded-full border border-slate-300 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500"
            type="button"
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
          </button>
        </div>
      </div>

      <div className={`grid gap-4 xl:grid-cols-[1fr_360px] ${isFullscreen ? "min-h-0 flex-1" : ""}`}>
        {/* 3D plot */}
        <div
          className={`relative overflow-hidden rounded-[1.5rem] border border-[#d9e0d8] bg-[radial-gradient(circle_at_top,_rgba(248,252,247,1),_rgba(233,241,237,1)_42%,_rgba(220,231,228,1))] ${
            isFullscreen ? "h-[56vh] xl:h-full" : "h-[540px]"
          }`}
        >
          {points.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-7 text-slate-500">
              {t("empty")}
            </div>
          ) : (
            <Plot
              data={traces as Plotly.Data[]}
              layout={layout}
              config={config}
              style={{width: "100%", height: "100%"}}
              onInitialized={(_, gd) => {
                graphDivRef.current = gd;
              }}
              onUpdate={(_, gd) => {
                graphDivRef.current = gd;
              }}
              onClick={handleClick}
              onHover={handleHover}
              onUnhover={handleUnhover}
            />
          )}

          {hoveredPoint && (
            <div className="pointer-events-none absolute bottom-4 left-4 max-w-sm rounded-[1.25rem] border border-white/70 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="font-semibold">
                {hoveredPoint.country_name} · {hoveredPoint.article_id}
              </p>
              <p className="mt-1 text-slate-600">{hoveredPoint.text_snippet}</p>
            </div>
          )}
        </div>

        {/* Article detail sidebar */}
        <div
          className={`flex flex-col overflow-hidden rounded-[1.5rem] border border-[#d9e0d8] bg-white/80 ${
            isFullscreen ? "h-[34vh] xl:h-full" : "h-[540px]"
          }`}
        >
          {!selectedPoint ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-7 text-slate-500">
              {t("detailEmpty")}
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">
                    {selectedPoint.country_code}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {selectedPoint.country_name}
                  </span>
                </div>
                <p className="mt-2 text-xs font-mono text-slate-500">{selectedPoint.article_id}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{t("detailCluster")}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{selectedPoint.global_cluster}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{t("detailProbability")}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {selectedPoint.cluster_probability === null
                        ? "n/a"
                        : `${(selectedPoint.cluster_probability * 100).toFixed(1)}%`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {isArticleLoading ? (
                  <p className="text-sm text-slate-400">{t("detailLoading")}</p>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {articleDetail?.text ?? selectedPoint.text_snippet}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
