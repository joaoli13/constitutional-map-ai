import Link from "next/link";

import type {AppLocale} from "@/i18n/routing";
import {
  buildDiscoveryPath,
  getDiscoveryUi,
  listDiscoveryPages,
} from "@/lib/editorial-discovery";

type EditorialDiscoveryLinksProps = Readonly<{
  locale: AppLocale;
}>;

const COPY = {
  en: {
    eyebrow: "Discovery pages",
    title: "Start from concrete constitutional research questions",
    description:
      "These indexable examples turn the Atlas into repeatable findings: semantic search, country-pair comparisons, structural themes, and bloc-level cuts.",
  },
  pt: {
    eyebrow: "Páginas editoriais",
    title: "Comece por perguntas constitucionais concretas",
    description:
      "Estes exemplos indexáveis transformam o Atlas em achados recorrentes: busca semântica, comparações país-país, temas estruturais e recortes por bloco.",
  },
};

export default function EditorialDiscoveryLinks({
  locale,
}: EditorialDiscoveryLinksProps) {
  const pages = listDiscoveryPages(locale);
  if (pages.length === 0 || (locale !== "pt" && locale !== "en")) {
    return null;
  }

  const copy = COPY[locale];
  const ui = getDiscoveryUi(locale);

  return (
    <section className="mx-auto w-full max-w-[1500px] px-6 py-8">
      <div className="border-t border-slate-200/80 pt-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
          {copy.eyebrow}
        </p>
        <div className="mt-2 grid gap-3 lg:grid-cols-[0.75fr_1fr] lg:items-end">
          <h2 className="max-w-3xl text-2xl font-semibold text-slate-950">
            {copy.title}
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 lg:justify-self-end">
            {copy.description}
          </p>
        </div>
        <div className="mt-6 grid overflow-hidden rounded-lg border border-slate-200/80 bg-slate-200/80 md:grid-cols-2">
          {pages.map((entry) => (
            <Link
              key={entry.id}
              href={buildDiscoveryPath(entry)}
              className="group bg-white/84 px-5 py-5 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-slate-700"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {ui.categoryLabel[entry.category]}
              </span>
              <span className="mt-2 block text-base font-semibold text-slate-900 group-hover:text-slate-950">
                {entry.question}
              </span>
              <span className="mt-3 block text-sm leading-6 text-slate-600">
                {entry.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
