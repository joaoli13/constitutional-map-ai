import type {MetadataRoute} from "next";

const BASE_URL = "https://constitutionalmap.ai";
const LOCALES = ["en", "es", "pt", "it", "fr"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: locale === "en" ? 1.0 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${BASE_URL}/${l}`]),
      ),
    },
  }));
}
