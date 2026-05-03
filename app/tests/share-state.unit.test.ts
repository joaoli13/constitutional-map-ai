import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSharedViewState,
  restoreSharedViewState,
  type ShareStateSnapshot,
} from "../lib/share-state-core.ts";

function baseState(overrides: Partial<ShareStateSnapshot> = {}): ShareStateSnapshot {
  return {
    selectedCountries: ["BRA"],
    lastSearchQuery: "",
    lastSemanticSearchQuery: "",
    focusedCountryCode: null,
    focusedSegmentId: null,
    selectedPoint: null,
    colorMode: "country",
    ...overrides,
  };
}

test("shared view serialization preserves a selected 3D segment", () => {
  const payload = buildSharedViewState(
    baseState({
      selectedPoint: {
        id: "BRA_2017_Art_1",
        country_code: "BRA",
      },
    }),
    null,
  );

  assert.equal(payload.focused_segment_id, "BRA_2017_Art_1");
  assert.equal(payload.filter_country, "BRA");
});

test("shared view serialization prefers explicit segment focus", () => {
  const payload = buildSharedViewState(
    baseState({
      focusedCountryCode: "DEU",
      focusedSegmentId: "DEU_1949_Art_79",
      selectedPoint: {
        id: "BRA_2017_Art_1",
        country_code: "BRA",
      },
    }),
    null,
  );

  assert.equal(payload.focused_segment_id, "DEU_1949_Art_79");
  assert.equal(payload.filter_country, "DEU");
});

test("shared view restore rehydrates focused and pending segment ids", () => {
  const calls: string[] = [];

  restoreSharedViewState(
    {
      title: "Test",
      observation: "Observation",
      countries: ["BRA"],
      focused_segment_id: "BRA_2017_Art_1",
      filter_country: "BRA",
      color_mode: "cluster",
    },
    {
      addCountries: (codes) => calls.push(`countries:${codes.join(",")}`),
      setRestrictSearchToSelectedCountries: (value) => calls.push(`restrict:${value}`),
      setLastSearchQuery: (query) => calls.push(`q:${query}`),
      setLastSemanticSearchQuery: (query) => calls.push(`semantic:${query}`),
      setCameraState: () => calls.push("camera"),
      setColorMode: (mode) => calls.push(`color:${mode}`),
      setFocusedCountryCode: (code) => calls.push(`country:${code}`),
      setFocusedSegmentId: (id) => calls.push(`focused:${id}`),
      setPendingSegmentId: (id) => calls.push(`pending:${id}`),
    },
  );

  assert.deepEqual(calls, [
    "countries:BRA",
    "restrict:true",
    "color:cluster",
    "country:BRA",
    "focused:BRA_2017_Art_1",
    "pending:BRA_2017_Art_1",
  ]);
});
