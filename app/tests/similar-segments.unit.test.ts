import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveSimilarSegmentCandidateCountries,
  findSimilarSegments,
  parseSimilarSegmentCountries,
  shapeDistinctCountrySimilarResults,
} from "../lib/similarSegments.ts";

const baseRow = {
  id: "row-1",
  country_code: "DEU",
  country_name: "Germany",
  article_id: "Article 1",
  text: "Full text",
  text_snippet: "Full text",
  global_cluster: 12,
  x: 1,
  y: 2,
  z: 3,
  score: 0.9,
  distance: 0.1,
};

test("similar segment country parsing normalizes valid alpha-3 codes", () => {
  assert.deepEqual(parseSimilarSegmentCountries("bra, DEU,,deu, invalid, JPN"), [
    "BRA",
    "DEU",
    "JPN",
  ]);
  assert.equal(parseSimilarSegmentCountries(""), null);
});

test("similar segment retrieval rejects a blank source id before hitting the database", async () => {
  await assert.rejects(
    () => findSimilarSegments({id: "   ", countries: null}),
    {name: "SimilarSegmentError", status: 400},
  );
});

test("similar segment scope uses full corpus for zero, one, and two selected countries", () => {
  assert.deepEqual(
    deriveSimilarSegmentCandidateCountries(null, "BRA"),
    {mode: "full_corpus", countries: null},
  );
  assert.deepEqual(
    deriveSimilarSegmentCandidateCountries(["BRA"], "BRA"),
    {mode: "full_corpus", countries: null},
  );
  assert.deepEqual(
    deriveSimilarSegmentCandidateCountries(["BRA", "DEU"], "BRA"),
    {mode: "full_corpus", countries: null},
  );
});

test("similar segment scope restricts to selected countries when more than two are selected", () => {
  assert.deepEqual(
    deriveSimilarSegmentCandidateCountries(["bra", "DEU", "FRA", "DEU"], "BRA"),
    {mode: "selected_countries", countries: ["DEU", "FRA"]},
  );
});

test("similar segment shaping keeps one row per country and caps the result count", () => {
  const rows = [
    {...baseRow, id: "deu-1", country_code: "DEU", distance: 0.1, score: 0.91},
    {...baseRow, id: "deu-2", country_code: "DEU", distance: 0.2, score: 0.83},
    {...baseRow, id: "fra-1", country_code: "FRA", distance: 0.3, score: 0.77},
    {...baseRow, id: "ita-1", country_code: "ITA", distance: 0.4, score: 0.71},
  ];

  const results = shapeDistinctCountrySimilarResults(rows, 2);

  assert.deepEqual(results.map((result) => result.id), ["deu-1", "fra-1"]);
  assert.deepEqual(results.map((result) => result.rank), [1, 2]);
});
