import {routing, type AppLocale} from "../i18n/routing.ts";
import {listDiscoveryPages} from "./editorial-discovery.ts";

export type DiscoveryLanguageOption = {
  locale: AppLocale;
  pathname: string;
};

type DiscoveryRoute = DiscoveryLanguageOption & {
  translationGroup: string;
};

export function getDiscoveryLanguageOptions(
  pathname: string | null | undefined,
): DiscoveryLanguageOption[] | null {
  if (!pathname) {
    return null;
  }

  const normalizedPath = normalizePathname(pathname);
  const discoveryRoutes = getDiscoveryRoutes();
  const currentRoute = discoveryRoutes.find(
    (route) =>
      route.pathname === normalizedPath.pathname
      && (!normalizedPath.locale || route.locale === normalizedPath.locale),
  );

  if (!currentRoute) {
    return null;
  }

  return discoveryRoutes
    .filter((route) => route.translationGroup === currentRoute.translationGroup)
    .sort(
      (left, right) =>
        routing.locales.indexOf(left.locale)
        - routing.locales.indexOf(right.locale),
    )
    .map(({locale, pathname}) => ({locale, pathname}));
}

function getDiscoveryRoutes(): DiscoveryRoute[] {
  return listDiscoveryPages().map((entry) => ({
    locale: entry.locale,
    pathname: `/${entry.slugPath.join("/")}`,
    translationGroup: entry.translationGroup,
  }));
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
