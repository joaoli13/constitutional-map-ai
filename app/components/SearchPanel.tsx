"use client";

import {KeyboardEvent, useEffect, useRef, useState} from "react";
import {useTranslations} from "next-intl";

import {useFullscreen} from "@/hooks/useFullscreen";
import {highlightTerms} from "@/lib/highlight";
import {useAppStore} from "@/stores/appStore";
import type {SearchResponse, SearchResult} from "@/lib/types";

type SearchPanelProps = {
  onSelectResult: (result: SearchResult) => void;
};

export default function SearchPanel({onSelectResult}: SearchPanelProps) {
  const t = useTranslations("Atlas.Search");
  const {ref, isFullscreen, toggleFullscreen} = useFullscreen<HTMLElement>();
  const selectedCountries = useAppStore((state) => state.selectedCountries);
  const searchResults = useAppStore((state) => state.searchResults);
  const restrictSearchToSelectedCountries = useAppStore(
    (state) => state.restrictSearchToSelectedCountries,
  );
  const setSearchResults = useAppStore((state) => state.setSearchResults);
  const setLastSearchQuery = useAppStore((state) => state.setLastSearchQuery);
  const setRestrictSearchToSelectedCountries = useAppStore(
    (state) => state.setRestrictSearchToSelectedCountries,
  );
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [showAdvancedHelp, setShowAdvancedHelp] = useState(false);
  const hasSelectedCountries = selectedCountries.length > 0;
  const hasActiveSearch = query.trim().length > 0 || searchResults.length > 0 || resultCount !== null;
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

  async function runSearch(text: string) {
    const normalized = text.trim();
    if (!normalized) {
      setSearchResults([]);
      setResultCount(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({q: normalized, limit: "70"});
      if (restrictSearchToSelectedCountries && hasSelectedCountries) {
        params.set("countries", selectedCountries.join(","));
      }

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const payload = (await response.json()) as SearchResponse;
      setSearchResults(payload.results);
      setLastSearchQuery(normalized);
      setResultCount(payload.total);
    } catch (searchError) {
      console.error("Search request failed", searchError);
      setSearchResults([]);
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
    setSearchResults([]);
    setLastSearchQuery("");
  }

  return (
    <section
      ref={ref}
      className={`rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
        isFullscreen ? "flex h-full flex-col rounded-none border-0 p-5 shadow-none" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {t("eyebrow")}
          </p>
          <h2 className="mt-1.5 text-[1.95rem] font-semibold leading-tight text-slate-950">
            {t("title")}
          </h2>
        </div>
        <button
          className="flex-shrink-0 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
          type="button"
          onClick={() => void toggleFullscreen()}
        >
          {isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
        </button>
      </div>

      <form className="mt-3 flex gap-2" onSubmit={handleSubmit}>
        <textarea
          className="min-w-0 flex-1 resize-none rounded-2xl border border-slate-300 bg-[#f7f4ee] px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          placeholder={t("placeholder")}
          rows={2}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
        />
        <button
          className="flex-shrink-0 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          disabled={!hasActiveSearch || isSearching}
          onClick={handleClearSearch}
        >
          {t("clear")}
        </button>
        <button
          className="flex-shrink-0 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={isSearching}
        >
          {isSearching ? "…" : t("submit")}
        </button>
      </form>

      <div className="mt-2 flex items-center gap-3">
        {t("languageHint") && (
          <p className="text-[11px] text-slate-400">{t("languageHint")}</p>
        )}
        <button
          className="ml-auto flex-shrink-0 text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          type="button"
          onClick={() => setShowAdvancedHelp((v) => !v)}
        >
          {t("advancedSearchToggle")} {showAdvancedHelp ? "▴" : "▾"}
        </button>
      </div>

      {showAdvancedHelp && (
        <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-600">
          <p className="font-medium text-slate-700">{t("advancedSearchDesc")}</p>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-white px-3 py-2.5 font-mono text-[10.5px] leading-5 text-slate-800 ring-1 ring-slate-200">{
`((supreme OR constitutional) AND (court OR tribunal))
AND (appoint* OR nomina* OR elect*)
AND (president OR senate OR parliament)`
          }</pre>
          <button
            className="mt-2 rounded-lg bg-slate-950 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            type="button"
            disabled={isSearching}
            onClick={() => {
              const example = `((supreme OR constitutional) AND (court OR tribunal)) AND (appoint* OR nomina* OR elect*) AND (president OR senate OR parliament)`;
              setQuery(example);
              setShowAdvancedHelp(false);
              void runSearch(example);
            }}
          >
            {isSearching ? "…" : t("advancedSearchTryExample")}
          </button>
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
          className="size-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
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

      <div className={`mt-3 ${isFullscreen ? "flex min-h-0 flex-1 flex-col" : "space-y-2.5"}`}>
        {searchResults.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">
            {t("empty")}
          </div>
        ) : (
          <div className={`${isFullscreen ? "flex min-h-0 flex-1 flex-col" : "space-y-2.5"}`}>
            <div
              className={`visible-scrollbar space-y-2.5 overflow-y-scroll pr-2 ${
                isFullscreen ? "min-h-0 flex-1" : "max-h-[230px]"
              }`}
            >
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  className="grid w-full gap-2 rounded-[1.1rem] border border-slate-200 bg-[#fbfaf7] px-4 py-3 text-left transition hover:border-slate-500"
                  type="button"
                  onClick={() => onSelectResult(result)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-semibold text-white">
                      {result.country_code}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {result.country_name}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {result.article_id}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {highlightTerms(result.text_snippet, query)}
                  </p>
                </button>
              ))}
            </div>
            {resultCount !== null ? (
              <div className="mt-3 border-t border-slate-200 px-1 pt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("resultsCount", {count: resultCount})}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

