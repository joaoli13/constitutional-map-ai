import type {AtlasSelectionPoint, CountryIndexRecord} from "./types";

export type CanvasFocusCountryOption = {
  id: string;
  code: string;
  name: string;
  label: string;
  searchText: string;
};

export type CanvasFocusSegmentOption = {
  id: string;
  articleId: string;
  label: string;
  searchText: string;
};

export type CanvasEmphasisMode = "segment" | "country" | "search" | "default";

export function deriveCanvasCountryScope(
  selectedCountries: string[],
  explicitCountryCode: string | null,
): string | null {
  if (explicitCountryCode && selectedCountries.includes(explicitCountryCode)) {
    return explicitCountryCode;
  }

  if (selectedCountries.length === 1) {
    return selectedCountries[0];
  }

  return null;
}

export function deriveCanvasFocusSeed(
  selectedCountries: string[],
  selectedPoint: Pick<AtlasSelectionPoint, "country_code" | "id"> | null,
): {countryCode: string | null; segmentId: string} | null {
  if (!selectedPoint || !selectedCountries.includes(selectedPoint.country_code)) {
    return null;
  }

  return {
    countryCode: selectedCountries.length > 1 ? selectedPoint.country_code : null,
    segmentId: selectedPoint.id,
  };
}

export function buildCanvasCountryOptions(
  selectedCountries: string[],
  countryByCode: Record<string, CountryIndexRecord | {name: string} | undefined>,
): CanvasFocusCountryOption[] {
  return selectedCountries
    .map((countryCode) => {
      const country = countryByCode[countryCode];
      const countryName = country?.name ?? countryCode;

      return {
        id: countryCode,
        code: countryCode,
        name: countryName,
        label: `${countryCode} - ${countryName}`,
        searchText: `${countryCode} ${countryName}`.toLowerCase(),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function filterCanvasCountryOptions(
  options: CanvasFocusCountryOption[],
  query: string,
): CanvasFocusCountryOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options;
  }

  return options.filter((option) => option.searchText.includes(normalized));
}

export function buildCanvasSegmentOptions(
  points: AtlasSelectionPoint[],
  countryCode: string | null,
): CanvasFocusSegmentOption[] {
  if (!countryCode) {
    return [];
  }

  return points
    .filter((point) => point.country_code === countryCode)
    .map((point) => ({
      id: point.id,
      articleId: point.article_id,
      label: point.article_id,
      searchText: point.article_id.toLowerCase(),
    }))
    .sort((left, right) => left.articleId.localeCompare(right.articleId));
}

export function filterCanvasSegmentOptions(
  options: CanvasFocusSegmentOption[],
  query: string,
): CanvasFocusSegmentOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options;
  }

  return options.filter((option) => option.searchText.includes(normalized));
}

export function findCanvasSegmentPoint(
  points: AtlasSelectionPoint[],
  segmentId: string | null,
): AtlasSelectionPoint | null {
  if (!segmentId) {
    return null;
  }

  return points.find((point) => point.id === segmentId) ?? null;
}

export function deriveCanvasEmphasisMode({
  hasSearchHighlights,
  isCountryFocusActive,
  isSegmentFocusActive,
}: {
  hasSearchHighlights: boolean;
  isCountryFocusActive: boolean;
  isSegmentFocusActive: boolean;
}): CanvasEmphasisMode {
  if (isSegmentFocusActive) {
    return "segment";
  }

  if (isCountryFocusActive) {
    return "country";
  }

  if (hasSearchHighlights) {
    return "search";
  }

  return "default";
}

export function deriveCanvasCountryFocusPoints({
  points,
  searchResultPoints,
  activeCountryCode,
  selectedPointId,
}: {
  points: AtlasSelectionPoint[];
  searchResultPoints: AtlasSelectionPoint[];
  activeCountryCode: string | null;
  selectedPointId: string | null;
}): AtlasSelectionPoint[] {
  if (!activeCountryCode) {
    return [];
  }

  const isSearchSelectedPoint = Boolean(
    selectedPointId
      && searchResultPoints.some((point) => point.id === selectedPointId),
  );
  const sourcePoints = isSearchSelectedPoint ? searchResultPoints : points;

  return sourcePoints.filter((point) => point.country_code === activeCountryCode);
}
