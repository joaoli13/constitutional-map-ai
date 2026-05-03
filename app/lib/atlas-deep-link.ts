import {COUNTRY_PRESETS} from "./presets.ts";
import type {AppLocale} from "../i18n/routing.ts";
import type {ColorMode} from "./types.ts";

export type AtlasDeepLinkInput = Record<
  string,
  string | string[] | undefined
> | URLSearchParams;

export type AtlasDeepLinkSeed = {
  countries: string[];
  keywordQuery: string | null;
  semanticQuery: string | null;
  focusedCountryCode: string | null;
  focusedClusterId: number | null;
  focusedSegmentId: string | null;
  colorMode: ColorMode | null;
  theme: string | null;
  preset: string | null;
};

export type AtlasLinkConfig = {
  countries?: string[];
  preset?: string;
  q?: string;
  semantic?: string;
  theme?: string;
  cluster?: number;
  color?: ColorMode;
  focus?: string;
  country?: string;
};

export type AtlasDeepLinkActions = {
  addCountries: (countryCodes: string[]) => void;
  setColorMode: (mode: ColorMode) => void;
  setFocusedClusterId: (id: number | null) => void;
  setFocusedCountryCode: (code: string | null) => void;
  setLastSearchQuery: (query: string) => void;
  setLastSemanticSearchQuery: (query: string) => void;
  setPendingSegmentId: (id: string | null) => void;
  setRestrictSearchToSelectedCountries: (value: boolean) => void;
};

const DEFAULT_SEED: AtlasDeepLinkSeed = {
  countries: [],
  keywordQuery: null,
  semanticQuery: null,
  focusedCountryCode: null,
  focusedClusterId: null,
  focusedSegmentId: null,
  colorMode: null,
  theme: null,
  preset: null,
};

const EXTRA_DEEP_LINK_PRESETS: Record<string, readonly string[]> = {
  cplp: ["BRA", "PRT", "AGO", "MOZ", "CPV", "GNB", "STP", "TLS"],
  "latin-america-post-1980": ["BRA", "COL", "PER", "ARG", "ECU", "BOL"],
  "latin-america": ["BRA", "COL", "PER", "ARG", "ECU", "BOL"],
};

const THEME_QUERY_FALLBACKS: Record<string, Record<AppLocale | "default", string>> = {
  "eternity-clauses": {
    default: "unamendable constitutional provisions",
    pt: "cláusulas pétreas emendas constitucionais",
    en: "eternity clauses constitutional amendment",
    es: "cláusulas de intangibilidad constitucional",
    it: "clausole costituzionali non emendabili",
    fr: "clauses constitutionnelles intangibles",
    ja: "改正できない憲法条項",
    zh: "不可修改的宪法条款",
  },
  "judicial-review-models": {
    default: "constitutional court judicial review",
    pt: "controle de constitucionalidade tribunal constitucional",
    en: "constitutional court judicial review",
    es: "control de constitucionalidad tribunal constitucional",
    it: "controllo di costituzionalità corte costituzionale",
    fr: "contrôle de constitutionnalité cour constitutionnelle",
    ja: "違憲審査 憲法裁判所",
    zh: "宪法法院 违宪审查",
  },
  "right-to-a-healthy-environment": {
    default: "right to a healthy environment",
    pt: "direito ao meio ambiente ecologicamente equilibrado",
    en: "right to a healthy environment",
    es: "derecho a un medio ambiente sano",
    it: "diritto a un ambiente salubre",
    fr: "droit à un environnement sain",
    ja: "健康的な環境への権利",
    zh: "健康环境权",
  },
  "lusophone-constitutions": {
    default: "health education environment dignity",
    pt: "saúde educação ambiente dignidade",
    en: "health education environment dignity",
    es: "salud educación ambiente dignidad",
    it: "salute istruzione ambiente dignità",
    fr: "santé éducation environnement dignité",
    ja: "健康 教育 環境 尊厳",
    zh: "健康 教育 环境 尊严",
  },
  "latin-america-post-1980": {
    default: "constitutional court social rights environment",
    pt: "tribunal constitucional direitos sociais meio ambiente",
    en: "constitutional court social rights environment",
    es: "tribunal constitucional derechos sociales medio ambiente",
    it: "corte costituzionale diritti sociali ambiente",
    fr: "cour constitutionnelle droits sociaux environnement",
    ja: "憲法裁判所 社会権 環境",
    zh: "宪法法院 社会权利 环境",
  },
};

export function parseAtlasDeepLinkParams(
  input: AtlasDeepLinkInput | undefined,
  validCountryCodes: Iterable<string>,
  locale: AppLocale = "en",
): AtlasDeepLinkSeed {
  if (!input) {
    return {...DEFAULT_SEED};
  }

  const validCountries = new Set(
    Array.from(validCountryCodes, (code) => code.toUpperCase()),
  );
  const countries = new Set<string>();
  const preset = normalizeSlug(readParam(input, "preset"));
  const presetCountries = preset ? getPresetCountries(preset) : [];

  for (const code of [
    ...splitCountryList(readParam(input, "countries")),
    ...presetCountries,
  ]) {
    if (validCountries.has(code)) {
      countries.add(code);
    }
  }

  const focusedCountryCode = normalizeCountryCode(readParam(input, "country"));
  const validFocusedCountry =
    focusedCountryCode && validCountries.has(focusedCountryCode)
      ? focusedCountryCode
      : null;
  if (validFocusedCountry) {
    countries.add(validFocusedCountry);
  }

  const colorMode = parseColorMode(readParam(input, "color"));
  const theme = normalizeSlug(readParam(input, "theme"));
  const semanticQuery =
    cleanQuery(readParam(input, "semantic"))
    ?? resolveThemeQueryFallback(theme, locale);

  return {
    countries: [...countries],
    keywordQuery: cleanQuery(readParam(input, "q")),
    semanticQuery,
    focusedCountryCode: validFocusedCountry,
    focusedClusterId: parseClusterId(readParam(input, "cluster")),
    focusedSegmentId: cleanFocus(readParam(input, "focus")),
    colorMode,
    theme,
    preset: preset && presetCountries.length > 0 ? preset : null,
  };
}

export function hasAtlasDeepLinkSeed(seed: AtlasDeepLinkSeed): boolean {
  return Boolean(
    seed.countries.length
      || seed.keywordQuery
      || seed.semanticQuery
      || seed.focusedCountryCode
      || seed.focusedClusterId !== null
      || seed.focusedSegmentId
      || seed.colorMode
      || seed.theme
      || seed.preset,
  );
}

export function applyAtlasDeepLinkSeed(
  seed: AtlasDeepLinkSeed,
  actions: AtlasDeepLinkActions,
): void {
  if (seed.countries.length > 0) {
    actions.addCountries(seed.countries);
    actions.setRestrictSearchToSelectedCountries(true);
  }
  if (seed.keywordQuery) {
    actions.setLastSearchQuery(seed.keywordQuery);
  }
  if (seed.semanticQuery) {
    actions.setLastSemanticSearchQuery(seed.semanticQuery);
  }
  if (seed.colorMode) {
    actions.setColorMode(seed.colorMode);
  }
  if (seed.focusedCountryCode) {
    actions.setFocusedCountryCode(seed.focusedCountryCode);
  }
  if (seed.focusedClusterId !== null) {
    actions.setFocusedClusterId(seed.focusedClusterId);
  }
  if (seed.focusedSegmentId) {
    actions.setPendingSegmentId(seed.focusedSegmentId);
  }
}

export function buildAtlasQueryString(config: AtlasLinkConfig): string {
  const params = new URLSearchParams();

  if (config.countries?.length) {
    params.set("countries", config.countries.map((code) => code.toUpperCase()).join(","));
  }
  if (config.preset) {
    params.set("preset", config.preset);
  }
  if (config.q) {
    params.set("q", config.q);
  }
  if (config.semantic) {
    params.set("semantic", config.semantic);
  }
  if (config.theme) {
    params.set("theme", config.theme);
  }
  if (Number.isInteger(config.cluster)) {
    params.set("cluster", String(config.cluster));
  }
  if (config.color) {
    params.set("color", config.color);
  }
  if (config.focus) {
    params.set("focus", config.focus);
  }
  if (config.country) {
    params.set("country", config.country.toUpperCase());
  }

  return params.toString();
}

function readParam(input: AtlasDeepLinkInput, key: string): string | null {
  if (input instanceof URLSearchParams) {
    return input.get(key);
  }

  const value = input[key];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function splitCountryList(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map(normalizeCountryCode)
    .filter((code): code is string => Boolean(code));
}

function normalizeCountryCode(value: string | null): string | null {
  const normalized = value?.trim().toUpperCase();
  if (!normalized || !/^[A-Z]{3}$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function cleanQuery(value: string | null): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 240) : null;
}

function cleanFocus(value: string | null): string | null {
  const normalized = value?.trim();
  if (!normalized || !/^[A-Za-z0-9_.:-]{1,120}$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function normalizeSlug(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase().replace(/_/g, "-");
  if (!normalized || !/^[a-z0-9-]{1,80}$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function parseColorMode(value: string | null): ColorMode | null {
  return value === "country" || value === "cluster" ? value : null;
}

function parseClusterId(value: string | null): number | null {
  if (!value || !/^-?\d{1,6}$/.test(value.trim())) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= -1 ? parsed : null;
}

function getPresetCountries(preset: string): readonly string[] {
  const localPreset = EXTRA_DEEP_LINK_PRESETS[preset];
  if (localPreset) {
    return localPreset;
  }

  const builtInPreset = COUNTRY_PRESETS[preset as keyof typeof COUNTRY_PRESETS];
  return builtInPreset ?? [];
}

function resolveThemeQueryFallback(
  theme: string | null,
  locale: AppLocale,
): string | null {
  if (!theme) {
    return null;
  }

  const query = THEME_QUERY_FALLBACKS[theme];
  return query?.[locale] ?? query?.default ?? theme.replace(/-/g, " ");
}
