import {routing, type AppLocale} from "../i18n/routing.ts";

export type DiscoveryLanguageOption = {
  locale: Extract<AppLocale, "en" | "pt">;
  pathname: string;
};

type DiscoveryRoute = DiscoveryLanguageOption & {
  translationGroup: string;
};

const DISCOVERY_ROUTES: readonly DiscoveryRoute[] = [
  {
    locale: "pt",
    pathname: "/direito-constitucional-comparado",
    translationGroup: "comparative-constitutional-law",
  },
  {
    locale: "en",
    pathname: "/comparative-constitutional-law-ai",
    translationGroup: "comparative-constitutional-law",
  },
  {
    locale: "pt",
    pathname: "/busca-semantica-constituicoes",
    translationGroup: "semantic-search-constitutions",
  },
  {
    locale: "en",
    pathname: "/semantic-search-constitutions",
    translationGroup: "semantic-search-constitutions",
  },
  {
    locale: "pt",
    pathname: "/comparar/brasil-portugal-saude",
    translationGroup: "brazil-portugal-health-rights",
  },
  {
    locale: "en",
    pathname: "/examples/germany-italy-eternity-clauses",
    translationGroup: "germany-italy-eternity-clauses",
  },
  {
    locale: "pt",
    pathname: "/comparar/brasil-alemanha-direitos-sociais",
    translationGroup: "brazil-germany-social-rights",
  },
  {
    locale: "pt",
    pathname: "/temas/clausulas-petreas",
    translationGroup: "eternity-clauses",
  },
  {
    locale: "pt",
    pathname: "/temas/controle-de-constitucionalidade",
    translationGroup: "judicial-review-models",
  },
  {
    locale: "en",
    pathname: "/themes/right-to-a-healthy-environment",
    translationGroup: "right-to-a-healthy-environment",
  },
  {
    locale: "pt",
    pathname: "/blocos/america-latina-constituicoes-pos-1980",
    translationGroup: "latin-america-post-1980",
  },
  {
    locale: "pt",
    pathname: "/blocos/cplp-constituicoes-lusofonas",
    translationGroup: "lusophone-constitutions",
  },
];

export function getDiscoveryLanguageOptions(
  pathname: string | null | undefined,
): DiscoveryLanguageOption[] | null {
  if (!pathname) {
    return null;
  }

  const normalizedPath = normalizePathname(pathname);
  const currentRoute = DISCOVERY_ROUTES.find(
    (route) =>
      route.pathname === normalizedPath.pathname
      && (!normalizedPath.locale || route.locale === normalizedPath.locale),
  );

  if (!currentRoute) {
    return null;
  }

  return DISCOVERY_ROUTES
    .filter((route) => route.translationGroup === currentRoute.translationGroup)
    .sort(
      (left, right) =>
        routing.locales.indexOf(left.locale)
        - routing.locales.indexOf(right.locale),
    )
    .map(({locale, pathname}) => ({locale, pathname}));
}

function normalizePathname(pathname: string) {
  const trimmed = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  const segments = trimmed.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const locale = routing.locales.includes(firstSegment as never)
    ? (firstSegment as AppLocale)
    : null;
  const pathSegments = locale ? segments.slice(1) : segments;

  return {
    locale,
    pathname: `/${pathSegments.join("/")}`.replace(/\/$/, "") || "/",
  };
}
