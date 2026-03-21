"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

import ExportModal from "@/components/ExportModal";
import KeywordSearchSubPanel from "@/components/KeywordSearchSubPanel";
import SemanticSearchSubPanel from "@/components/SemanticSearchSubPanel";
import {useAppStore} from "@/stores/appStore";
import type {SearchResult, SemanticSearchResult} from "@/lib/types";

type SearchPanelProps = {
  onSelectKeywordResult: (result: SearchResult) => void;
  onSelectSemanticResult: (result: SemanticSearchResult) => void;
};

export default function SearchPanel({
  onSelectKeywordResult,
  onSelectSemanticResult,
}: SearchPanelProps) {
  const t = useTranslations("Atlas.SearchPanel");
  const searchResults = useAppStore((state) => state.searchResults);
  const semanticSearchResults = useAppStore((state) => state.semanticSearchResults);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const hasAnyResults = searchResults.length > 0 || semanticSearchResults.length > 0;

  // Combined export: semantic first, then keyword results whose id is not already present.
  const combinedExportItems = (() => {
    const seen = new Set<string>();
    const items: {id: string; country_code: string; country_name: string; article_id: string; text_snippet: string}[] = [];
    for (const r of semanticSearchResults) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        items.push({
          id: r.id,
          country_code: r.country_code,
          country_name: r.country_name,
          article_id: r.article_id,
          text_snippet: r.text_snippet,
        });
      }
    }
    for (const r of searchResults) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        items.push({
          id: r.id,
          country_code: r.country_code,
          country_name: r.country_name,
          article_id: r.article_id,
          text_snippet: r.text_snippet,
        });
      }
    }
    return items;
  })();

  return (
    <div className="rounded-[2rem] border border-slate-400/70 bg-slate-50/40 px-5 pt-4 pb-5">
      {/* Shell header — estrutura, não protagonismo */}
      <div className="mb-4 flex items-center justify-between px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-600">
          {t("label")}
        </p>
        <button
          className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          disabled={!hasAnyResults}
          onClick={() => setIsExportModalOpen(true)}
        >
          {t("exportAll")}
        </button>
      </div>

      {/* Cards: overflow negativo só no desktop para efeito de float */}
      <div className="grid gap-6 xl:grid-cols-2 xl:-mx-3 xl:-mb-3">
        <KeywordSearchSubPanel onSelectResult={onSelectKeywordResult} />
        <SemanticSearchSubPanel onSelectResult={onSelectSemanticResult} />
      </div>

      {isExportModalOpen && (
        <ExportModal
          scope="combined"
          results={combinedExportItems}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}
