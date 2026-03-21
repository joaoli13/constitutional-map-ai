"use client";

import {useEffect, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";

import {serializeAtlasState} from "@/lib/share-state";
import {useAppStore} from "@/stores/appStore";

type ShareModalProps = {
  onClose: () => void;
};

export default function ShareModal({onClose}: ShareModalProps) {
  const t = useTranslations("Share");
  const locale = useLocale();
  const cameraState = useAppStore((s) => s.cameraState);

  const [title, setTitle] = useState("");
  const [observation, setObservation] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const stateSnapshot = serializeAtlasState(cameraState);
      const payload = {
        ...stateSnapshot,
        title: title.trim(),
        observation: observation.trim(),
        author_name: authorName.trim() || null,
        locale,
      };

      const response = await fetch("/api/share", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        setError(t("errorRateLimit"));
        return;
      }
      if (!response.ok) {
        const data = (await response.json()) as {error?: string};
        setError(data.error ?? t("errorGeneric"));
        return;
      }

      const data = (await response.json()) as {url: string};
      setSharedUrl(data.url);
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!sharedUrl) return;
    await navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative mx-4 w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white/95 px-7 py-7 shadow-[0_24px_64px_rgba(15,23,42,0.14)] backdrop-blur">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">{t("modalTitle")}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{t("modalSubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={t("close")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {sharedUrl ? (
          /* Success state */
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{t("successMessage")}</p>
            <div className="flex items-center gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{sharedUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-[0.6rem] bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 active:scale-95"
              >
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-[1rem] border border-slate-200 py-2 text-sm text-slate-500 transition hover:bg-slate-50"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                {t("titleLabel")}
                <span className="ml-1 text-rose-500">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder={t("titlePlaceholder")}
                required
                className="w-full rounded-[0.9rem] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              <span className="mt-1 block text-right text-[10px] text-slate-400">
                {title.length}/120
              </span>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                {t("observationLabel")}
                <span className="ml-1 text-rose-500">*</span>
              </label>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder={t("observationPlaceholder")}
                required
                className="w-full resize-none rounded-[0.9rem] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              <span className="mt-1 block text-right text-[10px] text-slate-400">
                {observation.length}/1000
              </span>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                {t("authorLabel")}
                <span className="ml-1 text-[10px] font-normal text-slate-400">
                  {t("optional")}
                </span>
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={80}
                placeholder={t("authorPlaceholder")}
                className="w-full rounded-[0.9rem] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {error && (
              <p className="rounded-[0.75rem] border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !observation.trim()}
              className="w-full rounded-[1rem] bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40 active:scale-[0.98]"
            >
              {isSubmitting ? t("generating") : t("generate")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
