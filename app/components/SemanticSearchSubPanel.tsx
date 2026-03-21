"use client";

import {KeyboardEvent, useEffect, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";

import {CountryBadge} from "@/components/CountryBadge";
import ExportModal from "@/components/ExportModal";
import {fetchArticleDetailForResult} from "@/lib/article-client";
import {useFullscreen} from "@/hooks/useFullscreen";
import {highlightTerms} from "@/lib/highlight";
import {SEARCH_PANEL_LIMIT} from "@/lib/search-config";
import {useAppStore} from "@/stores/appStore";
import type {SemanticSearchResponse, SemanticSearchResult} from "@/lib/types";

type SemanticSearchSubPanelProps = {
  onSelectResult: (result: SemanticSearchResult) => void;
};

export default function SemanticSearchSubPanel({
  onSelectResult,
}: SemanticSearchSubPanelProps) {
  const t = useTranslations("Atlas.SemanticSearch");
  const locale = useLocale();
  const exampleQuery = t("exampleQuery");
  const showLocalizedExample = ["pt", "es", "it", "fr", "ja", "zh"].includes(locale);
  const localizedExampleQuery = showLocalizedExample ? t("localizedExampleQuery") : "";
  const {ref, isFullscreen, toggleFullscreen} = useFullscreen<HTMLElement>();
  const selectedCountries = useAppStore((state) => state.selectedCountries);
  const semanticSearchResults = useAppStore((state) => state.semanticSearchResults);
  const restrictSearchToSelectedCountries = useAppStore(
    (state) => state.restrictSearchToSelectedCountries,
  );
  const setSemanticSearchResults = useAppStore(
    (state) => state.setSemanticSearchResults,
  );
  const setLastSemanticSearchQuery = useAppStore(
    (state) => state.setLastSemanticSearchQuery,
  );
  const setRestrictSearchToSelectedCountries = useAppStore(
    (state) => state.setRestrictSearchToSelectedCountries,
  );
  const [query, setQuery] = useState(() => useAppStore.getState().lastSemanticSearchQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [expandedArticleTexts, setExpandedArticleTexts] = useState<Record<string, string>>({});
  const [loadingExpandedResultId, setLoadingExpandedResultId] = useState<string | null>(null);
  const [expandedResultError, setExpandedResultError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const hasSelectedCountries = selectedCountries.length > 0;
  const hasActiveSearch = query.trim().length > 0
    || semanticSearchResults.length > 0
    || resultCount !== null;
  const prevHasCountries = useRef(hasSelectedCountries);

  useEffect(() => {
    if (!hasSelectedCountries) {
      setRestrictSearchToSelectedCountries(false);
      prevHasCountries.current = false;
    } else if (!prevHasCountries.current) {
      setRestrictSearchToSelectedCountries(true);
      prevHasCountries.current = true;
    }
  }, [hasSelectedCountries, setRestrictSearchToSelectedCountries]);

  // Auto-run search on mount when restoring a shared view
  const initialQueryRef = useRef(useAppStore.getState().lastSemanticSearchQuery);
  useEffect(() => {
    if (initialQueryRef.current && semanticSearchResults.length === 0) {
      void runSearch(initialQueryRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(text: string) {
    const normalized = text.trim();
    if (!normalized) {
      setSemanticSearchResults([]);
      setResultCount(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: normalized,
        limit: String(SEARCH_PANEL_LIMIT),
      });
      if (restrictSearchToSelectedCountries && hasSelectedCountries) {
        params.set("countries", selectedCountries.join(","));
      }

      const response = await fetch(`/api/semantic-search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Semantic search failed with status ${response.status}`);
      }

      const payload = (await response.json()) as SemanticSearchResponse;
      setSemanticSearchResults(payload.results);
      setLastSemanticSearchQuery(normalized);
      setResultCount(payload.total);
      setExpandedResultId(null);
      setExpandedResultError(null);
    } catch (searchError) {
      console.error("Semantic search request failed", searchError);
      setSemanticSearchResults([]);
      setResultCount(null);
      setError(t("error"));
    } finally {
      setIsSearching(false);
    }
  }

  function handleSubmit(event: {preventDefault(): void}) {
    event.preventDefault();
    void runSearch(query);
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void runSearch(query);
    }
  }

  function handleClearSearch() {
    setQuery("");
    setError(null);
    setResultCount(null);
    setSemanticSearchResults([]);
    setLastSemanticSearchQuery("");
    setExpandedResultId(null);
    setExpandedResultError(null);
  }

  async function handleToggleExpandedResult(result: SemanticSearchResult) {
    onSelectResult(result);
    if (expandedResultId === result.id) {
      setExpandedResultId(null);
      setExpandedResultError(null);
      return;
    }

    setExpandedResultId(result.id);
    setExpandedResultError(null);

    if (expandedArticleTexts[result.id]) {
      return;
    }

    setLoadingExpandedResultId(result.id);
    try {
      const article = await fetchArticleDetailForResult(result);
      setExpandedArticleTexts((current) => ({
        ...current,
        [result.id]: article.text,
      }));
    } catch (articleError) {
      console.error("Semantic result full text load failed", articleError);
      setExpandedResultError(t("fullTextUnavailable"));
    } finally {
      setLoadingExpandedResultId((current) =>
        current === result.id ? null : current,
      );
    }
  }

  const exportItems = semanticSearchResults.map((r) => ({
    id: r.id,
    country_code: r.country_code,
    country_name: r.country_name,
    article_id: r.article_id,
    text_snippet: r.text_snippet,
  }));

  return (
    <section
      ref={ref}
      className={`flex flex-col rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-[0_24px_64px_rgba(15,23,42,0.13)] ${
        isFullscreen ? "rounded-none border-0 p-5 shadow-none" : ""
      } h-full`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {t("eyebrow")}
          </p>
          <h2 className="mt-1.5 text-[1.45rem] font-semibold leading-tight text-slate-950">
            {t("title")}
          </h2>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={!hasActiveSearch || isSearching}
            onClick={handleClearSearch}
          >
            {t("clear")}
          </button>
          <button
            className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={semanticSearchResults.length === 0}
            onClick={() => setIsExportModalOpen(true)}
          >
            {t("exportButton")}
          </button>
          <button
            className="hidden rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950 sm:inline-flex"
            type="button"
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
          </button>
        </div>
      </div>

      <form className="mt-3 flex gap-2" onSubmit={handleSubmit}>
        <textarea
          className="min-w-0 flex-1 resize-none rounded-2xl border border-slate-300 bg-[#f2f6f1] px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          placeholder={t("placeholder")}
          rows={2}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
        />
        <button
          className="flex-shrink-0 rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={isSearching}
        >
          {isSearching ? "…" : t("submit")}
        </button>
      </form>

      <div className="mt-2 flex items-center gap-3">
        {t("languageHint") ? (
          <p className="text-[11px] text-slate-400">{t("languageHint")}</p>
        ) : null}
        <button
          className="ml-auto flex-shrink-0 text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          type="button"
          onClick={() => setShowExample((v) => !v)}
        >
          {t("exampleToggle")} {showExample ? "▴" : "▾"}
        </button>
      </div>

      {showExample && (
        <div className="mt-2 space-y-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-900/70">
                  {t("exampleLabel")}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {exampleQuery}
                </p>
              </div>
              <button
                className="flex-shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50"
                type="button"
                disabled={isSearching}
                onClick={() => {
                  setQuery(exampleQuery);
                  setShowExample(false);
                  void runSearch(exampleQuery);
                }}
              >
                {isSearching ? "…" : t("exampleTry")}
              </button>
            </div>
          </div>

          {showLocalizedExample ? (
            <div className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-900/70">
                    {t("localizedExampleLabel")}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {localizedExampleQuery}
                  </p>
                </div>
                <button
                  className="flex-shrink-0 rounded-full bg-teal-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"
                  type="button"
                  disabled={isSearching}
                  onClick={() => {
                    setQuery(localizedExampleQuery);
                    setShowExample(false);
                    void runSearch(localizedExampleQuery);
                  }}
                >
                  {isSearching ? "…" : t("localizedExampleTry")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <label
        className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
          hasSelectedCountries
            ? "border-slate-200 bg-slate-50 text-slate-700"
            : "border-slate-200 bg-slate-50/60 text-slate-400"
        }`}
      >
        <input
          className="size-4 rounded border-slate-300 text-emerald-900 focus:ring-emerald-400"
          type="checkbox"
          checked={restrictSearchToSelectedCountries}
          disabled={!hasSelectedCountries}
          onChange={(event) =>
            setRestrictSearchToSelectedCountries(event.target.checked)
          }
        />
        <span>
          {hasSelectedCountries
            ? t("restrictToSelectedAndHighlight", {count: selectedCountries.length})
            : t("restrictToSelectedDisabled")}
        </span>
      </label>

      {error ? (
        <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-3">
        {semanticSearchResults.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">
            {t("empty")}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div
              className="visible-scrollbar space-y-2.5 overflow-y-scroll pr-2 max-h-[250px]"
            >
              {semanticSearchResults.map((result) => (
                isFullscreen ? (
                  <div
                    key={result.id}
                    className="overflow-hidden rounded-[1.1rem] border border-slate-200 bg-[#f7fbf5]"
                  >
                    <button
                      className="grid w-full gap-2 px-4 py-3 text-left transition hover:bg-white"
                      type="button"
                      onClick={() => void handleToggleExpandedResult(result)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <CountryBadge
                          countryCode={result.country_code}
                          countryName={result.country_name}
                          tone="emerald"
                        />
                        <span className="text-sm font-semibold text-slate-900">
                          {result.country_name}
                        </span>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          {result.article_id}
                        </span>
                        <span className="ml-auto rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-900">
                          {t("scoreLabel")}: {result.score.toFixed(3)}
                        </span>
                        <span className="text-sm text-slate-400">
                          {expandedResultId === result.id ? "▴" : "▾"}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        {highlightTerms(result.text_snippet, query, "plain")}
                      </p>
                    </button>
                    {expandedResultId === result.id ? (
                      <div className="border-t border-slate-200 bg-white/80 px-4 py-4">
                        {loadingExpandedResultId === result.id ? (
                          <p className="text-sm text-slate-500">{t("loadingFullText")}</p>
                        ) : expandedResultError ? (
                          <p className="text-sm text-rose-700">{expandedResultError}</p>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                            {expandedArticleTexts[result.id] ?? result.text_snippet}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <button
                    key={result.id}
                    className="grid w-full gap-2 rounded-[1.1rem] border border-slate-200 bg-[#f7fbf5] px-4 py-3 text-left transition hover:border-emerald-500"
                    type="button"
                    onClick={() => onSelectResult(result)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <CountryBadge
                        countryCode={result.country_code}
                        countryName={result.country_name}
                        tone="emerald"
                      />
                      <span className="text-sm font-semibold text-slate-900">
                        {result.country_name}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {result.article_id}
                      </span>
                      <span className="ml-auto rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-900">
                        {t("scoreLabel")}: {result.score.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      {highlightTerms(result.text_snippet, query, "plain")}
                    </p>
                  </button>
                )
              ))}
            </div>
            {resultCount !== null ? (
              <div className="mt-3 border-t border-slate-200 px-1 pt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("resultsCount", {
                  shown: semanticSearchResults.length,
                  total: resultCount,
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {isExportModalOpen && (
        <ExportModal
          scope="semantic"
          results={exportItems}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </section>
  );
}
