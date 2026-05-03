import assert from "node:assert/strict";
import test from "node:test";

import sitemap from "../app/sitemap.ts";
import {buildDiscoveryUrl, listDiscoveryPages} from "../lib/editorial-discovery.ts";
import {
  buildOfficialProjectInfoUrl,
  listOfficialProjectInfoPages,
} from "../lib/official-project-info.ts";
import {routing} from "../i18n/routing.ts";

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
  const jaLocalEntry = entries.find(
    (entry) =>
      entry.url === "https://constitutionalmap.ai/ja/topics/local-self-government",
  );

  assert.ok(healthEntry);
  assert.ok(pillarEntry);
  assert.ok(jaLocalEntry);
  assert.deepEqual(Object.keys(healthEntry.alternates?.languages ?? {}), ["pt"]);
  assert.deepEqual(
    Object.keys(pillarEntry.alternates?.languages ?? {}).sort(),
    [...routing.locales, "x-default"].sort(),
  );
  assert.deepEqual(Object.keys(jaLocalEntry.alternates?.languages ?? {}), ["ja"]);
});

test("sitemap includes official project information pages", () => {
  const entries = sitemap();
  const urls = new Set(entries.map((entry) => entry.url));

  for (const page of listOfficialProjectInfoPages()) {
    assert.ok(
      urls.has(buildOfficialProjectInfoUrl(page)),
      `${buildOfficialProjectInfoUrl(page)} missing`,
    );
  }
});

test("sitemap official project alternates include every published language", () => {
  const entries = sitemap();
  const pressEntry = entries.find(
    (entry) => entry.url === "https://constitutionalmap.ai/en/press",
  );

  assert.ok(pressEntry);
  assert.deepEqual(
    Object.keys(pressEntry.alternates?.languages ?? {}).sort(),
    [...routing.locales, "x-default"].sort(),
  );
});
