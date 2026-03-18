"use client";

import dynamic from "next/dynamic";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useTranslations} from "next-intl";

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
  selectedCountries: string[];
  selectedPoint: AtlasSelectionPoint | null;
  focusTarget: [number, number, number] | null;
  countryColors: Record<string, string>;
  colorMode: ColorMode;
  articleDetail: ArticleDetail | null;
  isArticleLoading: boolean;
  onSelectPoint: (point: AtlasSelectionPoint) => void;
  onSetColorMode: (mode: ColorMode) => void;
  onRequestFocus: (point: AtlasSelectionPoint) => void;
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
  selectedCountries,
  selectedPoint,
  focusTarget,
  countryColors,
  colorMode,
  articleDetail,
  isArticleLoading,
  onSelectPoint,
  onSetColorMode,
  onRequestFocus,
}: Canvas3DProps) {
  const t = useTranslations("Atlas.Canvas");
  const graphDivRef = useRef<HTMLElement | null>(null);
  const plotlyRef = useRef<typeof import("plotly.js-dist-min") | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<AtlasSelectionPoint | null>(null);
  const [highlightPulse, setHighlightPulse] = useState(1);
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
    if (!selectedPoint) {
      setHighlightPulse(1);
      return;
    }

    let animationFrame = 0;
    const startedAt = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = (timestamp - startedAt) / 1000;
      setHighlightPulse(1 + (Math.sin(elapsed * Math.PI * 2.4) + 1) * 0.18);
      animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [selectedPoint]);

  const visibleCount = points.filter((p) => selectedCountries.includes(p.country_code)).length;

  function resolveColor(point: AtlasSelectionPoint): string {
    if (colorMode === "cluster") return colorForCluster(point.global_cluster);
    return countryColors[point.country_code] ?? "#64748b";
  }

  // Build Plotly traces: ghost layer (unselected) + selected layer.
  const traces = useMemo(() => {
    const selectedSet = new Set(selectedCountries);
    const hasSelection = selectedCountries.length > 0;

    const ghostPoints = hasSelection
      ? points.filter((p) => !selectedSet.has(p.country_code))
      : [];
    const activePoints = hasSelection
      ? points.filter((p) => selectedSet.has(p.country_code))
      : points;

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

    const highlightTrace = selectedPoint
      ? ({
          type: "scatter3d",
          mode: "markers",
          x: [selectedPoint.x],
          y: [selectedPoint.y],
          z: [selectedPoint.z],
          customdata: [selectedPoint] as unknown as Plotly.Datum[],
          text: [`<b>${selectedPoint.country_name}</b> · ${selectedPoint.article_id}`],
          hovertemplate: "%{text}<extra></extra>",
          marker: {
            size:
              (2.5 + (selectedPoint.cluster_probability ?? 0) * 4) *
              2.8 *
              highlightPulse,
            color: resolveColor(selectedPoint),
            opacity: 1,
            line: {
              width: 4 + (highlightPulse - 1) * 8,
              color: "#fff8d6",
            },
          },
          showlegend: false,
        } as Partial<Plotly.ScatterData>)
      : null;

    return [
      makeTrace(ghostPoints, 0.12),
      makeTrace(activePoints, 0.88),
      ...(highlightTrace ? [highlightTrace] : []),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, selectedCountries, colorMode, countryColors, selectedPoint, highlightPulse]);

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
    <section className="rounded-[2rem] border border-[#d8ddd7] bg-[linear-gradient(180deg,_#fbf7ef,_#eef4f1)] p-4 shadow-[0_28px_90px_rgba(15,23,42,0.14)]">
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
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* 3D plot */}
        <div className="relative h-[540px] overflow-hidden rounded-[1.5rem] border border-[#d9e0d8] bg-[radial-gradient(circle_at_top,_rgba(248,252,247,1),_rgba(233,241,237,1)_42%,_rgba(220,231,228,1))]">
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
        <div className="flex h-[540px] flex-col overflow-hidden rounded-[1.5rem] border border-[#d9e0d8] bg-white/80">
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
