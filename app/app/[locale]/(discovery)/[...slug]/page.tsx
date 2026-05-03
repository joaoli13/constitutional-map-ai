import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {routing, type AppLocale} from "@/i18n/routing";
import {
  buildDiscoveryAtlasHref,
  buildDiscoveryPath,
  buildDiscoveryUrl,
  getDiscoveryAlternates,
  getDiscoveryChildPages,
  getDiscoveryPage,
  getDiscoveryUi,
  listDiscoveryStaticParams,
  type DiscoveryPageEntry,
} from "@/lib/editorial-discovery";

type DiscoveryPageProps = Readonly<{
  params: Promise<{
    locale: string;
    slug: string[];
  }>;
}>;

const BASE_URL = "https://constitutionalmap.ai";

export function generateStaticParams() {
  return listDiscoveryStaticParams();
}

export async function generateMetadata({
  params,
}: DiscoveryPageProps): Promise<Metadata> {
  const {locale, slug} = await params;
  const resolvedLocale = resolveLocale(locale);
  if (!resolvedLocale) {
    return {};
  }

  const entry = getDiscoveryPage(resolvedLocale, slug);
  if (!entry) {
    return {};
  }

  const alternates = getDiscoveryAlternates(entry);

  return {
    metadataBase: new URL(BASE_URL),
    title: entry.title,
    description: entry.description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: buildDiscoveryPath(entry),
      languages: alternates.languages,
    },
    openGraph: {
      title: entry.title,
      description: entry.description,
      url: buildDiscoveryPath(entry),
      siteName: "Constitutional Map AI",
      type: "article",
      publishedTime: `${entry.publishedAt}T00:00:00Z`,
      modifiedTime: `${entry.updatedAt}T00:00:00Z`,
      images: [
        {
          url: entry.mapPreview.src,
          width: entry.mapPreview.width,
          height: entry.mapPreview.height,
          alt: entry.mapPreview.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.description,
      images: [entry.mapPreview.src],
    },
  };
}

export default async function DiscoveryPage({params}: DiscoveryPageProps) {
  const {locale, slug} = await params;
  const resolvedLocale = resolveLocale(locale);

  if (!resolvedLocale) {
    notFound();
  }

  const entry = getDiscoveryPage(resolvedLocale, slug);
  if (!entry) {
    notFound();
  }

  setRequestLocale(resolvedLocale);

  const ui = getDiscoveryUi(resolvedLocale);
  const childPages = getDiscoveryChildPages(entry);
  const atlasHref = buildDiscoveryAtlasHref(entry);
  const jsonLd = buildDiscoveryJsonLd(entry);

  return (
    <>
      <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#f5f0e8_50%,_#eef5f2_100%)] text-slate-950">
        <header className="mx-auto flex w-full max-w-[1500px] px-6 pt-6">
          <Link
            href={`/${resolvedLocale}`}
            aria-label="Constitutional Map AI home"
            className="inline-flex text-sm font-semibold tracking-tight text-slate-700 transition hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-700"
          >
            Constitutional Map AI
          </Link>
        </header>

        <section className="mx-auto grid w-full max-w-[1500px] gap-8 px-6 pb-10 pt-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:items-center">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              <span>{ui.categoryLabel[entry.category]}</span>
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>{entry.eyebrow}</span>
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>{ui.readingTime(entry.readingMinutes)}</span>
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {entry.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              {entry.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={atlasHref}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
              >
                {ui.atlasCta}
              </Link>
              <Link
                href={`/${resolvedLocale}`}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
              >
                {ui.openAtlasLabel}
              </Link>
            </div>
          </div>

          <figure className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 shadow-[0_22px_70px_rgba(15,23,42,0.18)]">
            <Image
              src={entry.mapPreview.src}
              width={entry.mapPreview.width}
              height={entry.mapPreview.height}
              alt={entry.mapPreview.alt}
              className="h-auto w-full"
              priority
            />
          </figure>
        </section>

        <section className="border-y border-slate-200/80 bg-white/76">
          <div className="mx-auto grid w-full max-w-[1300px] gap-8 px-6 py-9 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                {entry.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {entry.question}
              </h2>
            </div>
            <p className="text-lg leading-8 text-slate-700">
              {entry.shortAnswer}
            </p>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1300px] gap-8 px-6 py-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              {ui.contextLabel}
            </p>
            <div className="mt-4 space-y-4 text-base leading-8 text-slate-700">
              {entry.context.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              {ui.findingsLabel}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {entry.findings.map((finding, index) => (
                <article
                  key={finding}
                  className="min-h-[11rem] rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    {finding}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/80 bg-[#edf5f2]/80">
          <div className="mx-auto grid w-full max-w-[1300px] gap-8 px-6 py-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-900/70">
                {ui.methodologyLabel}
              </p>
              <p className="mt-3 text-base leading-8 text-slate-700">
                {entry.methodologyNote}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-900/70">
                {ui.sourcesLabel}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {entry.sourceLinks.map((source) => (
                  <a
                    key={source.href}
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-emerald-900/20 bg-white px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:border-emerald-900/50"
                  >
                    {source.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {childPages.length > 0 ? (
          <section className="mx-auto w-full max-w-[1300px] px-6 py-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              {ui.relatedLabel}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {childPages.map((child) => (
                <Link
                  key={child.id}
                  href={buildDiscoveryPath(child)}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-400"
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    {ui.categoryLabel[child.category]}
                  </span>
                  <h2 className="mt-3 text-lg font-semibold leading-6 text-slate-950">
                    {child.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {child.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
    </>
  );
}

function resolveLocale(locale: string): AppLocale | null {
  return routing.locales.includes(locale as never) ? (locale as AppLocale) : null;
}

function buildDiscoveryJsonLd(entry: DiscoveryPageEntry) {
  const pageUrl = buildDiscoveryUrl(entry);
  const pageId = `${pageUrl}#webpage`;
  const articleId = `${pageUrl}#article`;
  const datasetId = `${BASE_URL}/${entry.locale}#dataset`;
  const organizationId = `${BASE_URL}#organization`;
  const personId = `${BASE_URL}#author`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageId,
        url: pageUrl,
        name: entry.title,
        description: entry.description,
        inLanguage: entry.locale,
        isPartOf: {"@id": `${BASE_URL}/${entry.locale}#website`},
        about: [{"@id": articleId}, {"@id": datasetId}],
      },
      {
        "@type": "TechArticle",
        "@id": articleId,
        url: pageUrl,
        mainEntityOfPage: {"@id": pageId},
        headline: entry.title,
        description: entry.description,
        abstract: entry.shortAnswer,
        image: `${BASE_URL}${entry.mapPreview.src}`,
        datePublished: `${entry.publishedAt}T00:00:00Z`,
        dateModified: `${entry.updatedAt}T00:00:00Z`,
        inLanguage: entry.locale,
        articleSection: entry.category,
        keywords: [
          "constitutional law",
          "comparative constitutional law",
          entry.category,
          entry.scholarlyAngle,
        ],
        author: {"@id": personId},
        publisher: {"@id": organizationId},
        isBasedOn: {"@id": datasetId},
      },
      {
        "@type": "Dataset",
        "@id": datasetId,
        name: "The Constitutional Atlas corpus",
        url: `${BASE_URL}/${entry.locale}`,
        isAccessibleForFree: true,
        license: "https://creativecommons.org/licenses/by-nc/3.0/",
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Constitutional Map AI",
        url: BASE_URL,
        logo: `${BASE_URL}/favicon-512.png`,
      },
      {
        "@type": "Person",
        "@id": personId,
        name: "João Lima",
        url: "https://x.com/joaoli13",
      },
    ],
  };
}
