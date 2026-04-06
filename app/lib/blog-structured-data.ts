import type {AppLocale} from "@/i18n/routing";
import type {BlogTutorialEntry} from "@/lib/blog-tutorial";

const BASE_URL = "https://constitutionalmap.ai";
const ORGANIZATION_ID = `${BASE_URL}#organization`;
const PERSON_ID = `${BASE_URL}#author`;

function getBlogUrl(locale: AppLocale) {
  return `${BASE_URL}/${locale}/blog-tutorial`;
}

function getArticleUrl(locale: AppLocale, slug: string) {
  return `${getBlogUrl(locale)}/${slug}`;
}

function buildPublisherGraph() {
  return [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "Constitutional Map AI",
      url: BASE_URL,
      logo: `${BASE_URL}/favicon-512.png`,
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "João Lima",
      url: "https://x.com/joaoli13",
    },
  ];
}

function toIsoDate(value: string) {
  return `${value}T00:00:00Z`;
}

function toIsoDuration(minutes: number) {
  return `PT${minutes}M`;
}

export function buildBlogIndexJsonLd(args: {
  description: string;
  entries: BlogTutorialEntry[];
  locale: AppLocale;
  title: string;
}) {
  const {description, entries, locale, title} = args;
  const blogUrl = getBlogUrl(locale);
  const blogId = `${blogUrl}#blog`;
  const pageId = `${blogUrl}#webpage`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": pageId,
        url: blogUrl,
        name: title,
        description,
        inLanguage: locale,
        isPartOf: {"@id": `${BASE_URL}/${locale}#website`},
        about: {"@id": blogId},
      },
      {
        "@type": "Blog",
        "@id": blogId,
        url: blogUrl,
        name: title,
        description,
        inLanguage: locale,
        publisher: {"@id": ORGANIZATION_ID},
        author: {"@id": PERSON_ID},
        blogPost: entries.map((entry) => ({
          "@type": "BlogPosting",
          "@id": `${getArticleUrl(locale, entry.slug)}#blog-post`,
          url: getArticleUrl(locale, entry.slug),
          headline: entry.title,
          description: entry.summary,
          datePublished: toIsoDate(entry.publishedAt),
          dateModified: toIsoDate(entry.publishedAt),
          inLanguage: locale,
          timeRequired: toIsoDuration(entry.readingMinutes),
        })),
      },
      ...buildPublisherGraph(),
    ],
  };
}

export function buildBlogArticleJsonLd(args: {
  entry: BlogTutorialEntry;
  locale: AppLocale;
}) {
  const {entry, locale} = args;
  const blogUrl = getBlogUrl(locale);
  const articleUrl = getArticleUrl(locale, entry.slug);
  const pageId = `${articleUrl}#webpage`;
  const articleId = `${articleUrl}#blog-post`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageId,
        url: articleUrl,
        name: entry.title,
        description: entry.summary,
        inLanguage: locale,
        isPartOf: {"@id": `${BASE_URL}/${locale}#website`},
        about: {"@id": articleId},
      },
      {
        "@type": "BlogPosting",
        "@id": articleId,
        url: articleUrl,
        mainEntityOfPage: {"@id": pageId},
        isPartOf: {"@id": `${blogUrl}#blog`},
        headline: entry.title,
        description: entry.summary,
        abstract: entry.summary,
        datePublished: toIsoDate(entry.publishedAt),
        dateModified: toIsoDate(entry.publishedAt),
        inLanguage: locale,
        author: {"@id": PERSON_ID},
        publisher: {"@id": ORGANIZATION_ID},
        timeRequired: toIsoDuration(entry.readingMinutes),
        articleSection: entry.sections.map((section) => section.title),
      },
      ...buildPublisherGraph(),
    ],
  };
}
