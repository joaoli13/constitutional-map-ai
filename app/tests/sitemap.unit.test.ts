import assert from "node:assert/strict";
import test from "node:test";

import sitemap from "../app/sitemap.ts";
import {buildDiscoveryUrl, listDiscoveryPages} from "../lib/editorial-discovery.ts";

test("sitemap includes every published discovery page", () => {
  const entries = sitemap();
  const urls = new Set(entries.map((entry) => entry.url));

  for (const page of listDiscoveryPages()) {
    assert.ok(urls.has(buildDiscoveryUrl(page)), `${buildDiscoveryUrl(page)} missing`);
  }
});

test("sitemap discovery alternates omit missing translations", () => {
  const entries = sitemap();
  const healthEntry = entries.find(
    (entry) =>
      entry.url === "https://constitutionalmap.ai/pt/comparar/brasil-portugal-saude",
  );
  const pillarEntry = entries.find(
    (entry) =>
      entry.url === "https://constitutionalmap.ai/pt/direito-constitucional-comparado",
  );

  assert.ok(healthEntry);
  assert.ok(pillarEntry);
  assert.deepEqual(Object.keys(healthEntry.alternates?.languages ?? {}), ["pt"]);
  assert.deepEqual(
    Object.keys(pillarEntry.alternates?.languages ?? {}).sort(),
    ["en", "pt", "x-default"],
  );
});
