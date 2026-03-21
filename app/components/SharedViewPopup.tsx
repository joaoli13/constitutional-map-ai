"use client";

import {useTranslations} from "next-intl";

import type {SharedViewPayload} from "@/lib/types";

type SharedViewPopupProps = {
  view: SharedViewPayload;
  onDismiss: () => void;
};

export default function SharedViewPopup({view, onDismiss}: SharedViewPopupProps) {
  const t = useTranslations("Share");

  const formattedDate = view.created_at
    ? new Date(view.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 sm:items-center sm:pb-0">
      <div
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
        onClick={onDismiss}
      />
      <div className="relative mx-4 w-full max-w-lg rounded-[2rem] border border-slate-200/80 bg-white/95 px-7 py-6 shadow-[0_24px_64px_rgba(15,23,42,0.16)] backdrop-blur">
        {/* Eyebrow */}
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          {t("popupEyebrow")}
        </p>

        {/* Title */}
        <h2 className="text-[18px] font-semibold leading-snug text-slate-900">
          {view.title}
        </h2>

        {/* Observation */}
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {view.observation}
        </p>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          {view.author_name && (
            <span className="font-medium text-slate-500">{view.author_name}</span>
          )}
          {formattedDate && <span>{formattedDate}</span>}
          {view.countries && view.countries.length > 0 && (
            <span>
              {t("popupCountries", {count: view.countries.length})}
            </span>
          )}
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 w-full rounded-[1rem] border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
        >
          {t("popupDismiss")}
        </button>
      </div>
    </div>
  );
}
