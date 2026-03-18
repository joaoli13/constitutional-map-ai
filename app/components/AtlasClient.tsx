"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {useTranslations} from "next-intl";

import Canvas3D from "@/components/Canvas3D";
import ControlPanel from "@/components/ControlPanel";
import SearchPanel from "@/components/SearchPanel";
import StatsPanel from "@/components/StatsPanel";
import WorldMap from "@/components/WorldMap";
import {buildCountryPalette} from "@/lib/colors";
import {useCountryData} from "@/hooks/useCountryData";
import {useAppStore} from "@/stores/appStore";
import type {
  ArticleDetail,
  AtlasIndexData,
  AtlasSelectionPoint,
  ClusterSummary,
  CountryPoint,
  SearchResult,
} from "@/lib/types";

type AtlasClientProps = {
  atlasIndex: AtlasIndexData;
  clusters: ClusterSummary[];
};

export default function AtlasClient({atlasIndex, clusters}: AtlasClientProps) {
  const t = useTranslations("Atlas");
  const leftColumnRef = useRef<HTMLDivElement | null>(null);
  const selectedCountries = useAppStore((state) => state.selectedCountries);
  const loadedCountryData = useAppStore((state) => state.loadedCountryData);
  const selectedPoint = useAppStore((state) => state.selectedPoint);
  const searchResults = useAppStore((state) => state.searchResults);
  const restrictSearchToSelectedCountries = useAppStore(
    (state) => state.restrictSearchToSelectedCountries,
  );
  const colorMode = useAppStore((state) => state.colorMode);
  const toggleCountrySelection = useAppStore((state) => state.toggleCountrySelection);
  const addCountries = useAppStore((state) => state.addCountries);
  const clearCountrySelection = useAppStore((state) => state.clearCountrySelection);
  const setSelectedPoint = useAppStore((state) => state.setSelectedPoint);
  const setColorMode = useAppStore((state) => state.setColorMode);
  const {loadingCountries, errorCountry} = useCountryData(selectedCountries);
  const [controlPanelHeight, setControlPanelHeight] = useState<number | null>(null);
  const [articleDetail, setArticleDetail] = useState<ArticleDetail | null>(null);
  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const articleCache = useRef<Record<string, ArticleDetail>>({});

  const countryByCode = Object.fromEntries(
    atlasIndex.countries.map((country) => [country.code, country]),
  );
  const countryColors = buildCountryPalette(selectedCountries);
  const loadedPoints = buildLoadedPoints(loadedCountryData, countryByCode);
  const searchHighlightedPoints = restrictSearchToSelectedCountries
    ? searchResults.map(toSelectionPointFromSearchResult)
    : [];
  const selectedCountryRecords = selectedCountries
    .map((countryCode) => countryByCode[countryCode])
    .filter(Boolean);

  useLayoutEffect(() => {
    const node = leftColumnRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      setControlPanelHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      if (!selectedPoint) {
        setArticleDetail(null);
        return;
      }

      const cached = articleCache.current[selectedPoint.id];
      if (cached) {
        setArticleDetail(cached);
        return;
      }

      setIsArticleLoading(true);
      try {
        const response = await fetch(
          `/api/article?${new URLSearchParams({id: selectedPoint.id}).toString()}`,
        );
        if (!response.ok) {
          throw new Error(`Article request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as ArticleDetail;
        if (!cancelled) {
          articleCache.current[selectedPoint.id] = payload;
          setArticleDetail(payload);
        }
      } catch (error) {
        console.error("Article detail load failed", error);
        if (!cancelled) {
          setArticleDetail(null);
        }
      } finally {
        if (!cancelled) {
          setIsArticleLoading(false);
        }
      }
    }

    void loadArticle();

    return () => {
      cancelled = true;
    };
  }, [selectedPoint]);

  function handleSelectPoint(point: AtlasSelectionPoint) {
    setSelectedPoint(point);
    if (!selectedCountries.includes(point.country_code)) {
      addCountries([point.country_code]);
    }
  }

  function handleSelectSearchResult(result: SearchResult) {
    handleSelectPoint(toSelectionPointFromSearchResult(result));
  }

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-6 pb-16 pt-7">
      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr] xl:items-start">
        <div ref={leftColumnRef} className="flex flex-col gap-5">
          <div className="min-h-0 flex-1">
            <WorldMap
              countries={atlasIndex.countries}
              selectedCountries={selectedCountries}
              loadingCountries={loadingCountries}
              countryColors={countryColors}
              onToggleCountry={toggleCountrySelection}
            />
          </div>
          <SearchPanel onSelectResult={handleSelectSearchResult} />
        </div>
        <div
          className="min-h-0 xl:h-[var(--control-panel-height)]"
          style={
            controlPanelHeight === null
              ? undefined
              : ({
                  "--control-panel-height": `${controlPanelHeight}px`,
                } as CSSProperties)
          }
        >
          <ControlPanel
            countries={atlasIndex.countries}
            selectedCountries={selectedCountries}
            loadingCountries={loadingCountries}
            globalClusterCount={clusters.length}
            countryColors={countryColors}
            onToggleCountry={toggleCountrySelection}
            onAddCountries={addCountries}
            onClearCountries={clearCountrySelection}
          />
        </div>
      </section>

      {errorCountry ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {t("countryLoadError", {country: errorCountry})}
        </div>
      ) : null}

      <Canvas3D
        points={loadedPoints}
        searchHighlightedPoints={searchHighlightedPoints}
        selectedCountries={selectedCountries}
        selectedPoint={selectedPoint}
        countryColors={countryColors}
        colorMode={colorMode}
        articleDetail={articleDetail}
        isArticleLoading={isArticleLoading}
        onSelectPoint={handleSelectPoint}
        onSetColorMode={setColorMode}
      />

      <StatsPanel countries={selectedCountryRecords} />
    </main>
  );
}

// Global UMAP space centroid (x: -1.07→15.43, y: -4.74→11.43, z: 0.88→17.86)
// Subtracted so the point cloud is centered at the Three.js origin.
const UMAP_CENTER = {x: 7.18, y: 3.35, z: 9.37};

function buildLoadedPoints(
  loadedCountryData: Record<string, CountryPoint[]>,
  countryByCode: Record<string, {name: string} | undefined>,
) {
  const points: AtlasSelectionPoint[] = [];

  for (const [countryCode, countryPoints] of Object.entries(loadedCountryData)) {
    const country = countryByCode[countryCode];
    if (!country) {
      continue;
    }

    for (const point of countryPoints) {
      points.push({
        id: point.id,
        article_id: point.article_id,
        text_snippet: point.text_snippet,
        country_code: countryCode,
        country_name: country.name,
        x: point.x - UMAP_CENTER.x,
        y: point.y - UMAP_CENTER.y,
        z: point.z - UMAP_CENTER.z,
        global_cluster: point.global_cluster,
        country_cluster: point.country_cluster,
        cluster_probability: point.cluster_probability,
        rank: null,
      });
    }
  }

  return points;
}

function toSelectionPointFromSearchResult(result: SearchResult): AtlasSelectionPoint {
  return {
    id: result.id,
    article_id: result.article_id,
    text_snippet: result.text_snippet,
    country_code: result.country_code,
    country_name: result.country_name,
    x: result.x - UMAP_CENTER.x,
    y: result.y - UMAP_CENTER.y,
    z: result.z - UMAP_CENTER.z,
    global_cluster: result.global_cluster,
    country_cluster: null,
    cluster_probability: null,
    rank: result.rank,
  };
}
