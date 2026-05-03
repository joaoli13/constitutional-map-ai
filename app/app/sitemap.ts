import type {MetadataRoute} from "next";

import {listBlogTutorialSlugs, listBlogTutorials} from "../lib/blog-tutorial.ts";
import {
  buildDiscoveryUrl,
  getDiscoveryAlternates,
  listDiscoveryPages,
} from "../lib/editorial-discovery.ts";
import {routing} from "../i18n/routing.ts";

const BASE_URL = "https://constitutionalmap.ai";
const LAST_CONTENT_UPDATE = new Date("2026-03-30");

export default function sitemap(): MetadataRoute.Sitemap {
  const localeEntries = routing.locales.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
    lastModified: LAST_CONTENT_UPDATE,
    changeFrequency: "monthly" as const,
    priority: locale === "en" ? 1.0 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((value) => [value, `${BASE_URL}/${value}`]),
      ),
    },
  }));

  const blogEntries = routing.locales.flatMap((locale) => {
    const tutorials = listBlogTutorials(locale);
    const indexEntry = {
      url: `${BASE_URL}/${locale}/blog-tutorial`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: "monthly" as const,
      priority: locale === routing.defaultLocale ? 0.7 : 0.6,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((value) => [
            value,
            `${BASE_URL}/${value}/blog-tutorial`,
          ]),
        ),
      },
    };

    const articleEntries = listBlogTutorialSlugs().map((slug) => {
      const entry = tutorials.find((item) => item.slug === slug);

      return {
        url: `${BASE_URL}/${locale}/blog-tutorial/${slug}`,
        lastModified: new Date(`${entry?.publishedAt ?? "2026-03-30"}T00:00:00Z`),
        changeFrequency: "monthly" as const,
        priority: locale === routing.defaultLocale ? 0.6 : 0.5,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((value) => [
              value,
              `${BASE_URL}/${value}/blog-tutorial/${slug}`,
            ]),
          ),
        },
      };
    });

    return [indexEntry, ...articleEntries];
  });

  const discoveryEntries = listDiscoveryPages().map((entry) => {
    const alternates = getDiscoveryAlternates(entry);

    return {
      url: buildDiscoveryUrl(entry),
      lastModified: new Date(`${entry.updatedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: entry.category === "pillar" ? 0.82 : 0.72,
      alternates: {
        languages: alternates.absoluteLanguages,
      },
    };
  });

  return [...localeEntries, ...blogEntries, ...discoveryEntries];
}
