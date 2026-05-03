"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {useTranslations} from "next-intl";

import ShareModal from "@/components/ShareModal";
import SharedViewPopup from "@/components/SharedViewPopup";
import {deserializeSharedView} from "@/lib/share-state";

import Canvas3D from "@/components/Canvas3D";
import ControlPanel from "@/components/ControlPanel";
import {CountryIndexProvider} from "@/components/CountryBadge";
import SearchPanel from "@/components/SearchPanel";
import ClusterReachPanel from "@/components/ClusterReachPanel";
import StatsPanel from "@/components/StatsPanel";
import {
  applyAtlasDeepLinkSeed,
  hasAtlasDeepLinkSeed,
  parseAtlasDeepLinkParams,
  type AtlasDeepLinkSeed,
} from "@/lib/atlas-deep-link";
import WorldMap from "@/components/WorldMap";
import {buildCountryPalette} from "@/lib/colors";
import {useCountryData} from "@/hooks/useCountryData";
import {useAppStore} from "@/stores/appStore";
import {toAtlasSelectionPointFromSearchBase} from "@/lib/umap";
import type {
  ArticleDetail,
  AtlasIndexData,
  AtlasSelectionPoint,
  ClusterSummary,
  CountryPoint,
  SemanticSearchResult,
  SearchResult,
  SharedViewPayload,
} from "@/lib/types";

type AtlasClientProps = {
  atlasIndex: AtlasIndexData;
  clusters: ClusterSummary[];
  initialSharedView?: SharedViewPayload;
  initialQuerySeed?: AtlasDeepLinkSeed;
};

export default function AtlasClient({
  atlasIndex,
  clusters,
  initialSharedView,
  initialQuerySeed,
}: AtlasClientProps) {
  const t = useTranslations("Atlas");
  const selectedCountries = useAppStore((state) => state.selectedCountries);
  const loadedCountryData = useAppStore((state) => state.loadedCountryData);
  const selectedPoint = useAppStore((state) => state.selectedPoint);
  const searchResults = useAppStore((state) => state.searchResults);
  const semanticSearchResults = useAppStore((state) => state.semanticSearchResults);
  const restrictSearchToSelectedCountries = useAppStore(
    (state) => state.restrictSearchToSelectedCountries,
  );
  const colorMode = useAppStore((state) => state.colorMode);
  const toggleCountrySelection = useAppStore((state) => state.toggleCountrySelection);
  const addCountries = useAppStore((state) => state.addCountries);
  const clearCountrySelection = useAppStore((state) => state.clearCountrySelection);
  const setSelectedPoint = useAppStore((state) => state.setSelectedPoint);
  const setLastSearchQuery = useAppStore((state) => state.setLastSearchQuery);
  const setLastSemanticSearchQuery = useAppStore(
    (state) => state.setLastSemanticSearchQuery,
  );
  const setRestrictSearchToSelectedCountries = useAppStore(
    (state) => state.setRestrictSearchToSelectedCountries,
  );
  const setColorMode = useAppStore((state) => state.setColorMode);
  const setFocusedCountryCode = useAppStore((state) => state.setFocusedCountryCode);
  const setFocusedClusterId = useAppStore((state) => state.setFocusedClusterId);
  const setFocusedSegmentId = useAppStore((state) => state.setFocusedSegmentId);
  const pendingSegmentId = useAppStore((state) => state.pendingSegmentId);
  const setPendingSegmentId = useAppStore((state) => state.setPendingSegmentId);
  const {loadingCountries, errorCountry} = useCountryData(selectedCountries);
  const [articleDetail, setArticleDetail] = useState<ArticleDetail | null>(null);
  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const articleCache = useRef<Record<string, ArticleDetail>>({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharedViewPopup, setSharedViewPopup] = useState<SharedViewPayload | null>(null);

  // Apply shared view state synchronously on first render so Canvas3D picks up
  // the camera before it mounts. The ref guard prevents re-application on rerenders.
  const sharedViewAppliedRef = useRef(false);
  if (initialSharedView && !sharedViewAppliedRef.current) {
    sharedViewAppliedRef.current = true;
    deserializeSharedView(initialSharedView);
  }

  const querySeedAppliedRef = useRef(false);

  useEffect(() => {
    if (querySeedAppliedRef.current) {
      return;
    }

    const seed = initialQuerySeed ?? parseAtlasDeepLinkParams(
      new URLSearchParams(window.location.search),
      atlasIndex.countries
        .filter((country) => country.has_data)
        .map((country) => country.code),
    );

    if (!hasAtlasDeepLinkSeed(seed)) {
      return;
    }

    querySeedAppliedRef.current = true;
    applyAtlasDeepLinkSeed(seed, {
      addCountries,
      setColorMode,
      setFocusedClusterId,
      setFocusedCountryCode,
      setLastSearchQuery,
      setLastSemanticSearchQuery,
      setPendingSegmentId,
      setRestrictSearchToSelectedCountries,
    });
  }, [
    addCountries,
    atlasIndex.countries,
    initialQuerySeed,
    setColorMode,
    setFocusedClusterId,
    setFocusedCountryCode,
    setLastSearchQuery,
    setLastSemanticSearchQuery,
    setPendingSegmentId,
    setRestrictSearchToSelectedCountries,
  ]);

  // Show the popup after mount so the atlas has time to restore state first.
  useEffect(() => {
    if (initialSharedView) {
      setSharedViewPopup(initialSharedView);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore a pending segment point once the country data has loaded.
  useEffect(() => {
    if (!pendingSegmentId) return;
    for (const [countryCode, countryPoints] of Object.entries(loadedCountryData)) {
      const match = countryPoints.find((p) => p.id === pendingSegmentId);
      if (match) {
        setPendingSegmentId(null);
        setFocusedCountryCode(countryCode);
        setFocusedSegmentId(match.id);
        const country = atlasIndex.countries.find((c) => c.code === countryCode);
        handleSelectPoint({
          ...toAtlasSelectionPointFromSearchBase({
            id: match.id,
            article_id: match.article_id,
            text_snippet: match.text_snippet,
            country_code: countryCode,
            country_name: country?.name ?? countryCode,
            x: match.x,
            y: match.y,
            z: match.z,
            global_cluster: match.global_cluster,
          }),
          country_cluster: match.country_cluster,
          cluster_probability: match.cluster_probability,
        });
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedCountryData, pendingSegmentId]);

  const countryByCode = Object.fromEntries(
    atlasIndex.countries.map((country) => [country.code, country]),
  );
  const hasCountrySelection = selectedCountries.length > 0;
  const countryColors = buildCountryPalette(selectedCountries);
  const loadedPoints = buildLoadedPoints(loadedCountryData, countryByCode);
  const selectedCountriesSet = new Set(selectedCountries);
  const searchResultPoints = hasCountrySelection
    ? Array.from(
        new Map(
          [...searchResults, ...semanticSearchResults]
            .filter((result) => selectedCountriesSet.has(result.country_code))
            .map((result) => [
              result.id,
              "score" in result
                ? toSelectionPointFromSemanticSearchResult(result)
                : toSelectionPointFromSearchResult(result),
            ]),
        ).values(),
      )
    : [];
  const searchHighlightedPoints = restrictSearchToSelectedCountries
    ? searchResultPoints
    : [];
  const effectiveSelectedPoint =
    selectedPoint && selectedCountries.includes(selectedPoint.country_code)
      ? selectedPoint
      : null;
  const selectedCountryRecords = selectedCountries
    .map((countryCode) => countryByCode[countryCode])
    .filter(Boolean);

  useEffect(() => {
    const controller = new AbortController();

    async function loadArticle() {
      if (!selectedPoint) {
        setArticleDetail(null);
        setIsArticleLoading(false);
        return;
      }

      const cached = articleCache.current[selectedPoint.id];
      if (cached) {
        setArticleDetail(cached);
        setIsArticleLoading(false);
        return;
      }

      setIsArticleLoading(true);
      try {
        const response = await fetch(
          `/api/article?${new URLSearchParams({
            id: selectedPoint.id,
            country_code: selectedPoint.country_code,
            article_id: selectedPoint.article_id,
          }).toString()}`,
          {signal: controller.signal},
        );
        if (!response.ok) {
          throw new Error(`Article request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as ArticleDetail;
        if (!controller.signal.aborted) {
          articleCache.current[selectedPoint.id] = payload;
          setArticleDetail(payload);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (
          error instanceof Error
          && error.message.includes("status 429")
        ) {
          setArticleDetail(articleCache.current[selectedPoint.id] ?? null);
        } else {
          console.error("Article detail load failed", error);
          setArticleDetail((currentDetail) =>
            currentDetail && currentDetail.id === selectedPoint.id ? currentDetail : null,
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsArticleLoading(false);
        }
      }
    }

    void loadArticle();

    return () => {
      controller.abort();
    };
  }, [selectedPoint]);

  function handleSelectPoint(point: AtlasSelectionPoint) {
    if (selectedPoint?.id === point.id) {
      return;
    }
    setArticleDetail(null);
    setIsArticleLoading(true);
    setSelectedPoint(point);
    if (!selectedCountries.includes(point.country_code)) {
      addCountries([point.country_code]);
    }
  }

  function handleSelectSearchResult(result: SearchResult) {
    handleSelectPoint(toSelectionPointFromSearchResult(result));
  }

  function handleSelectSemanticSearchResult(result: SemanticSearchResult) {
    handleSelectPoint(toSelectionPointFromSemanticSearchResult(result));
  }

  return (
    <CountryIndexProvider countries={atlasIndex.countries}>
      <main className="mx-auto flex w-full max-w-[1560px] flex-col gap-6 px-6 pb-6 pt-7">
        <section className="flex flex-col gap-6">
          <div className="grid gap-6 xl:grid-cols-12">
            <div className="min-h-0 xl:col-span-7 xl:h-[39rem] 2xl:h-[41rem]">
              <WorldMap
                countries={atlasIndex.countries}
                selectedCountries={selectedCountries}
                loadingCountries={loadingCountries}
                countryColors={countryColors}
                onToggleCountry={toggleCountrySelection}
              />
            </div>
            <div className="min-h-0 xl:col-span-5 xl:h-[39rem] 2xl:h-[41rem]">
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
          </div>
          <SearchPanel
            onSelectKeywordResult={handleSelectSearchResult}
            onSelectSemanticResult={handleSelectSemanticSearchResult}
          />
        </section>

        {errorCountry ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {t("countryLoadError", {country: errorCountry})}
          </div>
        ) : null}

        <Canvas3D
          points={hasCountrySelection ? loadedPoints : []}
          searchHighlightedPoints={searchHighlightedPoints}
          searchResultPoints={searchResultPoints}
          selectedCountries={selectedCountries}
          loadingCountries={loadingCountries}
          selectedPoint={hasCountrySelection ? effectiveSelectedPoint : null}
          countryColors={countryColors}
          colorMode={colorMode}
          articleDetail={articleDetail}
          isArticleLoading={isArticleLoading}
          onSelectPoint={handleSelectPoint}
          onSetColorMode={setColorMode}
          onShare={() => setIsShareModalOpen(true)}
          sharedView={initialSharedView}
          onShowSharedView={initialSharedView ? () => setSharedViewPopup(initialSharedView) : undefined}
        />

        <ClusterReachPanel clusters={clusters} />

        <StatsPanel countries={selectedCountryRecords} />
      </main>

      {isShareModalOpen && (
        <ShareModal onClose={() => setIsShareModalOpen(false)} />
      )}

      {sharedViewPopup && (
        <SharedViewPopup
          view={sharedViewPopup}
          onDismiss={() => setSharedViewPopup(null)}
        />
      )}
    </CountryIndexProvider>
  );
}

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
      points.push(toAtlasSelectionPointFromSearchBase({
        id: point.id,
        article_id: point.article_id,
        text_snippet: point.text_snippet,
        country_code: countryCode,
        country_name: country.name,
        x: point.x,
        y: point.y,
        z: point.z,
        global_cluster: point.global_cluster,
      }, {
        country_cluster: point.country_cluster,
        cluster_probability: point.cluster_probability,
      }));
    }
  }

  return points;
}

function toSelectionPointFromSearchResult(result: SearchResult): AtlasSelectionPoint {
  return toAtlasSelectionPointFromSearchBase(result, {rank: result.rank});
}

function toSelectionPointFromSemanticSearchResult(
  result: SemanticSearchResult,
): AtlasSelectionPoint {
  return toAtlasSelectionPointFromSearchBase(result, {semantic_score: result.score});
}
