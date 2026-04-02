import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCanvasCountryOptions,
  deriveCanvasCountryFocusPoints,
  buildCanvasSegmentOptions,
  deriveCanvasEmphasisMode,
  deriveCanvasCountryScope,
  deriveCanvasFocusSeed,
  filterCanvasCountryOptions,
  filterCanvasSegmentOptions,
  findCanvasSegmentPoint,
} from "../lib/canvas-focus.ts";

test("deriveCanvasCountryScope prefers explicit valid country", () => {
  assert.equal(
    deriveCanvasCountryScope(["BRA", "IND"], "IND"),
    "IND",
  );
});

test("deriveCanvasCountryScope falls back to sole selected country", () => {
  assert.equal(
    deriveCanvasCountryScope(["BRA"], null),
    "BRA",
  );
});

test("deriveCanvasFocusSeed pre-populates segment and country for multi-country selection", () => {
  assert.deepEqual(
    deriveCanvasFocusSeed(["BRA", "IND"], {
      country_code: "IND",
      id: "IND_124",
    }),
    {
      countryCode: "IND",
      segmentId: "IND_124",
    },
  );
});

test("deriveCanvasFocusSeed keeps implicit country scope when only one country is selected", () => {
  assert.deepEqual(
    deriveCanvasFocusSeed(["BRA"], {
      country_code: "BRA",
      id: "BRA_1",
    }),
    {
      countryCode: null,
      segmentId: "BRA_1",
    },
  );
});

test("country options filter by code or name", () => {
  const options = buildCanvasCountryOptions(
    ["BRA", "IND"],
    {
      BRA: {name: "Brazil"},
      IND: {name: "India"},
    },
  );

  assert.deepEqual(
    filterCanvasCountryOptions(options, "ind").map((option) => option.code),
    ["IND"],
  );
  assert.deepEqual(
    filterCanvasCountryOptions(options, "brazil").map((option) => option.code),
    ["BRA"],
  );
});

test("segment options are scoped to the active country and filter by article id", () => {
  const points = [
    {
      id: "BRA_1",
      article_id: "Article 1",
      text_snippet: "x",
      country_code: "BRA",
      country_name: "Brazil",
      x: 0,
      y: 0,
      z: 0,
      global_cluster: 1,
      country_cluster: null,
      cluster_probability: null,
      rank: null,
      semantic_score: null,
    },
    {
      id: "BRA_5",
      article_id: "Article 5",
      text_snippet: "x",
      country_code: "BRA",
      country_name: "Brazil",
      x: 0,
      y: 0,
      z: 0,
      global_cluster: 1,
      country_cluster: null,
      cluster_probability: null,
      rank: null,
      semantic_score: null,
    },
    {
      id: "IND_32",
      article_id: "Article 32",
      text_snippet: "x",
      country_code: "IND",
      country_name: "India",
      x: 0,
      y: 0,
      z: 0,
      global_cluster: 1,
      country_cluster: null,
      cluster_probability: null,
      rank: null,
      semantic_score: null,
    },
  ];

  const options = buildCanvasSegmentOptions(points, "BRA");

  assert.deepEqual(
    options.map((option) => option.articleId),
    ["Article 1", "Article 5"],
  );
  assert.deepEqual(
    filterCanvasSegmentOptions(options, "5").map((option) => option.articleId),
    ["Article 5"],
  );
  assert.equal(findCanvasSegmentPoint(points, "BRA_5")?.article_id, "Article 5");
});

test("explicit 3D focus takes precedence over search highlights", () => {
  assert.equal(
    deriveCanvasEmphasisMode({
      hasSearchHighlights: true,
      isCountryFocusActive: false,
      isSegmentFocusActive: true,
      isClusterFocusActive: false,
    }),
    "segment",
  );
  assert.equal(
    deriveCanvasEmphasisMode({
      hasSearchHighlights: true,
      isCountryFocusActive: true,
      isSegmentFocusActive: false,
      isClusterFocusActive: false,
    }),
    "country",
  );
  assert.equal(
    deriveCanvasEmphasisMode({
      hasSearchHighlights: true,
      isCountryFocusActive: false,
      isSegmentFocusActive: false,
      isClusterFocusActive: false,
    }),
    "search",
  );
});

test("country focus uses only search results from the active country when seeded by a search result", () => {
  const points = [
    {
      id: "BRA_1",
      article_id: "Article 1",
      text_snippet: "x",
      country_code: "BRA",
      country_name: "Brazil",
      x: 0,
      y: 0,
      z: 0,
      global_cluster: 1,
      country_cluster: null,
      cluster_probability: null,
      rank: null,
      semantic_score: null,
    },
    {
      id: "BRA_2",
      article_id: "Article 2",
      text_snippet: "x",
      country_code: "BRA",
      country_name: "Brazil",
      x: 0,
      y: 0,
      z: 0,
      global_cluster: 1,
      country_cluster: null,
      cluster_probability: null,
      rank: null,
      semantic_score: null,
    },
    {
      id: "IND_1",
      article_id: "Article 1",
      text_snippet: "x",
      country_code: "IND",
      country_name: "India",
      x: 0,
      y: 0,
      z: 0,
      global_cluster: 1,
      country_cluster: null,
      cluster_probability: null,
      rank: null,
      semantic_score: null,
    },
  ];

  const searchResultPoints = [points[1], points[2]];

  assert.deepEqual(
    deriveCanvasCountryFocusPoints({
      points,
      searchResultPoints,
      activeCountryCode: "BRA",
      selectedPointId: "BRA_2",
    }).map((point) => point.id),
    ["BRA_2"],
  );
  assert.deepEqual(
    deriveCanvasCountryFocusPoints({
      points,
      searchResultPoints,
      activeCountryCode: "BRA",
      selectedPointId: "BRA_1",
    }).map((point) => point.id),
    ["BRA_1", "BRA_2"],
  );
});
