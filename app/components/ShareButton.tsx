"use client";

import {useTranslations} from "next-intl";

type ShareButtonProps = {
  onClick: () => void;
};

export default function ShareButton({onClick}: ShareButtonProps) {
  const t = useTranslations("Share");

  return (
    <button
      type="button"
      onClick={onClick}
      title={t("buttonTitle")}
      className="flex items-center gap-1.5 rounded-[0.75rem] border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white hover:text-slate-800 active:scale-95"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="13" cy="3" r="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="3" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="13" cy="13" r="2" stroke="currentColor" strokeWidth="1.4" />
        <line x1="5" y1="7" x2="11" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="5" y1="9" x2="11" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {t("buttonLabel")}
    </button>
  );
}
