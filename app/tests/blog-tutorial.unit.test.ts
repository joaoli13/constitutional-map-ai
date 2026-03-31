import assert from "node:assert/strict";
import test from "node:test";

import {
  getPrimaryRelatedVideo,
  getBlogTutorialBySlug,
  listBlogTutorialSlugs,
  listBlogTutorials,
} from "../lib/blog-tutorial.ts";
import {routing} from "../i18n/routing.ts";

test("blog tutorial seed contains at least three shared slugs", () => {
  assert.ok(listBlogTutorialSlugs().length >= 3);
});

test("blog tutorial lookup resolves a known slug in every locale", () => {
  for (const locale of routing.locales) {
    const entry = getBlogTutorialBySlug(locale, "getting-started-semantic-map");

    assert.ok(entry);
    assert.equal(entry?.slug, "getting-started-semantic-map");
    assert.ok(entry?.title.length);
    assert.ok(entry?.summary.length);
  }
});

test("portuguese blog tutorial content preserves diacritics", () => {
  const entry = getBlogTutorialBySlug("pt", "getting-started-semantic-map");

  assert.ok(entry);
  assert.equal(entry?.title, "Como começar no mapa semântico");
  assert.match(entry?.summary ?? "", /países/);
  assert.match(entry?.summary ?? "", /prática/);
});

test("every locale exposes the same slug set", () => {
  const expected = listBlogTutorialSlugs();

  for (const locale of routing.locales) {
    const actual = listBlogTutorials(locale).map((entry) => entry.slug);
    assert.deepEqual(actual, expected);
  }
});

test("blog tutorial listing is sorted by publish date descending for every locale", () => {
  for (const locale of routing.locales) {
    const entries = listBlogTutorials(locale);

    for (let index = 1; index < entries.length; index += 1) {
      assert.ok(entries[index - 1].publishedAt >= entries[index].publishedAt);
    }
  }
});

test("blog tutorial primary related video always points to a direct video", () => {
  for (const locale of routing.locales) {
    for (const entry of listBlogTutorials(locale)) {
      const primaryVideo = getPrimaryRelatedVideo(entry);

      assert.ok(primaryVideo, `${locale}/${entry.slug} is missing a primary video`);
      assert.match(
        primaryVideo.url,
        /youtube\.com\/watch\?/,
        `${locale}/${entry.slug} points to ${primaryVideo.url}`,
      );
    }
  }
});
