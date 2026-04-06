import type {Metadata} from "next";
import Link from "next/link";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {routing, type AppLocale} from "@/i18n/routing";
import {buildBlogIndexJsonLd} from "@/lib/blog-structured-data";
import {getPrimaryRelatedVideo, listBlogTutorials} from "@/lib/blog-tutorial";

type BlogTutorialIndexProps = Readonly<{
  params: Promise<{locale: string}>;
}>;

const BASE_URL = "https://constitutionalmap.ai";

function resolveLocale(locale: string): AppLocale | null {
  return routing.locales.includes(locale as never) ? (locale as AppLocale) : null;
}

function buildLanguageAlternates() {
  return {
    ...Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        `/${locale}/blog-tutorial`,
      ]),
    ),
    "x-default": `/${routing.defaultLocale}/blog-tutorial`,
  };
}

export async function generateMetadata({
  params,
}: BlogTutorialIndexProps): Promise<Metadata> {
  const {locale} = await params;
  const resolvedLocale = resolveLocale(locale);

  if (!resolvedLocale) {
    return {};
  }

  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "BlogTutorial",
  });

  return {
    metadataBase: new URL(BASE_URL),
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${resolvedLocale}/blog-tutorial`,
      languages: buildLanguageAlternates(),
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `/${resolvedLocale}/blog-tutorial`,
      siteName: "Constitutional Map AI",
      type: "website",
    },
  };
}

export default async function BlogTutorialIndex({
  params,
}: BlogTutorialIndexProps) {
  const {locale} = await params;
  const resolvedLocale = resolveLocale(locale);

  if (!resolvedLocale) {
    notFound();
  }

  setRequestLocale(resolvedLocale);

  const [t, entries] = await Promise.all([
    getTranslations({locale: resolvedLocale, namespace: "BlogTutorial"}),
    Promise.resolve(listBlogTutorials(resolvedLocale)),
  ]);
  const featuredEntry = entries[0];
  const jsonLd = buildBlogIndexJsonLd({
    locale: resolvedLocale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    entries,
  });

  return (
    <>
      <main className="min-h-screen bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,_#ede8df,_transparent),linear-gradient(to_bottom,_#f5f0e8,_#edf0ef)] text-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.92),_rgba(244,239,232,0.88))] px-6 py-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:px-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_55%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.1),_transparent_45%)]" />
            <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-slate-900/6 blur-3xl" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)] lg:items-end">
              <div>
                <p className="inline-flex rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-600 shadow-sm">
                  {t("eyebrow")}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  {t("title")}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                  {t("intro")}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/${resolvedLocale}`}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-500 hover:text-slate-950"
                  >
                    {t("openAtlas")}
                  </Link>
                  <a
                    href="https://www.youtube.com/playlist?list=PLJBMxTCVCi2NtUqcv9H2oU8QntVAa_nuh"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    {t("viewPlaylist")}
                  </a>
                </div>
              </div>
              {featuredEntry ? (
                <div className="rounded-[1.75rem] border border-slate-800/80 bg-[linear-gradient(160deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.96))] p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.22)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">
                    {featuredEntry.eyebrow}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                    {featuredEntry.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {featuredEntry.summary}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/${resolvedLocale}/blog-tutorial/${featuredEntry.slug}`}
                      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                    >
                      {t("readTutorial")}
                    </Link>
                    <span className="rounded-full border border-white/15 px-3 py-2 text-sm text-slate-300">
                      {formatDate(featuredEntry.publishedAt, resolvedLocale)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="relative mt-6 h-px bg-gradient-to-r from-slate-300 via-slate-200 to-transparent" />
            <div className="relative mt-4 max-w-3xl text-sm leading-6 text-slate-500">
              {t("metaDescription")}
            </div>
          </div>

          <section className="mt-8 grid gap-5">
            {entries.map((entry) => {
              const primaryVideo = getPrimaryRelatedVideo(entry);

              return (
                <article
                  key={entry.slug}
                  className="rounded-[1.75rem] border border-slate-200/80 bg-white/82 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      {entry.eyebrow}
                    </span>
                    <span>{formatDate(entry.publishedAt, resolvedLocale)}</span>
                    <span>{t("readingTime", {minutes: entry.readingMinutes})}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                    <Link
                      href={`/${resolvedLocale}/blog-tutorial/${entry.slug}`}
                      className="transition hover:text-slate-700"
                    >
                      {entry.title}
                    </Link>
                  </h2>
                  <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                    {entry.summary}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/${resolvedLocale}/blog-tutorial/${entry.slug}`}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      {t("readTutorial")}
                    </Link>
                    {primaryVideo ? (
                      <a
                        href={primaryVideo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
                      >
                        {t("watchRelatedVideo")}
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
    </>
  );
}

function formatDate(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}
