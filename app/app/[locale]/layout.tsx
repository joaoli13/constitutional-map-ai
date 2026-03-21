import { Analytics } from "@vercel/analytics/next";
import type {Metadata} from "next";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import LanguageSelector from "@/components/LanguageSelector";
import {routing, type AppLocale} from "@/i18n/routing";
import "../globals.css";

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

const BASE_URL = "https://constitutionalmap.ai";

const OG_LOCALE_MAP: Record<AppLocale, string> = {
  en: "en_US",
  es: "es_ES",
  pt: "pt_BR",
  it: "it_IT",
  fr: "fr_FR",
  ja: "ja_JP",
  zh: "zh_CN",
};

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  const resolvedLocale = routing.locales.includes(locale as never)
    ? (locale as AppLocale)
    : routing.defaultLocale;
  const t = await getTranslations({locale: resolvedLocale, namespace: "Meta"});

  return {
    metadataBase: new URL(BASE_URL),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${resolvedLocale}`,
      languages: {
        en: "/en",
        es: "/es",
        pt: "/pt",
        it: "/it",
        fr: "/fr",
        ja: "/ja",
        zh: "/zh",
        "x-default": "/en",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `/${resolvedLocale}`,
      siteName: "Constitutional Map AI",
      locale: OG_LOCALE_MAP[resolvedLocale],
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: t("ogImageAlt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/og-image.png"],
    },
  };
}

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

function buildJsonLd(locale: AppLocale, title: string, description: string) {
  const localeUrl = `${BASE_URL}/${locale}`;
  const websiteId = `${localeUrl}#website`;
  const organizationId = `${BASE_URL}#organization`;
  const catalogId = `${localeUrl}#catalog`;
  const datasetId = `${localeUrl}#dataset`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: localeUrl,
        name: "Constitutional Map AI",
        alternateName: "Constitutional Map",
        description,
        inLanguage: locale,
        isAccessibleForFree: true,
        publisher: {"@id": organizationId},
        about: {"@id": datasetId},
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Constitutional Map AI",
        url: BASE_URL,
        logo: `${BASE_URL}/favicon-512.png`,
        founder: {
          "@type": "Person",
          name: "João Lima",
          url: "https://x.com/joaoli13",
        },
        sameAs: [
          "https://github.com/joaoli13/constitutional-map-ai",
          "https://x.com/joaoli13",
          "https://buymeacoffee.com/Joaoli13",
        ],
      },
      {
        "@type": "DataCatalog",
        "@id": catalogId,
        url: localeUrl,
        name: title,
        description,
        inLanguage: locale,
        isAccessibleForFree: true,
        publisher: {"@id": organizationId},
        dataset: {"@id": datasetId},
      },
      {
        "@type": "Dataset",
        "@id": datasetId,
        url: localeUrl,
        name: "Constitutional Map AI – Global Constitutional Corpus",
        alternateName: "Global Constitutional Corpus",
        description:
          "A free, globally scoped corpus of constitutional articles from 190+ countries for comparative legal research, semantic search, clustering, and 3D exploration.",
        inLanguage: locale,
        isAccessibleForFree: true,
        license: "https://creativecommons.org/licenses/by-nc/3.0/",
        creator: {
          "@type": "Person",
          name: "João Lima",
          url: "https://x.com/joaoli13",
        },
        publisher: {"@id": organizationId},
        includedInDataCatalog: {"@id": catalogId},
        keywords: [
          "constitutional law",
          "comparative constitutional law",
          "constitutional corpus",
          "semantic search",
          "3D visualization",
        ],
        spatialCoverage: "Global",
        temporalCoverage: "1789/..",
      },
    ],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const {locale} = await params;
  if (!routing.locales.includes(locale as never)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const metaT = await getTranslations({locale, namespace: "Meta"});
  const chromeT = await getTranslations({locale, namespace: "Chrome"});
  const primerSections = [
    {
      title: chromeT("primerSection1Title"),
      paragraphs: [chromeT("primerP1"), chromeT("primerP2")],
    },
    {
      title: chromeT("primerSection2Title"),
      paragraphs: [chromeT("primerP3"), chromeT("primerP4"), chromeT("primerP5")],
    },
    {
      title: chromeT("primerSection3Title"),
      paragraphs: [chromeT("primerP6"), chromeT("primerP7")],
    },
  ];

  const jsonLd = buildJsonLd(
    locale as AppLocale,
    metaT("title"),
    metaT("description"),
  );

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,_#ede8df,_transparent),linear-gradient(to_bottom,_#f5f0e8,_#edf0ef)] text-slate-950 antialiased">
        <header className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-6 border-b border-slate-200/80 px-6 py-5">
          <div>
            <h1 className="text-[18px] font-bold uppercase tracking-[0.24em] text-slate-950 sm:text-[22px]">
              {chromeT("eyebrow")}
            </h1>
            <p className="mt-1 text-[15px] text-slate-600 sm:text-[17px]">
              {chromeT("subtitle")}
            </p>
          </div>
          <LanguageSelector />
        </header>
        {children}
        <section className="mx-auto w-full max-w-[1500px] px-6 pb-4 pt-0">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/70 px-6 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
              {chromeT("primerEyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {chromeT("primerTitle")}
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
        <footer className="mx-auto w-full max-w-[1500px] border-t border-slate-200/70 px-6 py-6 text-xs leading-6 text-slate-500">
          <p>
            {chromeT("dataNotice")}{" "}
            <a
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900"
              href="https://www.constituteproject.org/"
              target="_blank"
              rel="noreferrer"
            >
              {chromeT("projectLinkLabel")}
            </a>
            .
          </p>
          <p className="mt-1">
            <span className="text-slate-700">
              ({chromeT("sourceLabel")} {chromeT("citationText")})
            </span>
          </p>
          <p className="mt-3 border-t border-slate-200/70 pt-3">
            {chromeT("sourceCodeText")}{" "}
            <a
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900"
              href="https://github.com/joaoli13/constitutional-map-ai"
              target="_blank"
              rel="noreferrer"
            >
              github.com/joaoli13/constitutional-map-ai
            </a>
          </p>
          <p className="mt-2">
            {chromeT("agentGuideText")}{" "}
            <a
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900"
              href="/agents.md"
            >
              {chromeT("agentGuideLinkLabel")}
            </a>
            .
          </p>
          <p className="mt-2">
            {chromeT("madeBy")}{" "}
            <a
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900"
              href="https://x.com/joaoli13"
              target="_blank"
              rel="noreferrer"
            >
              João Lima
            </a>
            {" "}+{" "}
            <a
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900"
              href="https://claude.ai/code"
              target="_blank"
              rel="noreferrer"
            >
              Claude Code
            </a>
            {" "}+{" "}
            <a
              className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900"
              href="https://openai.com/index/openai-codex/"
              target="_blank"
              rel="noreferrer"
            >
              OpenAI Codex
            </a>
            . {chromeT("licenseNote")}
          </p>
          <p className="mt-2 text-slate-600">
            {chromeT("aiDisclaimer")}
          </p>
          <p className="mt-2">
            {chromeT("supportText")}{" "}
            <a
              className="font-medium text-amber-700 underline decoration-amber-300 underline-offset-4 transition hover:text-amber-900"
              href="https://buymeacoffee.com/Joaoli13"
              target="_blank"
              rel="noreferrer"
            >
              buymeacoffee.com/Joaoli13
            </a>
          </p>
        </footer>
      </div>
      <Analytics />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
    </NextIntlClientProvider>
  );
}
