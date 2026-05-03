import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

import {
  OFFICIAL_PROJECT_DATASET_SNAPSHOT,
  buildOfficialProjectInfoUrl,
  getOfficialProjectInfoAlternates,
  getOfficialProjectInfoPage,
  getOfficialProjectInfoPath,
  getOfficialProjectLanguageOptions,
  listOfficialProjectInfoPages,
} from "../lib/official-project-info.ts";
import {routing} from "../i18n/routing.ts";

const require = createRequire(import.meta.url);
const atlasIndex = require("../public/data/index.json") as {
  generated_at: string;
  total_articles: number;
  countries: Array<{has_data: boolean}>;
};
const clusters = require("../public/data/clusters.json") as unknown[];

test("official project info publishes every supported locale", () => {
  const pages = listOfficialProjectInfoPages();

  assert.deepEqual(
    pages.map((page) => page.locale).sort(),
    [...routing.locales].sort(),
  );

  for (const locale of routing.locales) {
    const page = getOfficialProjectInfoPage(locale);
    assert.ok(page, `${locale} missing`);
    assert.equal(buildOfficialProjectInfoUrl(page).startsWith("https://"), true);
    assert.equal(getOfficialProjectInfoPath(locale), `/${locale}/${page.slug}`);
  }
});

test("official project info numbers match current static data", () => {
  assert.equal(
    OFFICIAL_PROJECT_DATASET_SNAPSHOT.constitutionalSystems,
    atlasIndex.countries.filter((country) => country.has_data).length,
  );
  assert.equal(
    OFFICIAL_PROJECT_DATASET_SNAPSHOT.indexedCountryRecords,
    atlasIndex.countries.length,
  );
  assert.equal(
    OFFICIAL_PROJECT_DATASET_SNAPSHOT.legalSegments,
    atlasIndex.total_articles,
  );
  assert.equal(OFFICIAL_PROJECT_DATASET_SNAPSHOT.globalClusters, clusters.length);
  assert.equal(
    OFFICIAL_PROJECT_DATASET_SNAPSHOT.generatedAt,
    atlasIndex.generated_at,
  );
});

test("official project info alternates advertise published localized copy", () => {
  const enPage = getOfficialProjectInfoPage("en");
  assert.ok(enPage);

  assert.deepEqual(
    Object.keys(getOfficialProjectInfoAlternates(enPage).languages).sort(),
    [...routing.locales, "x-default"].sort(),
  );
});

test("official project language options map localized slugs", () => {
  const expectedOptions = [
    {locale: "en", pathname: "/press"},
    {locale: "es", pathname: "/prensa"},
    {locale: "pt", pathname: "/imprensa"},
    {locale: "it", pathname: "/stampa"},
    {locale: "fr", pathname: "/presse"},
    {locale: "ja", pathname: "/press"},
    {locale: "zh", pathname: "/press"},
  ];

  assert.deepEqual(getOfficialProjectLanguageOptions("/en/press"), [
    ...expectedOptions,
  ]);
  assert.deepEqual(getOfficialProjectLanguageOptions("/pt/imprensa"), expectedOptions);
  assert.deepEqual(getOfficialProjectLanguageOptions("/fr/presse"), expectedOptions);
  assert.deepEqual(getOfficialProjectLanguageOptions("/zh/press"), expectedOptions);
  assert.deepEqual(getOfficialProjectLanguageOptions("/pt"), null);
});
