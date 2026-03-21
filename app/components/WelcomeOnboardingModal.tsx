"use client";

import {useEffect} from "react";
import {useTranslations} from "next-intl";

type WelcomeOnboardingModalProps = {
  isOpen: boolean;
  onDismiss: () => void;
};

export default function WelcomeOnboardingModal({
  isOpen,
  onDismiss,
}: WelcomeOnboardingModalProps) {
  const t = useTranslations("WelcomeOnboarding");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onDismiss]);

  if (!isOpen) {
    return null;
  }

  const steps = [
    {
      title: t("step1Title"),
      body: t("step1Body"),
      accent: "bg-amber-50 text-amber-900 ring-amber-100",
    },
    {
      title: t("step2Title"),
      body: t("step2Body"),
      accent: "bg-emerald-50 text-emerald-900 ring-emerald-100",
    },
    {
      title: t("step3Title"),
      body: t("step3Body"),
      accent: "bg-sky-50 text-sky-900 ring-sky-100",
    },
  ];

  const secondaryActions = [
    t("secondaryExport"),
    t("secondaryShare"),
    t("secondaryStats"),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onDismiss()}
    >
      <div className="relative mx-3 max-h-[90dvh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-slate-200/80 bg-white/95 px-4 py-5 shadow-[0_24px_64px_rgba(15,23,42,0.16)] backdrop-blur sm:mx-4 sm:px-7 sm:py-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
              {t("eyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-[2rem]">
              {t("title")}
            </h2>
            <p className="mt-2 hidden text-sm leading-6 text-slate-600 sm:mt-3 sm:block sm:text-[15px]">
              {t("intro")}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={t("close")}
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

        <div className="grid gap-3 lg:grid-cols-3">
          {steps.map((step) => (
            <section
              key={step.title}
              className={`rounded-[1.5rem] px-5 py-5 ring-1 ${step.accent}`}
            >
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {step.body}
              </p>
            </section>
          ))}
        </div>

        <section className="mt-5 hidden rounded-[1.5rem] border border-slate-200 bg-slate-50/90 px-5 py-5 sm:block">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">
            {t("secondaryTitle")}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {secondaryActions.map((action) => (
              <span
                key={action}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700"
              >
                {action}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            {t("reopenHint")}
          </p>
        </section>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-[1rem] border border-slate-200 px-4 py-2.5 text-sm text-slate-500 transition hover:bg-slate-50"
          >
            {t("close")}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-[1rem] bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {t("start")}
          </button>
        </div>
      </div>
    </div>
  );
}
