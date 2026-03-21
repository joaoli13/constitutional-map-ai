import type {MetadataRoute} from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/data/", "/_next/"],
        crawlDelay: 10,
      },
    ],
    sitemap: "https://constitutionalmap.ai/sitemap.xml",
  };
}
