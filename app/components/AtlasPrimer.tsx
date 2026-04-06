import {getTranslations} from "next-intl/server";

import type {AppLocale} from "@/i18n/routing";

type AtlasPrimerProps = Readonly<{
  locale: AppLocale;
}>;

function rich(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-slate-800">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

export default async function AtlasPrimer({locale}: AtlasPrimerProps) {
  const t = await getTranslations({locale, namespace: "Chrome"});
  const primerSections = [
    {
      title: t("primerSection1Title"),
      paragraphs: [t("primerP1"), t("primerP2")],
    },
    {
      title: t("primerSection2Title"),
      paragraphs: [t("primerP3"), t("primerP4"), t("primerP5")],
    },
    {
      title: t("primerSection3Title"),
      paragraphs: [t("primerP6"), t("primerP7")],
    },
  ];

  return (
    <section className="mx-auto w-full max-w-[1500px] px-6 pb-4 pt-0">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/70 px-6 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
          {t("primerEyebrow")}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          {t("primerTitle")}
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {primerSections.map((section) => (
            <div
              key={section.title}
              className="rounded-[1.5rem] border border-slate-200/80 bg-white/78 px-5 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
            >
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                {section.title}
              </h3>
              <div className="mt-3 space-y-5 text-sm leading-[1.85] text-slate-600">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{rich(paragraph)}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
