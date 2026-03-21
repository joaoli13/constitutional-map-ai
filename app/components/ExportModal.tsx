"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

import {fetchArticleDetailForResult} from "@/lib/article-client";
import {
  toJson,
  toCsv,
  toMarkdown,
  toHtml,
  toXml,
  toXlsx,
  triggerDownload,
  type ExportItem,
  type ExportFormat,
} from "@/lib/export";

export type ExportScope = "keyword" | "semantic" | "combined";

type ExportModalProps = {
  scope: ExportScope;
  results: ExportItem[];
  onClose: () => void;
};

function buildDownloadPrefix(scope: ExportScope): string {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `ConstMap-${year}${month}${day}-${hours}${minutes}${seconds}-${scope}`;
}

export default function ExportModal({scope, results, onClose}: ExportModalProps) {
  const t = useTranslations("Export");
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(results.map((r) => r.id)),
  );
  const [format, setFormat] = useState<ExportFormat>("json");
  const [sortByCountry, setSortByCountry] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "error">("idle");

  const selectedItems = results.filter((r) => checked.has(r.id));

  function toggleItem(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (checked.size === results.length) {
      setChecked(new Set());
    } else {
      setChecked(new Set(results.map((r) => r.id)));
    }
  }

  async function buildItems() {
    const itemsWithText = await Promise.all(
      selectedItems.map(async (item) => {
        try {
          const detail = await fetchArticleDetailForResult(item);
          return {...item, full_text: detail.text};
        } catch {
          return item;
        }
      }),
    );
    if (sortByCountry) {
      itemsWithText.sort((a, b) => {
        const country = a.country_name.localeCompare(b.country_name);
        return country !== 0 ? country : a.article_id.localeCompare(b.article_id);
      });
    }
    return itemsWithText;
  }

  async function handleCopy() {
    if (selectedItems.length === 0 || format === "xlsx") return;
    setCopyState("copying");
    try {
      const items = await buildItems();
      let text: string;
      if (format === "json") text = toJson(items);
      else if (format === "csv") text = toCsv(items);
      else if (format === "xml") text = toXml(items);
      else if (format === "html") text = toHtml(items);
      else text = toMarkdown(items);
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  async function handleDownload() {
    if (selectedItems.length === 0) return;
    setIsDownloading(true);
    try {
      const itemsWithText = await buildItems();
      const prefix = buildDownloadPrefix(scope);
      if (format === "json") {
        triggerDownload(toJson(itemsWithText), `${prefix}.json`, "application/json");
      } else if (format === "csv") {
        triggerDownload(toCsv(itemsWithText), `${prefix}.csv`, "text/csv");
      } else if (format === "xml") {
        triggerDownload(toXml(itemsWithText), `${prefix}.xml`, "application/xml");
      } else if (format === "xlsx") {
        const bytes = await toXlsx(itemsWithText);
        triggerDownload(
          bytes,
          `${prefix}.xlsx`,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
      } else if (format === "md") {
        triggerDownload(toMarkdown(itemsWithText), `${prefix}.md`, "text/markdown");
      } else if (format === "html") {
        triggerDownload(toHtml(itemsWithText), `${prefix}.html`, "text/html");
      }
    } finally {
      setIsDownloading(false);
    }
  }

  const titleKey =
    scope === "keyword"
      ? "titleKeyword"
      : scope === "semantic"
        ? "titleSemantic"
        : "titleCombined";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative mx-4 w-full max-w-lg rounded-[2rem] border border-slate-200/80 bg-white/95 px-7 py-7 shadow-[0_24px_64px_rgba(15,23,42,0.14)] backdrop-blur">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">
              {t(titleKey)}
            </h2>
            {scope === "combined" && (
              <p className="mt-0.5 text-xs text-slate-500">{t("combinedNote")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={t("cancel")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {results.length === 0 ? (
          <p className="text-sm text-slate-500">{t("noResults")}</p>
        ) : (
          <div className="space-y-4">
            {/* Select all toggle */}
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                className="size-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                checked={checked.size === results.length}
                onChange={toggleAll}
              />
              {t("selectAll")} ({results.length})
            </label>

            {/* Checklist */}
            <div className="visible-scrollbar max-h-48 space-y-1.5 overflow-y-auto rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
              {results.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                    checked={checked.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-slate-800">
                      {item.country_name} · {item.article_id}
                    </span>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-500">
                      {item.text_snippet}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Format selector */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-700">{t("formatLabel")}</p>
              <div className="flex gap-2">
                {(["json", "csv", "xml", "xlsx", "md", "html"] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition ${
                      format === fmt
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort option */}
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                className="size-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                checked={sortByCountry}
                onChange={(e) => setSortByCountry(e.target.checked)}
              />
              {t("sortByCountry")}
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-[1rem] border border-slate-200 py-2.5 text-sm text-slate-500 transition hover:bg-slate-50"
              >
                {t("cancel")}
              </button>
              {format !== "xlsx" && (
                <button
                  type="button"
                  disabled={selectedItems.length === 0 || copyState === "copying"}
                  onClick={() => void handleCopy()}
                  className={`flex-1 rounded-[1rem] border py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:opacity-40 ${
                    copyState === "copied"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : copyState === "error"
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {copyState === "copied" ? (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : copyState !== "copying" ? (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="5" y="1" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M3 4H2.5A1.5 1.5 0 0 0 1 5.5v9A1.5 1.5 0 0 0 2.5 16h7A1.5 1.5 0 0 0 11 14.5V14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    ) : null}
                    {copyState === "copied"
                      ? t("copied")
                      : copyState === "error"
                        ? t("copyError")
                        : copyState === "copying"
                          ? "…"
                          : t("copy")}
                  </span>
                </button>
              )}
              <button
                type="button"
                disabled={selectedItems.length === 0 || isDownloading}
                onClick={() => void handleDownload()}
                className="flex-1 rounded-[1rem] bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40 active:scale-[0.98]"
              >
                {isDownloading ? "…" : t("download", {count: selectedItems.length})}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
