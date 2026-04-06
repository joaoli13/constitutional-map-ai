import type {Metadata} from "next";
import Link from "next/link";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import {routing, type AppLocale} from "@/i18n/routing";
import {buildBlogArticleJsonLd} from "@/lib/blog-structured-data";
import {
  getBlogTutorialBySlug,
  listBlogTutorialSlugs,
} from "@/lib/blog-tutorial";

type BlogTutorialPageProps = Readonly<{
  params: Promise<{locale: string; slug: string}>;
}>;

const BASE_URL = "https://constitutionalmap.ai";

function resolveLocale(locale: string): AppLocale | null {
  return routing.locales.includes(locale as never) ? (locale as AppLocale) : null;
}

function buildLanguageAlternates(slug: string) {
  return {
    ...Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        `/${locale}/blog-tutorial/${slug}`,
      ]),
    ),
    "x-default": `/${routing.defaultLocale}/blog-tutorial/${slug}`,
  };
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    listBlogTutorialSlugs().map((slug) => ({locale, slug})),
  );
}

export async function generateMetadata({
  params,
}: BlogTutorialPageProps): Promise<Metadata> {
  const {locale, slug} = await params;
  const resolvedLocale = resolveLocale(locale);

  if (!resolvedLocale) {
    return {};
  }

  const entry = getBlogTutorialBySlug(resolvedLocale, slug);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "BlogTutorial",
  });

  if (!entry) {
    return {};
  }

  return {
    metadataBase: new URL(BASE_URL),
    title: `${entry.title} | ${t("title")}`,
    description: entry.summary,
    alternates: {
      canonical: `/${resolvedLocale}/blog-tutorial/${entry.slug}`,
      languages: buildLanguageAlternates(entry.slug),
    },
    openGraph: {
      title: `${entry.title} | ${t("title")}`,
      description: entry.summary,
      url: `/${resolvedLocale}/blog-tutorial/${entry.slug}`,
      siteName: "Constitutional Map AI",
      type: "article",
      publishedTime: `${entry.publishedAt}T00:00:00Z`,
    },
  };
}

export default async function BlogTutorialArticle({
  params,
}: BlogTutorialPageProps) {
  const {locale, slug} = await params;
  const resolvedLocale = resolveLocale(locale);

  if (!resolvedLocale) {
    notFound();
  }

  setRequestLocale(resolvedLocale);

  const [t, entry] = await Promise.all([
    getTranslations({locale: resolvedLocale, namespace: "BlogTutorial"}),
    Promise.resolve(getBlogTutorialBySlug(resolvedLocale, slug)),
  ]);

  if (!entry) {
    notFound();
  }

  const jsonLd = buildBlogArticleJsonLd({
    locale: resolvedLocale,
    entry,
  });

  return (
    <>
      <main className="min-h-screen bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,_#ede8df,_transparent),linear-gradient(to_bottom,_#f5f0e8,_#edf0ef)] text-slate-950">
        <article className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 px-6 py-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:px-8">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <Link
                href={`/${resolvedLocale}/blog-tutorial`}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
              >
                {t("backToIndex")}
              </Link>
              <span>{entry.eyebrow}</span>
              <span>{formatDate(entry.publishedAt, resolvedLocale)}</span>
              <span>{t("readingTime", {minutes: entry.readingMinutes})}</span>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {entry.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              {entry.summary}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${resolvedLocale}`}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                {t("openAtlas")}
              </Link>
              {entry.relatedVideos.map((video) => (
                <a
                  key={video.url}
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
                >
                  {video.title}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {entry.sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[1.75rem] border border-slate-200/80 bg-white/82 px-6 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
              >
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base leading-8 text-slate-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.steps?.length ? (
                  <ol className="mt-5 space-y-3 border-l border-slate-200 pl-5">
                    {section.steps.map((step) => (
                      <li key={step} className="text-base leading-7 text-slate-700">
                        {step}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </section>
            ))}
          </div>
        </article>
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
