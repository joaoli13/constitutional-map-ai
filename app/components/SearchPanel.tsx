"use client";

import {FormEvent, useState} from "react";
import {useTranslations} from "next-intl";

import {useAppStore} from "@/stores/appStore";
import type {SearchResult} from "@/lib/types";

type SearchPanelProps = {
  onSelectResult: (result: SearchResult) => void;
};

export default function SearchPanel({onSelectResult}: SearchPanelProps) {
  const t = useTranslations("Atlas.Search");
  const searchResults = useAppStore((state) => state.searchResults);
  const setSearchResults = useAppStore((state) => state.setSearchResults);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    if (!normalized) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?${new URLSearchParams({q: normalized, limit: "20"}).toString()}`,
      );
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const payload = await response.json();
      setSearchResults(payload.results);
    } catch (searchError) {
      console.error("Search request failed", searchError);
      setSearchResults([]);
      setError(t("error"));
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        {t("eyebrow")}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{t("title")}</h2>

      <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
        <input
          className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-[#f7f4ee] px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          placeholder={t("placeholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          className="flex-shrink-0 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={isSearching}
        >
          {isSearching ? "…" : t("submit")}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {searchResults.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
            {t("empty")}
          </div>
        ) : (
          searchResults.map((result) => (
            <button
              key={result.id}
              className="grid w-full gap-2 rounded-[1.25rem] border border-slate-200 bg-[#fbfaf7] px-4 py-4 text-left transition hover:border-slate-500"
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
          ))
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
