import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAtlasDeepLinkSeed,
  buildAtlasQueryString,
  hasAtlasDeepLinkSeed,
  parseAtlasDeepLinkParams,
} from "../lib/atlas-deep-link.ts";

const VALID_COUNTRIES = ["BRA", "PRT", "DEU", "ITA", "AGO", "MOZ", "CPV", "GNB", "STP", "TLS"];

test("atlas deep-link parser validates and deduplicates countries", () => {
  const seed = parseAtlasDeepLinkParams(
    new URLSearchParams("countries=bra,prt,XXX,BRA&color=cluster"),
    VALID_COUNTRIES,
    "pt",
  );

  assert.deepEqual(seed.countries, ["BRA", "PRT"]);
  assert.equal(seed.colorMode, "cluster");
  assert.equal(hasAtlasDeepLinkSeed(seed), true);
});

test("atlas deep-link parser expands neutral presets", () => {
  const seed = parseAtlasDeepLinkParams(
    new URLSearchParams("preset=CPLP&theme=lusophone-constitutions"),
    VALID_COUNTRIES,
    "pt",
  );

  assert.deepEqual(seed.countries, ["BRA", "PRT", "AGO", "MOZ", "CPV", "GNB", "STP", "TLS"]);
  assert.equal(seed.preset, "cplp");
  assert.equal(seed.theme, "lusophone-constitutions");
  assert.equal(seed.semanticQuery, "saúde educação ambiente dignidade");
});

test("atlas deep-link parser ignores malformed focus and unsupported color", () => {
  const seed = parseAtlasDeepLinkParams(
    new URLSearchParams("countries=BRA&color=purple&focus=<script>&cluster=nope"),
    VALID_COUNTRIES,
    "en",
  );

  assert.deepEqual(seed.countries, ["BRA"]);
  assert.equal(seed.colorMode, null);
  assert.equal(seed.focusedSegmentId, null);
  assert.equal(seed.focusedClusterId, null);
});

test("atlas deep-link parser keeps keyword, semantic, cluster, and focused country", () => {
  const seed = parseAtlasDeepLinkParams(
    {
      countries: "BRA,DEU",
      country: "DEU",
      q: " amendment ",
      semantic: " human dignity ",
      cluster: "42",
      focus: "DEU_1949_Article_1",
    },
    VALID_COUNTRIES,
    "en",
  );

  assert.deepEqual(seed.countries, ["BRA", "DEU"]);
  assert.equal(seed.focusedCountryCode, "DEU");
  assert.equal(seed.keywordQuery, "amendment");
  assert.equal(seed.semanticQuery, "human dignity");
  assert.equal(seed.focusedClusterId, 42);
  assert.equal(seed.focusedSegmentId, "DEU_1949_Article_1");
});

test("atlas query string builder serializes discovery CTA state", () => {
  const query = buildAtlasQueryString({
    countries: ["bra", "prt"],
    semantic: "direito à saúde",
    color: "cluster",
    theme: "right-to-a-healthy-environment",
  });

  assert.equal(
    query,
    "countries=BRA%2CPRT&semantic=direito+%C3%A0+sa%C3%BAde&theme=right-to-a-healthy-environment&color=cluster",
  );
});

test("atlas deep-link application calls the store boundary actions", () => {
  const calls: string[] = [];
  const seed = parseAtlasDeepLinkParams(
    new URLSearchParams("countries=BRA,PRT&semantic=dignidade&color=cluster&cluster=7&focus=BRA_2017_Art_1"),
    VALID_COUNTRIES,
    "pt",
  );

  applyAtlasDeepLinkSeed(seed, {
    addCountries: (codes) => calls.push(`countries:${codes.join(",")}`),
    setColorMode: (mode) => calls.push(`color:${mode}`),
    setFocusedClusterId: (id) => calls.push(`cluster:${id}`),
    setFocusedCountryCode: (code) => calls.push(`country:${code}`),
    setLastSearchQuery: (query) => calls.push(`q:${query}`),
    setLastSemanticSearchQuery: (query) => calls.push(`semantic:${query}`),
    setPendingSegmentId: (id) => calls.push(`focus:${id}`),
    setRestrictSearchToSelectedCountries: (value) => calls.push(`restrict:${value}`),
  });

  assert.deepEqual(calls, [
    "countries:BRA,PRT",
    "restrict:true",
    "semantic:dignidade",
    "color:cluster",
    "cluster:7",
    "focus:BRA_2017_Art_1",
  ]);
});
