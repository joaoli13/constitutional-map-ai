import type {Metadata} from "next";
import {setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";

import OfficialProjectInfoPage from "@/components/OfficialProjectInfoPage";
import {
  BASE_URL,
  buildOfficialProjectInfoJsonLd,
  getOfficialProjectInfoAlternates,
  getOfficialProjectInfoPage,
  getOfficialProjectInfoPath,
  OFFICIAL_PROJECT_PREVIEW_IMAGE,
} from "@/lib/official-project-info";

export type OfficialProjectInfoRouteProps = Readonly<{
  params: Promise<{locale: string}>;
}>;

type OfficialProjectInfoRouteComponentProps = OfficialProjectInfoRouteProps &
  Readonly<{
    expectedSlug: string;
  }>;

export async function generateOfficialProjectInfoMetadata(
  {params}: OfficialProjectInfoRouteProps,
  expectedSlug: string,
): Promise<Metadata> {
  const {locale} = await params;
  const page = getOfficialProjectInfoPage(locale);

  if (!page || page.slug !== expectedSlug) {
    return {};
  }

  const alternates = getOfficialProjectInfoAlternates(page);
  const canonical = getOfficialProjectInfoPath(page.locale) ?? "/en/press";

  return {
    metadataBase: new URL(BASE_URL),
    title: page.metaTitle,
    description: page.metaDescription,
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
      canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: canonical,
      siteName: "Constitutional Map AI",
      type: "website",
      images: [
        {
          url: OFFICIAL_PROJECT_PREVIEW_IMAGE,
          width: 1200,
          height: 630,
          alt: page.mediaAssets[0]?.alt ?? page.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
      images: [OFFICIAL_PROJECT_PREVIEW_IMAGE],
    },
  };
}

export default async function OfficialProjectInfoRoute({
  expectedSlug,
  params,
}: OfficialProjectInfoRouteComponentProps) {
  const {locale} = await params;
  const page = getOfficialProjectInfoPage(locale);

  if (!page || page.slug !== expectedSlug) {
    notFound();
  }

  setRequestLocale(page.locale);
  const jsonLd = buildOfficialProjectInfoJsonLd(page);

  return (
    <>
      <OfficialProjectInfoPage page={page} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
    </>
  );
}
