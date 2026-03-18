"use client";

import {FormEvent, useEffect, useState} from "react";
import {useTranslations} from "next-intl";

import {useFullscreen} from "@/hooks/useFullscreen";
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
  const setRestrictSearchToSelectedCountries = useAppStore(
    (state) => state.setRestrictSearchToSelectedCountries,
  );
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const hasSelectedCountries = selectedCountries.length > 0;
  const hasActiveSearch = query.trim().length > 0 || searchResults.length > 0 || resultCount !== null;

  useEffect(() => {
    if (!hasSelectedCountries && restrictSearchToSelectedCountries) {
      setRestrictSearchToSelectedCountries(false);
    }
  }, [
    hasSelectedCountries,
    restrictSearchToSelectedCountries,
    setRestrictSearchToSelectedCountries,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    if (!normalized) {
      setSearchResults([]);
      setResultCount(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({q: normalized, limit: "20"});
      if (restrictSearchToSelectedCountries && hasSelectedCountries) {
        params.set("countries", selectedCountries.join(","));
      }

      const response = await fetch(
        `/api/search?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const payload = (await response.json()) as SearchResponse;
      setSearchResults(payload.results);
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

  function handleClearSearch() {
    setQuery("");
    setError(null);
    setResultCount(null);
    setSearchResults([]);
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
        <input
          className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-[#f7f4ee] px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          placeholder={t("placeholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
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

function highlightTerms(text: string, query: string) {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) {
    return text;
  }

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) =>
    terms.includes(part.toLowerCase()) ? (
      <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-1 text-slate-950">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
