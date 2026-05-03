"use client";

import dynamic from "next/dynamic";
import {useEffect, useMemo, useRef, useState} from "react";
import {useTranslations} from "next-intl";

import {CountryBadge, toFlagEmoji, useCountryIndex} from "@/components/CountryBadge";
import SearchableComboBox from "@/components/SearchableComboBox";
import ShareButton from "@/components/ShareButton";
import {useFullscreen} from "@/hooks/useFullscreen";
import {
  buildCanvasCountryOptions,
  buildCanvasSegmentOptions,
  deriveCanvasCountryFocusPoints,
  deriveCanvasEmphasisMode,
  deriveCanvasCountryScope,
  findCanvasSegmentPoint,
} from "@/lib/canvas-focus";
import {colorForCluster} from "@/lib/colors";
import {highlightTerms} from "@/lib/highlight";
import {useAppStore} from "@/stores/appStore";
import type {ArticleDetail, AtlasSelectionPoint, ColorMode, SharedViewPayload} from "@/lib/types";

type Point3D = Pick<AtlasSelectionPoint, "x" | "y" | "z">;
type AxisRange = [number, number];
type FocusRanges = {
  x: AxisRange;
  y: AxisRange;
  z: AxisRange;
};
type FocusRevealState = {
  baseRanges: FocusRanges;
  baseEyeNorm: number;
};
type PlotlyGraphDiv = Plotly.PlotlyHTMLElement & {
  _fullLayout?: {
    scene?: {
      camera?: Partial<Plotly.Camera>;
      xaxis?: {range?: number[]};
      yaxis?: {range?: number[]};
      zaxis?: {range?: number[]};
    };
  };
};

// Use the factory pattern so we control which Plotly bundle is loaded.
// react-plotly.js's default import requires "plotly.js/dist/plotly" (not installed);
// the factory lets us substitute plotly.js-dist-min instead.
const Plot = dynamic(
  () =>
    Promise.all([
      import("react-plotly.js/factory"),
      import("plotly.js-gl3d-dist"),
    ]).then(([{default: createPlotlyComponent}, Plotly]) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: createPlotlyComponent(Plotly as any),
    })),
  {ssr: false},
);

type Canvas3DProps = {
  points: AtlasSelectionPoint[];
  searchHighlightedPoints: AtlasSelectionPoint[];
  searchResultPoints: AtlasSelectionPoint[];
  selectedCountries: string[];
  loadingCountries: string[];
  selectedPoint: AtlasSelectionPoint | null;
  countryColors: Record<string, string>;
  colorMode: ColorMode;
  articleDetail: ArticleDetail | null;
  isArticleLoading: boolean;
  onSelectPoint: (point: AtlasSelectionPoint) => void;
  onSetColorMode: (mode: ColorMode) => void;
  onShare: () => void;
  sharedView?: SharedViewPayload | null;
  onShowSharedView?: () => void;
};

const INITIAL_CAMERA = {
  eye: {x: 1.6, y: 1.6, z: 1.0},
  center: {x: 0, y: 0, z: 0},
  up: {x: 0, y: 1, z: 0},
};

const DOUBLE_CLICK_DELAY_MS = 320;
const FOCUS_ANIMATION_DURATION_MS = 420;
const MIN_FOCUS_AXIS_RADIUS = 0.8;
const FOCUS_AXIS_RADIUS_RATIO = 0.08;
const RESET_AXIS_PADDING_RATIO = 0.06;
const MIN_RESET_AXIS_PADDING = 0.45;
const DOCKED_DETAIL_PANEL_BIAS_RATIO = 0.75;
const MAX_DOCKED_DETAIL_PANEL_BIAS = 0.32;
const FOCUS_REVEAL_EYE_RATIO = 0.75;
const RANGE_EPSILON = 0.0001;
const SEARCH_CONTEXT_NEUTRAL = "rgb(102 116 136)";
const CLUSTER_FOCUS_NEUTRAL = "#e2e8f0";

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
  searchResultPoints,
  selectedCountries,
  loadingCountries,
  selectedPoint,
  countryColors,
  colorMode,
  articleDetail,
  isArticleLoading,
  onSelectPoint,
  onSetColorMode,
  onShare,
  sharedView,
  onShowSharedView,
}: Canvas3DProps) {
  const t = useTranslations("Atlas.Canvas");
  const countryByCode = useCountryIndex();
  const {ref, isFullscreen, toggleFullscreen} = useFullscreen<HTMLElement>();
  const lastSearchQuery = useAppStore((state) => state.lastSearchQuery);
  const setCameraState = useAppStore((state) => state.setCameraState);
  const [initialCamera] = useState(() => useAppStore.getState().cameraState ?? INITIAL_CAMERA);
  const plotContainerRef = useRef<HTMLDivElement | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const graphDivRef = useRef<PlotlyGraphDiv | null>(null);
  const plotlyRef = useRef<typeof import("plotly.js-gl3d-dist") | null>(null);
  const focusAnimationFrameRef = useRef<number | null>(null);
  const focusAnimationTokenRef = useRef(0);
  const isSceneTransitionActiveRef = useRef(false);
  const focusRevealStateRef = useRef<FocusRevealState | null>(null);
  const lastClickedPointRef = useRef<AtlasSelectionPoint | null>(null);
  const lastClickedAtRef = useRef(0);
  const focusedCountryCode = useAppStore((s) => s.focusedCountryCode);
  const setFocusedCountryCode = useAppStore((s) => s.setFocusedCountryCode);
  const focusedSegmentId = useAppStore((s) => s.focusedSegmentId);
  const setFocusedSegmentId = useAppStore((s) => s.setFocusedSegmentId);
  const focusedClusterId = useAppStore((s) => s.focusedClusterId);
  const [isPlotReady, setIsPlotReady] = useState(false);
  const [focusRanges, setFocusRanges] = useState<FocusRanges | null>(null);
  const uirevision = "canvas-3d";

  // Load Plotly once for imperative camera calls (relayout).
  useEffect(() => {
    import("plotly.js-gl3d-dist").then((mod) => {
      plotlyRef.current = mod;
    });
  }, []);

  useEffect(() => {
    return () => {
      focusAnimationTokenRef.current += 1;
      if (focusAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(focusAnimationFrameRef.current);
        focusAnimationFrameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isPlotReady || !graphDivRef.current || !plotlyRef.current || !plotContainerRef.current) {
      return;
    }

    let resizeFrame: number | null = null;
    const resizePlot = () => {
      if (!graphDivRef.current || !plotlyRef.current) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (plotlyRef.current.Plots.resize as any)?.(graphDivRef.current);
    };
    const scheduleResize = () => {
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        resizePlot();
      });
    };
    const observer = new ResizeObserver(() => {
      scheduleResize();
    });

    observer.observe(plotContainerRef.current);
    scheduleResize();

    return () => {
      observer.disconnect();
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }
    };
  }, [isFullscreen, isPlotReady, selectedPoint]);

  useEffect(() => {
    if (focusedCountryCode && !selectedCountries.includes(focusedCountryCode)) {
      setFocusedCountryCode(null);
    }
  }, [focusedCountryCode, selectedCountries, setFocusedCountryCode]);

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

  const countryOptions = useMemo(
    () => buildCanvasCountryOptions(selectedCountries, countryByCode),
    [countryByCode, selectedCountries],
  );
  const activeCountryCode = useMemo(
    () => deriveCanvasCountryScope(selectedCountries, focusedCountryCode),
    [focusedCountryCode, selectedCountries],
  );
  const countryFocusPoints = useMemo(
    () =>
      deriveCanvasCountryFocusPoints({
        points,
        searchResultPoints,
        activeCountryCode,
        selectedPointId: selectedPoint?.id ?? null,
      }),
    [activeCountryCode, points, searchResultPoints, selectedPoint],
  );
  const segmentOptions = useMemo(
    () => buildCanvasSegmentOptions(countryFocusPoints, activeCountryCode),
    [activeCountryCode, countryFocusPoints],
  );
  const focusedSegmentPoint = useMemo(
    () => findCanvasSegmentPoint(points, focusedSegmentId),
    [focusedSegmentId, points],
  );
  const isActiveCountryLoading = activeCountryCode
    ? loadingCountries.includes(activeCountryCode)
    : false;
  const isSegmentFocusActive = Boolean(
    focusedSegmentPoint
      && activeCountryCode
      && focusedSegmentPoint.country_code === activeCountryCode,
  );
  const isCountryFocusActive = Boolean(
    focusedCountryCode
      && activeCountryCode
      && !isSegmentFocusActive,
  );
  const isClusterFocusActive = focusedClusterId !== null && colorMode === "cluster";

  useEffect(() => {
    if (!focusedSegmentId) return;
    if (!activeCountryCode) {
      setFocusedSegmentId(null);
      return;
    }
    const point = points.find((item) => item.id === focusedSegmentId);
    if (point?.country_code !== activeCountryCode) {
      setFocusedSegmentId(null);
    }
  }, [activeCountryCode, focusedSegmentId, points, setFocusedSegmentId]);

  const countryCentroidLabels = useMemo(() => {
    if (colorMode !== "country" || selectedCountries.length === 0) {
      return [];
    }

    const labelCountryCodes = isCountryFocusActive || isSegmentFocusActive
      ? [activeCountryCode]
      : selectedCountries;
    const selectedSet = new Set(labelCountryCodes.filter(Boolean));
    const groupedPoints = new Map<string, AtlasSelectionPoint[]>();

    for (const point of points) {
      if (!selectedSet.has(point.country_code)) {
        continue;
      }

      const existingPoints = groupedPoints.get(point.country_code);
      if (existingPoints) {
        existingPoints.push(point);
      } else {
        groupedPoints.set(point.country_code, [point]);
      }
    }

    return labelCountryCodes.flatMap((countryCode) => {
      if (!countryCode) {
        return [];
      }
      const countryPoints = groupedPoints.get(countryCode);
      if (!countryPoints || countryPoints.length === 0) {
        return [];
      }

      const centroid = computeCentroid(countryPoints);
      if (!centroid) {
        return [];
      }

      return [
        {
          countryCode,
          countryName: countryPoints[0].country_name,
          color: countryColors[countryCode] ?? "#64748b",
          ...centroid,
        },
      ];
    });
  }, [
    activeCountryCode,
    colorMode,
    countryColors,
    isCountryFocusActive,
    isSegmentFocusActive,
    points,
    selectedCountries,
  ]);
  const resetRanges = useMemo(
    () => computeExpandedSceneRanges(points),
    [points],
  );

  // Build Plotly traces: ghost layer (unselected) + selected layer.
  const {traces, selectableTracePointGroups} = useMemo(() => {
    const selectedSet = new Set(selectedCountries);
    const hasSelection = selectedCountries.length > 0;
    const searchHighlightIds = new Set(searchHighlightedPoints.map((point) => point.id));
    const emphasisMode = deriveCanvasEmphasisMode({
      hasSearchHighlights: searchHighlightIds.size > 0,
      isCountryFocusActive,
      isSegmentFocusActive,
      isClusterFocusActive,
    });
    const isSearchActive = emphasisMode === "search";
    const isClusterEmphasis = emphasisMode === "cluster";

    const ghostPoints = hasSelection
      ? points.filter((p) => !selectedSet.has(p.country_code))
      : [];
    const visiblePoints = hasSelection
      ? points.filter((p) => selectedSet.has(p.country_code))
      : points;
    const countryFocusedPoints = isCountryFocusActive
      ? countryFocusPoints
      : [];
    const segmentFocusedPoints = isSegmentFocusActive && focusedSegmentPoint
      ? [focusedSegmentPoint]
      : [];
    const searchFocusedPoints = isSearchActive ? searchHighlightedPoints : [];

    const clusterFocusedPoints = isClusterEmphasis
      ? visiblePoints.filter((p) => p.global_cluster === focusedClusterId)
      : [];
    const emphasizedPoints = isSegmentFocusActive
      ? segmentFocusedPoints
      : isCountryFocusActive
        ? countryFocusedPoints
        : isClusterEmphasis
          ? clusterFocusedPoints
          : isSearchActive
            ? searchFocusedPoints
            : visiblePoints;
    const emphasizedIds = new Set(emphasizedPoints.map((point) => point.id));
    const deEmphasizedVisiblePoints = visiblePoints.filter(
      (point) => !emphasizedIds.has(point.id),
    );

    function makeTrace(
      pts: AtlasSelectionPoint[],
      opacity: number,
      sizeMultiplier: number = 1,
      lineWidth: number = 0,
      colorOverride?: string,
    ): Partial<Plotly.ScatterData> {
      return {
        type: "scatter3d",
        mode: "markers",
        x: pts.map((p) => p.x),
        y: pts.map((p) => p.y),
        z: pts.map((p) => p.z),
        customdata: pts as unknown as Plotly.Datum[],
        hovertext: pts.map((p) => formatHoverContent(p, countryByCode)),
        hovertemplate: "%{hovertext}<extra></extra>",
        marker: {
          size: pts.map((p) => (2.5 + (p.cluster_probability ?? 0) * 4) * sizeMultiplier),
          color: colorOverride
            ? pts.map(() => colorOverride)
            : pts.map((p) => resolveColor(p)),
          opacity,
          line: {
            width: lineWidth,
            color: lineWidth > 0 ? "rgba(255,255,255,0.85)" : "transparent",
          },
        },
        showlegend: false,
      } as Partial<Plotly.ScatterData>;
    }

    const emphasisTrace = emphasizedPoints.length > 0
      ? makeTrace(
          emphasizedPoints,
          isSearchActive || isSegmentFocusActive ? 1 : 0.9,
          isSearchActive || isSegmentFocusActive ? 2.2 : 1,
          isSearchActive || isSegmentFocusActive ? 2.5 : 0,
        )
      : null;


    const highlightTrace = selectedPoint
      && (
        (!isSegmentFocusActive && !isCountryFocusActive)
        || (isSegmentFocusActive && selectedPoint.id === focusedSegmentId)
        || (isCountryFocusActive && selectedPoint.country_code === activeCountryCode)
      )
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

    const centroidLabelTraces = countryCentroidLabels.map(
      (label) =>
        ({
          type: "scatter3d",
          mode: "text",
          x: [label.x],
          y: [label.y],
          z: [label.z],
          text: [label.countryName],
          textposition: "middle center",
          textfont: {
            color: label.color,
            size: 15,
            family: "Palatino Linotype, Book Antiqua, Georgia, serif",
          },
          hoverinfo: "skip",
          marker: {
            size: 0,
            color: label.color,
            opacity: 0,
          },
          showlegend: false,
        } as Partial<Plotly.ScatterData>),
    );

    const isFocusActive = isSearchActive || isCountryFocusActive || isSegmentFocusActive || isClusterEmphasis;
    const nextTraces = [
      makeTrace(
        ghostPoints,
        isFocusActive ? 0.03 : 0.12,
        1,
        0,
        isSearchActive ? SEARCH_CONTEXT_NEUTRAL : isClusterEmphasis ? CLUSTER_FOCUS_NEUTRAL : undefined,
      ),
      ...(deEmphasizedVisiblePoints.length > 0
        ? [
            makeTrace(
              deEmphasizedVisiblePoints,
              isFocusActive ? 0.1 : 0.88,
              1,
              0,
              isSearchActive ? SEARCH_CONTEXT_NEUTRAL : isClusterEmphasis ? CLUSTER_FOCUS_NEUTRAL : undefined,
            ),
          ]
        : []),
      ...(emphasisTrace ? [emphasisTrace] : []),
      ...(highlightTrace ? [highlightTrace] : []),
      ...centroidLabelTraces,
    ];

    const nextSelectableTracePointGroups: AtlasSelectionPoint[][] = [
      ghostPoints,
      ...(deEmphasizedVisiblePoints.length > 0 ? [deEmphasizedVisiblePoints] : []),
      ...(emphasisTrace ? [emphasizedPoints] : []),
      ...(highlightTrace ? [[]] : []),
      ...centroidLabelTraces.map(() => []),
    ];

    return {
      traces: nextTraces,
      selectableTracePointGroups: nextSelectableTracePointGroups,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    points,
    searchHighlightedPoints,
    selectedCountries,
    colorMode,
    countryColors,
    selectedPoint,
    countryCentroidLabels,
    countryByCode,
    activeCountryCode,
    countryFocusPoints,
    focusedSegmentId,
    focusedSegmentPoint,
    isCountryFocusActive,
    isSegmentFocusActive,
    isClusterFocusActive,
    focusedClusterId,
  ]);

  const layout = useMemo(
    () =>
      ({
        uirevision,
        margin: {l: 0, r: 0, t: 0, b: 0},
        paper_bgcolor: "transparent",
        scene: {
          bgcolor: "rgba(237,244,239,0)",
          xaxis: buildSceneAxis(focusRanges?.x),
          yaxis: buildSceneAxis(focusRanges?.y),
          zaxis: buildSceneAxis(focusRanges?.z),
          aspectmode: "cube",
          camera: initialCamera,
        },
        showlegend: false,
      }) as Partial<Plotly.Layout>,
    [focusRanges, initialCamera, uirevision],
  );

  const config = useMemo(
    () =>
      ({
        displayModeBar: false,
        doubleClick: false,
        responsive: true,
      }) as Partial<Plotly.Config>,
    [],
  );

  function cancelFocusAnimation() {
    focusAnimationTokenRef.current += 1;
    isSceneTransitionActiveRef.current = false;
    if (focusAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(focusAnimationFrameRef.current);
      focusAnimationFrameRef.current = null;
    }
  }

  function animateSceneTransition({
    targetCamera,
    targetRanges,
    onComplete,
  }: {
    targetCamera: Plotly.Camera;
    targetRanges: FocusRanges;
    onComplete: () => void;
  }) {
    const graphDiv = graphDivRef.current;
    const plotly = plotlyRef.current;

    if (!graphDiv || !plotly) {
      onComplete();
      return;
    }

    const startRanges = readSceneRanges(graphDiv) ?? focusRanges ?? resetRanges ?? targetRanges;
    const startCamera = readSceneCamera(graphDiv);

    cancelFocusAnimation();
    isSceneTransitionActiveRef.current = true;
    const animationToken = focusAnimationTokenRef.current;
    const startedAt = performance.now();
    const step = (timestamp: number) => {
      if (animationToken !== focusAnimationTokenRef.current) {
        return;
      }

      const progress = Math.min(
        (timestamp - startedAt) / FOCUS_ANIMATION_DURATION_MS,
        1,
      );
      const easedProgress = easeInOutCubic(progress);

      void plotly.relayout(
        graphDiv,
        buildSceneRelayoutUpdate(
          interpolateFocusRanges(startRanges, targetRanges, easedProgress),
          interpolateCamera(startCamera, targetCamera, easedProgress),
        ),
      );

      if (progress < 1) {
        focusAnimationFrameRef.current = window.requestAnimationFrame(step);
        return;
      }

      focusAnimationFrameRef.current = null;
      isSceneTransitionActiveRef.current = false;
      onComplete();
    };

    focusAnimationFrameRef.current = window.requestAnimationFrame(step);
  }

  function focusPoint(point: AtlasSelectionPoint | null) {
    if (!point) {
      return;
    }

    const focusContextPoints =
      points.length > 0
        ? points
        : searchHighlightedPoints.length > 0
          ? searchHighlightedPoints
          : [point];
    const axisRadius = computeFocusAxisRadius(focusContextPoints);
    const horizontalBias = computeDockedDetailPanelBias(
      plotContainerRef.current,
      detailPanelRef.current,
    );
    const nextFocusRanges: FocusRanges = {
      x: [
        point.x - axisRadius * (1 - horizontalBias),
        point.x + axisRadius * (1 + horizontalBias),
      ],
      y: [point.y - axisRadius, point.y + axisRadius],
      z: [point.z - axisRadius, point.z + axisRadius],
    };
    const startRanges = readSceneRanges(graphDivRef.current ?? undefined) ?? focusRanges ?? resetRanges ?? nextFocusRanges;
    const startCamera = readSceneCamera(graphDivRef.current ?? undefined);
    const targetCamera = buildTargetFocusCamera(startCamera, startRanges, nextFocusRanges);

    animateSceneTransition({
      targetCamera,
      targetRanges: nextFocusRanges,
      onComplete: () => {
        focusRevealStateRef.current = {
          baseRanges: nextFocusRanges,
          baseEyeNorm: pointVectorLength(targetCamera.eye),
        };
        setFocusRanges(nextFocusRanges);
      },
    });
  }

  function handleRelayout() {
    if (!isSceneTransitionActiveRef.current && graphDivRef.current) {
      setCameraState(readSceneCamera(graphDivRef.current) as import("@/lib/types").PlotlyCamera);
    }

    if (
      isSceneTransitionActiveRef.current
      || !focusRevealStateRef.current
      || !resetRanges
      || !graphDivRef.current
    ) {
      return;
    }

    const focusRevealState = focusRevealStateRef.current;
    const currentCamera = readSceneCamera(graphDivRef.current);
    const eyeNorm = pointVectorLength(currentCamera.eye);
    const revealProgress = clamp(
      (eyeNorm / Math.max(focusRevealState.baseEyeNorm, RANGE_EPSILON) - 1)
        / FOCUS_REVEAL_EYE_RATIO,
      0,
      1,
    );
    const nextRanges = revealProgress >= 1
      ? resetRanges
      : interpolateFocusRanges(
          focusRevealState.baseRanges,
          resetRanges,
          revealProgress,
        );

    setFocusRanges((current) =>
      rangesApproximatelyEqual(current, nextRanges) ? current : nextRanges,
    );

    if (revealProgress >= 1) {
      focusRevealStateRef.current = null;
    }
  }

  function handleClick(data: Plotly.PlotMouseEvent) {
    const point = extractSelectionPointFromPlotEvent(
      data.points,
      selectableTracePointGroups,
    );
    if (!point) {
      return;
    }

    const clickedAt = Date.now();
    const isPointDoubleClick =
      lastClickedPointRef.current?.id === point.id
      && clickedAt - lastClickedAtRef.current <= DOUBLE_CLICK_DELAY_MS;

    lastClickedPointRef.current = point;
    lastClickedAtRef.current = clickedAt;
    onSelectPoint(point);

    if (isPointDoubleClick) {
      focusPoint(point);
    }
  }

  function handleResetView() {
    cancelFocusAnimation();
    focusRevealStateRef.current = null;

    if (!resetRanges) {
      setFocusRanges(null);
      return;
    }

    animateSceneTransition({
      targetCamera: INITIAL_CAMERA,
      targetRanges: resetRanges,
      onComplete: () => {
        setFocusRanges(null);
      },
    });
  }

  function handleFocusSelection() {
    focusPoint(selectedPoint);
  }

  function handleCountryFocusChange(countryCode: string | null) {
    setFocusedCountryCode(countryCode);
    if (!countryCode || !focusedSegmentId) {
      setFocusedSegmentId(null);
    } else {
      const point = points.find((item) => item.id === focusedSegmentId);
      if (point?.country_code !== countryCode) {
        setFocusedSegmentId(null);
      }
    }
  }

  function handleSegmentFocusChange(segmentId: string | null) {
    setFocusedSegmentId(segmentId);
    const point = findCanvasSegmentPoint(points, segmentId);
    if (point) {
      lastClickedPointRef.current = point;
      lastClickedAtRef.current = Date.now();
      onSelectPoint(point);
      focusPoint(point);
    }
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
        <div className="flex items-center gap-2">
          {sharedView && onShowSharedView && (
            <button
              type="button"
              onClick={onShowSharedView}
              title={sharedView.title}
              className="flex max-w-[260px] items-center gap-1.5 truncate rounded-[0.75rem] border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white hover:text-slate-800 active:scale-95"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 7v5M8 5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="truncate">{sharedView.title}</span>
            </button>
          )}
          <ShareButton onClick={onShare} />
        </div>
      </div>

      <div className="space-y-3 px-2 pb-3">
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
            className="hidden rounded-full border border-slate-300 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 sm:inline-flex"
            type="button"
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
          </button>
        </div>

        {selectedCountries.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {selectedCountries.length > 1 ? (
              <SearchableComboBox
                label={t("countryFocusLabel")}
                placeholder={t("countryFocusPlaceholder")}
                options={countryOptions}
                selectedId={focusedCountryCode}
                onSelect={handleCountryFocusChange}
                clearLabel={t("clearFocus")}
                emptyText={t("countryFocusEmpty")}
                noResultsText={t("countryFocusNoResults")}
              />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {t("countryFocusLabel")}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {countryOptions[0]?.label ?? t("countryFocusEmpty")}
                </p>
              </div>
            )}

            <SearchableComboBox
              label={t("segmentFocusLabel")}
              placeholder={t("segmentFocusPlaceholder")}
              options={segmentOptions}
              selectedId={focusedSegmentId}
              onSelect={handleSegmentFocusChange}
              clearLabel={t("clearFocus")}
              emptyText={
                !activeCountryCode
                  ? t("segmentFocusDisabled")
                  : isActiveCountryLoading
                    ? t("segmentFocusLoading")
                    : t("segmentFocusEmpty")
              }
              noResultsText={t("segmentFocusNoResults")}
              disabled={!activeCountryCode || isActiveCountryLoading}
            />
          </div>
        ) : null}

        {isSegmentFocusActive && focusedSegmentPoint ? (
          <p className="text-xs text-slate-500">
            {t("focusStatusSegment", {
              country: focusedSegmentPoint.country_code,
              article: focusedSegmentPoint.article_id,
            })}
          </p>
        ) : isCountryFocusActive && activeCountryCode ? (
          <p className="text-xs text-slate-500">
            {t("focusStatusCountry", {country: activeCountryCode})}
          </p>
        ) : null}
      </div>

      <div className={`grid gap-4 ${selectedPoint ? "xl:grid-cols-[1fr_360px]" : ""} ${isFullscreen ? "min-h-0 flex-1" : ""}`}>
        {/* 3D plot */}
        <div
          ref={plotContainerRef}
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
                graphDivRef.current = gd as PlotlyGraphDiv;
                setIsPlotReady(true);
              }}
              onUpdate={(_, gd) => {
                graphDivRef.current = gd as PlotlyGraphDiv;
              }}
              onClick={handleClick}
              onRelayout={handleRelayout}
            />
          )}
        </div>

        {/* Article detail sidebar — only rendered when a point is selected */}
        {selectedPoint && (
        <div
          ref={detailPanelRef}
          className={`flex flex-col overflow-hidden rounded-[1.5rem] border border-[#d9e0d8] bg-white/80 ${
            isFullscreen ? "h-[34vh] xl:h-full" : "h-[540px]"
          }`}
        >
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <CountryBadge
                countryCode={selectedPoint.country_code}
                countryName={selectedPoint.country_name}
                tone="slate"
                size="sm"
              />
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
                {lastSearchQuery
                  ? highlightTerms(articleDetail?.text ?? selectedPoint.text_snippet, lastSearchQuery)
                  : (articleDetail?.text ?? selectedPoint.text_snippet)}
              </p>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}

function computeCentroid(points: Point3D[]) {
  if (points.length === 0) {
    return null;
  }

  const totals = points.reduce(
    (accumulator, point) => {
      accumulator.x += point.x;
      accumulator.y += point.y;
      accumulator.z += point.z;
      return accumulator;
    },
    {x: 0, y: 0, z: 0},
  );

  return {
    x: totals.x / points.length,
    y: totals.y / points.length,
    z: totals.z / points.length,
  };
}

function buildSceneAxis(range?: [number, number]) {
  return range
    ? {
        ...AXIS_STYLE,
        autorange: false,
        range,
      }
    : {
        ...AXIS_STYLE,
        autorange: true,
      };
}

function computeFocusAxisRadius(points: Point3D[]) {
  if (points.length === 0) {
    return MIN_FOCUS_AXIS_RADIUS;
  }

  const bounds = points.reduce(
    (accumulator, point) => ({
      minX: Math.min(accumulator.minX, point.x),
      maxX: Math.max(accumulator.maxX, point.x),
      minY: Math.min(accumulator.minY, point.y),
      maxY: Math.max(accumulator.maxY, point.y),
      minZ: Math.min(accumulator.minZ, point.z),
      maxZ: Math.max(accumulator.maxZ, point.z),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      minZ: Number.POSITIVE_INFINITY,
      maxZ: Number.NEGATIVE_INFINITY,
    },
  );

  const maxSpan = Math.max(
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY,
    bounds.maxZ - bounds.minZ,
  );

  return Math.max(maxSpan * FOCUS_AXIS_RADIUS_RATIO, MIN_FOCUS_AXIS_RADIUS);
}

function computeExpandedSceneRanges(points: Point3D[]): FocusRanges | null {
  if (points.length === 0) {
    return null;
  }

  const bounds = computeBounds(points);
  const padding = Math.max(
    Math.max(
      bounds.maxX - bounds.minX,
      bounds.maxY - bounds.minY,
      bounds.maxZ - bounds.minZ,
    ) * RESET_AXIS_PADDING_RATIO,
    MIN_RESET_AXIS_PADDING,
  );

  return {
    x: [bounds.minX - padding, bounds.maxX + padding],
    y: [bounds.minY - padding, bounds.maxY + padding],
    z: [bounds.minZ - padding, bounds.maxZ + padding],
  };
}

function computeDockedDetailPanelBias(
  plotContainer: HTMLDivElement | null,
  detailPanel: HTMLDivElement | null,
) {
  if (!plotContainer || !detailPanel) {
    return 0;
  }

  const plotRect = plotContainer.getBoundingClientRect();
  const detailRect = detailPanel.getBoundingClientRect();
  const isDockedRight = Math.abs(plotRect.top - detailRect.top) < 8
    && detailRect.left >= plotRect.right - 1;

  if (!isDockedRight || plotRect.width <= 0 || detailRect.width <= 0) {
    return 0;
  }

  const rawBias = (detailRect.width / (plotRect.width + detailRect.width))
    * DOCKED_DETAIL_PANEL_BIAS_RATIO;

  return clamp(rawBias, 0, MAX_DOCKED_DETAIL_PANEL_BIAS);
}

function computeBounds(points: Point3D[]) {
  return points.reduce(
    (accumulator, point) => ({
      minX: Math.min(accumulator.minX, point.x),
      maxX: Math.max(accumulator.maxX, point.x),
      minY: Math.min(accumulator.minY, point.y),
      maxY: Math.max(accumulator.maxY, point.y),
      minZ: Math.min(accumulator.minZ, point.z),
      maxZ: Math.max(accumulator.maxZ, point.z),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      minZ: Number.POSITIVE_INFINITY,
      maxZ: Number.NEGATIVE_INFINITY,
    },
  );
}

function readSceneCamera(graphDiv?: PlotlyGraphDiv | null): Plotly.Camera {
  const fullLayoutCamera = graphDiv?._fullLayout?.scene?.camera;
  const layoutCamera = graphDiv?.layout.scene?.camera;
  const source = fullLayoutCamera ?? layoutCamera ?? INITIAL_CAMERA;

  return {
    eye: {
      x: source.eye?.x ?? INITIAL_CAMERA.eye.x,
      y: source.eye?.y ?? INITIAL_CAMERA.eye.y,
      z: source.eye?.z ?? INITIAL_CAMERA.eye.z,
    },
    center: {
      x: source.center?.x ?? INITIAL_CAMERA.center.x,
      y: source.center?.y ?? INITIAL_CAMERA.center.y,
      z: source.center?.z ?? INITIAL_CAMERA.center.z,
    },
    up: {
      x: source.up?.x ?? INITIAL_CAMERA.up.x,
      y: source.up?.y ?? INITIAL_CAMERA.up.y,
      z: source.up?.z ?? INITIAL_CAMERA.up.z,
    },
  };
}

function readSceneRanges(graphDiv?: PlotlyGraphDiv | null): FocusRanges | null {
  const fullLayoutScene = graphDiv?._fullLayout?.scene;
  const layoutScene = graphDiv?.layout.scene;

  const x = readAxisRange(fullLayoutScene?.xaxis?.range, layoutScene?.xaxis?.range);
  const y = readAxisRange(fullLayoutScene?.yaxis?.range, layoutScene?.yaxis?.range);
  const z = readAxisRange(fullLayoutScene?.zaxis?.range, layoutScene?.zaxis?.range);

  if (!x || !y || !z) {
    return null;
  }

  return {x, y, z};
}

function readAxisRange(
  primary?: number[],
  secondary?: number[],
): AxisRange | null {
  const source = primary ?? secondary;

  if (
    !source
    || source.length < 2
    || typeof source[0] !== "number"
    || typeof source[1] !== "number"
  ) {
    return null;
  }

  return [source[0], source[1]];
}

function buildTargetFocusCamera(
  startCamera: Plotly.Camera,
  startRanges: FocusRanges,
  targetRanges: FocusRanges,
): Plotly.Camera {
  const startSpan = largestAxisSpan(startRanges);
  const targetSpan = largestAxisSpan(targetRanges);
  const eyeScale = startSpan > 0
    ? clamp(Math.sqrt(targetSpan / startSpan), 0.55, 1)
    : 1;

  return {
    eye: scalePoint(startCamera.eye, eyeScale),
    center: INITIAL_CAMERA.center,
    up: startCamera.up,
  };
}

function buildSceneRelayoutUpdate(
  ranges: FocusRanges,
  camera: Plotly.Camera,
): Partial<Plotly.Layout> {
  return {
    scene: {
      camera,
      xaxis: {
        ...AXIS_STYLE,
        autorange: false,
        range: ranges.x,
      },
      yaxis: {
        ...AXIS_STYLE,
        autorange: false,
        range: ranges.y,
      },
      zaxis: {
        ...AXIS_STYLE,
        autorange: false,
        range: ranges.z,
      },
    },
  };
}

function interpolateFocusRanges(
  start: FocusRanges,
  end: FocusRanges,
  progress: number,
): FocusRanges {
  return {
    x: interpolateRange(start.x, end.x, progress),
    y: interpolateRange(start.y, end.y, progress),
    z: interpolateRange(start.z, end.z, progress),
  };
}

function interpolateRange(
  start: AxisRange,
  end: AxisRange,
  progress: number,
): AxisRange {
  return [
    interpolateNumber(start[0], end[0], progress),
    interpolateNumber(start[1], end[1], progress),
  ];
}

function interpolateCamera(
  start: Plotly.Camera,
  end: Plotly.Camera,
  progress: number,
): Plotly.Camera {
  return {
    eye: interpolatePoint(start.eye, end.eye, progress),
    center: interpolatePoint(start.center, end.center, progress),
    up: interpolatePoint(start.up, end.up, progress),
  };
}

function interpolatePoint(
  start: Partial<Plotly.Point>,
  end: Partial<Plotly.Point>,
  progress: number,
): Partial<Plotly.Point> {
  return {
    x: interpolateNumber(start.x ?? 0, end.x ?? 0, progress),
    y: interpolateNumber(start.y ?? 0, end.y ?? 0, progress),
    z: interpolateNumber(start.z ?? 0, end.z ?? 0, progress),
  };
}

function scalePoint(
  point: Partial<Plotly.Point>,
  factor: number,
): Partial<Plotly.Point> {
  return {
    x: (point.x ?? 0) * factor,
    y: (point.y ?? 0) * factor,
    z: (point.z ?? 0) * factor,
  };
}

function interpolateNumber(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function pointVectorLength(point: Partial<Plotly.Point>) {
  return Math.sqrt(
    (point.x ?? 0) ** 2
    + (point.y ?? 0) ** 2
    + (point.z ?? 0) ** 2,
  );
}

function largestAxisSpan(ranges: FocusRanges) {
  return Math.max(
    ranges.x[1] - ranges.x[0],
    ranges.y[1] - ranges.y[0],
    ranges.z[1] - ranges.z[0],
  );
}

function rangesApproximatelyEqual(
  left: FocusRanges | null,
  right: FocusRanges | null,
) {
  if (!left || !right) {
    return left === right;
  }

  return (
    Math.abs(left.x[0] - right.x[0]) < RANGE_EPSILON
    && Math.abs(left.x[1] - right.x[1]) < RANGE_EPSILON
    && Math.abs(left.y[0] - right.y[0]) < RANGE_EPSILON
    && Math.abs(left.y[1] - right.y[1]) < RANGE_EPSILON
    && Math.abs(left.z[0] - right.z[0]) < RANGE_EPSILON
    && Math.abs(left.z[1] - right.z[1]) < RANGE_EPSILON
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - ((-2 * progress + 2) ** 3) / 2;
}

function extractSelectionPoint(
  point: Plotly.PlotDatum | undefined,
): AtlasSelectionPoint | null {
  if (!point) {
    return null;
  }

  const directCustomData = (point as {customdata?: unknown}).customdata;
  if (isSelectionPoint(directCustomData)) {
    return directCustomData;
  }

  const pointNumber =
    typeof point.pointNumber === "number" ? point.pointNumber : null;
  const traceCustomData = (
    point.data as {customdata?: unknown[] | undefined} | undefined
  )?.customdata;

  if (
    pointNumber !== null
    && Array.isArray(traceCustomData)
    && isSelectionPoint(traceCustomData[pointNumber])
  ) {
    return traceCustomData[pointNumber];
  }

  return null;
}

function extractSelectionPointFromPoints(
  points: readonly Plotly.PlotDatum[] | undefined,
): AtlasSelectionPoint | null {
  if (!points || points.length === 0) {
    return null;
  }

  for (const point of points) {
    const selectionPoint = extractSelectionPoint(point);
    if (selectionPoint) {
      return selectionPoint;
    }
  }

  return null;
}

function extractSelectionPointFromPlotEvent(
  points: readonly Plotly.PlotDatum[] | undefined,
  selectableTracePointGroups: AtlasSelectionPoint[][],
): AtlasSelectionPoint | null {
  const firstPoint = points?.[0];
  const curveNumber =
    typeof firstPoint?.curveNumber === "number" ? firstPoint.curveNumber : null;
  const pointNumber =
    typeof firstPoint?.pointNumber === "number" ? firstPoint.pointNumber : null;

  if (curveNumber !== null && pointNumber !== null) {
    const tracePoint = selectableTracePointGroups[curveNumber]?.[pointNumber];
    if (tracePoint) {
      return tracePoint;
    }
  }

  return extractSelectionPointFromPoints(points);
}

function isSelectionPoint(value: unknown): value is AtlasSelectionPoint {
  return (
    typeof value === "object"
    && value !== null
    && "id" in value
    && "text_snippet" in value
    && "country_code" in value
    && "article_id" in value
  );
}

function formatHoverContent(
  point: AtlasSelectionPoint,
  countryByCode: Record<string, {iso_alpha2?: string | null}>,
): string {
  const flagEmoji = toFlagEmoji(countryByCode[point.country_code]?.iso_alpha2);
  const countryLabel = [flagEmoji, point.country_code, point.country_name]
    .filter(Boolean)
    .join(" ");

  return `<b>${escapeHoverText(countryLabel)}</b> · ${escapeHoverText(point.article_id)}<br>${escapeHoverText(
    wrapSnippetText(point.text_snippet, 8),
  ).replaceAll("\n", "<br>")}`;
}

function escapeHoverText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function wrapSnippetText(value: string, wordsPerLine: number = 8): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= wordsPerLine) {
    return value.trim();
  }

  const lines: string[] = [];
  for (let index = 0; index < words.length; index += wordsPerLine) {
    lines.push(words.slice(index, index + wordsPerLine).join(" "));
  }

  return lines.join("\n");
}
