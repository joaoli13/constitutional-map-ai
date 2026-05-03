import assert from "node:assert/strict";
import test from "node:test";

import {routing} from "../i18n/routing.ts";
import {
  buildDiscoveryAtlasHref,
  buildDiscoveryPath,
  getDiscoveryAlternates,
  getDiscoveryChildPages,
  getDiscoveryPage,
  listDiscoveryPages,
} from "../lib/editorial-discovery.ts";
import {getDiscoveryLanguageOptions} from "../lib/discovery-language-options.ts";

const EXPECTED_ROUTES = [
  "/pt/direito-constitucional-comparado",
  "/en/comparative-constitutional-law-ai",
  "/pt/busca-semantica-constituicoes",
  "/en/semantic-search-constitutions",
  "/pt/comparar/brasil-portugal-saude",
  "/en/examples/germany-italy-eternity-clauses",
  "/pt/comparar/brasil-alemanha-direitos-sociais",
  "/pt/temas/clausulas-petreas",
  "/pt/temas/controle-de-constitucionalidade",
  "/en/themes/right-to-a-healthy-environment",
  "/pt/blocos/america-latina-constituicoes-pos-1980",
  "/pt/blocos/cplp-constituicoes-lusofonas",
];

test("discovery seed publishes the final 12-route set", () => {
  const pages = listDiscoveryPages();
  const routes = pages.map(buildDiscoveryPath);

  assert.equal(pages.length, 12);
  assert.deepEqual(new Set(routes), new Set(EXPECTED_ROUTES));
  assert.equal(pages.filter((entry) => entry.locale === "pt").length, 8);
  assert.equal(pages.filter((entry) => entry.locale === "en").length, 4);
});

test("discovery registry covers every required category", () => {
  const categories = new Set(listDiscoveryPages().map((entry) => entry.category));

  assert.ok(categories.has("pillar"));
  assert.ok(categories.has("semantic-search"));
  assert.ok(categories.has("country-comparison"));
  assert.ok(categories.has("theme"));
  assert.ok(categories.has("bloc-comparison"));
});

test("discovery entries have complete content and atlas links", () => {
  for (const entry of listDiscoveryPages()) {
    assert.equal(entry.findings.length, 3, `${entry.id} must have 3 findings`);
    assert.ok(entry.question.length > 20);
    assert.ok(entry.shortAnswer.length > 60);
    assert.ok(entry.methodologyNote.length > 40);
    assert.ok(entry.mapPreview.src.endsWith(".png"));
    assert.match(buildDiscoveryAtlasHref(entry), new RegExp(`^/${entry.locale}\\?`));
    assert.ok(entry.sourceLinks.some((source) => source.href.includes("constituteproject")));
    assert.ok(entry.sourceLinks.some((source) => source.href.includes("github")));
  }
});

test("discovery paths are unique per locale", () => {
  for (const locale of routing.locales) {
    const paths = listDiscoveryPages(locale).map((entry) => entry.slugPath.join("/"));
    assert.equal(paths.length, new Set(paths).size);
  }
});

test("first-wave editorial guardrails exclude polarizing seed topics", () => {
  const searchable = listDiscoveryPages()
    .map((entry) => `${buildDiscoveryPath(entry)} ${entry.title} ${entry.description}`)
    .join("\n")
    .toLowerCase();

  for (const banned of [
    "liberdade-de-imprensa",
    "direitos-trabalhistas",
    "brics",
    "aborto",
    "porte-de-armas",
    "intervencao-militar",
    "art-142",
  ]) {
    assert.equal(searchable.includes(banned), false, `${banned} should not be seeded`);
  }
});

test("pillar pages expose the required child-page hub links", () => {
  const ptPillar = getDiscoveryPage("pt", ["direito-constitucional-comparado"]);
  const enPillar = getDiscoveryPage("en", ["comparative-constitutional-law-ai"]);

  assert.ok(ptPillar);
  assert.ok(enPillar);
  assert.ok(getDiscoveryChildPages(ptPillar).length >= 6);
  assert.equal(getDiscoveryChildPages(enPillar).length, 3);
});

test("discovery alternates only advertise translated equivalents", () => {
  const ptPillar = getDiscoveryPage("pt", ["direito-constitucional-comparado"]);
  const ptHealth = getDiscoveryPage("pt", ["comparar", "brasil-portugal-saude"]);

  assert.ok(ptPillar);
  assert.ok(ptHealth);
  assert.deepEqual(Object.keys(getDiscoveryAlternates(ptPillar).languages).sort(), [
    "en",
    "pt",
    "x-default",
  ]);
  assert.deepEqual(Object.keys(getDiscoveryAlternates(ptHealth).languages), ["pt"]);
});

test("discovery language selector only exposes available translations", () => {
  assert.deepEqual(
    getDiscoveryLanguageOptions("/pt/direito-constitucional-comparado"),
    [
      {locale: "en", pathname: "/comparative-constitutional-law-ai"},
      {locale: "pt", pathname: "/direito-constitucional-comparado"},
    ],
  );
  assert.deepEqual(
    getDiscoveryLanguageOptions("/pt/comparar/brasil-portugal-saude"),
    [{locale: "pt", pathname: "/comparar/brasil-portugal-saude"}],
  );
  assert.deepEqual(getDiscoveryLanguageOptions("/pt"), null);
});
