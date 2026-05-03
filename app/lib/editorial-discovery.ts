import {buildAtlasQueryString, type AtlasLinkConfig} from "./atlas-deep-link.ts";
import type {AppLocale} from "../i18n/routing.ts";

export type DiscoveryCategory =
  | "pillar"
  | "semantic-search"
  | "country-comparison"
  | "theme"
  | "bloc-comparison";

export type DiscoverySourceLink = {
  label: string;
  href: string;
};

export type DiscoveryPreview = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type DiscoveryPageEntry = {
  id: string;
  locale: Extract<AppLocale, "en" | "pt">;
  translationGroup: string;
  category: DiscoveryCategory;
  slugPath: string[];
  title: string;
  description: string;
  eyebrow: string;
  question: string;
  shortAnswer: string;
  context: string[];
  findings: [string, string, string];
  methodologyNote: string;
  scholarlyAngle: string;
  mapPreview: DiscoveryPreview;
  atlasLink: AtlasLinkConfig;
  hubLinks: string[];
  sourceLinks: DiscoverySourceLink[];
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
};

export type DiscoveryUiCopy = {
  atlasCta: string;
  contextLabel: string;
  findingsLabel: string;
  methodologyLabel: string;
  sourcesLabel: string;
  relatedLabel: string;
  openAtlasLabel: string;
  categoryLabel: Record<DiscoveryCategory, string>;
  readingTime: (minutes: number) => string;
};

const BASE_URL = "https://constitutionalmap.ai";
const GITHUB_URL = "https://github.com/joaoli13/constitutional-map-ai";
const CONSTITUTE_URL = "https://www.constituteproject.org/";
const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 630;
const FIRST_PUBLISHED_AT = "2026-05-02";

const COMMON_SOURCES_PT: DiscoverySourceLink[] = [
  {label: "Constitute Project", href: CONSTITUTE_URL},
  {label: "Código e metodologia no GitHub", href: GITHUB_URL},
];

const COMMON_SOURCES_EN: DiscoverySourceLink[] = [
  {label: "Constitute Project", href: CONSTITUTE_URL},
  {label: "Code and method on GitHub", href: GITHUB_URL},
];

const DISCOVERY_UI: Record<"en" | "pt", DiscoveryUiCopy> = {
  en: {
    atlasCta: "Open this analysis in the Atlas",
    contextLabel: "Research context",
    findingsLabel: "Three findings to test",
    methodologyLabel: "Method note",
    sourcesLabel: "Sources",
    relatedLabel: "Related discovery pages",
    openAtlasLabel: "Interactive map",
    categoryLabel: {
      "pillar": "Comparative hub",
      "semantic-search": "Semantic search",
      "country-comparison": "Country comparison",
      "theme": "Theme",
      "bloc-comparison": "Bloc comparison",
    },
    readingTime: (minutes) => `${minutes} min read`,
  },
  pt: {
    atlasCta: "Abrir esta análise no mapa",
    contextLabel: "Contexto da pesquisa",
    findingsLabel: "Três achados para testar",
    methodologyLabel: "Nota metodológica",
    sourcesLabel: "Fontes",
    relatedLabel: "Páginas relacionadas",
    openAtlasLabel: "Mapa interativo",
    categoryLabel: {
      "pillar": "Hub comparativo",
      "semantic-search": "Busca semântica",
      "country-comparison": "Comparação país-país",
      "theme": "Tema constitucional",
      "bloc-comparison": "Comparação por bloco",
    },
    readingTime: (minutes) => `${minutes} min de leitura`,
  },
};

const DISCOVERY_PAGES: DiscoveryPageEntry[] = [
  {
    id: "pt-comparative-constitutional-law",
    locale: "pt",
    translationGroup: "comparative-constitutional-law",
    category: "pillar",
    slugPath: ["direito-constitucional-comparado"],
    title: "Direito constitucional comparado em um mapa semântico",
    description:
      "Veja como o The Constitutional Atlas transforma constituições de 190+ países em perguntas comparativas, clusters temáticos e rotas de pesquisa verificáveis.",
    eyebrow: "Direito constitucional comparado",
    question:
      "O que o direito constitucional comparado pode mostrar quando constituições inteiras são lidas como um espaço semântico comum?",
    shortAnswer:
      "Ele mostra que muitas convergências constitucionais aparecem por função jurídica, não por vocabulário idêntico. O mapa ajuda a sair da comparação palavra a palavra e a testar famílias de temas, instituições e direitos em escala global.",
    context: [
      "A página funciona como hub em português para pesquisas que começam amplas e depois descem para casos concretos: busca semântica, pares de países, temas institucionais e blocos regionais.",
      "O corpus público do Atlas reúne 30.828 segmentos constitucionais de 194 países, projetados em 3D por similaridade semântica. A leitura correta é exploratória: o mapa sugere caminhos, e o texto constitucional confirma ou corrige a hipótese.",
    ],
    findings: [
      "Países de tradições distintas frequentemente se aproximam quando tratam da mesma função constitucional, como controle de constitucionalidade, saúde, educação ou limites ao poder de reforma.",
      "A distância semântica ajuda a localizar outliers: dispositivos que usam vocabulário familiar, mas cumprem papel institucional diferente no desenho constitucional.",
      "Páginas filhas com perguntas estreitas geram leituras melhores que uma entrada genérica no mapa, porque cada CTA já abre países, busca e modo de cor coerentes com a hipótese.",
    ],
    methodologyNote:
      "Use esta página como índice de investigação. As inferências substantivas devem ser confirmadas no texto completo dos artigos, porque proximidade semântica não equivale a identidade normativa ou doutrinária.",
    scholarlyAngle:
      "Hub interno para direito constitucional comparado, com ênfase em perguntas estáveis e baixa polarização editorial.",
    mapPreview: preview("pt-direito-constitucional-comparado", "Dispersão global de segmentos constitucionais selecionados para pesquisa comparada"),
    atlasLink: {
      countries: ["BRA", "PRT", "DEU", "ITA", "COL", "ECU", "BOL"],
      semantic: "dignidade direitos sociais controle de constitucionalidade",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [
      "pt-busca-semantica-constituicoes",
      "pt-brasil-portugal-saude",
      "pt-brasil-alemanha-direitos-sociais",
      "pt-clausulas-petreas",
      "pt-controle-de-constitucionalidade",
      "pt-latam-pos-1980",
      "pt-cplp-constituicoes-lusofonas",
    ],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "en-comparative-constitutional-law-ai",
    locale: "en",
    translationGroup: "comparative-constitutional-law",
    category: "pillar",
    slugPath: ["comparative-constitutional-law-ai"],
    title: "Comparative constitutional law with AI semantic maps",
    description:
      "Explore how AI-assisted semantic comparison can surface institutional patterns across the world's constitutions without reducing the analysis to keyword matching.",
    eyebrow: "Comparative constitutional law",
    question:
      "How does AI-driven semantic comparison reveal patterns across world constitutions?",
    shortAnswer:
      "It lets researchers test constitutional functions across languages and drafting styles. Instead of asking only whether the same phrase appears, the Atlas asks which provisions behave similarly in the global semantic space.",
    context: [
      "This English hub points to narrower discovery pages for semantic search, country-pair comparison, structural themes, and bloc-level research questions.",
      "The Atlas is not a substitute for legal interpretation. It is a triage layer that helps scholars decide which countries, clusters, and provisions deserve close reading first.",
    ],
    findings: [
      "Semantic proximity often tracks institutional function more clearly than literal wording, especially in rights catalogues and judicial-review provisions.",
      "Country comparison works best when the first map state is small enough to inspect: two or three constitutional traditions before a wider bloc view.",
      "The strongest SEO and research pages are not product explanations; they are narrow constitutional questions with a reproducible Atlas state.",
    ],
    methodologyNote:
      "Treat the map as a research instrument. It ranks and visualizes similarity, but doctrinal conclusions still require reading the relevant constitutional text and legal context.",
    scholarlyAngle:
      "English-language hub for AI-assisted comparative constitutional-law research.",
    mapPreview: preview("en-comparative-constitutional-law-ai", "Semantic map preview for comparative constitutional law research"),
    atlasLink: {
      countries: ["DEU", "ITA", "BRA", "COL", "ECU", "ZAF"],
      semantic: "constitutional court social rights environment",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [
      "en-semantic-search-constitutions",
      "en-germany-italy-eternity-clauses",
      "en-right-to-a-healthy-environment",
    ],
    sourceLinks: COMMON_SOURCES_EN,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "pt-busca-semantica-constituicoes",
    locale: "pt",
    translationGroup: "semantic-search-constitutions",
    category: "semantic-search",
    slugPath: ["busca-semantica-constituicoes"],
    title: "Busca semântica em constituições: além da palavra exata",
    description:
      "Entenda como buscar conceitos constitucionais como dignidade da pessoa humana mesmo quando cada país usa uma redação diferente.",
    eyebrow: "Busca semântica",
    question:
      "Como encontrar dispositivos constitucionalmente próximos quando eles não usam a mesma expressão?",
    shortAnswer:
      "A busca semântica parte do sentido da pergunta. Uma consulta como “dignidade da pessoa humana” aproxima textos sobre fundamentos do Estado, igualdade, direitos sociais e proteção da pessoa mesmo quando a fórmula literal varia.",
    context: [
      "A busca textual continua útil para expressões fechadas. A busca semântica entra quando o pesquisador quer abrir o campo para redações equivalentes, traduções diferentes ou tradições jurídicas que organizam o mesmo tema em outro lugar da Constituição.",
      "O CTA desta página abre países que tornam a comparação didática: Brasil, Portugal, Alemanha, Espanha, Peru, Colômbia e Bolívia.",
    ],
    findings: [
      "Portugal e Alemanha usam a dignidade como fórmula estruturante logo no início do texto constitucional, enquanto outras constituições conectam a ideia a igualdade, proteção social ou integridade pessoal.",
      "A consulta semântica tende a recuperar vizinhanças úteis para leitura, não apenas ocorrências literais da palavra “dignidade”.",
      "Selecionar poucos países antes de buscar reduz ruído e facilita comparar o texto completo dos resultados.",
    ],
    methodologyNote:
      "A consulta sugerida não prova equivalência doutrinária entre sistemas. Ela cria uma lista inicial de dispositivos para leitura comparada e conferência no texto constitucional.",
    scholarlyAngle:
      "Showcase de busca semântica com termo constitucional clássico e estável no debate acadêmico lusófono.",
    mapPreview: preview("pt-busca-semantica-constituicoes", "Busca semântica por dignidade da pessoa humana no mapa constitucional"),
    atlasLink: {
      countries: ["BRA", "PRT", "DEU", "ESP", "PER", "COL", "BOL"],
      semantic: "dignidade da pessoa humana",
      color: "cluster",
      theme: "eternity-clauses",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "en-semantic-search-constitutions",
    locale: "en",
    translationGroup: "semantic-search-constitutions",
    category: "semantic-search",
    slugPath: ["semantic-search-constitutions"],
    title: "Semantic search for constitutions",
    description:
      "Use semantic search to find constitutional provisions about environmental rights, due process, dignity, and institutional design across different drafting traditions.",
    eyebrow: "Semantic search",
    question:
      "What changes when constitutional search is based on meaning rather than exact words?",
    shortAnswer:
      "A meaning-based query can connect provisions that describe the same constitutional problem with different vocabulary. That is especially useful for rights such as a healthy environment, due process, and dignity.",
    context: [
      "The example query opens a small set of countries with visible environmental-rights language and then colors the results by global cluster.",
      "This is useful for cold research traffic because the user starts from a concrete question, not from a blank map.",
    ],
    findings: [
      "Environmental-rights language appears in multiple constitutional families, including Latin American, European, Lusophone, and Nordic texts.",
      "Some constitutions frame the topic as an individual right; others pair it with duties of the state, citizens, or public authorities.",
      "Semantic search helps expose neighboring provisions about health, natural resources, public policy, and intergenerational protection.",
    ],
    methodologyNote:
      "Semantic retrieval broadens the candidate set. The final claim should be checked by reading the full provision and, where needed, the constitutional amendment or doctrinal history.",
    scholarlyAngle:
      "English showcase of semantic search using a low-polarization, high-growth constitutional-rights topic.",
    mapPreview: preview("en-semantic-search-constitutions", "Semantic search preview for the right to a healthy environment"),
    atlasLink: {
      countries: ["BRA", "PRT", "COL", "ECU", "ARG", "NOR", "TUR"],
      semantic: "right to a healthy environment",
      color: "cluster",
      theme: "right-to-a-healthy-environment",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_EN,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "pt-brasil-portugal-saude",
    locale: "pt",
    translationGroup: "brazil-portugal-health",
    category: "country-comparison",
    slugPath: ["comparar", "brasil-portugal-saude"],
    title: "Brasil e Portugal tratam saúde de forma semanticamente próxima?",
    description:
      "Compare o direito à saúde na Constituição brasileira de 1988 e na Constituição portuguesa de 1976 usando busca semântica e mapa 3D.",
    eyebrow: "Brasil × Portugal",
    question:
      "Brasil e Portugal tratam saúde como direito constitucional de maneira semanticamente próxima?",
    shortAnswer:
      "Sim, há aproximação relevante: ambos constitucionalizam saúde como direito e dever público. A diferença aparece no desenho institucional, na linguagem de sistema e na conexão com segurança social, políticas públicas e deveres de promoção.",
    context: [
      "O par é útil para usuários lusófonos porque reduz a barreira linguística e permite começar a leitura com dois textos conhecidos: Art. 196 da Constituição brasileira e Art. 64 da Constituição portuguesa.",
      "A comparação não deve parar na palavra “saúde”. O mapa ajuda a ver a vizinhança semântica com seguridade social, ambiente, consumidores, família e deveres estatais.",
    ],
    findings: [
      "O Brasil formula saúde como “direito de todos” e dever estatal garantido por políticas sociais e econômicas.",
      "Portugal combina direito à proteção da saúde com dever de defesa e promoção, aproximando o tema de organização pública e responsabilidade social.",
      "A seleção BR–PT mostra como uma mesma língua pode ocultar escolhas institucionais distintas dentro de uma área semântica comum.",
    ],
    methodologyNote:
      "A página usa a tradução disponível no corpus para orientar a comparação. Para citação jurídica final, confira a versão oficial de cada Constituição e o contexto doutrinário local.",
    scholarlyAngle:
      "Entrada lusófona concreta para direito à saúde e constitucionalismo social.",
    mapPreview: preview("pt-brasil-portugal-saude", "Comparação semântica entre Brasil e Portugal sobre direito à saúde"),
    atlasLink: {
      countries: ["BRA", "PRT"],
      semantic: "direito à saúde sistema público saúde",
      q: "health",
      color: "cluster",
      theme: "right-to-a-healthy-environment",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "en-germany-italy-eternity-clauses",
    locale: "en",
    translationGroup: "germany-italy-eternity-clauses",
    category: "country-comparison",
    slugPath: ["examples", "germany-italy-eternity-clauses"],
    title: "Germany, Italy, and eternity clauses",
    description:
      "Compare how Germany and Italy protect constitutional identity from ordinary amendment, with Brazil added as a third reference point.",
    eyebrow: "Germany × Italy",
    question:
      "How do Germany and Italy constitutionalize limits on constitutional amendment?",
    shortAnswer:
      "Germany states a broad eternity clause in Article 79(3), while Italy protects the republican form in Article 139. Adding Brazil shows a third drafting style: enumerated unamendable clauses in Article 60(4).",
    context: [
      "This comparison is useful because the countries do not use identical formulas. The semantic map places amendment limits, constitutional identity, dignity, federalism, and republican form near one another when their legal function overlaps.",
      "The CTA includes Brazil as a reference point because Brazilian scholarship often compares Article 60(4) with the German eternity clause.",
    ],
    findings: [
      "Germany's Article 79(3) is framed as a material limit on amendment affecting federal structure and the core principles of Articles 1 and 20.",
      "Italy's Article 139 is narrower in wording, protecting the republican form from constitutional amendment.",
      "Brazil provides a useful bridge case because its unamendable clauses list institutional and rights commitments rather than relying on a single formula.",
    ],
    methodologyNote:
      "The Atlas compares constitutional text. Doctrines such as India's basic-structure doctrine are relevant context, but they are not treated as textual provisions unless present in the corpus.",
    scholarlyAngle:
      "English country-pair page for the stable search term “eternity clauses”.",
    mapPreview: preview("en-germany-italy-eternity-clauses", "Germany, Italy, and Brazil plotted for eternity-clause comparison"),
    atlasLink: {
      countries: ["DEU", "ITA", "BRA"],
      semantic: "eternity clauses constitutional amendment republican form human dignity",
      q: "amendment",
      color: "cluster",
      theme: "eternity-clauses",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_EN,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "pt-brasil-alemanha-direitos-sociais",
    locale: "pt",
    translationGroup: "brazil-germany-social-rights",
    category: "country-comparison",
    slugPath: ["comparar", "brasil-alemanha-direitos-sociais"],
    title: "Brasil e Alemanha: dignidade, Estado social e direitos sociais",
    description:
      "Use o mapa semântico para comparar fundamentos constitucionais de dignidade, Estado social e proteção social na Alemanha e no Brasil.",
    eyebrow: "Brasil × Alemanha",
    question:
      "Como Brasil e Alemanha aproximam dignidade humana e constitucionalismo social?",
    shortAnswer:
      "A aproximação não é uma cópia textual. A Alemanha coloca dignidade e força vinculante dos direitos fundamentais no centro do texto; o Brasil combina dignidade, objetivos sociais, direitos fundamentais e uma ordem social extensa.",
    context: [
      "O par é clássico em debates sobre dignidade da pessoa humana, mínimo existencial e deveres positivos do Estado.",
      "O mapa não resolve a discussão dogmática, mas ajuda a encontrar onde cada Constituição posiciona fundamentos, direitos sociais, organização estatal e limites de reforma.",
    ],
    findings: [
      "Na Alemanha, dignidade aparece como núcleo textual explícito e ponto de partida para direitos fundamentais.",
      "No Brasil, a dignidade convive com objetivos constitucionais de justiça social e um catálogo amplo de direitos sociais.",
      "A comparação mostra como uma mesma categoria acadêmica pode se distribuir por artigos muito diferentes dentro de cada Constituição.",
    ],
    methodologyNote:
      "A página foi desenhada para pesquisa inicial. Leituras sobre Sarlet, Sarmento, Alexy e mínimo existencial entram como bibliografia externa, não como dado produzido automaticamente pelo Atlas.",
    scholarlyAngle:
      "Comparação acadêmica de alta demanda e baixa polarização sobre dignidade e constitucionalismo social.",
    mapPreview: preview("pt-brasil-alemanha-direitos-sociais", "Brasil e Alemanha no mapa semântico de dignidade e direitos sociais"),
    atlasLink: {
      countries: ["BRA", "DEU"],
      semantic: "dignidade humana Estado social direitos sociais mínimo existencial",
      q: "dignity",
      color: "cluster",
      theme: "eternity-clauses",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "pt-clausulas-petreas",
    locale: "pt",
    translationGroup: "eternity-clauses",
    category: "theme",
    slugPath: ["temas", "clausulas-petreas"],
    title: "Cláusulas pétreas e limites materiais ao poder de reforma",
    description:
      "Explore como constituições protegem certos compromissos contra emendas ordinárias: Brasil, Alemanha, Itália, Angola, Moçambique e outros casos.",
    eyebrow: "Tema constitucional",
    question:
      "Como constituições tornam certos compromissos resistentes ao poder de reforma?",
    shortAnswer:
      "Elas usam técnicas diferentes: listas de matérias intangíveis, proteção da forma republicana, preservação de princípios fundantes, limites circunstanciais e maiorias qualificadas.",
    context: [
      "O tema é estável em pesquisa constitucional porque conecta teoria do poder constituinte, democracia, direitos fundamentais e identidade constitucional.",
      "O mapa permite comparar a redação de limites materiais sem pressupor que todos os países usam a expressão brasileira “cláusulas pétreas”.",
    ],
    findings: [
      "Brasil, Alemanha e Itália exemplificam três estilos textuais: lista de matérias, núcleo de princípios e proteção da forma republicana.",
      "Constituições lusófonas africanas também apresentam limites materiais expressos, o que amplia a comparação para além do eixo Brasil–Europa.",
      "A busca por “amendment” e por termos semânticos de intangibilidade captura mais casos do que a busca literal por “eternity clause”.",
    ],
    methodologyNote:
      "O Atlas localiza textos constitucionais. Ele não incorpora automaticamente doutrinas judiciais que criam limites implícitos, salvo quando aparecem como texto constitucional no corpus.",
    scholarlyAngle:
      "Tema institucional forte para tráfego acadêmico e comparações de teoria constitucional.",
    mapPreview: preview("pt-clausulas-petreas", "Mapa de cláusulas pétreas e limites constitucionais de reforma"),
    atlasLink: {
      countries: ["BRA", "DEU", "ITA", "AGO", "MOZ", "GNB"],
      semantic: "cláusulas pétreas emendas constitucionais limites materiais",
      q: "amendment",
      color: "cluster",
      theme: "eternity-clauses",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "pt-controle-de-constitucionalidade",
    locale: "pt",
    translationGroup: "judicial-review-models",
    category: "theme",
    slugPath: ["temas", "controle-de-constitucionalidade"],
    title: "Controle de constitucionalidade: modelos difuso, concentrado e misto",
    description:
      "Compare como constituições descrevem tribunais constitucionais, cortes supremas e mecanismos de controle de constitucionalidade.",
    eyebrow: "Tema institucional",
    question:
      "Como diferentes constituições distribuem o controle de constitucionalidade entre cortes e procedimentos?",
    shortAnswer:
      "O texto constitucional revela desenhos variados: cortes constitucionais especializadas, supremas cortes com competência constitucional, controles preventivos e sistemas mistos.",
    context: [
      "Este é um dos temas mais úteis para tráfego acadêmico porque as expressões variam muito entre tradições kelsenianas, modelos difusos e sistemas híbridos.",
      "A busca semântica ajuda a encontrar dispositivos sobre tribunais, competência, revisão normativa e conflitos federativos mesmo quando a expressão “judicial review” não aparece.",
    ],
    findings: [
      "Portugal, Itália, Alemanha, Colômbia, Peru e Bolívia trazem linguagem explícita sobre tribunais constitucionais ou cortes com função constitucional.",
      "Brasil usa a centralidade do Supremo Tribunal Federal em vez de um tribunal constitucional separado, aproximando-se de modelos mistos.",
      "A Constituição dos EUA tem pouco texto sobre judicial review, o que mostra um limite importante da comparação puramente textual.",
    ],
    methodologyNote:
      "A página compara texto constitucional, não prática jurisprudencial. Países com doutrinas judiciais centrais podem parecer menos explícitos no mapa se a competência não estiver textualizada.",
    scholarlyAngle:
      "Tema estrutural, não partidário, com alto valor para graduação, pós-graduação e pesquisa comparada.",
    mapPreview: preview("pt-controle-de-constitucionalidade", "Modelos de controle de constitucionalidade no espaço semântico"),
    atlasLink: {
      countries: ["BRA", "PRT", "DEU", "ITA", "COL", "PER", "BOL", "USA"],
      semantic: "controle de constitucionalidade tribunal constitucional suprema corte",
      q: "constitutional court",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "en-right-to-a-healthy-environment",
    locale: "en",
    translationGroup: "right-to-a-healthy-environment",
    category: "theme",
    slugPath: ["themes", "right-to-a-healthy-environment"],
    title: "The constitutional right to a healthy environment",
    description:
      "Compare how constitutions protect environmental quality, health, natural resources, and duties toward future generations.",
    eyebrow: "Constitutional theme",
    question:
      "How do constitutions describe the right to a healthy environment?",
    shortAnswer:
      "Many constitutions now frame environmental protection as both a right and a duty. The strongest comparative signal is not one phrase, but a neighborhood of provisions about health, nature, public policy, and intergenerational protection.",
    context: [
      "This theme is growing but remains less partisan than many rights topics. It also demonstrates semantic search well because constitutional texts use varied formulas.",
      "The CTA opens countries with visible environmental language from Latin America, Europe, Lusophone Africa, Norway, and Turkey.",
    ],
    findings: [
      "Brazil, Portugal, Colombia, Ecuador, Argentina, Angola, Mozambique, Cape Verde, Norway, and Turkey all include environment-related constitutional language in different forms.",
      "Some texts emphasize an individual right; others combine rights with duties to defend, preserve, or improve the environment.",
      "The environmental cluster often borders health, public administration, land, natural resources, and development policy.",
    ],
    methodologyNote:
      "The page identifies textual patterns. It does not measure environmental enforcement, litigation success, or policy outcomes.",
    scholarlyAngle:
      "Low-polarization English theme page for a growing constitutional-rights query.",
    mapPreview: preview("en-right-to-a-healthy-environment", "Constitutional right to a healthy environment across selected countries"),
    atlasLink: {
      countries: ["BRA", "PRT", "COL", "ECU", "ARG", "AGO", "MOZ", "CPV", "NOR", "TUR"],
      semantic: "right to a healthy environment",
      q: "environment",
      color: "cluster",
      theme: "right-to-a-healthy-environment",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_EN,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "pt-latam-pos-1980",
    locale: "pt",
    translationGroup: "latin-america-post-1980",
    category: "bloc-comparison",
    slugPath: ["blocos", "america-latina-constituicoes-pos-1980"],
    title: "Constituições latino-americanas pós-1980 no mapa semântico",
    description:
      "Compare Brasil, Colômbia, Peru, Argentina, Equador e Bolívia como parte da onda democrática e do novo constitucionalismo latino-americano.",
    eyebrow: "América Latina pós-1980",
    question:
      "O que aproxima constituições latino-americanas adotadas ou reformadas depois das transições democráticas?",
    shortAnswer:
      "Elas combinam reconstrução institucional, catálogos de direitos, mecanismos de controle e temas sociais. A proximidade semântica ajuda a separar ondas políticas gerais de escolhas textuais concretas.",
    context: [
      "O recorte evita um bloco geopolítico contemporâneo e usa uma chave acadêmica mais limpa: constituições democráticas e reformas estruturais depois de 1980.",
      "O CTA abre Brasil, Colômbia, Peru, Argentina, Equador e Bolívia, permitindo comparar direitos, cortes, ambiente e organização do Estado.",
    ],
    findings: [
      "Colômbia, Equador e Bolívia tendem a exibir catálogos extensos e linguagem forte sobre direitos, participação e organização estatal.",
      "Brasil e Argentina oferecem pontos de comparação úteis por combinarem transição democrática com tradições federativas diferentes.",
      "A busca por tribunais constitucionais, ambiente e direitos sociais ajuda a distinguir convergências regionais de soluções nacionais específicas.",
    ],
    methodologyNote:
      "O rótulo “novo constitucionalismo latino-americano” é usado como contexto de pesquisa, não como classificação automática do Atlas.",
    scholarlyAngle:
      "Bloco regional neutro e estabelecido para pesquisa comparada em português.",
    mapPreview: preview("pt-america-latina-constituicoes-pos-1980", "Constituições latino-americanas pós-1980 no mapa semântico"),
    atlasLink: {
      preset: "latin-america-post-1980",
      semantic: "tribunal constitucional direitos sociais meio ambiente",
      color: "cluster",
      theme: "latin-america-post-1980",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "pt-cplp-constituicoes-lusofonas",
    locale: "pt",
    translationGroup: "cplp-lusophone-constitutions",
    category: "bloc-comparison",
    slugPath: ["blocos", "cplp-constituicoes-lusofonas"],
    title: "Constituições lusófonas da CPLP: língua comum, desenhos diferentes",
    description:
      "Compare Brasil, Portugal, Angola, Moçambique, Cabo Verde, Guiné-Bissau, São Tomé e Príncipe e Timor-Leste no mesmo mapa constitucional.",
    eyebrow: "CPLP",
    question:
      "Constituições em língua portuguesa se aproximam semanticamente por compartilharem idioma?",
    shortAnswer:
      "A língua comum ajuda a leitura, mas não determina o desenho constitucional. As constituições lusófonas aproximam-se em direitos sociais e deveres estatais, mas divergem em organização territorial, sistema de governo e limites de reforma.",
    context: [
      "Este recorte é forte para tráfego lusófono e menos explorado que comparações entre grandes blocos geopolíticos.",
      "O CTA usa países da CPLP presentes no corpus: Brasil, Portugal, Angola, Moçambique, Cabo Verde, Guiné-Bissau, São Tomé e Príncipe e Timor-Leste.",
    ],
    findings: [
      "Saúde, educação, ambiente e dignidade aparecem como temas recorrentes nas constituições lusófonas, ainda que com redações e densidades diferentes.",
      "A semelhança linguística não elimina diferenças institucionais relevantes, especialmente em revisão constitucional, poder local e desenho dos tribunais.",
      "O mapa permite testar se a proximidade vem do idioma, do tema ou de trajetórias constitucionais pós-autoritárias e pós-coloniais.",
    ],
    methodologyNote:
      "A comparação usa traduções e textos disponíveis no corpus. Para uso forense ou citação acadêmica final, confira a redação oficial e a versão temporal de cada Constituição.",
    scholarlyAngle:
      "Bloco lusófono neutro, específico e com alta utilidade para audiência PT-BR/PT-PT.",
    mapPreview: preview("pt-cplp-constituicoes-lusofonas", "Constituições lusófonas da CPLP no mapa semântico"),
    atlasLink: {
      preset: "CPLP",
      semantic: "saúde educação ambiente dignidade",
      color: "cluster",
      theme: "lusophone-constitutions",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
];

export function listDiscoveryPages(locale?: AppLocale): DiscoveryPageEntry[] {
  const entries = locale
    ? DISCOVERY_PAGES.filter((entry) => entry.locale === locale)
    : DISCOVERY_PAGES;
  return [...entries].sort((left, right) => {
    const localeOrder = left.locale.localeCompare(right.locale);
    if (localeOrder !== 0) {
      return localeOrder;
    }
    return buildDiscoveryPath(left).localeCompare(buildDiscoveryPath(right));
  });
}

export function getDiscoveryPage(
  locale: AppLocale,
  slugPath: string[],
): DiscoveryPageEntry | null {
  const normalizedPath = slugPath.join("/");
  return (
    DISCOVERY_PAGES.find(
      (entry) =>
        entry.locale === locale && entry.slugPath.join("/") === normalizedPath,
    ) ?? null
  );
}

export function getDiscoveryPageById(id: string): DiscoveryPageEntry | null {
  return DISCOVERY_PAGES.find((entry) => entry.id === id) ?? null;
}

export function getDiscoveryUi(locale: AppLocale): DiscoveryUiCopy {
  return locale === "pt" ? DISCOVERY_UI.pt : DISCOVERY_UI.en;
}

export function buildDiscoveryPath(entry: DiscoveryPageEntry): string {
  return `/${entry.locale}/${entry.slugPath.join("/")}`;
}

export function buildDiscoveryUrl(entry: DiscoveryPageEntry): string {
  return `${BASE_URL}${buildDiscoveryPath(entry)}`;
}

export function buildDiscoveryAtlasHref(entry: DiscoveryPageEntry): string {
  const query = buildAtlasQueryString(entry.atlasLink);
  return query ? `/${entry.locale}?${query}` : `/${entry.locale}`;
}

export function listDiscoveryStaticParams() {
  return DISCOVERY_PAGES.map((entry) => ({
    locale: entry.locale,
    slug: entry.slugPath,
  }));
}

export function getDiscoveryAlternates(entry: DiscoveryPageEntry) {
  const translatedEntries = DISCOVERY_PAGES.filter(
    (candidate) => candidate.translationGroup === entry.translationGroup,
  );
  const languages = Object.fromEntries(
    translatedEntries.map((candidate) => [
      candidate.locale,
      buildDiscoveryPath(candidate),
    ]),
  ) as Partial<Record<AppLocale, string>>;
  const englishEntry = translatedEntries.find((candidate) => candidate.locale === "en");

  return {
    languages: englishEntry
      ? {...languages, "x-default": buildDiscoveryPath(englishEntry)}
      : languages,
    absoluteLanguages: Object.fromEntries(
      Object.entries(
        englishEntry
          ? {...languages, "x-default": buildDiscoveryPath(englishEntry)}
          : languages,
      ).map(([locale, path]) => [locale, `${BASE_URL}${path}`]),
    ),
  };
}

export function getDiscoveryChildPages(
  entry: DiscoveryPageEntry,
): DiscoveryPageEntry[] {
  return entry.hubLinks
    .map((id) => getDiscoveryPageById(id))
    .filter((page): page is DiscoveryPageEntry => Boolean(page));
}

function preview(id: string, alt: string): DiscoveryPreview {
  return {
    src: `/discovery/${id}.png`,
    alt,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
  };
}
