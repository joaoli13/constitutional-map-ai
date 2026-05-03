import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import path from "node:path";
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

const SEED_ROUTES = [
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

const LOCALIZED_EXPANSION_ROUTES = [
  "/es/derecho-constitucional-comparado",
  "/es/busqueda-semantica-constituciones",
  "/es/temas/derecho-a-un-medio-ambiente-sano",
  "/es/bloques/constituciones-iberoamericanas-educacion",
  "/it/diritto-costituzionale-comparato",
  "/it/ricerca-semantica-costituzioni",
  "/it/esempi/germania-italia-clausole-eterne",
  "/it/temi/corti-costituzionali-modelli-comparati",
  "/fr/droit-constitutionnel-compare",
  "/fr/recherche-semantique-constitutions",
  "/fr/themes/droit-a-un-environnement-sain",
  "/fr/blocs/constitutions-francophones-decentralisation",
  "/ja/hikaku-kenpo-ai",
  "/ja/imi-kensaku-kenpo",
  "/ja/themes/constitutional-courts",
  "/ja/topics/local-self-government",
  "/zh/bijiao-xianfa-ai",
  "/zh/yuyi-sousuo-xianfa",
  "/zh/themes/environmental-rights",
  "/zh/topics/constitutional-terms-translation",
];

const AUDIENCE_SPECIFIC_ROUTES = [
  "/es/bloques/constituciones-iberoamericanas-educacion",
  "/it/esempi/germania-italia-clausole-eterne",
  "/fr/blocs/constitutions-francophones-decentralisation",
  "/ja/topics/local-self-government",
  "/zh/topics/constitutional-terms-translation",
];

test("discovery publishes seed routes plus localized expansion routes", () => {
  const pages = listDiscoveryPages();
  const routes = pages.map(buildDiscoveryPath);

  assert.equal(pages.length, 32);
  assert.deepEqual(
    new Set(routes),
    new Set([...SEED_ROUTES, ...LOCALIZED_EXPANSION_ROUTES]),
  );
  assert.equal(pages.filter((entry) => entry.locale === "pt").length, 8);
  assert.equal(pages.filter((entry) => entry.locale === "en").length, 4);
  for (const locale of ["es", "it", "fr", "ja", "zh"]) {
    assert.equal(
      pages.filter((entry) => entry.locale === locale).length,
      4,
      `${locale} must have four discovery entries`,
    );
  }
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
    assert.ok(
      existsSync(path.join(process.cwd(), "public", entry.mapPreview.src)),
      `${entry.mapPreview.src} is missing`,
    );
    assert.match(buildDiscoveryAtlasHref(entry), new RegExp(`^/${entry.locale}\\?`));
    assert.ok(entry.sourceLinks.some((source) => source.href.includes("constituteproject")));
    assert.ok(entry.sourceLinks.some((source) => source.href.includes("github")));
  }
});

test("localized expansion includes one audience-specific entry per target locale", () => {
  for (const route of AUDIENCE_SPECIFIC_ROUTES) {
    const entry = listDiscoveryPages().find((page) => buildDiscoveryPath(page) === route);

    assert.ok(entry, `${route} missing`);
    assert.equal(entry.audienceSpecific, true, `${route} must be audience-specific`);
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
  const esPillar = getDiscoveryPage("es", ["derecho-constitucional-comparado"]);
  const itPillar = getDiscoveryPage("it", ["diritto-costituzionale-comparato"]);
  const frPillar = getDiscoveryPage("fr", ["droit-constitutionnel-compare"]);
  const jaPillar = getDiscoveryPage("ja", ["hikaku-kenpo-ai"]);
  const zhPillar = getDiscoveryPage("zh", ["bijiao-xianfa-ai"]);

  assert.ok(ptPillar);
  assert.ok(enPillar);
  assert.ok(getDiscoveryChildPages(ptPillar).length >= 6);
  assert.equal(getDiscoveryChildPages(enPillar).length, 3);
  for (const pillar of [esPillar, itPillar, frPillar, jaPillar, zhPillar]) {
    assert.ok(pillar);
    assert.equal(getDiscoveryChildPages(pillar).length, 3);
  }
});

test("discovery alternates only advertise translated equivalents", () => {
  const ptPillar = getDiscoveryPage("pt", ["direito-constitucional-comparado"]);
  const ptHealth = getDiscoveryPage("pt", ["comparar", "brasil-portugal-saude"]);
  const itGermany = getDiscoveryPage("it", [
    "esempi",
    "germania-italia-clausole-eterne",
  ]);
  const jaLocal = getDiscoveryPage("ja", ["topics", "local-self-government"]);

  assert.ok(ptPillar);
  assert.ok(ptHealth);
  assert.ok(itGermany);
  assert.ok(jaLocal);
  assert.deepEqual(Object.keys(getDiscoveryAlternates(ptPillar).languages).sort(), [
    "en",
    "es",
    "fr",
    "it",
    "ja",
    "pt",
    "zh",
    "x-default",
  ].sort());
  assert.deepEqual(Object.keys(getDiscoveryAlternates(ptHealth).languages), ["pt"]);
  assert.deepEqual(Object.keys(getDiscoveryAlternates(itGermany).languages).sort(), [
    "en",
    "it",
    "x-default",
  ]);
  assert.deepEqual(Object.keys(getDiscoveryAlternates(jaLocal).languages), ["ja"]);
});

test("discovery language selector only exposes available translations", () => {
  assert.deepEqual(
    getDiscoveryLanguageOptions("/pt/direito-constitucional-comparado"),
    [
      {locale: "en", pathname: "/comparative-constitutional-law-ai"},
      {locale: "es", pathname: "/derecho-constitucional-comparado"},
      {locale: "pt", pathname: "/direito-constitucional-comparado"},
      {locale: "it", pathname: "/diritto-costituzionale-comparato"},
      {locale: "fr", pathname: "/droit-constitutionnel-compare"},
      {locale: "ja", pathname: "/hikaku-kenpo-ai"},
      {locale: "zh", pathname: "/bijiao-xianfa-ai"},
    ],
  );
  assert.deepEqual(
    getDiscoveryLanguageOptions("/pt/comparar/brasil-portugal-saude"),
    [{locale: "pt", pathname: "/comparar/brasil-portugal-saude"}],
  );
  assert.deepEqual(
    getDiscoveryLanguageOptions("/it/esempi/germania-italia-clausole-eterne"),
    [
      {locale: "en", pathname: "/examples/germany-italy-eternity-clauses"},
      {locale: "it", pathname: "/esempi/germania-italia-clausole-eterne"},
    ],
  );
  assert.deepEqual(getDiscoveryLanguageOptions("/pt"), null);
});
