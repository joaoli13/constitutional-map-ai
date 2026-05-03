import assert from "node:assert/strict";
import test from "node:test";

import {
  countrySearchIncludes,
  getCountryDisplayName,
  getLocalizedCountryName,
} from "../lib/country-names.ts";
import {
  buildCanvasCountryOptions,
  filterCanvasCountryOptions,
} from "../lib/canvas-focus.ts";

test("localized country names resolve from ISO alpha-2 metadata", () => {
  const brazil = {code: "BRA", iso_alpha2: "BR", name: "Brazil"};

  assert.equal(getLocalizedCountryName(brazil, "pt"), "Brasil");
  assert.equal(getLocalizedCountryName(brazil, "es"), "Brasil");
  assert.equal(getLocalizedCountryName(brazil, "en"), "Brazil");
});

test("localized country display keeps English fallback context", () => {
  const germany = {code: "DEU", iso_alpha2: "DE", name: "Germany"};
  const display = getCountryDisplayName(germany, "fr");

  assert.equal(display.localizedName, "Allemagne");
  assert.equal(display.secondaryLabel, "Germany");
  assert.equal(display.label, "DEU - Allemagne");
});

test("country name fallback uses English when ISO metadata is unavailable", () => {
  const display = getCountryDisplayName(
    {code: "XKX", iso_alpha2: null, name: "Kosovo"},
    "ja",
  );

  assert.equal(display.localizedName, "Kosovo");
  assert.equal(display.secondaryLabel, null);
  assert.equal(display.label, "XKX - Kosovo");
});

test("country search matches localized names, English names, and alpha-3 codes", () => {
  const options = buildCanvasCountryOptions(
    ["DEU", "BRA", "JPN"],
    {
      DEU: {code: "DEU", iso_alpha2: "DE", name: "Germany"},
      BRA: {code: "BRA", iso_alpha2: "BR", name: "Brazil"},
      JPN: {code: "JPN", iso_alpha2: "JP", name: "Japan"},
    },
    "es",
  );

  assert.deepEqual(
    filterCanvasCountryOptions(options, "alemania").map((option) => option.code),
    ["DEU"],
  );
  assert.deepEqual(
    filterCanvasCountryOptions(options, "germany").map((option) => option.code),
    ["DEU"],
  );
  assert.deepEqual(
    filterCanvasCountryOptions(options, "bra").map((option) => option.code),
    ["BRA"],
  );
});

test("country search supports non-Latin localized names", () => {
  const japan = getCountryDisplayName(
    {code: "JPN", iso_alpha2: "JP", name: "Japan"},
    "zh",
  );

  assert.equal(japan.localizedName, "日本");
  assert.equal(countrySearchIncludes(japan.searchText, "日本"), true);
  assert.equal(countrySearchIncludes(japan.searchText, "Japan"), true);
  assert.equal(countrySearchIncludes(japan.searchText, "JPN"), true);
});
