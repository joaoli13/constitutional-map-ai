import type {CountryIndexRecord} from "./types";

const COUNTRY_ALIASES: Record<string, string> = {
  "bosnia and herz": "bosnia and herzegovina",
  "brunei": "brunei darussalam",
  "cabo verde": "cape verde",
  "central african rep": "central african republic",
  "dem rep congo": "democratic republic of the congo",
  "dominican rep": "dominican republic",
  "eq guinea": "equatorial guinea",
  "eswatini": "swaziland",
  "ivory coast": "cote d ivoire",
  "laos": "lao people s democratic republic",
  "moldova": "republic of moldova",
  "north macedonia": "macedonia",
  "palestine": "palestine state of",
  "russia": "russian federation",
  "solomon is": "solomon islands",
  "south korea": "korea republic of",
  "syria": "syrian arab republic",
  "tanzania": "united republic of tanzania",
  "timor leste": "timor leste",
  "united states of america": "united states",
  "venezuela": "venezuela bolivarian republic of",
  "vietnam": "viet nam",
};

export function normalizeCountryName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function resolveCountryForGeography(
  name: string,
  countries: CountryIndexRecord[],
) {
  const byName = new Map(
    countries.map((country) => [normalizeCountryName(country.name), country]),
  );
  const normalized = normalizeCountryName(name);
  return byName.get(normalized) ?? byName.get(COUNTRY_ALIASES[normalized] ?? "");
}
