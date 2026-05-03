import type {AppLocale} from "../i18n/routing.ts";

export type CountryNameRecord = {
  code: string;
  iso_alpha2?: string | null;
  name: string;
};

export type CountryDisplayName = {
  code: string;
  localizedName: string;
  englishName: string;
  label: string;
  secondaryLabel: string | null;
  searchText: string;
  sortName: string;
};

const DISPLAY_NAME_CACHE = new Map<string, Intl.DisplayNames>();

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "")
    .toLocaleLowerCase();
}

function getDisplayNames(locale: AppLocale): Intl.DisplayNames | null {
  const cacheKey = locale;
  const cached = DISPLAY_NAME_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const displayNames = new Intl.DisplayNames([locale], {type: "region"});
    DISPLAY_NAME_CACHE.set(cacheKey, displayNames);
    return displayNames;
  } catch {
    return null;
  }
}

export function getLocalizedCountryName(
  country: CountryNameRecord,
  locale: AppLocale,
): string {
  if (locale === "en") {
    return country.name;
  }

  const normalizedIso = country.iso_alpha2?.trim().toUpperCase();
  if (!normalizedIso || !/^[A-Z]{2}$/.test(normalizedIso)) {
    return country.name;
  }

  return getDisplayNames(locale)?.of(normalizedIso) ?? country.name;
}

export function getCountryDisplayName(
  country: CountryNameRecord,
  locale: AppLocale,
): CountryDisplayName {
  const localizedName = getLocalizedCountryName(country, locale);
  const englishName = country.name;
  const hasDistinctLocalizedName =
    locale !== "en" && localizedName.toLocaleLowerCase() !== englishName.toLocaleLowerCase();
  const secondaryLabel = hasDistinctLocalizedName ? englishName : null;
  const searchText = normalizeSearchText(
    [
      country.code,
      localizedName,
      englishName,
    ].join(" "),
  );

  return {
    code: country.code,
    localizedName,
    englishName,
    label: `${country.code} - ${localizedName}`,
    secondaryLabel,
    searchText,
    sortName: localizedName,
  };
}

export function countrySearchIncludes(searchText: string, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query.trim());
  return !normalizedQuery || searchText.includes(normalizedQuery);
}
